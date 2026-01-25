import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor() {
        // Se a chave não estiver no .env, use placeholder.
        // O usuário deverá substituir no .env no final.
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER', {
            apiVersion: '2024-12-18.acacia' as any, // TypeScript pode reclamar sem as any se a lib estiver desatualizada
        });
    }

    async createPaymentIntent(amount: number, currency: string = 'brl', metadata: any) {
        try {
            return await this.stripe.paymentIntents.create({
                amount,
                currency,
                metadata, // Guardamos userId e planId no metadata para usar no webhook depois
                automatic_payment_methods: { enabled: true },
            });
        } catch (error) {
            console.error('Erro no Stripe CreateIntent:', error);
            throw error;
        }
    }
}
