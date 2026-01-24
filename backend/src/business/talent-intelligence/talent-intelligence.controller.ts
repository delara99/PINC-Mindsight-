import { Controller, Get, Post, Put, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TalentIntelligenceService } from './talent-intelligence.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('business/talent-intelligence')
@UseGuards(AuthGuard('jwt'))
export class TalentIntelligenceController {
    constructor(
        private service: TalentIntelligenceService,
        private prisma: PrismaService
    ) { }

    @Get('analyze/:profileId')
    async analyzeCandidates(@Request() req, @Param('profileId') profileId: string) {
        const tenantId = req.user.tenantId;

        // 1. Buscar assessments concluídos do tenant
        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: {
                user: { tenantId: tenantId },
                status: 'COMPLETED',
                result: { isNot: null }
            },
            include: { user: true }
        });

        // 2. Calcular fit para cada um
        // Obs: Em produção, isso deveria ser paginado ou pré-calculado.
        const analysisResults = await Promise.all(assignments.map(async (assignment) => {
            try {
                // Calcula e SALVA a análise (sim, vamos persistir para ter histórico/cache)
                return await this.service.calculateJobFit(assignment.id, profileId);
            } catch (e) {
                console.error(`Erro ao calcular fit para ${assignment.id}:`, e);
                return null;
            }
        }));

        // 3. Retornar filtrado e ordenado
        const validResults = analysisResults
            .filter(r => r !== null)
            // Adicionar infos do usuário na resposta para o frontend exibir
            // Como calculateJobFit retorna o objeto CandidateFitAnalysis, precisamos popular o usuário.
            // O Prisma create retorna o objeto simples. Vamos fazer um refetch ou buscar usuário separadamente?
            // Melhor: vamos enriquecer a resposta aqui manualmente pois temos a lista de assignments com user.
            .map(result => {
                const assignment = assignments.find(a => a.user.id === result.candidateId);
                // Ops, candidateId no schema CandidateFitAnalysis aponta para User ID ou Assignment ID?
                // No service eu pus: candidateId: assignment.user.id
                // Então aponta para User.
                const user = assignments.find(a => a.user.id === result.candidateId)?.user;

                return {
                    ...result,
                    candidateName: user?.name,
                    candidateEmail: user?.email,
                    candidateRole: 'Colaborador' // Placeholder
                };
            })
            .sort((a, b) => b.overallFit - a.overallFit);

        return validResults;
    }

    // --- TEAM ENDPOINTS ---

    @Post('teams')
    async createTeam(@Request() req, @Body() data: { name: string; description?: string; memberIds?: string[] }) {
        return this.service.createTeam(req.user.tenantId, data);
    }

    @Get('teams')
    async getTeams(@Request() req) {
        return this.service.getTeams(req.user.tenantId);
    }

    @Put('teams/:id/members')
    async addMembers(@Request() req, @Param('id') teamId: string, @Body() data: { memberIds: string[] }) {
        return this.service.addMembersToTeam(req.user.tenantId, teamId, data.memberIds);
    }
}
