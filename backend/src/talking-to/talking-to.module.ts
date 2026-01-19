import { Module } from '@nestjs/common';
import { TalkingToController } from './talking-to.controller';
import { TalkingToService } from './talking-to.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TalkingToController],
    providers: [TalkingToService],
    exports: [TalkingToService]
})
export class TalkingToModule { }
