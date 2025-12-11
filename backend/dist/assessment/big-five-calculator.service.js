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
exports.BigFiveCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BigFiveCalculatorService = class BigFiveCalculatorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateBigFiveScores(assessmentId, responses) {
        const questions = await this.prisma.question.findMany({
            where: { assessmentModelId: assessmentId },
            select: {
                id: true,
                text: true,
                traitKey: true,
                weight: true
            }
        });
        const responseMap = new Map();
        responses.forEach(r => responseMap.set(r.questionId, r.value));
        const traitFacetMap = new Map();
        questions.forEach(q => {
            if (!q.traitKey)
                return;
            const [trait, facet] = q.traitKey.split('::');
            if (!trait || !facet)
                return;
            const isInverted = q.text.includes('(INV)');
            if (!traitFacetMap.has(trait)) {
                traitFacetMap.set(trait, new Map());
            }
            const facetMap = traitFacetMap.get(trait);
            if (!facetMap.has(facet)) {
                facetMap.set(facet, []);
            }
            facetMap.get(facet).push({
                id: q.id,
                weight: q.weight,
                isInverted
            });
        });
        const traitScores = [];
        traitFacetMap.forEach((facetMap, traitName) => {
            const facetScores = [];
            facetMap.forEach((questions, facetName) => {
                let facetSum = 0;
                let facetCount = 0;
                questions.forEach(q => {
                    const response = responseMap.get(q.id);
                    if (response !== undefined) {
                        const adjustedValue = q.isInverted ? (6 - response) : response;
                        facetSum += adjustedValue * q.weight;
                        facetCount += q.weight;
                    }
                });
                if (facetCount > 0) {
                    const rawScore = facetSum / facetCount;
                    const normalizedScore = ((rawScore - 1) / 4) * 100;
                    facetScores.push({
                        facet: facetName,
                        rawScore: Math.round(rawScore * 100) / 100,
                        normalizedScore: Math.round(normalizedScore * 10) / 10
                    });
                }
            });
            if (facetScores.length > 0) {
                const traitRawScore = facetScores.reduce((sum, f) => sum + f.rawScore, 0) / facetScores.length;
                const traitNormalizedScore = facetScores.reduce((sum, f) => sum + f.normalizedScore, 0) / facetScores.length;
                traitScores.push({
                    trait: traitName,
                    rawScore: Math.round(traitRawScore * 100) / 100,
                    normalizedScore: Math.round(traitNormalizedScore * 10) / 10,
                    facets: facetScores,
                    interpretation: this.interpretScore(traitNormalizedScore)
                });
            }
        });
        return {
            totalQuestions: questions.length,
            answeredQuestions: responses.length,
            traits: traitScores,
            completionPercentage: Math.round((responses.length / questions.length) * 100),
            timestamp: new Date()
        };
    }
    interpretScore(score) {
        if (score >= 80)
            return 'Muito Alto';
        if (score >= 60)
            return 'Alto';
        if (score >= 40)
            return 'Médio';
        if (score >= 20)
            return 'Baixo';
        return 'Muito Baixo';
    }
    getTraitDescription(trait, score) {
        var _a;
        const level = this.interpretScore(score);
        const descriptions = {
            'Abertura à Experiência': {
                'Muito Alto': 'Extremamente criativo, curioso e aberto a novas experiências. Busca constantemente novidades e valora diversidade.',
                'Alto': 'Criativo e disposto a explorar novas ideias. Aprecia inovação e mudanças.',
                'Médio': 'Equilibrado entre tradição e inovação. Aberto a mudanças quando necessário.',
                'Baixo': 'Prefere rotinas estabelecidas e métodos testados. Mais conservador em abordagens.',
                'Muito Baixo': 'Fortemente orientado a tradições e rotinas. Desconforto significativo com mudanças.'
            },
            'Conscienciosidade': {
                'Muito Alto': 'Extremamente organizado, disciplinado e orientado a objetivos. Altíssimo senso de responsabilidade.',
                'Alto': 'Organizado e confiável. Cumpre prazos e mantém compromissos consistentemente.',
                'Médio': 'Razoavelmente organizado com equilíbrio entre flexibilidade e estrutura.',
                'Baixo': 'Mais espontâneo que planejado. Pode ter dificuldade com organização.',
                'Muito Baixo': 'Muito espontâneo e desorganizado. Desafios significativos com planejamento e prazos.'
            },
            'Extroversão': {
                'Muito Alto': 'Extremamente sociável e energético. Prospera em interações sociais e ambientes estimulantes.',
                'Alto': 'Sociável e assertivo. Gosta de trabalhar com pessoas e em equipes.',
                'Médio': 'Equilibrado entre interação social e trabalho independente.',
                'Baixo': 'Mais reservado e introspectivo. Prefere trabalho individual.',
                'Muito Baixo': 'Muito reservado e quieto. Forte preferência por trabalho solitário.'
            },
            'Amabilidade': {
                'Muito Alto': 'Extremamente empático, cooperativo e altruísta. Prioriza harmonia nas relações.',
                'Alto': 'Cooperativo e confiável. Valoriza trabalho em equipe e relações positivas.',
                'Médio': 'Equilibrado entre cooperação e assertividade própria.',
                'Baixo': 'Mais competitivo e direto. Foca em resultados acima de relações.',
                'Muito Baixo': 'Muito competitivo e cético. Pode ser percebido como difícil em trabalho colaborativo.'
            },
            'Estabilidade Emocional': {
                'Muito Alto': 'Extremamente calmo e resiliente. Rara ansiedade mesmo sob alta pressão.',
                'Alto': 'Emocionalmente estável. Lida bem com estresse e críticas.',
                'Médio': 'Resiliência moderada. Geralmente estável com momentos de tensão.',
                'Baixo': 'Mais sensível a estresse e ansiedade. Pode ter variações de humor.',
                'Muito Baixo': 'Muito sensível emocionalmente. Significativa dificuldade sob pressão ou críticas.'
            }
        };
        return ((_a = descriptions[trait]) === null || _a === void 0 ? void 0 : _a[level]) || 'Descrição não disponível.';
    }
    generateDevelopmentRecommendations(results) {
        const recommendations = [];
        results.traits.forEach(trait => {
            const score = trait.normalizedScore;
            if (trait.trait === 'Abertura à Experiência' && score < 40) {
                recommendations.push('Considere participar de workshops ou cursos fora da sua área de expertise para expandir horizontes.');
            }
            if (trait.trait === 'Conscienciosidade' && score < 40) {
                recommendations.push('Utilize ferramentas de gestão de tarefas (como Trello ou Notion) para melhorar organização.');
            }
            if (trait.trait === 'Extroversão' && score < 40) {
                recommendations.push('Pratique técnicas de comunicação e apresentação para aumentar confiança em grupos.');
            }
            if (trait.trait === 'Amabilidade' && score > 80) {
                recommendations.push('Trabalhe assertividade - nem sempre concordar com tudo gera melhores resultados.');
            }
            if (trait.trait === 'Estabilidade Emocional' && score < 40) {
                recommendations.push('Considere práticas de mindfulness ou técnicas de gestão de estresse.');
            }
        });
        return recommendations;
    }
};
exports.BigFiveCalculatorService = BigFiveCalculatorService;
exports.BigFiveCalculatorService = BigFiveCalculatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BigFiveCalculatorService);
//# sourceMappingURL=big-five-calculator.service.js.map