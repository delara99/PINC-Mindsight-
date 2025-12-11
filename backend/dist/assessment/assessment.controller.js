"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const assessment_service_1 = require("./assessment.service");
const big_five_calculator_service_1 = require("./big-five-calculator.service");
const assessment_template_service_1 = require("./assessment-template.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AssessmentController = class AssessmentController {
    constructor(assessmentService, bigFiveCalculator, templateService, prisma) {
        this.assessmentService = assessmentService;
        this.bigFiveCalculator = bigFiveCalculator;
        this.templateService = templateService;
        this.prisma = prisma;
    }
    async getAssignmentDetails(id, req) {
        const user = req.user;
        console.log('\n========== GET ASSIGNMENT DETAILS ==========');
        console.log('[DEBUG] Assignment ID requested:', id);
        console.log('[DEBUG] User from token:', JSON.stringify(user, null, 2));
        console.log('[DEBUG] User ID:', user.userId);
        console.log('[DEBUG] User email:', user.email);
        console.log('[DEBUG] User role:', user.role);
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
            throw new common_1.BadRequestException('Avaliação não encontrada');
        }
        console.log('[DEBUG] ✅ Assignment found');
        console.log('[DEBUG] Assignment userId:', assignment.userId);
        console.log('[DEBUG] Assignment user email:', assignment.user.email);
        const isAssignee = assignment.userId === user.userId;
        console.log('[DEBUG] Comparing IDs:');
        console.log('[DEBUG]   assignment.userId:', assignment.userId);
        console.log('[DEBUG]   user.userId:', user.userId);
        console.log('[DEBUG]   Are equal?', isAssignee);
        console.log('[DEBUG]   Type of assignment.userId:', typeof assignment.userId);
        console.log('[DEBUG]   Type of user.userId:', typeof user.userId);
        if (isAssignee) {
            console.log('[DEBUG] ✅ User IS the assignee - GRANTING ACCESS');
            return assignment;
        }
        const isOwnerAdmin = (user.role === 'TENANT_ADMIN' || user.role === 'SUPER_ADMIN') && assignment.assessment.tenantId === user.tenantId;
        const isSuperAdmin = user.role === 'SUPER_ADMIN';
        if (isOwnerAdmin || isSuperAdmin) {
            return assignment;
        }
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
            const ownerSettings = connection.sharingSettings.find(s => s.userId === assignment.userId);
            if ((ownerSettings === null || ownerSettings === void 0 ? void 0 : ownerSettings.shareInventories) === true) {
                return assignment;
            }
        }
        throw new common_1.ForbiddenException('Acesso negado');
    }
    async getMyAssignment(assessmentId, req) {
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
            throw new common_1.BadRequestException('Você não possui assignment para esta avaliação');
        }
        return assignment;
    }
    async addFeedback(id, body, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem dar feedback');
        }
        return this.prisma.assessmentAssignment.update({
            where: { id },
            data: {
                feedback: body.feedback,
                feedbackAt: new Date()
            }
        });
    }
    async getCompletedAssessments(req) {
        const tenantId = req.user.tenantId;
        const completedAssignments = await this.prisma.assessmentAssignment.findMany({
            where: {
                status: 'COMPLETED',
                assessment: { tenantId }
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
        return completedAssignments.map(assignment => {
            var _a;
            return ({
                id: assignment.id,
                userName: assignment.user.name || assignment.user.email,
                userEmail: assignment.user.email,
                assessmentTitle: assignment.assessment.title,
                completedAt: assignment.completedAt,
                scores: ((_a = assignment.result) === null || _a === void 0 ? void 0 : _a.scores) || {}
            });
        });
    }
    async getUserCompletedAssessments(userId, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem ver histórico.');
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
        return assignments.map(a => {
            var _a;
            return ({
                id: a.id,
                title: a.assessment.title,
                completedAt: a.completedAt,
                scores: (_a = a.result) === null || _a === void 0 ? void 0 : _a.scores
            });
        });
    }
    async getOne(id, req) {
        const user = req.user;
        if (user.role === 'MEMBER' || (user.userType === 'INDIVIDUAL' && user.role !== 'SUPER_ADMIN')) {
            const assignment = await this.prisma.assessmentAssignment.findFirst({
                where: {
                    assessmentId: id,
                    userId: user.userId
                }
            });
            if (assignment) {
                return this.assessmentService.findOne(id);
            }
        }
        return this.assessmentService.findOne(id, req.user.tenantId);
    }
    create(createAssessmentDto, req) {
        return this.assessmentService.create(createAssessmentDto, req.user.tenantId);
    }
    async update(id, updateAssessmentDto, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem atualizar avaliações');
        }
        const tenantId = user.role === 'SUPER_ADMIN' ? undefined : user.tenantId;
        return this.assessmentService.update(id, updateAssessmentDto, tenantId);
    }
    async delete(id, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem deletar avaliações');
        }
        const tenantId = user.role === 'SUPER_ADMIN' ? undefined : user.tenantId;
        return this.assessmentService.delete(id, tenantId);
    }
    async findAll(req) {
        const user = req.user;
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
            return assignments.map(assignment => (Object.assign(Object.assign({}, assignment.assessment), { assignmentId: assignment.id, assignmentStatus: assignment.status, assignedAt: assignment.assignedAt, feedback: assignment.feedback })));
        }
        const myAssessments = await this.assessmentService.findAll(user.tenantId);
        const bigFiveTemplates = await this.prisma.assessmentModel.findMany({
            where: {
                type: 'BIG_FIVE',
            },
            include: {
                questions: true
            },
            take: 1
        });
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
        return [...templatesMarked, ...myAssessments];
    }
    async assignToUsers(id, body, req) {
        const tenantId = req.user.tenantId;
        const assessment = await this.assessmentService.findOne(id, tenantId);
        if (!assessment) {
            throw new Error('Avaliação não encontrada');
        }
        const assignments = await Promise.all(body.userIds.map(userId => this.prisma.assessmentAssignment.create({
            data: {
                assessmentId: id,
                userId: userId,
                status: 'PENDING'
            }
        })));
        return {
            message: `Avaliação atribuída a ${assignments.length} usuário(s)`,
            assignments
        };
    }
    async getAssignments(id, req) {
        const tenantId = req.user.tenantId;
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
                        companyName: true
                    }
                }
            }
        });
        return assignments;
    }
    async removeAssignment(id, userId, req) {
        const tenantId = req.user.tenantId;
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
    async submitAssessment(id, body, req) {
        const userId = req.user.userId;
        try {
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
                throw new common_1.BadRequestException('Você não tem permissão para responder esta avaliação.');
            }
            if (assignment.status === 'COMPLETED') {
                throw new common_1.BadRequestException('Esta avaliação já foi respondida.');
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({
                    where: { id: userId }
                });
                if (user.credits < 1) {
                    throw new common_1.BadRequestException('Créditos insuficientes para completar a avaliação.');
                }
                await tx.assessmentResult.deleteMany({
                    where: { assignmentId: assignment.id }
                });
                await tx.assessmentResponse.deleteMany({
                    where: { assignmentId: assignment.id }
                });
                await Promise.all(body.answers.map(answer => tx.assessmentResponse.create({
                    data: {
                        assignmentId: assignment.id,
                        questionId: answer.questionId,
                        answer: Number(answer.value)
                    }
                })));
                const traitScores = {};
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
                const finalScores = {};
                for (const [trait, data] of Object.entries(traitScores)) {
                    finalScores[trait] = data.totalWeight > 0 ? data.sum / data.totalWeight : 0;
                }
                const savedResult = await tx.assessmentResult.create({
                    data: {
                        assignmentId: assignment.id,
                        scores: finalScores
                    }
                });
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
        }
        catch (error) {
            console.error('Erro ao submeter avaliação:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Erro técnico: ${error.message}.Stack: ${JSON.stringify(error)} `);
        }
    }
    async calculateBigFive(assessmentId, body, req) {
        const user = req.user;
        const assessment = await this.prisma.assessmentModel.findUnique({
            where: { id: assessmentId }
        });
        if (!assessment) {
            throw new common_1.BadRequestException('Avaliação não encontrada');
        }
        if (assessment.type !== 'BIG_FIVE') {
            throw new common_1.BadRequestException('Este endpoint é apenas para avaliações Big Five');
        }
        const result = await this.bigFiveCalculator.calculateBigFiveScores(assessmentId, body.responses);
        const recommendations = this.bigFiveCalculator.generateDevelopmentRecommendations(result);
        const enrichedTraits = result.traits.map(trait => (Object.assign(Object.assign({}, trait), { description: this.bigFiveCalculator.getTraitDescription(trait.trait, trait.normalizedScore) })));
        return Object.assign(Object.assign({}, result), { traits: enrichedTraits, recommendations });
    }
    async listTemplates(req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem acessar templates');
        }
        const templates = await this.templateService.listTemplates();
        console.log('📊 Templates retornados:', templates.length);
        return templates;
    }
    async getTemplateDetails(id, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem acessar templates');
        }
        return this.templateService.getTemplateDetails(id);
    }
    async cloneTemplate(templateId, body, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem clonar templates');
        }
        return this.templateService.cloneTemplate(templateId, user.tenantId, body.title);
    }
};
exports.AssessmentController = AssessmentController;
__decorate([
    (0, common_1.Get)('assignments/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getAssignmentDetails", null);
__decorate([
    (0, common_1.Get)(':id/my-assignment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getMyAssignment", null);
__decorate([
    (0, common_1.Post)('assignments/:id/feedback'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "addFeedback", null);
__decorate([
    (0, common_1.Get)('completed'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getCompletedAssessments", null);
__decorate([
    (0, common_1.Get)('user/:userId/completed'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getUserCompletedAssessments", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AssessmentController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "assignToUsers", null);
__decorate([
    (0, common_1.Get)(':id/assignments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getAssignments", null);
__decorate([
    (0, common_1.Delete)(':id/assignments/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "removeAssignment", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "submitAssessment", null);
__decorate([
    (0, common_1.Post)(':id/calculate-big-five'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "calculateBigFive", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getTemplateDetails", null);
__decorate([
    (0, common_1.Post)('templates/:id/clone'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "cloneTemplate", null);
exports.AssessmentController = AssessmentController = __decorate([
    (0, common_1.Controller)('assessments'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [assessment_service_1.AssessmentService,
        big_five_calculator_service_1.BigFiveCalculatorService,
        assessment_template_service_1.AssessmentTemplateService,
        prisma_service_1.PrismaService])
], AssessmentController);
//# sourceMappingURL=assessment.controller.js.map