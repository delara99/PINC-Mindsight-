import { Module } from '@nestjs/common';
import { ComparisonController } from './comparison.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [ComparisonController],
    providers: [PrismaService]
})
export class ComparisonModule { }
