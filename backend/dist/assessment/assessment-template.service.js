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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentTemplateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AssessmentTemplateService = class AssessmentTemplateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listTemplates() {
        const templates = await this.prisma.assessmentModel.findMany({
            where: {
                type: 'BIG_FIVE'
            },
            include: {
                questions: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });
        return templates.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            type: t.type,
            questionCount: t.questions.length,
            createdAt: t.createdAt,
            isTemplate: true
        }));
    }
    async cloneTemplate(templateId, tenantId, customTitle) {
        const template = await this.prisma.assessmentModel.findUnique({
            where: { id: templateId },
            include: {
                questions: true
            }
        });
        if (!template) {
            throw new Error('Template não encontrado');
        }
        const cloned = await this.prisma.assessmentModel.create({
            data: {
                title: customTitle || template.title,
                description: template.description,
                type: template.type,
                tenantId: tenantId,
                questions: {
                    create: template.questions.map(q => ({
                        text: q.text,
                        traitKey: q.traitKey,
                        weight: q.weight
                    }))
                }
            },
            include: {
                questions: true
            }
        });
        return {
            id: cloned.id,
            title: cloned.title,
            description: cloned.description,
            type: cloned.type,
            questionCount: cloned.questions.length,
            message: 'Inventário clonado com sucesso!'
        };
    }
    async getTemplateDetails(templateId) {
        const template = await this.prisma.assessmentModel.findUnique({
            where: { id: templateId },
            include: {
                questions: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });
        if (!template) {
            throw new Error('Template não encontrado');
        }
        const questionsByTrait = template.questions.reduce((acc, q) => {
            var _a, _b;
            const trait = ((_a = q.traitKey) === null || _a === void 0 ? void 0 : _a.split('::')[0]) || 'Sem Traço';
            if (!acc[trait]) {
                acc[trait] = [];
            }
            acc[trait].push({
                id: q.id,
                text: q.text,
                facet: ((_b = q.traitKey) === null || _b === void 0 ? void 0 : _b.split('::')[1]) || '',
                weight: q.weight,
                isInverted: q.text.includes('(INV)')
            });
            return acc;
        }, {});
        return {
            id: template.id,
            title: template.title,
            description: template.description,
            type: template.type,
            totalQuestions: template.questions.length,
            traits: Object.keys(questionsByTrait).map(trait => ({
                name: trait,
                questionCount: questionsByTrait[trait].length,
                questions: questionsByTrait[trait]
            }))
        };
    }
};
exports.AssessmentTemplateService = AssessmentTemplateService;
exports.AssessmentTemplateService = AssessmentTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssessmentTemplateService);
//# sourceMappingURL=assessment-template.service.js.map