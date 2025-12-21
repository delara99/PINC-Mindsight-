import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/fix')
@UseGuards(AuthGuard('jwt'))
export class FixController {
    constructor(private readonly prisma: PrismaService) { }

    @Post('my-assignments')
    async fixMyAssignments(@Req() req: any) {
        const userId = req.user.userId;

        // 1. Buscar config ativa do tenant do usuário
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { tenantId: true }
        });

        if (!user) {
            return { success: false, message: 'Usuário não encontrado' };
        }

        const activeConfig = await this.prisma.bigFiveConfig.findFirst({
            where: {
                tenantId: user.tenantId,
                isActive: true
            }
        });

        if (!activeConfig) {
            return { success: false, message: 'Config Big Five não encontrada' };
        }

        // 2. Buscar assignments COMPLETED sem config
        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: {
                userId,
                status: 'COMPLETED',
                OR: [
                    { configId: null },
                    { configId: '' }
                ]
            }
        });

        // 3. Vincular à config ativa
        let fixed = 0;
        for (const assignment of assignments) {
            await this.prisma.assessmentAssignment.update({
                where: { id: assignment.id },
                data: { configId: activeConfig.id }
            });
            fixed++;
        }

        return {
            success: true,
            message: `${fixed} assignments corrigidos`,
            configId: activeConfig.id
        };
    }
}
