import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { ComparisonController } from '../comparison/comparison.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [ConnectionsController, ComparisonController],
    providers: [ConnectionsService, PrismaService],
    exports: [ConnectionsService],
})
export class ConnectionsModule { }
