import { Module } from '@nestjs/common';
import { CrossProfileController } from './cross-profile.controller';
import { CrossProfileService } from './cross-profile.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AssessmentModule } from '../../assessment/assessment.module';

@Module({
    imports: [PrismaModule, AssessmentModule],
    controllers: [CrossProfileController],
    providers: [CrossProfileService],
})
export class CrossProfileModule {}
