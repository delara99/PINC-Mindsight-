import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BigFiveConfigService } from './big-five-config.service';
import { BigFiveConfigController } from './big-five-config.controller';

@Module({
    providers: [PrismaService, BigFiveConfigService],
    controllers: [BigFiveConfigController],
    exports: [BigFiveConfigService]
})
export class BigFiveConfigModule { }
