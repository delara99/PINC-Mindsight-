import { Module } from '@nestjs/common';
import { TalkingToController } from './talking-to.controller';
import { TalkingToRulesController } from './rules.controller';
import { TalkingToService } from './talking-to.service';
import { TalkingToRulesService } from './rules.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScoreCalculationService } from '../reports/score-calculation.service';
import { PdfService } from '../reports/pdf.service';

@Module({
    imports: [PrismaModule],
    controllers: [TalkingToController, TalkingToRulesController],
    providers: [TalkingToService, TalkingToRulesService, ScoreCalculationService, PdfService],
    exports: [TalkingToService]
})
export class TalkingToModule { }
