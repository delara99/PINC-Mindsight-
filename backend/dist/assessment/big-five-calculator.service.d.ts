import { PrismaService } from '../prisma/prisma.service';
export interface QuestionResponse {
    questionId: string;
    value: number;
}
export interface FacetScore {
    facet: string;
    rawScore: number;
    normalizedScore: number;
}
export interface TraitScore {
    trait: string;
    rawScore: number;
    normalizedScore: number;
    facets: FacetScore[];
    interpretation: string;
}
export interface BigFiveResult {
    totalQuestions: number;
    answeredQuestions: number;
    traits: TraitScore[];
    completionPercentage: number;
    timestamp: Date;
}
export declare class BigFiveCalculatorService {
    private prisma;
    constructor(prisma: PrismaService);
    calculateBigFiveScores(assessmentId: string, responses: QuestionResponse[]): Promise<BigFiveResult>;
    private interpretScore;
    getTraitDescription(trait: string, score: number): string;
    generateDevelopmentRecommendations(results: BigFiveResult): string[];
}
