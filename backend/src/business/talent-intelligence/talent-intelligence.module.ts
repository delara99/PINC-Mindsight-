import { Module } from '@nestjs/common';
import { JobProfileController } from './job-profile.controller';
import { TalentIntelligenceController } from './talent-intelligence.controller';
import { JobProfileService } from './job-profile.service';
import { TalentIntelligenceService } from './talent-intelligence.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [JobProfileController, TalentIntelligenceController],
    providers: [JobProfileService, TalentIntelligenceService],
    exports: [TalentIntelligenceService, JobProfileService]
})
export class TalentIntelligenceModule { }
