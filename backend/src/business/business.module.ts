
import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TalkingToModule } from '../talking-to/talking-to.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
    imports: [PrismaModule, TalkingToModule, ReportsModule],
    controllers: [BusinessController],
    providers: [BusinessService],
    exports: [BusinessService]
})
export class BusinessModule { }
