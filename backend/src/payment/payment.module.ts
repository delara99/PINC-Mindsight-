import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { StripeService } from './stripe.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PaymentController],
    providers: [StripeService],
    exports: [StripeService]
})
export class PaymentModule { }
