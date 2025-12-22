import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/diagnostic')
@UseGuards(AuthGuard('jwt'))
export class DiagnosticController {
    constructor(private prisma: PrismaService) { }

    @Get('interpretative-texts')
    async listAllTexts() {
        const texts = await this.prisma.bigFiveInterpretativeText.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' }
        });

        const grouped = texts.reduce((acc, text) => {
            const key = `${text.traitKey}_${text.scoreRange}`;
            if (!acc[key]) {
                acc[key] = {
                    traitKey: text.traitKey,
                    scoreRange: text.scoreRange,
                    configId: text.configId,
                    categories: []
                };
            }
            acc[key].categories.push(text.category);
            return acc;
        }, {});

        return {
            total: texts.length,
            summary: Object.values(grouped),
            fullData: texts
        };
    }

    @Get('configs')
    async listConfigs() {
        const configs = await this.prisma.bigFiveConfig.findMany({
            include: {
                _count: {
                    select: {
                        interpretativeTexts: true,
                        traits: true
                    }
                }
            }
        });

        return {
            total: configs.length,
            configs: configs.map(c => ({
                id: c.id,
                name: c.name,
                tenantId: c.tenantId,
                isActive: c.isActive,
                textsCount: c._count.interpretativeTexts,
                traitsCount: c._count.traits
            }))
        };
    }

    @Get('assignment/:id')
    async inspectAssignment(@Param('id') id: string) {
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id },
            include: {
                assessment: true,
                config: {
                    include: {
                        interpretativeTexts: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        tenantId: true
                    }
                }
            }
        });

        if (!assignment) {
            return { error: 'Assignment not found' };
        }

        return {
            assignmentId: assignment.id,
            userId: assignment.user.id,
            userEmail: assignment.user.email,
            userTenantId: assignment.user.tenantId,
            configId: assignment.configId,
            configName: assignment.config?.name,
            configTenantId: assignment.config?.tenantId,
            textsInConfig: assignment.config?.interpretativeTexts?.length || 0,
            assessmentType: assignment.assessment.type
        };
    }
}
