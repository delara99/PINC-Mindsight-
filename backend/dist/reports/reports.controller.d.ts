import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { InterpretationService } from './interpretation.service';
import { PdfService } from './pdf.service';
export declare class ReportsController {
    private analytics;
    private interpretation;
    private pdf;
    constructor(analytics: AnalyticsService, interpretation: InterpretationService, pdf: PdfService);
    getInterpretation(scoresStr: string): Promise<any[]>;
    getFit(profileId: string, scoresStr: string): Promise<{
        fit: number;
    }>;
    downloadReport(assignmentId: string, res: Response): Promise<StreamableFile>;
}
