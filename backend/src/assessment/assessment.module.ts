import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { BigFiveCalculatorService } from './big-five-calculator.service';
import { AssessmentTemplateService } from './assessment-template.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AssessmentController],
    providers: [AssessmentService, BigFiveCalculatorService, AssessmentTemplateService],
    exports: [AssessmentService, BigFiveCalculatorService, AssessmentTemplateService]
})
export class AssessmentModule { }
