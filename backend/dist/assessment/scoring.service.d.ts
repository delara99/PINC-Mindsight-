export declare class ScoringService {
    calculateBigFive(answers: Record<string, number>, questions: any[]): {
        OPENNESS: number;
        CONSCIENTIOUSNESS: number;
        EXTRAVERSION: number;
        AGREEABLENESS: number;
        NEUROTICISM: number;
    };
}
