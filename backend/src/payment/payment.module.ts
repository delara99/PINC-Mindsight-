import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { BtgService } from './btg.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PaymentController],
    providers: [BtgService],
    exports: [BtgService]
})
export class PaymentModule { }
