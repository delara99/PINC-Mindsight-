import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { TalentIntelligenceModule } from '../talent-intelligence/talent-intelligence.module';

@Module({
    imports: [PrismaModule, TalentIntelligenceModule],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService]
})
export class TeamModule { }
