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

    async loginByAccessCode(accessCode: string): Promise<any> {
        // Busca usuário onde companyName = accessCode (hack definido no BusinessService)
        // Por segurança, verificamos se o companyName começa com "PINC-" para evitar logar como empresa errada
        if (!accessCode.startsWith('PINC-')) return null;

        const user = await this.prisma.user.findFirst({
            where: { companyName: accessCode }
        });

        // Valida se a SENHA também bate (por segurança extra)
        // No createEmployee, definimos hash do accessCode como senha.
        if (user && await bcrypt.compare(accessCode, user.password)) {
            if (user.status === 'pending') throw new UnauthorizedException('Conta pendente.');
            if (user.status === 'inactive') throw new UnauthorizedException('Conta inativa.');

            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            tenantId: user.tenantId,
            userType: user.userType,
            mustChangePassword: user.mustChangePassword
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                credits: user.credits,
                userType: user.userType,
                mustChangePassword: user.mustChangePassword
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

        // 1.1. Validate Coupon (Pre-Check) to prevent partial registration
        if (data.couponCode) {
            const coupon = await this.prisma.coupon.findUnique({ where: { code: data.couponCode } });
            if (!coupon) throw new BadRequestException('Cupom inválido.');
            if (!coupon.isActive) throw new BadRequestException('Cupom inativo.');
            if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) throw new BadRequestException('Limite de uso do cupom atingido.');
            if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new BadRequestException('Cupom expirado.');

            // Plan Validation
            const allowedPlans = coupon.allowedPlans as any;
            const planMap: Record<string, string> = {
                'starter': 'START', 'start': 'START',
                'pro': 'PRO',
                'business': 'BUSINESS'
            };
            const inputPlanId = (data.planId || 'starter').toLowerCase();
            let selectedPlanEnum = planMap[inputPlanId];

            if (!selectedPlanEnum && data.planName) {
                const name = data.planName.toLowerCase();
                if (name.includes('business')) selectedPlanEnum = 'BUSINESS';
                else if (name.includes('pro')) selectedPlanEnum = 'PRO';
                else selectedPlanEnum = 'START';
            }
            if (!selectedPlanEnum) selectedPlanEnum = 'START';

            if (Array.isArray(allowedPlans) && allowedPlans.length > 0) {
                if (!allowedPlans.includes(selectedPlanEnum)) {
                    throw new BadRequestException(`Este cupom é válido apenas para o plano: ${allowedPlans.join(', ')}`);
                }
            }
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

        // CORREÇÃO: Priorizar modelo marcado como Default (mesmo que seja de outro tenant se for template global, ou system default)
        // Como o tenant acabou de ser criado, ele não tem modelos próprios ainda.
        // Devemos buscar o modelo PADRÃO do sistema (Global).
        let assessmentModel = await this.prisma.assessmentModel.findFirst({
            where: { type: 'BIG_FIVE', isDefault: true },
            orderBy: { createdAt: 'desc' } // ✅ Garantir determinismo se houver múltiplos defaults
        });

        // Fallback: Se não tiver nenhum default marcado, pega o mais recente global
        if (!assessmentModel) {
            assessmentModel = await this.prisma.assessmentModel.findFirst({
                where: { type: 'BIG_FIVE' },
                orderBy: { createdAt: 'desc' }
            });
        }

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
                        let selectedPlanEnum = planMap[inputPlanId];

                        // Fallback to Plan Name matching if ID mapping failed
                        if (!selectedPlanEnum && data.planName) {
                            const name = data.planName.toLowerCase();
                            if (name.includes('business')) selectedPlanEnum = 'BUSINESS';
                            else if (name.includes('pro')) selectedPlanEnum = 'PRO';
                            else selectedPlanEnum = 'START';
                        }

                        // Default to START if still undefined
                        if (!selectedPlanEnum) selectedPlanEnum = 'START';

                        console.log(`🎟️ Resolved Plan Enum: ${selectedPlanEnum} (from ID: ${inputPlanId}, Name: ${data.planName})`);

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

    async logout(userId: string) {
        // "Zera" a atividade do usuário para que ele suma da lista de online imediatamente
        await this.prisma.user.update({
            where: { id: userId },
            data: { lastActivityAt: new Date(0) } // 1970
        });
        return { message: 'Logout realizado com sucesso' };
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

    // Reset de senha com validação de dados cadastrais (Camada Extra de Segurança)
    async resetPassword(data: {
        email: string;
        name: string;
        phone: string;
        cpf?: string;
        cnpj?: string;
        newPassword: string;
    }) {
        // 1. Buscar usuário pelo email
        const user = await this.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() }
        });

        if (!user) {
            // Retorna erro genérico ou específico. Por segurança, as vezes é bom ser genérico, mas aqui queremos UX.
            throw new BadRequestException('❌ Dados incorretos. Verifique as informações.');
        }

        // 2. Validar nome completo
        const userNameNormalized = user.name?.toLowerCase().trim().replace(/\s+/g, ' ');
        const providedNameNormalized = data.name.toLowerCase().trim().replace(/\s+/g, ' ');

        if (userNameNormalized !== providedNameNormalized) {
            throw new BadRequestException('❌ Nome completo incorreto.');
        }

        // 3. Validação Dupla Obrigatória: Telefone E Documento

        // 3.1 Validar Telefone
        if (!data.phone || !user.phone) {
            throw new BadRequestException('❌ Telefone é obrigatório para validação.');
        }
        const phoneMatch = user.phone.replace(/\D/g, '') === data.phone.replace(/\D/g, '');
        if (!phoneMatch) {
            throw new BadRequestException('❌ O telefone informado não confere com o cadastro.');
        }

        // 3.2 Validar Documento (CPF ou CNPJ)
        const suppliedDoc = (data.cpf || data.cnpj || '').replace(/\D/g, '');

        if (!suppliedDoc) {
            throw new BadRequestException('❌ CPF ou CNPJ obrigatórios para segurança extra.');
        }

        const userCpf = user.cpf?.replace(/\D/g, '');
        const userCnpj = user.cnpj?.replace(/\D/g, '');

        // Verifica se o documento fornecido bate com CPF ou CNPJ do usuário
        const docMatch = (userCpf && userCpf === suppliedDoc) || (userCnpj && userCnpj === suppliedDoc);

        if (!docMatch) {
            throw new BadRequestException('❌ O CPF/CNPJ informado não confere.');
        }

        // 4. Tudo OK! Atualizar senha
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return {
            success: true,
            message: '🎉 Senha redefinida com sucesso! Você já pode fazer login.'
        };
    }

    async debugFailSafe(connectionId: string) {
        const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
        if (!conn) return { error: "Connection not found" };

        const userA = await this.prisma.user.findUnique({ where: { id: conn.userAId }, select: { id: true, name: true, email: true } });
        const userB = await this.prisma.user.findUnique({ where: { id: conn.userBId }, select: { id: true, name: true, email: true } });

        const assessmentsA = await this.prisma.assessmentAssignment.findMany({
            where: { userId: conn.userAId },
            select: { id: true, status: true, assessment: { select: { type: true, title: true } }, completedAt: true }
        });

        const assessmentsB = await this.prisma.assessmentAssignment.findMany({
            where: { userId: conn.userBId },
            select: { id: true, status: true, assessment: { select: { type: true, title: true } }, completedAt: true }
        });

        // Tenta rodar extração de chaves para um assessment, se existir
        let sampleKeysA: any[] = [];
        const completedA = assessmentsA.find(a => a.status === 'COMPLETED');
        if (completedA) {
            const full = await this.prisma.assessmentAssignment.findUnique({
                where: { id: completedA.id },
                include: { responses: { include: { question: true } } }
            });
            if (full && full.responses.length > 0) {
                sampleKeysA = full.responses.slice(0, 5).map(r => ({
                    qId: r.questionId,
                    traitKey: r.question.traitKey,
                    // Cast para any para evitar erro de TS
                    meta: (r.question as any).metadata,
                }));
            }
        }

        return {
            source: "AUTH_FAIL_SAFE",
            connection: conn,
            users: { A: userA, B: userB },
            assessments: { A: assessmentsA, B: assessmentsB },
            sampleKeysA,
            timestamp: new Date().toISOString()
        };
    }
}
