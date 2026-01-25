import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { BtgService } from './btg.service';
import { StripeService } from './stripe.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PaymentController],
    providers: [BtgService, StripeService],
    exports: [BtgService, StripeService]
})
export class PaymentModule { }
