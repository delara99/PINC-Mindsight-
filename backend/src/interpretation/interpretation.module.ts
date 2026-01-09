import { Module } from '@nestjs/common';
import { InterpretationEngineService } from './interpretation-engine.service';
import { InterpretationController } from './interpretation.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [InterpretationController],
    providers: [InterpretationEngineService],
    exports: [InterpretationEngineService]
})
export class InterpretationModule { }
