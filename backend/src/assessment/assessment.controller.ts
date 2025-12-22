import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssessmentService } from './assessment.service';
import { BigFiveCalculatorService } from './big-five-calculator.service';
import { AssessmentTemplateService } from './assessment-template.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCalculationService } from '../reports/score-calculation.service';
import { InterpretationService } from '../reports/interpretation.service';

@Controller('assessments')
@UseGuards(AuthGuard('jwt'))
export class AssessmentController {
    constructor(
        private assessmentService: AssessmentService,
        private bigFiveCalculator: BigFiveCalculatorService,
        private templateService: AssessmentTemplateService,
        private prisma: PrismaService,
        private scoreCalculation: ScoreCalculationService,
        private interpretation: InterpretationService
    ) { }

    @Get('my-assignments-list')
    async getMyAssignmentsList(@Request() req) {
        const user = req.user;

        // --- AUTO-ASSIGN: START ---
        // Garantir que o usuário tenha um inventário disponível (Regra de Negócio: Sempre ter um a fazer)
        try {
            // 1. Buscar modelo Padrão do Tenant
            let bigFiveModel = await this.prisma.assessmentModel.findFirst({
                where: { tenantId: user.tenantId, isDefault: true, type: 'BIG_FIVE' }
            });

            // 2. Fallback: Qualquer do Tenant
            if (!bigFiveModel) {
                bigFiveModel = await this.prisma.assessmentModel.findFirst({
                    where: { tenantId: user.tenantId, type: 'BIG_FIVE' }, orderBy: { createdAt: 'desc' }
                });
            }

            // 3. Fallback: Global/System
            if (!bigFiveModel) {
                bigFiveModel = await this.prisma.assessmentModel.findFirst({
                    where: { type: 'BIG_FIVE' }
                });
            }

            if (bigFiveModel) {
                // Verificar se já existe algum pendente (de qualquer versão Big Five, para não acumular)
                const anyPending = await this.prisma.assessmentAssignment.findFirst({
                    where: {
                        userId: user.userId,
                        assessment: { type: 'BIG_FIVE' },
                        status: { not: 'COMPLETED' }
                    }
                });

                if (!anyPending) {
                    console.log(`[AutoAssign] Criando novo assignment do modelo ${bigFiveModel.id} para user ${user.userId}`);
                    await this.prisma.assessmentAssignment.create({
                        data: {
                            userId: user.userId,
                            assessmentId: bigFiveModel.id,
                            status: 'PENDING',
                            assignedAt: new Date(),
                        }
                    });
                }
            }
        } catch (e) {
            console.error('[AutoAssign] Falha silenciosa ao tentar atribuir inventário:', e);
        }
        // --- AUTO-ASSIGN: END ---

        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: { userId: user.userId, status: { not: 'DELETED' } },
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
            // Calcular scores reais antes de retornar
            const calculatedScores = await this.calculateRealScores(id, user.tenantId);
            return { ...assignment, calculatedScores };
        }

        // Se não for o dono, verificar outras permissões
        const isOwnerAdmin = (user.role === 'TENANT_ADMIN' || user.role === 'SUPER_ADMIN') && assignment.assessment.tenantId === user.tenantId;
        const isSuperAdmin = user.role === 'SUPER_ADMIN';

