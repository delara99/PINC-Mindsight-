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
import { BtgService } from './btg.service';

import { StripeService } from './stripe.service';

@Controller('api/v1/payment')
export class PaymentController {
    constructor(
        private prisma: PrismaService,
        private btgService: BtgService,
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
     * Criar uma cobrança PIX para um plano
     */
    @Post('create-pix')
    @UseGuards(AuthGuard('jwt'))
    async createPix(
        @Request() req,
        @Body() body: { planId: string; couponCode?: string }
    ) {
        const user = req.user;

        // Buscar plano (aqui você vai precisar buscar de onde armazena os planos)
        // Por ora, vou criar uma função helper
        const plan = await this.getPlanDetails(body.planId);

        if (!plan) {
            throw new NotFoundException('Plano não encontrado');
        }

        // Aplicar cupom se fornecido
        let finalAmount = plan.price;
        /* TEMPORARIAMENTE DESABILITADO - será reativado após deploy
        if (body.couponCode) {
            const discount = await this.validateAndApplyCoupon(body.couponCode, plan.id);
            finalAmount = plan.price * (1 - discount / 100);
        }
        */


        // Criar registro de pagamento no banco
        const payment = await this.prisma.payment.create({
            data: {
                userId: user.userId,
                planId: plan.id,
                planName: plan.name,
                amount: finalAmount,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
                status: 'PENDING'
            }
        });

        try {
            // Criar cobrança no BTG
            const btgCharge = await this.btgService.createPixCharge({
                amount: finalAmount,
                description: `${plan.name} - PINC Mindsight`,
                externalReference: payment.id
            });

            // Atualizar pagamento com dados do BTG
            const updatedPayment = await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    btgChargeId: btgCharge.id,
                    pixCopyPaste: btgCharge.pixCopyPaste,
                    qrCodeBase64: btgCharge.qrCode,
                    expiresAt: new Date(btgCharge.expiresAt)
                }
            });

            return {
                paymentId: updatedPayment.id,
                qrCodeBase64: updatedPayment.qrCodeBase64,
                pixCopyPaste: updatedPayment.pixCopyPaste,
                expiresAt: updatedPayment.expiresAt,
                amount: updatedPayment.amount,
                planName: updatedPayment.planName
            };

        } catch (error) {
            // Se falhar na criação do BTG, marcar pagamento como cancelado
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'CANCELED' }
            });

            throw new BadRequestException(error.message || 'Erro ao criar cobrança PIX');
        }
    }

    /**
     * Criar Intent de Pagamento STRIPE (Cartão)
     */
    @Post('create-stripe-intent')
    @UseGuards(AuthGuard('jwt'))
    async createStripeIntent(@Body() body: { planId: string }, @Request() req) {
        const user = req.user;

        // Configuração de Preços B2C (Hardcoded por enquanto)
        const plans = {
            'essential': 2990,    // R$ 29,90
            'professional': 5990, // R$ 59,90
            // Aliases para garantir compatibilidade
            'starter': 2990,
            'pro': 5990
        };

        // Normalize planId
        const cleanPlanId = body.planId.toLowerCase().trim();
        const amount = plans[cleanPlanId];

        if (!amount) {
            console.error(`Plano inválido solicitado: ${body.planId}`);
            throw new BadRequestException('Plano inválido ou não encontrado.');
        }

        // Criar registro de pagamento no banco
        const payment = await this.prisma.payment.create({
            data: {
                userId: user.userId,
                planId: cleanPlanId,
                planName: cleanPlanId.charAt(0).toUpperCase() + cleanPlanId.slice(1),
                amount: amount / 100,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h para pagar
                status: 'PENDING',
                gateway: 'STRIPE'
            }
        });

        // Criar Intent no Stripe
        try {
            const intent = await this.stripeService.createPaymentIntent(amount, 'brl', {
                userId: user.userId,
                paymentId: payment.id,
                planId: cleanPlanId,
                integration_type: 'b2c_modal'
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
            // Cleanup: Se falhar no Stripe, cancela no banco
            await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'CANCELED' } });
            throw new BadRequestException('Erro ao iniciar pagamento com Stripe.');
        }
    }

    /**
     * Webhook para receber notificações do BTG
     */
    @Post('webhook-btg')
    async handleWebhook(@Body() webhook: any) {
        console.log('[BTG WEBHOOK] Recebido:', JSON.stringify(webhook, null, 2));

        // Validar webhook
        const isValid = this.btgService.validateWebhookSignature(webhook, webhook.signature);
        if (!isValid) {
            throw new UnauthorizedException('Invalid webhook signature');
        }

        const { id: chargeId, status, paidAt, externalReference } = webhook;

        if (status === 'PAID') {
            // Buscar pagamento pelo externalReference (nosso Payment.id)
            const payment = await this.prisma.payment.findUnique({
                where: { id: externalReference }
            });

            if (!payment) {
                console.error(`[BTG WEBHOOK] Pagamento não encontrado: ${externalReference}`);
                return { received: true, processed: false };
            }

            // Evitar processar pagamento já pago (idempotência)
            if (payment.status === 'PAID') {
                console.log(`[BTG WEBHOOK] Pagamento já processado: ${payment.id}`);
                return { received: true, processed: false, message: 'Already processed' };
            }

            // Atualizar status do pagamento
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    paidAt: new Date(paidAt)
                }
            });

            // Liberar créditos ao usuário
            await this.addCreditsToUser(payment.userId, payment.planName, payment.planId);

            console.log(`[BTG WEBHOOK] ✅ Pagamento processado e créditos liberados: ${payment.id}`);
        }

        return { received: true, processed: true };
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

        // Se ainda está pendente e tem btgChargeId, consultar o BTG
        if (payment.status === 'PENDING' && payment.btgChargeId) {
            try {
                const btgStatus = await this.btgService.getChargeStatus(payment.btgChargeId);

                if (btgStatus.status === 'PAID') {
                    // Atualizar localmente
                    await this.prisma.payment.update({
                        where: { id: paymentId },
                        data: {
                            status: 'PAID',
                            paidAt: new Date(btgStatus.paidAt)
                        }
                    });

                    // Liberar créditos
                    await this.addCreditsToUser(payment.userId, payment.planName, payment.planId);

                    return { status: 'PAID', paidAt: btgStatus.paidAt };
                }
            } catch (error) {
                console.error('Erro ao consultar status no BTG:', error);
            }
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

    // ====== HELPER METHODS ======

    private async getPlanDetails(planId: string) {
        // TODO: Adaptar para buscar de onde você armazena os planos
        // Por ora, retornando planos fixos
        const plans = {
            'starter': { id: 'starter', name: 'Starter', price: 4.99, credits: 1 },
            'pro': { id: 'pro', name: 'Pro', price: 7.99, credits: 3 },
            'business': { id: 'business', name: 'Business', price: 14.99, credits: 10 }
        };

        return plans[planId.toLowerCase()] || null;
    }


    private async addCreditsToUser(userId: string, planName: string, planId: string) {
        // Buscar quantidade de créditos do plano
        const plan = await this.getPlanDetails(planId);
        const creditsToAdd = plan?.credits || 1;

        // Adicionar créditos ao usuário
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                credits: {
                    increment: creditsToAdd
                }
            }
        });

        console.log(`✅ ${creditsToAdd} crédito(s) adicionado(s) ao usuário ${userId}`);
    }
}
