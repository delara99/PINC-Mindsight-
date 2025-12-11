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
exports.InterpretationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InterpretationService = class InterpretationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getInterpretation(traitKey, score) {
        const rule = await this.prisma.interpretationRule.findFirst({
            where: {
                traitKey,
                minScore: { lte: score },
                maxScore: { gte: score }
            }
        });
        if (rule) {
            return {
                text: rule.text,
                category: rule.category
            };
        }
        return {
            text: 'Interpretação não disponível para este score.',
            category: 'GENERAL'
        };
    }
    async generateFullReport(scores) {
        const report = [];
        for (const [trait, score] of Object.entries(scores)) {
            const interpretation = await this.getInterpretation(trait, score);
            report.push(Object.assign({ trait,
                score }, interpretation));
        }
        return report;
    }
};
exports.InterpretationService = InterpretationService;
exports.InterpretationService = InterpretationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InterpretationService);
//# sourceMappingURL=interpretation.service.js.map