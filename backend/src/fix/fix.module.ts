import { Module } from '@nestjs/common';
import { FixController } from './fix.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [FixController],
    providers: [PrismaService]
})
export class FixModule { }
