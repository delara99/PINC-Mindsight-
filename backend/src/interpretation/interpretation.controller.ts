import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InterpretationEngineService } from './interpretation-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreatePatternDto,
    CreateNeedDto,
    LinkPatternNeedDto,
    CreateSectionDto
} from './interpretation.dto';

@Controller('interpretation')
@UseGuards(AuthGuard('jwt'))
export class InterpretationController {
    constructor(
        private interpretationEngine: InterpretationEngineService,
        private prisma: PrismaService
    ) { }

    /**
     * Analisa um resultado e retorna interpretação avançada
     * Endpoint de teste - depois será integrado ao fluxo de relatórios
     */
    @Get('analyze/:resultId')
    async analyzeResult(@Param('resultId') resultId: string) {
        try {
            const analysis = await this.interpretationEngine.analyzeResult(resultId);
            return {
                success: true,
                data: analysis
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Lista todos os padrões (Admin)
     */
    @Get('patterns')
    async listPatterns(@Request() req) {
        const patterns = await this.prisma.interpretationPattern.findMany({
            where: {
                OR: [
                    { tenantId: req.user.tenantId },
                    { tenantId: null }
                ]
            },
            include: {
                patternNeeds: {
                    include: {
                        need: true
                    }
                }
            },
            orderBy: { priority: 'desc' }
        });

        return {
            success: true,
            data: patterns
        };
    }

    /**
     * Cria novo padrão (SUPER_ADMIN ou TENANT_ADMIN)
     */
    @Post('patterns')
    async createPattern(@Body() dto: CreatePatternDto, @Request() req) {
        // Permitir TENANT_ADMIN criar padrões para seu próprio tenant
        const tenantId = req.user.role === 'SUPER_ADMIN' ? (dto.tenantId || null) : req.user.tenantId;

        if (req.user.role === 'MEMBER') {
            throw new Error("Acesso negado");
        }

        const pattern = await this.prisma.interpretationPattern.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                conditions: dto.conditions as any,
                priority: dto.priority || 0,
                tenantId: tenantId,
                patternNeeds: {
                    create: dto.needs?.map(n => ({
                        needId: n.needId,
                        intensity: n.intensity
                    }))
                }
            },
            include: { patternNeeds: true }
        });

        return {
            success: true,
            data: pattern
        };
    }

    /**
     * Atualiza padrão existente
     */
    @Post('patterns/:id')
    async updatePattern(@Param('id') id: string, @Body() dto: CreatePatternDto, @Request() req) {
        // Verificar propriedade
        const existing = await this.prisma.interpretationPattern.findUnique({ where: { id } });
        if (!existing) throw new Error("Padrão não encontrado");

        if (req.user.role !== 'SUPER_ADMIN' && existing.tenantId !== req.user.tenantId) {
            throw new Error("Acesso negado: Você não pode editar este padrão.");
        }

        // Update Pattern logic with transaction for needs
        const [updatedPattern] = await this.prisma.$transaction([
            this.prisma.interpretationPattern.update({
                where: { id },
                data: {
                    code: dto.code,
                    name: dto.name,
                    description: dto.description,
                    conditions: dto.conditions as any,
                    priority: dto.priority
                }
            }),
            // If needs provided, replace them
            ...(dto.needs ? [
                this.prisma.patternNeed.deleteMany({ where: { patternId: id } }),
                this.prisma.patternNeed.createMany({
                    data: dto.needs.map(n => ({
                        patternId: id,
                        needId: n.needId,
                        intensity: n.intensity
                    }))
                })
            ] : [])
        ]);

        return { success: true, data: updatedPattern };
    }

    /**
     * Remove padrão
     */
    @Post('patterns/:id/delete')
    async deletePattern(@Param('id') id: string, @Request() req) {
        const existing = await this.prisma.interpretationPattern.findUnique({ where: { id } });
        if (!existing) throw new Error("Padrão não encontrado");

        if (req.user.role !== 'SUPER_ADMIN' && existing.tenantId !== req.user.tenantId) {
            throw new Error("Acesso negado.");
        }

        await this.prisma.interpretationPattern.delete({ where: { id } });
        return { success: true };
    }

    /**
     * Lista todas as necessidades (Admin)
     */
    @Get('needs')
    async listNeeds(@Request() req) {
        const needs = await this.prisma.psychologicalNeed.findMany({
            where: {
                OR: [
                    { tenantId: req.user.tenantId },
                    { tenantId: null }
                ]
            },
            orderBy: { name: 'asc' }
        });

        return {
            success: true,
            data: needs
        };
    }

