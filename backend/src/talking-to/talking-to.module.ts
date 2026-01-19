import { Module } from '@nestjs/common';
import { TalkingToController } from './talking-to.controller';
import { TalkingToService } from './talking-to.service';
import { PrismaModule } from '../prisma/prisma.module';

import { ScoreCalculationService } from '../reports/score-calculation.service';

@Module({
    imports: [PrismaModule],
    controllers: [TalkingToController],
    providers: [TalkingToService, ScoreCalculationService],
    exports: [TalkingToService]
})
export class TalkingToModule { }
