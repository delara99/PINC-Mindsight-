
import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { InterpretationService } from './interpretation.service';
import { PdfService } from './pdf.service';
import { ScoreCalculationService } from './score-calculation.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [ReportsController],
    providers: [
        AnalyticsService,
        InterpretationService,
        PdfService,
        ScoreCalculationService,
        PrismaService
    ],
    exports: [AnalyticsService, InterpretationService, PdfService, ScoreCalculationService]
})
export class ReportsModule { }
