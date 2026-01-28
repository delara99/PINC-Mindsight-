
import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TalkingToModule } from '../talking-to/talking-to.module';
import { ReportsModule } from '../reports/reports.module';

import { TalentIntelligenceModule } from './talent-intelligence/talent-intelligence.module';

import { PublicBusinessController } from './public-business.controller';

@Module({
    imports: [PrismaModule, TalkingToModule, ReportsModule, TalentIntelligenceModule],
    controllers: [BusinessController, PublicBusinessController],
    providers: [BusinessService],
    exports: [BusinessService, TalentIntelligenceModule]
})
export class BusinessModule { }
