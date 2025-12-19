import { Module } from '@nestjs/common';
import { MigrationController } from './migration.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [MigrationController],
    providers: [PrismaService]
})
export class MigrationModule { }
