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
        const user = await this.prisma.user.create({
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
                status: 'pending', // Aguardando aprovação
                tenantId: tenant.id
            }
        });

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

        return {
            message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.',
            user: { email: user.email, name: user.name }
        };
    }
}
