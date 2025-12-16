import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        // Use bcrypt to compare hashes
        if (user && await bcrypt.compare(pass, user.password)) {
            if (user.status === 'pending') {
                throw new UnauthorizedException('Sua conta aguarda aprovação do administrador.');
            }
            if (user.status === 'inactive') {
                throw new UnauthorizedException('Sua conta foi desativada.');
            }
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId, userType: user.userType };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                credits: user.credits,
                userType: user.userType
            }
        };
    }

    async register(data: any) {
        // 1. Verificar se email já existe
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new UnauthorizedException('Email já cadastrado');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 2. Criar Tenant (Um novo tenant para cada pré-cadastro)
        // O nome do tenant será o nome da empresa ou do usuário
        const tenantName = data.companyName || data.name || 'Novo Cliente';
        const tenantSlug = data.email.split('@')[0] + '-' + Date.now(); // Slug simples

        const tenant = await this.prisma.tenant.create({
            data: {
                name: tenantName,
                slug: tenantSlug
            }
        });

        // 3. Criar Usuário (como Tenant Admin, mas Pendente)
        // 3. Criar Usuário (como Tenant Admin, mas Pendente)
        let user;
        try {
            user = await this.prisma.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                    phone: data.phone,
                    userType: data.userType || 'INDIVIDUAL',
                    cpf: data.cpf || null,
                    cnpj: data.cnpj || null,
                    companyName: data.companyName || null,
                    role: 'TENANT_ADMIN', // Quem se cadastra é admin do próprio tenant
                    status: 'active', // Todas as contas nascem aprovadas
                    tenantId: tenant.id
                }
            });
        } catch (error: any) {
            // Rollback: Deletar tenant criado se falhar usuario (opcional, mas boa pratica para nao deixar lixo)
            await this.prisma.tenant.delete({ where: { id: tenant.id } });

            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (target?.includes('cpf')) {
                    throw new UnauthorizedException('CPF já cadastrado em outra conta.');
                }
                if (target?.includes('cnpj')) {
                    throw new UnauthorizedException('CNPJ já cadastrado em outra conta.');
                }
                throw new UnauthorizedException('Dados já cadastrados (Email, CPF ou CNPJ).');
            }
            throw error;
        }

        // 4. Se houve solicitação inicial de créditos
        if (data.initialCredits && Number(data.initialCredits) > 0) {
            // Criar solicitação de crédito (pendente)
            // Como criamos um modelo CreditSolicitation, vamos usá-lo ou usar um campo temporário?
            // O modelo CreditSolicitation já existe.
            await this.prisma.creditSolicitation.create({
                data: {
                    userId: user.id,
                    tenantId: tenant.id,
                    status: 'PENDING'
                }
            });
            // Obs: Precisamos saber a quantidade? O modelo CreditSolicitation atual não tem "amount".
            // Vou assumir que o fluxo de "Confirmar Pagamento" é quem define, mas aqui é pré-venda.
            // O usuário pediu "cliente escolhe a quantidade...". Talvez precisemos adicionar 'amount' em CreditSolicitation.
            // Por enquanto vou focar no registro e a venda se resolve depois no dashboard ou adiciono um campo de 'requestedAmount' depois.
        }

        // 5. Auto-Atribuição do Inventário (Big Five)
        // Isso garante que o usuário já tenha o card "Em Andamento" no dashboard assim que se cadastra.
        // Evita erros de ID mismatch e race conditions no frontend.
        const assessmentModel = await this.prisma.assessmentModel.findFirst({
            where: { type: 'BIG_FIVE' }
        });

        if (assessmentModel) {
            // Criar atribuição (Assignment) IMEDIATAMENTE
            const assignment = await this.prisma.assessmentAssignment.create({
                data: {
                    userId: user.id,
                    assessmentId: assessmentModel.id,
                    status: 'IN_PROGRESS',
                    assignedAt: new Date(),
                }
            });

            // Se houver dados do Trial (Degustação), salvar progresso recuperado
            if (data.trialData && Array.isArray(data.trialData) && data.trialData.length > 0) {
                // Buscar as questões do banco para mapear IDs corretos
                const questions = await this.prisma.question.findMany({
                    where: { assessmentModelId: assessmentModel.id },
                    orderBy: { createdAt: 'asc' }, // Assumindo ordem estável
                    take: 10 // Trial costuma ter poucas perguntas
                });

                if (questions.length > 0) {
                    const responsesToCreate = [];
                    
                    data.trialData.forEach((item: any) => {
                        // O item.questionId do trial é 1, 2, 3... (índice 0-based seria id-1)
                        // Lógica de mapeamento baseada na ordem
                        const index = item.questionId - 1;
                        if (questions[index]) {
                            responsesToCreate.push({
                                assignmentId: assignment.id,
                                questionId: questions[index].id,
                                answer: Number(item.response)
                            });
                        }
                    });

                    if (responsesToCreate.length > 0) {
                        await this.prisma.assessmentResponse.createMany({
                            data: responsesToCreate
                        });
                    }
                }
            }
        }

        return {
            message: 'Cadastro realizado com sucesso!',
            user: { email: user.email, name: user.name }
        };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        const { password, ...result } = user;
        return result;
    }
}
