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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateJobFit(candidateScores, jobProfileId) {
        const profile = await this.prisma.jobProfile.findUnique({
            where: { id: jobProfileId }
        });
        if (!profile)
            throw new Error('Perfil não encontrado');
        const idealScores = profile.idealScores;
        let totalDiff = 0;
        let traitCount = 0;
        for (const [trait, idealScore] of Object.entries(idealScores)) {
            if (candidateScores[trait] !== undefined) {
                const diff = Math.abs(candidateScores[trait] - idealScore);
                totalDiff += diff;
                traitCount++;
            }
        }
        if (traitCount === 0)
            return 0;
        const avgDiff = totalDiff / traitCount;
        const fitPercentage = Math.max(0, 100 - (avgDiff * 25));
        return Math.round(fitPercentage);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map