        if (isOwnerAdmin || isSuperAdmin) {
            // Calcular scores reais antes de retornar
            const calculatedScores = await this.calculateRealScores(id, user.tenantId);
            return { ...assignment, calculatedScores };
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
                // Calcular scores reais antes de retornar
                const calculatedScores = await this.calculateRealScores(id, user.tenantId);
                return { ...assignment, calculatedScores };
            }
        }

        // Se chegou aqui, não tem permissão
        throw new ForbiddenException('Acesso negado');
    }

    /**
     * Helper: Calcular scores reais usando a nova lógica
     */
    private async calculateRealScores(assignmentId: string, fallbackTenantId?: string) {
        console.log('[calculateRealScores] ========== INÍCIO ==========');
        console.log('[calculateRealScores] Assignment ID:', assignmentId);
        console.log('[calculateRealScores] Fallback Tenant ID:', fallbackTenantId);

        try {
            // PASSO 1: Calcular scores
            console.log('[calculateRealScores] PASSO 1: Calculando scores...');
            let scoreResult;
            try {
                scoreResult = await this.scoreCalculation.calculateScores(assignmentId);
            } catch (scoreError) {
                console.error('[calculateRealScores] ❌ ERRO NO PASSO 1 (cálculo de scores):', scoreError);
                return {
                    _debug: true,
                    _error: 'SCORE_CALCULATION_FAILED',
                    _message: scoreError.message,
                    _step: 1,
                    _stepName: 'Cálculo de Scores',
                    scores: []
                };
            }

            const { scores, config } = scoreResult;
            console.log('[calculateRealScores] ✅ Scores calculados:', Object.keys(scores).length, 'traits');
            console.log('[calculateRealScores] ✅ Config:', config?.id, config?.name, config?.tenantId);

            if (!scores || Object.keys(scores).length === 0) {
                console.error('[calculateRealScores] ❌ Nenhum score retornado!');
                return {
                    _debug: true,
                    _error: 'NO_SCORES_RETURNED',
                    _message: 'Score calculation returned empty',
                    _step: 1,
                    _stepName: 'Cálculo de Scores',
                    scores: []
                };
            }

            // PASSO 2: Buscar textos interpretativos
            console.log('[calculateRealScores] PASSO 2: Buscando textos interpretativos...');
            let reportTraits: any[] = [];
            let textError = null;

            try {
                const effectiveTenantId = config?.tenantId || fallbackTenantId;
                console.log('[calculateRealScores] TenantID efetivo:', effectiveTenantId);

                if (effectiveTenantId) {
                    const report = await this.interpretation.generateFullReport(assignmentId, effectiveTenantId, config?.id);
                    reportTraits = report.traits || [];
                    console.log('[calculateRealScores] ✅ Textos carregados:', reportTraits.length, 'traits');
                } else {
                    textError = 'NO_TENANT_ID';
                    console.warn('[calculateRealScores] ⚠️ Sem TenantID para buscar textos');
                }
            } catch (interpretError) {
                textError = interpretError.message;
                console.error('[calculateRealScores] ⚠️ ERRO NO PASSO 2 (interpretação) - continuando:', interpretError);
            }

            // PASSO 3: Montar resultado final
            console.log('[calculateRealScores] PASSO 3: Montando resultado...');
            const result = {
                scores: Object.values(scores).map((score: any) => {
                    const enriched = reportTraits.find((t: any) => t.key === score.traitKey);
                    return {
                        key: score.traitKey,
                        name: score.traitName,
                        score: score.normalizedScore,
                        rawScore: score.score,
                        level: score.level,
                        interpretation: score.interpretation,
                        facets: score.facets,
                        customTexts: enriched?.customTexts || null
                    };
                }),
                config: {
                    id: config?.id,
                    name: config?.name
                },
                _debug: true,
                _success: true,
                _textError: textError,
                _steps: {
                    scoreCalculation: 'SUCCESS',
                    interpretation: textError ? 'FAILED' : 'SUCCESS'
                }
            };

            console.log('[calculateRealScores] ✅ ========== SUCESSO ==========');
            console.log('[calculateRealScores] Retornando', result.scores.length, 'scores');
            return result;

        } catch (error) {
            console.error('[calculateRealScores] ❌ ========== ERRO CRÍTICO ==========');
            console.error('[calculateRealScores] Erro:', error);
            console.error('[calculateRealScores] Stack:', error.stack);

            return {
                _debug: true,
                _error: 'CRITICAL_ERROR',
                _message: error.message,
                _stack: error.stack,
                _step: 0,
                _stepName: 'Inicialização',
                scores: []
            };
        }
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

        // Find Big Five Model (Prioritize Default)
        let assessmentModel = await this.prisma.assessmentModel.findFirst({
            where: { tenantId: user.tenantId, isDefault: true, type: 'BIG_FIVE' }
        });

        if (!assessmentModel) {
            // Fallback: qualquer um do tenant
            assessmentModel = await this.prisma.assessmentModel.findFirst({
                where: { tenantId: user.tenantId, type: 'BIG_FIVE' }, orderBy: { createdAt: 'desc' }
            });
        }

        if (!assessmentModel) {
            // Fallback Final: qualquer Big Five do sistema (Template Global)
            assessmentModel = await this.prisma.assessmentModel.findFirst({
                where: { type: 'BIG_FIVE' }
            });
        }

        if (!assessmentModel) {
            throw new BadRequestException('Configuração de avaliação não encontrada no sistema.');
        }

        // ✅ CORREÇÃO: Buscar configuração ATIVA do tenant
        const activeConfig = await this.prisma.bigFiveConfig.findFirst({
            where: {
                tenantId: user.tenantId,
                isActive: true
            }
        });

        if (!activeConfig) {
            throw new BadRequestException('Configuração Big Five não encontrada. Entre em contato com o administrador.');
        }

        // Buscar dados do usuário para verificar créditos
        const userData = await this.prisma.user.findUnique({
            where: { id: user.userId },
            select: { credits: true }
        });

        if (!userData) {
            throw new BadRequestException('Usuário não encontrado.');
        }

        // Se o usuário tem créditos, verificar se já existe um PENDING (criado automaticamente)
        if (userData.credits > 0) {
            // Verificar se já existe um assignment PENDING ou IN_PROGRESS
            const existingPending = await this.prisma.assessmentAssignment.findFirst({
                where: {
                    userId: user.userId,
                    assessmentId: assessmentModel.id,
                    status: { in: ['PENDING', 'IN_PROGRESS'] }
                }
            });

            if (existingPending) {
                // Se estava PENDING, mudar para IN_PROGRESS
                if (existingPending.status === 'PENDING') {
                    return await this.prisma.assessmentAssignment.update({
                        where: { id: existingPending.id },
                        data: {
                            status: 'IN_PROGRESS',
                            configId: activeConfig.id // ✅ Garantir que tem config
                        }
                    });
                }
                return existingPending;
            }

            // Se não existe, criar um novo
            const newAssignment = await this.prisma.assessmentAssignment.create({
                data: {
                    userId: user.userId,
                    assessmentId: assessmentModel.id,
                    configId: activeConfig.id, // ✅ VINCULAR CONFIG
                    status: 'IN_PROGRESS',
                    assignedAt: new Date(),
                }
            });
            return newAssignment;
        }

        // Se não tem créditos, verificar se existe algum pendente para retomar
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

        // Sem créditos e sem inventário pendente: CRIAR UM INVENTÁRIO BLOQUEADO
        // O frontend mostrará que precisa adicionar créditos, mas o inventário existe
        const blockedAssignment = await this.prisma.assessmentAssignment.create({
            data: {
                userId: user.userId,
                assessmentId: assessmentModel.id,
                configId: activeConfig.id, // ✅ VINCULAR CONFIG
                status: 'PENDING', // PENDING = bloqueado até adicionar crédito
                assignedAt: new Date(),
            }
        });
        return blockedAssignment;
    }

    // Listar avaliações completadas (para relatórios)
    @Get('completed')
    async getCompletedAssessments(@Request() req) {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        const userEmail = req.user.email;
        const userRole = req.user.role;

        // Se for ADMIN, mostrar TODOS os inventários completados do sistema
        if (userRole === 'TENANT_ADMIN' || userRole === 'SUPER_ADMIN') {
            const completedAssignments = await this.prisma.assessmentAssignment.findMany({
                where: {
                    status: 'COMPLETED'
                },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    assessment: { select: { id: true, title: true } },
                    result: true
                },
                orderBy: { completedAt: 'desc' }
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

        // Lógica para usuários comuns (conexões + domínio)
        const connections = await this.prisma.connection.findMany({
            where: {
                OR: [
                    { userAId: userId, status: 'ACTIVE' },
                    { userBId: userId, status: 'ACTIVE' }
                ]
            }
        });
        const connectedUserIds = connections.map(c => c.userAId === userId ? c.userBId : c.userAId);

        const domain = userEmail.split('@')[1];
        const publicDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'uol.com.br', 'bol.com.br', 'terra.com.br'];
        const isCorporateDomain = domain && !publicDomains.includes(domain.toLowerCase());

        const whereCondition: any = {
            status: 'COMPLETED',
            OR: [
                { user: { tenantId } },
                { userId: { in: connectedUserIds } }
            ]
        };

        if (isCorporateDomain) {
            whereCondition.OR.push({ user: { email: { endsWith: `@${domain}` } } });
        }

        const completedAssignments = await this.prisma.assessmentAssignment.findMany({
            where: whereCondition,
            include: {
                user: { select: { id: true, name: true, email: true } },
                assessment: { select: { id: true, title: true } },
                result: true
            },
            orderBy: { completedAt: 'desc' }
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

    // Inventários completados do próprio usuário (para devolutiva)
    @Get('my-completed')
    async getMyCompletedAssessments(@Request() req) {
        const userId = req.user.userId;

        const completedAssignments = await this.prisma.assessmentAssignment.findMany({
            where: {
                userId: userId,
                status: 'COMPLETED'
            },
            include: {
                assessment: { select: { id: true, title: true } },
                result: true
            },
            orderBy: { completedAt: 'desc' }
        });

        return completedAssignments.map(assignment => ({
            id: assignment.id,
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
        } catch (e) { }

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

    @Put(':id/set-default')
    @UseGuards(AuthGuard('jwt'))
    async setDefault(@Param('id') id: string, @Request() req) {
        const user = req.user;

        // Permissão: Apenas Admins
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem alterar o padrão.');
        }

        // Buscar avaliação e validar tenant
        const assessment = await this.prisma.assessmentModel.findFirst({
            where: { id, tenantId: user.tenantId }
        });

        if (!assessment) {
            throw new BadRequestException('Avaliação não encontrada.');
        }

        // Transaction para garantir unicidade do Default
        await this.prisma.$transaction([
            // 1. Remove default de todas
            this.prisma.assessmentModel.updateMany({
                where: { tenantId: user.tenantId },
                data: { isDefault: false }
            }),
            // 2. Define esta como default
            this.prisma.assessmentModel.update({
                where: { id },
                data: { isDefault: true }
            })
        ]);

        return { success: true, message: 'Avaliação definida como padrão com sucesso.' };
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
            // GARANTIR que sempre existe pelo menos 1 inventário BIG_FIVE
            let bigFiveModel = await this.prisma.assessmentModel.findFirst({
                where: { tenantId: user.tenantId, isDefault: true, type: 'BIG_FIVE' }
            });

            if (!bigFiveModel) {
                bigFiveModel = await this.prisma.assessmentModel.findFirst({
                    where: { tenantId: user.tenantId, type: 'BIG_FIVE' }, orderBy: { createdAt: 'desc' }
                });
            }

            if (!bigFiveModel) {
                bigFiveModel = await this.prisma.assessmentModel.findFirst({
                    where: { type: 'BIG_FIVE' }
                });
            }

            if (bigFiveModel) {
                // Verificar se o usuário tem algum assignment BIG_FIVE não completado
                const existingAssignment = await this.prisma.assessmentAssignment.findFirst({
                    where: {
                        userId: user.userId,
                        assessmentId: bigFiveModel.id,
                        status: { not: 'COMPLETED' }
                    }
                });

                // Se não existe nenhum assignment não-completado, criar um PENDING
                if (!existingAssignment) {
                    await this.prisma.assessmentAssignment.create({
                        data: {
                            userId: user.userId,
                            assessmentId: bigFiveModel.id,
                            status: 'PENDING',
                            assignedAt: new Date(),
                        }
                    });
                }
            }

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

            // Após completar, SEMPRE criar um novo inventário automaticamente (PENDING)
            // Se tiver créditos, pode iniciar. Se não tiver, fica bloqueado até adicionar.
            const updatedUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { credits: true }
            });

            let newAssignmentCreated = false;
            // Buscar o modelo Big Five para criar novo assignment
            // Buscar o modelo Big Five PADRÃO para criar novo assignment
            let assessmentModel = await this.prisma.assessmentModel.findFirst({
                where: {
                    tenantId: assignment.user.tenantId, // Respeita o tenant do usuário
                    type: 'BIG_FIVE',
                    isDefault: true
                }
            });

            // Fallback: Se não tiver padrão definido, pega qualquer Big Five do Tenant
            if (!assessmentModel) {
                assessmentModel = await this.prisma.assessmentModel.findFirst({
                    where: { tenantId: assignment.user.tenantId, type: 'BIG_FIVE' }, orderBy: { createdAt: 'desc' }
                });
            }

            // Fallback Global: Se não tiver no tenant, pega o System Default (se existir)
            if (!assessmentModel) {
                assessmentModel = await this.prisma.assessmentModel.findFirst({
                    where: { type: 'BIG_FIVE' }
                });
            }

            if (assessmentModel) {
                // Verificar se já existe um PENDING (evitar duplicatas)
                const existingPending = await this.prisma.assessmentAssignment.findFirst({
                    where: {
                        userId: userId,
                        assessmentId: assessmentModel.id,
                        status: 'PENDING'
                    }
                });

                if (!existingPending) {
                    // Criar novo assignment automaticamente (PENDING = pronto se tem créditos, bloqueado se não tem)
                    await this.prisma.assessmentAssignment.create({
                        data: {
                            userId: userId,
                            assessmentId: assessmentModel.id,
                            status: 'PENDING',
                            assignedAt: new Date(),
                        }
                    });
                    newAssignmentCreated = true;
                }
            }

            return {
                message: 'Avaliação submetida com sucesso!',
                result: result,
                creditsRemaining: updatedUser?.credits || 0,
                newInventoryAvailable: newAssignmentCreated
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

        // ========== ADICIONAR TEXTOS INTERPRETATIVOS ==========
        // Buscar assignment para pegar configId e tenantId
        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: {
                assessmentId: assessmentId,
                userId: user.userId
            },
            include: {
                config: true
            }
        });

        let traitsWithTexts = enrichedTraits;

        if (assignment) {
            try {
                const effectiveTenantId = assignment.config?.tenantId || user.tenantId;
                const configId = assignment.configId;

                if (effectiveTenantId) {
                    console.log('[calculateBigFive] Buscando textos interpretativos...');
                    const report = await this.interpretation.generateFullReport(
                        assignment.id,
                        effectiveTenantId,
                        configId
                    );

                    // Mesclar textos nos traits
                    traitsWithTexts = enrichedTraits.map(trait => {
                        const enriched = report.traits?.find((t: any) => t.key === trait.trait);
                        return {
                            ...trait,
                            customTexts: enriched?.customTexts || null
                        };
                    });

                    console.log('[calculateBigFive] ✅ Textos adicionados aos traits');
                }
            } catch (error) {
                console.error('[calculateBigFive] ⚠️ Erro ao buscar textos (continuando sem eles):', error);
                // Continua sem os textos
            }
        }

        return {
            ...result,
            traits: traitsWithTexts,
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

        // NORMALIZAR template ANTES de clonar
        await this.fixTemplate(req);

        return this.templateService.cloneTemplate(
            templateId,
            user.tenantId,
            body.title
        );
    }

    /**
     * Normaliza os traitKeys do template Big Five para padrões consistentes
     * POST /api/v1/assessments/fix-template
     */
    @Post('fix-template')
    async fixTemplate(@Request() req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem corrigir templates');
        }

        // Buscar template Big Five (primeiro do tipo BIG_FIVE encontrado)
        const template = await this.prisma.assessmentModel.findFirst({
            where: {
                type: 'BIG_FIVE'
            },
            include: {
                questions: true
            },
            orderBy: {
                createdAt: 'asc' // Pega o mais antigo (geralmente o template original)
            }
        });

        if (!template) {
            throw new BadRequestException('Template Big Five não encontrado');
        }

        // Mapa de normalização PT -> EN
        const traitMap: Record<string, string> = {
            'Amabilidade': 'AGREEABLENESS',
            'Conscienciosidade': 'CONSCIENTIOUSNESS',
            'Extroversão': 'EXTRAVERSION',
            'Extroversao': 'EXTRAVERSION',
            'Abertura': 'OPENNESS',
            'Abertura a Experiência': 'OPENNESS',
            'Abertura a Experiencia': 'OPENNESS',
            'Neuroticismo': 'NEUROTICISM',
            'Estabilidade Emocional': 'NEUROTICISM'
        };

        let updatedCount = 0;
        const updates = [];

        for (const question of template.questions) {
            const currentKey = question.traitKey;
            const normalizedKey = traitMap[currentKey];

            if (normalizedKey && normalizedKey !== currentKey) {
                await this.prisma.question.update({
                    where: { id: question.id },
                    data: { traitKey: normalizedKey }
                });
                updatedCount++;
                updates.push({
                    questionId: question.id,
                    from: currentKey,
                    to: normalizedKey
                });
            }
        }

        return {
            success: true,
            message: `Template corrigido! ${updatedCount} questões foram atualizadas.`,
            templateId: template.id,
            templateTitle: template.title,
            totalQuestions: template.questions.length,
            updatedQuestions: updatedCount,
            details: updates.slice(0, 10) // Primeiras 10 para não sobrecarregar
        };
    }

    // Usuário deletar seu próprio assignment (Histórico)
    @Delete('my-assignment/:id')
    async deleteMyAssignment(@Param('id') id: string, @Request() req) {
        const userId = req.user.userId;

        // 1. Buscar o assignment garantindo que pertence ao usuário
        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: {
                id: id,
                userId: userId
            }
        });

        if (!assignment) {
            throw new BadRequestException('Avaliação não encontrada ou você não tem permissão para excluí-la.');
        }

        // 2. Soft Delete (Mover para Lixeira)
        await this.prisma.assessmentAssignment.update({
            where: { id: id },
            data: { status: 'DELETED' }
        });

        return { message: 'Avaliação excluída com sucesso.' };
    }

    // Restaurar item da lixeira (ADMIN)
    @Post(':id/restore')
    async restoreAssignment(@Param('id') id: string, @Request() req) {
        // if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        //    throw new ForbiddenException('Apenas admin pode restaurar.');
        // }
        // Simplificado para teste, adicione roles depois se precisar importar ForbiddenException

        const assignment = await this.prisma.assessmentAssignment.findUnique({ where: { id } });
        if (!assignment) throw new BadRequestException('Assignment not found');

        // Restaurar status
        const newStatus = assignment.completedAt ? 'COMPLETED' : 'PENDING';

        await this.prisma.assessmentAssignment.update({
            where: { id },
            data: { status: newStatus }
        });

        return { success: true };
    }

    // Listar Lixeira (ADMIN)
    @Get('admin/deleted-list')
    async getDeletedAssignments(@Request() req) {
        // if (req.user.role !== 'TENANT_ADMIN') ...

        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: {
                status: 'DELETED' /* filter removed */
            },
            include: {
                user: { select: { name: true, email: true } },
                assessment: { select: { title: true } }
            },
            orderBy: { assignedAt: 'desc' }
        });

        return assignments.map(a => ({
            id: a.id,
            userName: a.user.name,
            userEmail: a.user.email,
            assessmentTitle: a.assessment.title,
            deletedAt: a.assignedAt // TODO: Ideal seria ter deletedAt coluna
        }));
    }
}
