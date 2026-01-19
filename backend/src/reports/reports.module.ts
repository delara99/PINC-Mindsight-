
import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { InterpretationService } from './interpretation.service';
import { PdfService } from './pdf.service';
import { ScoreCalculationService } from './score-calculation.service';
import { ReportsController } from './reports.controller';
import { DebugReportsController } from './debug.controller';
import { PrismaService } from '../prisma/prisma.service';
import { InterpretationEngineService } from '../interpretation/interpretation-engine.service';

import { TalkingToModule } from '../talking-to/talking-to.module';

@Module({
    imports: [TalkingToModule],
    controllers: [ReportsController, DebugReportsController],
    providers: [
        AnalyticsService,
        InterpretationService,
        PdfService,
        ScoreCalculationService,
        PrismaService,
        InterpretationEngineService
    ],
    exports: [AnalyticsService, InterpretationService, PdfService, ScoreCalculationService, InterpretationEngineService]
})
export class ReportsModule { }
