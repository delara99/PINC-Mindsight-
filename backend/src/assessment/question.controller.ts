import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('questions')
@UseGuards(AuthGuard('jwt'))
export class QuestionController {
    constructor(private prisma: PrismaService) { }

    /**
     * Atualiza uma pergunta (Admin)
     */
    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any, @Request() req) {
        // Verificar permissão
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem editar perguntas');
        }

        // Buscar pergunta para verificar tenant (se necessário)
        // Por enquanto, assume-se que admin pode editar qualquer pergunta do seu escopo
        // (Em SaaS real, verificar se o assessmentModel da pergunta pertence ao tenant)

        return this.prisma.question.update({
            where: { id },
            data: {
                text: data.text,
                traitKey: data.traitKey,
                facetKey: data.facetKey,
                weight: data.weight,
                isReverse: data.isReverse, // Novo campo
                isActive: data.isActive
            }
        });
    }

    /**
     * Cria uma nova pergunta em um Assessment
     */
    @Post('assessment/:assessmentId')
    async create(@Param('assessmentId') assessmentId: string, @Body() data: any, @Request() req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas admin');
        }

        return this.prisma.question.create({
            data: {
                assessmentModelId: assessmentId,
                text: data.text,
                traitKey: data.traitKey,
                facetKey: data.facetKey,
                weight: data.weight || 1.0,
                isReverse: data.isReverse || false,
                isActive: true
            }
        });
    }

    /**
     * Deleta (ou inativa) uma pergunta
     */
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas admin');
        }

        // Hard delete ou Soft delete?
        // Se já tiver respostas, hard delete falha (constraints).
        // Melhor usar isActive = false. Mas o user pediu "Delete".
        // Vou tentar delete, se falhar, update isActive.

        try {
            return await this.prisma.question.delete({ where: { id } });
        } catch (e) {
            // Fallback para soft delete se houver violação de FK
            return this.prisma.question.update({
                where: { id },
                data: { isActive: false }
            });
        }
    }

    /**
    * Lista perguntas de um assessment (Admin View)
    */
    @Get('assessment/:assessmentId')
    async listByAssessment(@Param('assessmentId') assessmentId: string, @Request() req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException();
        }

        return this.prisma.question.findMany({
            where: { assessmentModelId: assessmentId },
            orderBy: { createdAt: 'asc' }
        });
    }
}
