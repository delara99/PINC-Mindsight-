import { Module } from '@nestjs/common';
import { MigrationController } from './migration.controller';
import { MigrationPaymentController } from './migration-payment.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [MigrationController, MigrationPaymentController],
    providers: [PrismaService]
})
export class MigrationModule { }
