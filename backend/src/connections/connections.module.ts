import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TalkingToModule } from '../talking-to/talking-to.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [TalkingToModule, AiModule],
    controllers: [ConnectionsController],
    providers: [ConnectionsService, PrismaService],
    exports: [ConnectionsService],
})
export class ConnectionsModule { }
