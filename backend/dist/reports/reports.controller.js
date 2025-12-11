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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const interpretation_service_1 = require("./interpretation.service");
const pdf_service_1 = require("./pdf.service");
let ReportsController = class ReportsController {
    constructor(analytics, interpretation, pdf) {
        this.analytics = analytics;
        this.interpretation = interpretation;
        this.pdf = pdf;
    }
    async getInterpretation(scoresStr) {
        const scores = JSON.parse(scoresStr);
        return this.interpretation.generateFullReport(scores);
    }
    async getFit(profileId, scoresStr) {
        const scores = JSON.parse(scoresStr);
        return {
            fit: await this.analytics.calculateJobFit(scores, profileId)
        };
    }
    async downloadReport(assignmentId, res) {
        const data = {
            name: "Candidato Mock",
            scores: {
                "OPENNESS": 4.5,
                "CONSCIENTIOUSNESS": 3.8,
                "EXTRAVERSION": 4.2,
                "AGREEABLENESS": 4.0,
                "NEUROTICISM": 2.1
            }
        };
        const interpretation = await this.interpretation.generateFullReport(data.scores);
        const pdfBuffer = await this.pdf.generatePdf(Object.assign(Object.assign({}, data), { interpretation }));
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="report-${assignmentId}.pdf"`,
        });
        return new common_1.StreamableFile(pdfBuffer);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('interpretation'),
    __param(0, (0, common_1.Query)('scores')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getInterpretation", null);
__decorate([
    (0, common_1.Get)('fit/:profileId'),
    __param(0, (0, common_1.Param)('profileId')),
    __param(1, (0, common_1.Query)('scores')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getFit", null);
__decorate([
    (0, common_1.Get)('download/:assignmentId'),
    __param(0, (0, common_1.Param)('assignmentId')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        interpretation_service_1.InterpretationService,
        pdf_service_1.PdfService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map