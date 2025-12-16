
import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LeadsController } from './leads.controller';

@Module({
    imports: [PrismaModule],
    controllers: [LeadsController],
    providers: [LeadsService],
})
export class LeadsModule {}
