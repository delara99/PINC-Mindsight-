import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { BigFiveCalculatorService } from './big-five-calculator.service';
import { AssessmentTemplateService } from './assessment-template.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';
import { ScoreCalculationService } from '../reports/score-calculation.service';

import { QuestionController } from './question.controller';
import { DiagnosticController } from './diagnostic.controller';
import { SetupController } from './setup.controller';

@Module({
    imports: [PrismaModule, ReportsModule],
    controllers: [AssessmentController, QuestionController, DiagnosticController, SetupController],
    providers: [AssessmentService, BigFiveCalculatorService, AssessmentTemplateService, ScoreCalculationService],
    exports: [AssessmentService, BigFiveCalculatorService, AssessmentTemplateService]
})
export class AssessmentModule { }

