import { Module } from '@nestjs/common';
import { TalkingToController } from './talking-to.controller';
import { TalkingToRulesController } from './rules.controller';
import { TalkingToService } from './talking-to.service';
import { TalkingToRulesService } from './rules.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScoreCalculationService } from '../reports/score-calculation.service';
import { PdfService } from '../reports/pdf.service';

import { TalkingToStructureController } from './structure.controller';
import { TalkingToStructureService } from './structure.service';

@Module({
    imports: [PrismaModule],
    controllers: [TalkingToController, TalkingToRulesController, TalkingToStructureController],
    providers: [TalkingToService, TalkingToRulesService, TalkingToStructureService, ScoreCalculationService, PdfService],
    exports: [TalkingToService]
})
export class TalkingToModule { }
