import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TalkingToModule } from '../talking-to/talking-to.module';

@Module({
    imports: [TalkingToModule],
    controllers: [ConnectionsController],
    providers: [ConnectionsService, PrismaService],
    exports: [ConnectionsService],
})
export class ConnectionsModule { }
