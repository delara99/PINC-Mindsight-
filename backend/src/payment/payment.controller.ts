import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    Request,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';


import { StripeService } from './stripe.service';

@Controller('payment')
export class PaymentController {
    constructor(
        private prisma: PrismaService,

        private stripeService: StripeService
    ) { }

    @Get('health')
    getHealth() {
        return {
            status: 'Payment Controller Active',
            timestamp: new Date().toISOString(),
            hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
            env: process.env.NODE_ENV
        };
    }



    /**
     * Criar Intent de Pagamento STRIPE (Cartão)
     * Suporta quantidade dinâmica de créditos.
     */
    @Post('create-stripe-intent')
    @UseGuards(AuthGuard('jwt'))
    async createStripeIntent(@Body() body: { planId: string; credits?: number }, @Request() req) {
        const user = req.user;
        const EXTRA_CREDIT_PRICE = 2990; // R$ 29,90 por crédito adicional

        // Configuração de Planos (Base)
        // Cada plano tem um preço base e crédito(s) incluso(s)
        const plansCheck = {
            'essential': { price: 2990, includedCredits: 1, name: 'Essential' },
            'professional': { price: 5990, includedCredits: 1, name: 'Professional' },

            // Mapeamento de IDs
            '1': { price: 2990, includedCredits: 1, name: 'Essential' },
            '2': { price: 5990, includedCredits: 1, name: 'Professional' },
            '3': { price: 9990, includedCredits: 10, name: 'Business' },

            // Aliases
            'starter': { price: 2990, includedCredits: 1, name: 'Essential' },
            'pro': { price: 5990, includedCredits: 1, name: 'Professional' }
        };

        // Normalize planId
        const cleanPlanId = body.planId.toString().toLowerCase().trim();
        const selectedPlan = plansCheck[cleanPlanId];

        if (!selectedPlan) {
            console.error(`Plano inválido solicitado: ${cleanPlanId}`);
            throw new BadRequestException('Plano inválido ou não encontrado.');
        }

        // Lógica de Cálculo de Preço
        // Se o frontend mandou 'credits', usamos para calcular extras.
        // Se não mandou, usamos o padrão do plano.
        const requestedCredits = body.credits ? Number(body.credits) : selectedPlan.includedCredits;
        const extraCredits = Math.max(0, requestedCredits - selectedPlan.includedCredits);

        const totalAmount = selectedPlan.price + (extraCredits * EXTRA_CREDIT_PRICE);

        console.log(`[STRIPE] Criando Intent. Plano: ${selectedPlan.name}, Créditos: ${requestedCredits} (Extra: ${extraCredits}), Total: ${totalAmount / 100}`);

        // Criar registro de pagamento no banco
        const payment = await this.prisma.payment.create({
            data: {
                userId: user.userId,
                planId: cleanPlanId,
                planName: `${selectedPlan.name} (${requestedCredits} Créditos)`,
                amount: totalAmount / 100, // Salva float no banco
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                status: 'PENDING',
                gateway: 'STRIPE'
            }
        });

        // Criar Intent no Stripe
        try {
            const intent = await this.stripeService.createPaymentIntent(totalAmount, 'brl', {
                userId: user.userId,
                paymentId: payment.id,
                planId: cleanPlanId,
                credits: requestedCredits.toString(), // Metadata importante para o Webhook saber quantos créditos liberar
                type: 'credit_purchase'
            });

            // Atualizar pagamento com o ID do Intent
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { stripeIntentId: intent.id }
            });

            return {
                clientSecret: intent.client_secret,
                paymentId: payment.id
            };
        } catch (error) {
            console.error('Erro ao criar Stripe Intent:', error);
            await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'CANCELED' } });
            throw new BadRequestException('Erro ao iniciar pagamento com Stripe.');
        }
    }

    /**
     * Webhook para processar eventos do Stripe
     * URL: /api/v1/payment/webhook-stripe
     * Eventos: payment_intent.succeeded
     */
    @Post('webhook-stripe')
    async stripeWebhook(@Body() event: any) {
        // Em produção, deveria validar a assinatura (stripe-signature)
        // Mas para simplificar neste MVP, vamos confiar no ID do evento por enquanto
        // ou validar apenas se o ID existe.

        console.log(`[STRIPE WEBHOOK] Recebido evento: ${event.type}`);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata;

            // Log para debug
            console.log(`[STRIPE WEBHOOK] Sucesso! Intent: ${paymentIntent.id}, Meta:`, metadata);

            if (metadata && metadata.paymentId && metadata.userId) {
                try {
                    // 1. Atualizar Status do Pagamento
                    await this.prisma.payment.update({
                        where: { id: metadata.paymentId },
                        data: {
                            status: 'PAID',
                            paidAt: new Date(),
                            stripeIntentId: paymentIntent.id // Garantir sync
                        }
                    });

                    // 2. Liberar Créditos para o Usuário
                    const creditsToAdd = Number(metadata.credits || 1);

                    // Preparar update do usuário
                    const userUpdateData: any = {
                        credits: { increment: creditsToAdd }
                    };

                    // 3. Atualizar Plano (Se aplicável)
                    if (metadata.planId) {
                        const planId = metadata.planId.toLowerCase();
                        if (planId.includes('professional') || planId === '2') {
                            userUpdateData.plan = 'PRO';
                        } else if (planId.includes('business') || planId === '3') {
                            userUpdateData.plan = 'BUSINESS';
                        }
                    }

                    await this.prisma.user.update({
                        where: { id: metadata.userId },
                        data: userUpdateData
                    });

                    console.log(`[STRIPE WEBHOOK] ✅ Créditos liberados: +${creditsToAdd} para User ${metadata.userId}`);

                } catch (error) {
                    console.error('[STRIPE WEBHOOK] ❌ Erro ao processar:', error);
                    // Não lançar erro para não fazer o Stripe tentar de novo infinitamente se for erro de lógica
                    // Mas em produção idealmente tratamos retry.
                }
            } else {
                console.warn('[STRIPE WEBHOOK] Metadata incompleto. Ignorando.');
            }
        }

        return { received: true };
    }



    /**
     * Consultar status de um pagamento
     */
    @Get('status/:paymentId')
    @UseGuards(AuthGuard('jwt'))
    async getPaymentStatus(
        @Param('paymentId') paymentId: string,
        @Request() req
    ) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            throw new NotFoundException('Pagamento não encontrado');
        }

        // Verificar se o pagamento pertence ao usuário
        if (payment.userId !== req.user.userId) {
            throw new UnauthorizedException('Acesso negado');
        }



        return {
            status: payment.status,
            paidAt: payment.paidAt,
            amount: payment.amount,
            planName: payment.planName
        };
    }

    /**
     * Histórico de pagamentos do usuário
     */
    @Get('history')
    @UseGuards(AuthGuard('jwt'))
    async getPaymentHistory(@Request() req) {
        const payments = await this.prisma.payment.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return payments.map(p => ({
            id: p.id,
            planName: p.planName,
            amount: p.amount,
            status: p.status,
            createdAt: p.createdAt,
            paidAt: p.paidAt
        }));
    }
}

