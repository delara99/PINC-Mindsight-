
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rules = [
    // --- OPENNESS (Abertura) ---
    {
        traitKey: 'OPENNESS',
        minScore: 4.0,
        maxScore: 5.0,
        category: 'STRENGTH',
        text: 'Demonstra alta criatividade e curiosidade intelectual. Tende a buscar inovação e aceitar bem mudanças.'
    },
    {
        traitKey: 'OPENNESS',
        minScore: 0.0,
        maxScore: 2.5,
        category: 'RISK',
        text: 'Pode apresentar resistência a mudanças e preferência por métodos tradicionais.'
    },

    // --- CONSCIENTIOUSNESS (Conscienciosidade) ---
    {
        traitKey: 'CONSCIENTIOUSNESS',
        minScore: 4.0,
        maxScore: 5.0,
        category: 'STRENGTH',
        text: 'Altamente organizado, disciplinado e focado em resultados. Tende a planejar meticulosamente.'
    },
    {
        traitKey: 'CONSCIENTIOUSNESS',
        minScore: 4.5,
        maxScore: 5.0,
        category: 'RISK',
        text: 'Pode se tornar excessivamente perfeccionista ou rígido em processos.'
    },
    {
        traitKey: 'CONSCIENTIOUSNESS',
        minScore: 0.0,
        maxScore: 2.5,
        category: 'RISK',
        text: 'Pode ter dificuldade com prazos e organização pessoal. Tende a ser mais flexível e espontâneo.'
    },

    // --- EXTRAVERSION (Extroversão) ---
    {
        traitKey: 'EXTRAVERSION',
        minScore: 4.0,
        maxScore: 5.0,
        category: 'COMMUNICATION_STYLE',
        text: 'Comunicador nato, energiza-se com interações sociais e tende a assumir liderança em grupos.'
    },
    {
        traitKey: 'EXTRAVERSION',
        minScore: 0.0,
        maxScore: 2.5,
        category: 'COMMUNICATION_STYLE',
        text: 'Mais reservado e reflexivo. Prefere interações um-a-um e ambientes de trabalho mais silenciosos.'
    },

    // --- AGREEABLENESS (Amabilidade) ---
    {
        traitKey: 'AGREEABLENESS',
        minScore: 4.0,
        maxScore: 5.0,
        category: 'STRENGTH',
        text: 'Altamente colaborativo, empático e focado em harmonia. Excelente para trabalho em equipe.'
    },
    {
        traitKey: 'AGREEABLENESS',
        minScore: 0.0,
        maxScore: 2.0,
        category: 'RISK',
        text: 'Pode ser percebido como competitivo ou cético. Tende a priorizar a lógica sobre os sentimentos alheios.'
    },
    {
        traitKey: 'AGREEABLENESS',
        minScore: 4.5,
        maxScore: 5.0,
        category: 'RISK',
        text: 'Pode ter dificuldade em dizer "não" ou em lidar com conflitos necessários.'
    },

    // --- NEUROTICISM (Estabilidade Emocional - Invertido) ---
    // Score alto = Baixa estabilidade (Alto Neuroticismo)
    {
        traitKey: 'NEUROTICISM',
        minScore: 0.0,
        maxScore: 2.0,
        category: 'STRENGTH',
        text: 'Demonstra alta resiliência e calma sob pressão. Não se abala facilmente com estresse.'
    },
    {
        traitKey: 'NEUROTICISM',
        minScore: 4.0,
        maxScore: 5.0,
        category: 'RISK',
        text: 'Pode reagir intensamente ao estresse, apresentando ansiedade ou oscilações de humor.'
    }
];

async function main() {
    console.log('🌱 Seeding Interpretation Rules...');

    // Limpar regras antigas para garantir
    await prisma.interpretationRule.deleteMany({});

    for (const rule of rules) {
        await prisma.interpretationRule.create({
            data: {
                traitKey: rule.traitKey,
                minScore: rule.minScore,
                maxScore: rule.maxScore,
                category: rule.category as any,
                text: rule.text
            }
        });
    }

    console.log(`✅ Added ${rules.length} rules.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
