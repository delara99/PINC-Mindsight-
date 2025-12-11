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
exports.AssessmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AssessmentService = class AssessmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, tenantId) {
        return this.prisma.assessmentModel.create({
            data: Object.assign(Object.assign({}, data), { tenantId }),
        });
    }
    async findAll(tenantId) {
        return this.prisma.assessmentModel.findMany({
            where: { tenantId },
            include: {
                questions: true,
                _count: {
                    select: { assignments: true }
                }
            },
        });
    }
    async findOne(id, tenantId) {
        return this.prisma.assessmentModel.findFirst({
            where: Object.assign({ id }, (tenantId && { tenantId })),
            include: { questions: true }
        });
    }
    async update(id, data, tenantId) {
        if (tenantId) {
            const assessment = await this.prisma.assessmentModel.findFirst({
                where: { id, tenantId }
            });
            if (!assessment) {
                throw new Error('Assessment not found or access denied');
            }
        }
        return this.prisma.assessmentModel.update({
            where: { id },
            data,
            include: { questions: true }
        });
    }
    async delete(id, tenantId) {
        if (tenantId) {
            const assessment = await this.prisma.assessmentModel.findFirst({
                where: { id, tenantId }
            });
            if (!assessment) {
                throw new Error('Assessment not found or access denied');
            }
        }
        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: { assessmentId: id }
        });
        for (const assignment of assignments) {
            await this.prisma.assessmentResponse.deleteMany({
                where: { assignmentId: assignment.id }
            });
        }
        await this.prisma.assessmentAssignment.deleteMany({
            where: { assessmentId: id }
        });
        await this.prisma.question.deleteMany({
            where: { assessmentModelId: id }
        });
        return this.prisma.assessmentModel.delete({
            where: { id }
        });
    }
};
exports.AssessmentService = AssessmentService;
exports.AssessmentService = AssessmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssessmentService);
//# sourceMappingURL=assessment.service.js.map