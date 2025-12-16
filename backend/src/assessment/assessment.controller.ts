import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssessmentService } from './assessment.service';
import { BigFiveCalculatorService } from './big-five-calculator.service';
import { AssessmentTemplateService } from './assessment-template.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('assessments')
@UseGuards(AuthGuard('jwt'))
export class AssessmentController {
    constructor(
        private assessmentService: AssessmentService,
        private bigFiveCalculator: BigFiveCalculatorService,
        private templateService: AssessmentTemplateService,
        private prisma: PrismaService
    ) { }

    @Get('my-assignments-list')
    async getMyAssignmentsList(@Request() req) {
        const user = req.user;
        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: { userId: user.userId },
            include: {
                assessment: {
                    include: {
                        questions: true,
                        _count: { select: { assignments: true } }
                    }
                }
            },
            orderBy: { assignedAt: 'desc' }
        });

        return assignments.map(assignment => ({
            ...assignment.assessment,
            assignmentId: assignment.id,
            assignmentStatus: assignment.status,
            assignedAt: assignment.assignedAt,
            feedback: assignment.feedback
        }));
    }

    @Get('assignments/:id')
    @UseGuards(AuthGuard('jwt'))
    async getAssignmentDetails(@Param('id') id: string, @Request() req) {
        const user = req.user;

        // ===== DEBUG LOGS START =====
        console.log('\n========== GET ASSIGNMENT DETAILS ==========');
        console.log('[DEBUG] Assignment ID requested:', id);
        console.log('[DEBUG] User from token:', JSON.stringify(user, null, 2));
        console.log('[DEBUG] User ID:', user.userId);
        console.log('[DEBUG] User email:', user.email);
        console.log('[DEBUG] User role:', user.role);
        // ===== DEBUG LOGS END =====

        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id },
            include: {
                user: true,
                assessment: { include: { questions: true } },
                responses: true,
                result: true
            }
        });

        if (!assignment) {
            console.log('[DEBUG] ❌ Assignment NOT FOUND in database');
            throw new BadRequestException('Avaliação não encontrada');
        }

        console.log('[DEBUG] ✅ Assignment found');
        console.log('[DEBUG] Assignment userId:', assignment.userId);
        console.log('[DEBUG] Assignment user email:', assignment.user.email);

        // CRITICAL: Verificar se é o dono PRIMEIRO e retornar imediatamente
        const isAssignee = assignment.userId === user.userId;

        console.log('[DEBUG] Comparing IDs:');
        console.log('[DEBUG]   assignment.userId:', assignment.userId);
        console.log('[DEBUG]   user.userId:', user.userId);
        console.log('[DEBUG]   Are equal?', isAssignee);
        console.log('[DEBUG]   Type of assignment.userId:', typeof assignment.userId);
        console.log('[DEBUG]   Type of user.userId:', typeof user.userId);

        if (isAssignee) {
            console.log('[DEBUG] ✅ User IS the assignee - GRANTING ACCESS');
            // Usuário sempre pode ver seu próprio assignment
            return assignment;
        }

        // Se não for o dono, verificar outras permissões
        const isOwnerAdmin = (user.role === 'TENANT_ADMIN' || user.role === 'SUPER_ADMIN') && assignment.assessment.tenantId === user.tenantId;
        const isSuperAdmin = user.role === 'SUPER_ADMIN';

        if (isOwnerAdmin || isSuperAdmin) {
            return assignment;
        }

        // Verificar se há conexão ativa com permissão de compartilhar inventários
        const connection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { userAId: assignment.userId, userBId: user.userId, status: 'ACTIVE' },
                    { userAId: user.userId, userBId: assignment.userId, status: 'ACTIVE' }
                ]
            },
            include: {
                sharingSettings: true
            }
        });

        if (connection) {
            // Verificar se o dono do assignment compartilha inventários
            const ownerSettings = connection.sharingSettings.find(
                s => s.userId === assignment.userId
            );
            if (ownerSettings?.shareInventories === true) {
                return assignment;
            }
        }

        // Se chegou aqui, não tem permissão
        throw new ForbiddenException('Acesso negado');
    }

    /**
     * GET /assessments/:id/my-assignment
     * Busca o assignment do usuário logado para um assessment específico
     */
    @Get(':id/my-assignment')
    async getMyAssignment(@Param('id') assessmentId: string, @Request() req) {
        const user = req.user;

        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: {
                assessmentId,
                userId: user.userId
            },
            include: {
                user: true,
                assessment: { include: { questions: true } },
                responses: true,
                result: true
            }
        });

        if (!assignment) {
            throw new BadRequestException('Você não possui assignment para esta avaliação');
        }

        return assignment;
    }

    @Post('assignments/:id/feedback')
    async addFeedback(@Param('id') id: string, @Body() body: { feedback: string }, @Request() req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem dar feedback');
        }

        return this.prisma.assessmentAssignment.update({
            where: { id },
            data: {
                feedback: body.feedback,
                feedbackAt: new Date()
            }
        });
    }


    @Post('init-big-five')
    async initBigFive(@Request() req) {
        const user = req.user;
        
        // Find Big Five Model
        const assessmentModel = await this.prisma.assessmentModel.findFirst({
            where: { type: 'BIG_FIVE' }
        });

        if (!assessmentModel) {
            throw new BadRequestException('Configuração de avaliação não encontrada no sistema.');
        }

        // Check if already exists pending
        const existing = await this.prisma.assessmentAssignment.findFirst({
            where: { 
                userId: user.userId, 
                assessmentId: assessmentModel.id, 
                status: { not: 'COMPLETED' } 
            }
        });

        if (existing) {
            return existing;
        }

        // Create new assignment
        // Buscar questões para garantir integridade? O create aceita só ID.
        // A persistência de respostas do trial é feita no registro. Aqui é "Start Fresh" ou "Rescue".
        // Se quisermos recuperar o trialData do frontend, teríamos que passar no body.
        // Mas por simplicidade, vamos apenas criar o Assignment vazio (o usuario começa do zero, melhor que travar).
        
        const assignment = await this.prisma.assessmentAssignment.create({
            data: {
                userId: user.userId,
                assessmentId: assessmentModel.id,
                status: 'IN_PROGRESS',
                assignedAt: new Date(),
            }
        });

        return assignment;
    }

    // Listar avaliações completadas (para relatórios)
    @Get('completed')
    async getCompletedAssessments(@Request() req) {
        const tenantId = req.user.tenantId;

        const completedAssignments = await this.prisma.assessmentAssignment.findMany({
            where: {
                status: 'COMPLETED',
                user: { tenantId }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assessment: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                result: true
            },
            orderBy: {
                completedAt: 'desc'
            }
        });

        return completedAssignments.map(assignment => ({
            id: assignment.id,
            userName: assignment.user.name || assignment.user.email,
            userEmail: assignment.user.email,
            assessmentTitle: assignment.assessment.title,
            completedAt: assignment.completedAt,
            scores: assignment.result?.scores || {}
        }));
    }

    // Listar avaliações completadas de um usuário especifico (para Admin)
    @Get('user/:userId/completed')
    async getUserCompletedAssessments(@Param('userId') userId: string, @Request() req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem ver histórico.');
        }

        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: {
                userId: userId,
                status: 'COMPLETED'
            },
            include: {
                assessment: {
                    select: { title: true }
                },
                result: true
            },
            orderBy: {
                completedAt: 'desc'
            }
        });

        return assignments.map(a => ({
            id: a.id,
            title: a.assessment.title,
            completedAt: a.completedAt,
            scores: a.result?.scores
        }));
    }

    @Get(':id')
    async getOne(@Param('id') id: string, @Request() req) {
        const user = req.user;
        console.log(`[DEBUG] getOne request. ID: ${id}, User: ${user.userId}, Role: ${user.role}`);

        // 1. Prioridade Máxima: Se o usuário tem um Assignment para esta avaliação, ele DEVE poder vê-la.
        // Isso remove restrições de Role/UserType que estavam bloqueando TenantAdmins de verem suas próprias provas.
        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: {
                assessmentId: id,
                userId: user.userId
            }
        });

        if (assignment) {
            console.log('[DEBUG] Assignment found via Universal Check. Granting access.');
            // Se tiver atribuição, busca a avaliação ignorando o tenantId (Modo Leitura para Realização)
            return this.assessmentService.findOne(id);
        }

        // Se não tiver atribuição, tenta buscar normalmente.
        // Se for BIG_FIVE (Template Público), permitimos visualizar a estrutura mesmo sem assignment
        // Wrap em try-catch pois o service pode lançar erro se não encontrar/permitir
        let assessment = null;
        console.log(`[DEBUG] getOne calling findOne for id: ${id}, tenant: ${req.user.tenantId}`);
        try {
            assessment = await this.assessmentService.findOne(id, req.user.tenantId);
        } catch (error) {
            console.log('[DEBUG] findOne failed:', error.message);
        }
        
        if (!assessment) {
             console.log('[DEBUG] Assessment not found via normal flow. Trying Public Template fallback.');
             // Tenta buscar como Template Público (System Tenant)
             const publicTemplate = await this.prisma.assessmentModel.findFirst({
                 where: { id: id, type: 'BIG_FIVE' },
                 include: { questions: true }
             });
             
             if (publicTemplate) {
                 console.log('[DEBUG] Public Template FOUND. ID:', publicTemplate.id);
                 return publicTemplate;
             }
             
             console.log('[DEBUG] Public Template NOT FOUND. ID:', id);
             // Se não achou nem template, relança o erro ou retorna 404
             throw new BadRequestException('Avaliação não encontrada.');
        }

        return assessment;
    }

    /**
     * Inicializa uma sessão de avaliação específica (cria Assignment)
     * Garante que o usuário tem um assignment linkado ao ID correto.
     */
    @Post(':id/start-session')
    async startSession(@Param('id') id: string, @Request() req) {
        const user = req.user;
        console.log(`[DEBUG] Starting session for Assessment: ${id}, User: ${user.userId}`);

        // 1. Verificar se a avaliação existe (mesma lógica permissiva do getOne)
        let assessment = null;
        try {
            assessment = await this.assessmentService.findOne(id, user.tenantId);
        } catch (e) {}
        
        if (!assessment) {
             assessment = await this.prisma.assessmentModel.findFirst({
                 where: { id: id, type: 'BIG_FIVE' }
             });
        }

        if (!assessment) {
            throw new BadRequestException('Avaliação não encontrada para iniciar sessão.');
        }

        // 2. Verificar/Criar Assignment
        const existing = await this.prisma.assessmentAssignment.findFirst({
            where: { userId: user.userId, assessmentId: id }
        });

        if (existing) {
            console.log('[DEBUG] Session already exists:', existing.id);
            return existing;
        }

        const newAssignment = await this.prisma.assessmentAssignment.create({
            data: {
                userId: user.userId,
                assessmentId: id,
                status: 'IN_PROGRESS',
                assignedAt: new Date()
            }
        });
        console.log('[DEBUG] New Session created:', newAssignment.id);
        return newAssignment;
    }

    @Post()
    create(@Body() createAssessmentDto: any, @Request() req) {
        return this.assessmentService.create(createAssessmentDto, req.user.tenantId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateAssessmentDto: any, @Request() req) {
        const user = req.user;

        // Only admins can update
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem atualizar avaliações');
        }

        const tenantId = user.role === 'SUPER_ADMIN' ? undefined : user.tenantId;
        return this.assessmentService.update(id, updateAssessmentDto, tenantId);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        const user = req.user;

        // Only admins can delete
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem deletar avaliações');
        }

        const tenantId = user.role === 'SUPER_ADMIN' ? undefined : user.tenantId;
        return this.assessmentService.delete(id, tenantId);
    }





    @Get()
    async findAll(@Request() req) {
        const user = req.user;

        // Se for cliente (MEMBER) ou Pessoa Física (INDIVIDUAL - exceto Super Admin), 
        // retornar apenas avaliações atribuídas a ele
        if (user.role === 'MEMBER' || (user.userType === 'INDIVIDUAL' && user.role !== 'SUPER_ADMIN')) {
            const assignments = await this.prisma.assessmentAssignment.findMany({
                where: { userId: user.userId },
                include: {
                    assessment: {
                        include: {
                            questions: true,
                            _count: {
                                select: { assignments: true }
                            }
                        }
                    }
                }
            });

            return assignments.map(assignment => ({
                ...assignment.assessment,
                assignmentId: assignment.id,  // ✅ ID do assignment (não do template!)
                assignmentStatus: assignment.status,
                assignedAt: assignment.assignedAt,
                feedback: assignment.feedback
            }));
        }

        // Se for admin, retornar avaliações do tenant + templates Big Five
        const myAssessments = await this.assessmentService.findAll(user.tenantId);

        // Buscar templates Big Five disponíveis
        const bigFiveTemplates = await this.prisma.assessmentModel.findMany({
            where: {
                type: 'BIG_FIVE',
                // Pegar apenas o primeiro Big Five encontrado como template
            },
            include: {
                questions: true
            },
            take: 1  // Apenas o primeiro
        });

        // Marcar como template e adicionar à lista
        const templatesMarked = bigFiveTemplates.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            type: t.type,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            tenantId: t.tenantId,
            isTemplate: true,
            questionCount: t.questions.length,
            _count: { assignments: 0 }
        }));

        // Retornar templates primeiro, depois avaliações do usuário
        return [...templatesMarked, ...myAssessments];
    }




    // Aplicar avaliação a múltiplos usuários
    @Post(':id/assign')
    async assignToUsers(
        @Param('id') id: string,
        @Body() body: { userIds: string[] },
        @Request() req
    ) {
        const tenantId = req.user.tenantId;

        // Verificar se a avaliação pertence ao tenant
        const assessment = await this.assessmentService.findOne(id, tenantId);
        if (!assessment) {
            throw new Error('Avaliação não encontrada');
        }

        // Criar atribuições para cada usuário
        const assignments = await Promise.all(
            body.userIds.map(userId =>
                this.prisma.assessmentAssignment.create({
                    data: {
                        assessmentId: id,
                        userId: userId,
                        status: 'PENDING'
                    }
                })
            )
        );

        return {
            message: `Avaliação atribuída a ${assignments.length} usuário(s)`,
            assignments
        };
    }

    // Listar candidatos com a avaliação atribuída
    @Get(':id/assignments')
    async getAssignments(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.tenantId;

        // Verificar se a avaliação pertence ao tenant
        const assessment = await this.assessmentService.findOne(id, tenantId);
        if (!assessment) {
            throw new Error('Avaliação não encontrada');
        }

        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: { assessmentId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        userType: true,
                        cpf: true,
                        cnpj: true,
                        companyName: true,
                        tenantId: true // Incluir para debug
                    }
                }
            }
        });

        // Filtrar candidatos que pertencem ao MESMO tenant do admin (Segurança + Correção de Visibilidade)
        // Se o usuário for INDIVIDUAL (sem tenant), mostramos se o admin for SUPER_ADMIN ou se houver conexão.
        // Para simplificar e corrigir o bug relatado:
        // Se o Admin for SUPER_ADMIN, vê tudo.
        // Se for TENANT_ADMIN, vê apenas usuários do seu tenant OU usuários sem tenant (Trial/Individual) que tomaram a avaliação.
        
        if (req.user.role === 'SUPER_ADMIN') {
            return assignments;
        }

        return assignments.filter(a => 
            a.user.tenantId === tenantId || // Usuário do mesmo tenant
            !a.user.tenantId // Usuário Individual/Trial (sem tenant definido)
        );
    }

    // Remover atribuição de um candidato
    @Delete(':id/assignments/:userId')
    async removeAssignment(
        @Param('id') id: string,
        @Param('userId') userId: string,
        @Request() req
    ) {
        const tenantId = req.user.tenantId;

        // Verificar se a avaliação pertence ao tenant
        const assessment = await this.assessmentService.findOne(id, tenantId);
        if (!assessment) {
            throw new Error('Avaliação não encontrada');
        }

        await this.prisma.assessmentAssignment.deleteMany({
            where: {
                assessmentId: id,
                userId: userId
            }
        });

        return { message: 'Atribuição removida com sucesso' };
    }

    // Salvar resposta individual (Progresso Parcial) + Tempo
    @Post(':id/save-answer')
    async saveAnswer(@Param('id') id: string, @Body() body: { questionId: string, value: number, timeSpent: number }, @Request() req) {
        const userId = req.user.userId;

        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: { assessmentId: id, userId: userId }
        });

        if (!assignment) throw new BadRequestException('Atribuição não encontrada');
        if (assignment.status === 'COMPLETED') return { message: 'Already completed' };

        const existingResponse = await this.prisma.assessmentResponse.findFirst({
            where: { assignmentId: assignment.id, questionId: body.questionId }
        });

        if (existingResponse) {
             await this.prisma.assessmentResponse.update({
                 where: { id: existingResponse.id },
                 data: { answer: Number(body.value) }
             });
        } else {
             await this.prisma.assessmentResponse.create({
                 data: { assignmentId: assignment.id, questionId: body.questionId, answer: Number(body.value) }
             });
        }

        await this.prisma.assessmentAssignment.update({
            where: { id: assignment.id },
            data: { timeSpent: body.timeSpent, status: 'IN_PROGRESS' }
        });

        return { success: true };
    }

    // Submeter respostas da avaliação
    @Post(':id/submit')
    async submitAssessment(@Param('id') id: string, @Body() body: { answers: any[] }, @Request() req) {
        const userId = req.user.userId;

        try {
            // Buscar assignment
            const assignment = await this.prisma.assessmentAssignment.findFirst({
                where: {
                    assessmentId: id,
                    userId: userId
                },
                include: {
                    assessment: {
                        include: { questions: true }
                    },
                    user: true
                }
            });

            if (!assignment) {
                throw new BadRequestException('Você não tem permissão para responder esta avaliação.');
            }

            if (assignment.status === 'COMPLETED') {
                throw new BadRequestException('Esta avaliação já foi respondida.');
            }

            // Executar tudo em uma transação para garantir consistência
            const result = await this.prisma.$transaction(async (tx) => {
                // Verificar créditos novamente dentro da transação
                const user = await tx.user.findUnique({
                    where: { id: userId }
                });

                if (user.credits < 1) {
                    throw new BadRequestException('Créditos insuficientes para completar a avaliação.');
                }

                // Limpar respostas/resultados anteriores caso existam (retry)
                await tx.assessmentResult.deleteMany({
                    where: { assignmentId: assignment.id }
                });
                await tx.assessmentResponse.deleteMany({
                    where: { assignmentId: assignment.id }
                });

                // Salvar respostas
                await Promise.all(
                    body.answers.map(answer =>
                        tx.assessmentResponse.create({
                            data: {
                                assignmentId: assignment.id,
                                questionId: answer.questionId,
                                answer: Number(answer.value)
                            }
                        })
                    )
                );

                // Calcular scores por trait
                const traitScores: { [key: string]: { sum: number, count: number, totalWeight: number } } = {};

                for (const answer of body.answers) {
                    const question = assignment.assessment.questions.find(q => q.id === answer.questionId);
                    if (question && question.traitKey) {
                        if (!traitScores[question.traitKey]) {
                            traitScores[question.traitKey] = { sum: 0, count: 0, totalWeight: 0 };
                        }
                        traitScores[question.traitKey].sum += Number(answer.value) * question.weight;
                        traitScores[question.traitKey].totalWeight += question.weight;
                        traitScores[question.traitKey].count++;
                    }
                }

                // Calcular médias ponderadas
                const finalScores: { [key: string]: number } = {};
                for (const [trait, data] of Object.entries(traitScores)) {
                    finalScores[trait] = data.totalWeight > 0 ? data.sum / data.totalWeight : 0;
                }

                // Salvar resultado
                const savedResult = await tx.assessmentResult.create({
                    data: {
                        assignmentId: assignment.id,
                        scores: finalScores
                    }
                });

                // Atualizar assignment e decrementar créditos
                await tx.assessmentAssignment.update({
                    where: { id: assignment.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date()
                    }
                });

                await tx.user.update({
                    where: { id: userId },
                    data: {
                        credits: { decrement: 1 }
                    }
                });

                return savedResult;
            });

            return {
                message: 'Avaliação submetida com sucesso!',
                result: result
            };

        } catch (error) {
            console.error('Erro ao submeter avaliação:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            // Retornar erro detalhado para facilitar debug
            throw new BadRequestException(`Erro técnico: ${error.message}.Stack: ${JSON.stringify(error)} `);
        }
    }

    /**
     * POST /assessments/:id/calculate-big-five
     * Calcula scores do Big Five baseado nas respostas
     */
    @Post(':id/calculate-big-five')
    async calculateBigFive(
        @Param('id') assessmentId: string,
        @Body() body: { responses: Array<{ questionId: string; value: number }> },
        @Request() req
    ) {
        const user = req.user;

        // Verificar se a avaliação existe e é do tipo BIG_FIVE
        const assessment = await this.prisma.assessmentModel.findUnique({
            where: { id: assessmentId }
        });

        if (!assessment) {
            throw new BadRequestException('Avaliação não encontrada');
        }

        if (assessment.type !== 'BIG_FIVE') {
            throw new BadRequestException('Este endpoint é apenas para avaliações Big Five');
        }

        // Calcular scores
        const result = await this.bigFiveCalculator.calculateBigFiveScores(
            assessmentId,
            body.responses
        );

        // Gerar recomendações
        const recommendations = this.bigFiveCalculator.generateDevelopmentRecommendations(result);

        // Adicionar descrições detalhadas
        const enrichedTraits = result.traits.map(trait => ({
            ...trait,
            description: this.bigFiveCalculator.getTraitDescription(trait.trait, trait.normalizedScore)
        }));

        return {
            ...result,
            traits: enrichedTraits,
            recommendations
        };
    }

    /**
     * GET /assessments/templates
     * Lista templates de inventários disponíveis
     */
    @Get('templates')
    async listTemplates(@Request() req) {
        const user = req.user;

        // Apenas admins podem ver templates
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem acessar templates');
        }

        const templates = await this.templateService.listTemplates();
        console.log('📊 Templates retornados:', templates.length);
        return templates;
    }

    /**
     * GET /assessments/templates/:id
     * Visualiza detalhes de um template
     */
    @Get('templates/:id')
    async getTemplateDetails(@Param('id') id: string, @Request() req) {
        const user = req.user;

        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem acessar templates');
        }

        return this.templateService.getTemplateDetails(id);
    }

    /**
     * POST /assessments/templates/:id/clone
     * Clona um template para o tenant do admin
     */
    @Post('templates/:id/clone')
    async cloneTemplate(
        @Param('id') templateId: string,
        @Body() body: { title?: string },
        @Request() req
    ) {
        const user = req.user;

        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem clonar templates');
        }

        return this.templateService.cloneTemplate(
            templateId,
            user.tenantId,
            body.title
        );
    }
}
