
import { Controller, Get, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { InterpretationService } from './interpretation.service';
import { PdfService } from './pdf.service';

@Controller('reports')
export class ReportsController {
    constructor(
        private analytics: AnalyticsService,
        private interpretation: InterpretationService,
        private pdf: PdfService
    ) { }

    @Get('interpretation')
    async getInterpretation(@Query('scores') scoresStr: string) {
        const scores = JSON.parse(scoresStr);
        return this.interpretation.generateFullReport(scores);
    }

    @Get('fit/:profileId')
    async getFit(@Param('profileId') profileId: string, @Query('scores') scoresStr: string) {
        const scores = JSON.parse(scoresStr);
        return {
            fit: await this.analytics.calculateJobFit(scores, profileId)
        };
    }

    @Get('download/:assignmentId')
    async downloadReport(@Param('assignmentId') assignmentId: string, @Res({ passthrough: true }) res: Response) {
        // Mock data fetching for now
        const data = {
            name: "Candidato Mock",
            scores: {
                "OPENNESS": 4.5,
                "CONSCIENTIOUSNESS": 3.8,
                "EXTRAVERSION": 4.2,
                "AGREEABLENESS": 4.0,
                "NEUROTICISM": 2.1
            }
        };

        // Gerar interpretação
        const interpretation = await this.interpretation.generateFullReport(data.scores);

        const pdfBuffer = await this.pdf.generatePdf({
            ...data,
            interpretation
        });
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="report-${assignmentId}.pdf"`,
        });

        return new StreamableFile(pdfBuffer);
    }
}
