import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

        // 6. Process Coupon Usage
        // 6. Process Coupon Usage
        if (data.couponCode) {
            try {
                const coupon = await this.prisma.coupon.findUnique({
                    where: { code: data.couponCode }
                });

                if (coupon && coupon.isActive) {
                    // Check limits
                    if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {

                        // Validate Allowed Plans (New Logic)
                        const allowedPlans = coupon.allowedPlans as any;

                        console.log(`🎟️ Validating Coupon ${coupon.code}. User Plan ID: ${data.planId}. Allowed: ${JSON.stringify(allowedPlans)}`);

                        const planMap: Record<string, string> = {
                            'starter': 'START', 'start': 'START',
                            'pro': 'PRO',
                            'business': 'BUSINESS'
                        };
                        const inputPlanId = (data.planId || 'starter').toLowerCase();
                        const selectedPlanEnum = planMap[inputPlanId] || 'START';

                        if (Array.isArray(allowedPlans) && allowedPlans.length > 0) {
                            if (!allowedPlans.includes(selectedPlanEnum)) {
                                throw new BadRequestException(`Este cupom é válido apenas para o plano: ${allowedPlans.join(', ')}`);
                            }
                        }

                        // Apply Usage
                        await this.prisma.coupon.update({
                            where: { id: coupon.id },
                            data: { usageCount: { increment: 1 } }
                        });

                        // Special Rule: 100% Discount
                        if (coupon.discountPercent === 100) {
                            // Re-use determined planEnum
                            const targetPlan = selectedPlanEnum;
                            const planEnum = targetPlan as any;

                            console.log(`🎟️ Applying 100% Discount logic for ${user.email}. Plan: ${targetPlan}, Credits: ${data.initialCredits}`);

                            await this.prisma.tenant.update({
                                where: { id: tenant.id },
                                data: { plan: planEnum }
                            });

                            await this.prisma.user.update({
                                where: { id: user.id },
                                data: {
                                    plan: planEnum,
                                    credits: { increment: Number(data.initialCredits) || 1 }
                                }
                            });
                        }
                    }
                }
            } catch (error) {
                if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                    throw error;
                }
                console.error('Error processing coupon:', error);
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
