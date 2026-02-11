
process.env.DATABASE_URL = 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway';
import { Test } from '@nestjs/testing';
import { PrismaService } from './src/prisma/prisma.service';
import { ScoreCalculationService } from './src/reports/score-calculation.service';
import { TalkingToService } from './src/talking-to/talking-to.service';
import { ConfigModule } from '@nestjs/config';

async function analyzeClient() {
    console.log('Initializing minimalist context...');

    const moduleRef = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: false }),
        ],
        providers: [
            PrismaService,
            ScoreCalculationService,
            TalkingToService
        ],
    }).compile();

    const prisma = moduleRef.get<PrismaService>(PrismaService);
    const scoreService = moduleRef.get<ScoreCalculationService>(ScoreCalculationService);

    const email = 'cristianoan04ii@gmail.com';
    console.log(`Searching for user: ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('User not found!');
        return;
    }
    console.log(`User Found: ${user.name} (ID: ${user.id})`);

    const assignment = await prisma.assessmentAssignment.findFirst({
        where: { userId: user.id, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        include: { responses: true, assessment: { include: { questions: true } } }
    });

    if (!assignment) {
        console.error('No completed assignment found.');
        return;
    }
    console.log(`Latest Assignment ID: ${assignment.id}`);

    // 1. Calculate Scores (Engine)
    const { scores } = await scoreService.calculateScores(assignment.id);

    console.log('\n--- 1. RAW SCORES FROM ENGINE (BIG FIVE) ---');
    Object.keys(scores).forEach(key => {
        if (scores[key].facets) {
            console.log(`\nDimension: ${key} (${scores[key].score})`);
            scores[key].facets.forEach(f => {
                console.log(`   - ${f.facetName}: ${f.score} (Raw Normalized)`);
            });
        }
    });

    // 2. Simulate Controller Mapping Logic (New Sources Logic)
    console.log('\n--- 2. APPLYING PINC MAPPING (REAL SIMULATION) ---');

    // COPIED FROM CONTROLLER (UPDATED)
    const pincMapping = {
        'EXTRAVERSION': [
            { pinc: 'COMMUNICATION', sources: ['acolhimento', 'warmth'], label: 'Comunicação', invert: false },
            { pinc: 'SOCIAL_INTERACTION', sources: ['gregarismo', 'gregariousness', 'social'], label: 'Interação Social', invert: false },
            { pinc: 'AUTHORITY', sources: ['assertividade', 'assertiveness', 'autoridade'], label: 'Autoridade', invert: false },
            { pinc: 'ACTION_ORIENTATION', sources: ['atividade', 'activity', 'nivel de atividade', 'acao'], label: 'Orientação p/ Ação', invert: false }
        ],
        'AGREEABLENESS': [
            { pinc: 'LOGIC', sources: ['franqueza', 'straightforwardness', 'sinceridade'], label: 'Lógica', invert: true },
            { pinc: 'INDEPENDENCE', sources: ['altruismo', 'altruísmo', 'altruism'], label: 'Independência', invert: true },
            { pinc: 'COMPETITIVENESS', sources: ['complacencia', 'complacência', 'compliance'], label: 'Competitividade', invert: true }
        ],
        'CONSCIENTIOUSNESS': [
            { pinc: 'PLANNING', sources: ['deliberacao', 'deliberação', 'deliberation', 'planejamento'], label: 'Planejamento', invert: false },
            { pinc: 'DISCIPLINE', sources: ['autodisciplina', 'selfdiscipline', 'disciplina'], label: 'Disciplina', invert: false },
            { pinc: 'PERSISTENCE', sources: ['realizacao', 'realização', 'achievement', 'esforço', 'esforco por realizacao'], label: 'Persistência', invert: false }
        ],
        'OPENNESS': [
            { pinc: 'IMAGINATION', sources: ['fantasia', 'fantasy', 'imaginacao'], label: 'Imaginação', invert: false },
            { pinc: 'INTELLECT', sources: ['ideias', 'ideas', 'intelecto'], label: 'Intelectualidade', invert: false },
            { pinc: 'OPENNESS_TO_NEW', sources: ['valores', 'values', 'abertura'], label: 'Abertura ao Novo', invert: false }
        ],
        'NEUROTICISM': [
            { pinc: 'CONFIDENCE', sources: ['ansiedade', 'anxiety'], label: 'Confiança', invert: true },
            { pinc: 'SELF_CONFIDENCE', sources: ['depressao', 'depressão', 'depression'], label: 'Autoconfiança', invert: true },
            { pinc: 'TEMPERAMENT', sources: ['hostilidade', 'angryhostility', 'raiva', 'temperamento'], label: 'Temperamento', invert: true },
            { pinc: 'CONTROL', sources: ['impulsividade', 'impulsiveness', 'imoderacao', 'imoderação', 'controle'], label: 'Controle', invert: true }
        ]
    };

    const mappedScores = JSON.parse(JSON.stringify(scores));

    Object.keys(mappedScores).forEach(key => {
        const mapping = pincMapping[key];
        if (mapping && mappedScores[key].facets) {
            console.log(`\nMapping ${key}...`);
            const newFacets = mapping.map(m => {
                let original = null;
                // Try sources
                for (const src of m.sources) {
                    original = mappedScores[key].facets.find((f: any) =>
                        (f.name || f.facetName || '').toLowerCase().includes(src)
                    );
                    if (original) {
                        console.log(`   ✅ Matched '${m.pinc}' with source '${src}' (Original: ${original.facetName || original.name}, Score: ${original.score})`);
                        break;
                    }
                }

                if (!original) console.warn(`   ⚠️ WARNING: No match for PINC '${m.pinc}' (Tried: ${m.sources.join(', ')})`);

                let rawScore = original ? ((original as any).score || 50) : 50;
                const finalScore = m.invert ? (100 - rawScore) : rawScore;

                // NEW BINARY CLASSIFICATION
                const classification = finalScore <= 50 ? 'BAIXO' : 'ALTO';

                return {
                    name: m.pinc,
                    score: finalScore,
                    label: m.label,
                    classification
                };
            });
            mappedScores[key].facets = newFacets;
        }
    });

    console.log('\n--- 3. FINAL PINC PROFILE (PREVIEW) ---');
    Object.keys(mappedScores).forEach(k => {
        if (mappedScores[k].facets) {
            console.log(`\n${k} (Dim Score: ${mappedScores[k].score})`);
            mappedScores[k].facets.forEach(f => {
                console.log(`   - ${f.label} (${f.name}): ${f.score} [${f.classification}]`);
            });
        }
    });

    await prisma.$disconnect();
}

analyzeClient();
