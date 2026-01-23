import { Module } from '@nestjs/common';
import { CalculationEngineController } from './calculation-engine.controller';
import { CalculationEngineService } from './calculation-engine.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CalculationEngineController],
    providers: [CalculationEngineService],
    exports: [CalculationEngineService]
})
export class CalculationEngineModule { }
