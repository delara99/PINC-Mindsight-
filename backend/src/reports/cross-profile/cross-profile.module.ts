// Cross Profile Module
import { Module } from '@nestjs/common';
import { CrossProfileController } from './cross-profile.controller';
import { CrossProfileService } from './cross-profile.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AssessmentModule } from '../../assessment/assessment.module';
import { ScoreCalculationService } from '../score-calculation.service';

@Module({
    imports: [PrismaModule, AssessmentModule],
    controllers: [CrossProfileController],
    providers: [CrossProfileService, ScoreCalculationService],
})
export class CrossProfileModule { }
