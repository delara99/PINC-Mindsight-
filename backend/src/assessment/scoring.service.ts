import { Injectable } from '@nestjs/common';

@Injectable()
export class ScoringService {
    /**
     * Calculates Big Five scores based on answers.
     * Assumes answers are in format: { questionId: number (1-5) }
     * and questions metadata contains the trait key and if it's reversed.
     */
    calculateBigFive(answers: Record<string, number>, questions: any[]) {
        const scores = {
            OPENNESS: 0,
            CONSCIENTIOUSNESS: 0,
            EXTRAVERSION: 0,
            AGREEABLENESS: 0,
            NEUROTICISM: 0,
        };

        const counts = { ...scores }; // To calculate average if needed

        questions.forEach(q => {
            const trait = q.traitKey;
            if (scores.hasOwnProperty(trait)) {
                let value = answers[q.id] || 0;

                // Handle reverse scoring if implemented in Question model
                // if (q.isReversed) value = 6 - value;

                scores[trait] += value;
                // counts[trait]++;
            }
        });

        return scores;
    }
}
