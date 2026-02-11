
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
import { TalkingToController } from './src/talking-to/talking-to.controller';
import { TalkingToService } from './src/talking-to/talking-to.service';
import { ScoreCalculationService } from './src/reports/score-calculation.service';
import { PdfService } from './src/reports/pdf.service';

async function analyzeClient() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    // Manually instantiate controller to access private method or just use the logic
    // Actually, I can't access private methods easily. I will use the public `getReportById` if I can pretend to be admin, 
    // or just replicate the calls: scoreService.calculateScores -> manual mapping -> talkingToService.analyzeProfile.

    const email = 'cristianoan04ii@gmail.com';
    console.log(`Searching for user: ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('User not found!');
        await app.close();
        return;
    }
    console.log(`User Found: ${user.name} (ID: ${user.id})`);

    const assignment = await prisma.assessmentAssignment.findFirst({
        where: { userId: user.id, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        include: { responses: true }
    });

    if (!assignment) {
        console.error('No completed assignment found.');
        await app.close();
        return;
    }
    console.log(`Latest Assignment ID: ${assignment.id} (Completed: ${assignment.completedAt})`);

    // 1. Calculate Scores (Engine)
    const scoreService = app.get(ScoreCalculationService);
    const { scores } = await scoreService.calculateScores(assignment.id);

    console.log('\n--- 1. RAW SCORES FROM ENGINE (BIG FIVE) ---');
    // Log a sample to see what facet names are returned
    if (scores['EXTRAVERSION']) {
        console.log('Extraversion Facets (Raw):', scores['EXTRAVERSION'].facets?.map(f => `${f.facetName} (${f.score})`).join(', '));
    }

    // 2. Simulate Controller Mapping Logic (IPIP -> PINC)
    console.log('\n--- 2. APPLYING PINC MAPPING (SIMULATION) ---');
    const pincMapping = {
        'EXTRAVERSION': [
            { ipip: 'acolhimento', pinc: 'COMMUNICATION', label: 'Comunicação', invert: false },
            { ipip: 'gregarismo', pinc: 'SOCIAL_INTERACTION', label: 'Interação Social', invert: false },
            { ipip: 'assertividade', pinc: 'AUTHORITY', label: 'Autoridade', invert: false },
            { ipip: 'atividade', pinc: 'ACTION_ORIENTATION', label: 'Orientação p/ Ação', invert: false }
        ],
        'AGREEABLENESS': [
            { ipip: 'franqueza', pinc: 'LOGIC', label: 'Lógica', invert: true },
            { ipip: 'altruísmo', pinc: 'INDEPENDENCE', label: 'Independência', invert: true },
            { ipip: 'altruismo', pinc: 'INDEPENDENCE', label: 'Independência', invert: true },
            { ipip: 'complacência', pinc: 'COMPETITIVENESS', label: 'Competitividade', invert: true },
            { ipip: 'complacencia', pinc: 'COMPETITIVENESS', label: 'Competitividade', invert: true }
        ],
        'CONSCIENTIOUSNESS': [
            { ipip: 'deliberação', pinc: 'PLANNING', label: 'Planejamento', invert: false },
            { ipip: 'deliberacao', pinc: 'PLANNING', label: 'Planejamento', invert: false },
            { ipip: 'autodisciplina', pinc: 'DISCIPLINE', label: 'Disciplina', invert: false },
            { ipip: 'realização', pinc: 'PERSISTENCE', label: 'Persistência', invert: false },
            { ipip: 'realizacao', pinc: 'PERSISTENCE', label: 'Persistência', invert: false }
        ],
        'OPENNESS': [
            { ipip: 'fantasia', pinc: 'IMAGINATION', label: 'Imaginação', invert: false },
            { ipip: 'ideias', pinc: 'INTELLECT', label: 'Intelectualidade', invert: false },
            { ipip: 'valores', pinc: 'OPENNESS_TO_NEW', label: 'Abertura ao Novo', invert: false }
        ],
        'NEUROTICISM': [
            { ipip: 'ansiedade', pinc: 'CONFIDENCE', label: 'Confiança', invert: true },
            { ipip: 'depressão', pinc: 'SELF_CONFIDENCE', label: 'Autoconfiança', invert: true },
            { ipip: 'depressao', pinc: 'SELF_CONFIDENCE', label: 'Autoconfiança', invert: true },
            { ipip: 'hostilidade', pinc: 'TEMPERAMENT', label: 'Temperamento', invert: true },
            { ipip: 'impulsividade', pinc: 'CONTROL', label: 'Controle', invert: true }
        ]
    };

    const mappedScores = JSON.parse(JSON.stringify(scores)); // Deep copy

    Object.keys(mappedScores).forEach(key => {
        const mapping = pincMapping[key];
        if (mapping && mappedScores[key].facets) {
            console.log(`\nMapping ${key}...`);
            const newFacets = mapping.map(m => {
                const original = mappedScores[key].facets.find((f: any) =>
                    f.facetName?.toLowerCase().includes(m.ipip) ||
                    f.name?.toLowerCase().includes(m.ipip)
                );

                let rawScore = original ? (original.score || original.normalizedScore || 50) : 50;
                if (!original) console.warn(`   ⚠️ WARNING: Facet '${m.ipip}' not found in raw scores! Using fallback 50.`);
                else console.log(`   ✅ Found '${m.ipip}' (Score: ${rawScore}) -> Inv: ${m.invert} -> New: ${m.pinc}`);

                const finalScore = m.invert ? (100 - rawScore) : rawScore;

                return {
                    name: m.pinc,
                    score: finalScore,
                    label: m.label
                };
            });
            mappedScores[key].facets = newFacets;
        }
    });

    console.log('\n--- 3. MAPPED FACETS (FINAL) ---');
    console.log(JSON.stringify(mappedScores['EXTRAVERSION']?.facets, null, 2));
    console.log(JSON.stringify(mappedScores['NEUROTICISM']?.facets, null, 2));

    await app.close();
}

analyzeClient();