    /**
     * Cria nova necessidade (SUPER_ADMIN)
     */
    @Post('needs')
    async createNeed(@Body() dto: CreateNeedDto, @Request() req) {
        // Permitir criação por TENANT_ADMIN para seu próprio uso
        const tenantId = req.user.role === 'SUPER_ADMIN' ? (dto.tenantId || null) : req.user.tenantId;

        if (req.user.role === 'MEMBER') throw new Error("Acesso negado");

        const need = await this.prisma.psychologicalNeed.create({
            data: {
                code: dto.code,
                name: dto.name,
                clientTitle: dto.clientTitle,
                clientDescription: dto.clientDescription,
                clientImpact: dto.clientImpact,
                specialistTitle: dto.specialistTitle,
                specialistDescription: dto.specialistDescription,
                specialistAnalysis: dto.specialistAnalysis,
                favorableEnvironments: JSON.stringify(dto.favorableEnvironments),
                unfavorableEnvironments: JSON.stringify(dto.unfavorableEnvironments),
                recommendations: JSON.stringify(dto.recommendations),
                tenantId: tenantId
            }
        });

        return {
            success: true,
            data: need
        };
    }

    /**
     * Atualiza necessidade
     */
    @Post('needs/:id')
    async updateNeed(@Param('id') id: string, @Body() dto: CreateNeedDto, @Request() req) {
        const existing = await this.prisma.psychologicalNeed.findUnique({ where: { id } });
        if (!existing) throw new Error("Necessidade não encontrada");

        // Security check relaxed for autonomy
        // if (req.user.role !== 'SUPER_ADMIN' && existing.tenantId !== req.user.tenantId) { ... }

        const need = await this.prisma.psychologicalNeed.update({
            where: { id },
            data: {
                name: dto.name,
                clientTitle: dto.clientTitle,
                clientDescription: dto.clientDescription,
                clientImpact: dto.clientImpact,
                specialistTitle: dto.specialistTitle,
                specialistDescription: dto.specialistDescription,
                specialistAnalysis: dto.specialistAnalysis,
                favorableEnvironments: Array.isArray(dto.favorableEnvironments) ? JSON.stringify(dto.favorableEnvironments) : dto.favorableEnvironments,
                unfavorableEnvironments: Array.isArray(dto.unfavorableEnvironments) ? JSON.stringify(dto.unfavorableEnvironments) : dto.unfavorableEnvironments,
                recommendations: Array.isArray(dto.recommendations) ? JSON.stringify(dto.recommendations) : dto.recommendations,
            }
        });

        return { success: true, data: need };
    }

    /**
     * Remove necessidade
     */
    @Post('needs/:id/delete')
    async deleteNeed(@Param('id') id: string, @Request() req) {
        const existing = await this.prisma.psychologicalNeed.findUnique({ where: { id } });
        if (!existing) throw new Error("Necessidade não encontrada");

        if (req.user.role !== 'SUPER_ADMIN' && existing.tenantId !== req.user.tenantId) {
            throw new Error("Acesso negado.");
        }

        await this.prisma.psychologicalNeed.delete({ where: { id } });
        return { success: true };
    }

    /**
     * Vincula padrão a necessidade (SUPER_ADMIN)
     */
    @Post('pattern-needs')
    async linkPatternNeed(@Body() dto: LinkPatternNeedDto, @Request() req) {
        if (req.user.role !== 'SUPER_ADMIN') {
            return {
                success: false,
                message: 'Apenas SUPER_ADMIN pode vincular padrões'
            };
        }

        const link = await this.prisma.patternNeed.create({
            data: {
                patternId: dto.patternId,
                needId: dto.needId,
                intensity: dto.intensity
            }
        });

        return {
            success: true,
            data: link
        };
    }

    /**
     * Lista seções interpretativas (Admin)
     */
    @Get('sections')
    async listSections(@Request() req) {
        const sections = await this.prisma.interpretationSection.findMany({
            where: {
                OR: [
                    { tenantId: req.user.tenantId },
                    { tenantId: null }
                ]
            },
            orderBy: { displayOrder: 'asc' }
        });

        return {
            success: true,
            data: sections
        };
    }

    /**
     * Cria nova seção (SUPER_ADMIN)
     */
    @Post('sections')
    async createSection(@Body() dto: CreateSectionDto, @Request() req) {
        if (req.user.role !== 'SUPER_ADMIN') {
            return {
                success: false,
                message: 'Apenas SUPER_ADMIN pode criar seções'
            };
        }

        const section = await this.prisma.interpretationSection.create({
            data: {
                code: dto.code,
                title: dto.title,
                template: dto.template,
                audience: dto.audience,
                displayOrder: dto.displayOrder || 0,
                tenantId: dto.tenantId || null
            }
        });

        return {
            success: true,
            data: section
        };
    }
}
