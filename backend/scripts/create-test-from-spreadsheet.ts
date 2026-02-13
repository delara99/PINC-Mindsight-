import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SCRIPT: Criar Teste com Respostas da Planilha
 * 
 * Cria um novo assignment usando as respostas EXATAS da planilha do especialista
 * para comparação direta com os cálculos do sistema
 */

// ============================================================================
// RESPOSTAS DA PLANILHA (PREENCHER COM DADOS REAIS)
// ============================================================================
// Formato: índice da questão (1-126) → resposta (1-4)
const RESPOSTAS_PLANILHA: Record<number, number> = {
    // EXEMPLO - SUBSTITUIR COM DADOS REAIS DA PLANILHA
    // 1: 4,  // Questão 1: CONCORDO
    // 2: 2,  // Questão 2: DISCORDO PARCIALMENTE
    // 3: 4,  // Questão 3: CONCORDO
    // ... continuar até 126

    // ⚠️ PREENCHER AQUI COM AS 126 RESPOSTAS DA PLANILHA ⚠️
};

async function createTestFromSpreadsheet() {
    console.log('='.repeat(80));
    console.log('CRIAR TESTE COM RESPOSTAS DA PLANILHA');
    console.log('='.repeat(80));

    // 1. Verificar se temos todas as respostas
    const totalRespostas = Object.keys(RESPOSTAS_PLANILHA).length;

    if (totalRespostas === 0) {
        console.log('❌ ERRO: Nenhuma resposta fornecida!');
        console.log('');
        console.log('Por favor, preencha o objeto RESPOSTAS_PLANILHA com as respostas da planilha.');
        console.log('');
        console.log('Formato:');
        console.log('const RESPOSTAS_PLANILHA: Record<number, number> = {');
        console.log('    1: 4,  // Questão 1: CONCORDO');
        console.log('    2: 2,  // Questão 2: DISCORDO PARCIALMENTE');
        console.log('    3: 3,  // Questão 3: CONCORDO PARCIALMENTE');
        console.log('    // ... até 126');
        console.log('};');
        await prisma.$disconnect();
        return;
    }

    console.log(`\n📋 Total de respostas fornecidas: ${totalRespostas}`);

    if (totalRespostas < 126) {
        console.log(`⚠️  ATENÇÃO: Esperado 126 respostas, mas apenas ${totalRespostas} foram fornecidas.`);
        console.log('Continuando mesmo assim...\n');
    }

    // 2. Buscar usuário (Cristiano)
    const user = await prisma.user.findUnique({
        where: { email: 'cristianoan04ii@gmail.com' }
    });

    if (!user) {
        console.log('❌ Usuário não encontrado!');
        await prisma.$disconnect();
        return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

    // 3. Buscar assessment (TalkingTO)
    const assessment = await prisma.assessmentModel.findFirst({
        where: {
            type: 'TALKINGTO'
        },
        include: {
            questions: {
                orderBy: { sequence: 'asc' }
            }
        }
    });

    if (!assessment) {
        console.log('❌ Assessment TalkingTO não encontrado!');
        await prisma.$disconnect();
        return;
    }

    console.log(`✅ Assessment encontrado: ${assessment.title}`);
    console.log(`   Total de questões: ${assessment.questions.length}`);

    // 4. Criar mapeamento de sequência → questionId
    const sequenceToQuestionId = new Map<number, string>();
    assessment.questions.forEach(q => {
        sequenceToQuestionId.set(q.sequence, q.id);
    });

    // 5. Preparar respostas para inserção
    const responsesToCreate = [];

    for (const [sequenceStr, answer] of Object.entries(RESPOSTAS_PLANILHA)) {
        const sequence = parseInt(sequenceStr);
        const questionId = sequenceToQuestionId.get(sequence);

        if (!questionId) {
            console.log(`⚠️  Questão ${sequence} não encontrada no assessment`);
            continue;
        }

        // Validar resposta (1-4)
        if (answer < 1 || answer > 4) {
            console.log(`⚠️  Resposta inválida para questão ${sequence}: ${answer} (deve ser 1-4)`);
            continue;
        }

        responsesToCreate.push({
            questionId,
            answer
        });
    }

    console.log(`\n📊 Respostas válidas para inserir: ${responsesToCreate.length}`);

    // 6. Criar novo assignment
    console.log('\n📋 Criando novo assignment...\n');

    const newAssignment = await prisma.assessmentAssignment.create({
        data: {
            userId: user.id,
            assessmentId: assessment.id,
            status: 'COMPLETED',
            assignedAt: new Date(),
            completedAt: new Date(),
            responses: {
                create: responsesToCreate
            }
        }
    });

    console.log(`✅ Assignment criado com sucesso!`);
    console.log(`   ID: ${newAssignment.id}`);

    // 7. Calcular scores
    console.log('\n📊 Calculando scores...\n');

    const { ScoreCalculationService } = await import('../src/reports/score-calculation.service');
    const { PrismaService } = await import('../src/prisma/prisma.service');

    const prismaService = new PrismaService();
    const scoreService = new ScoreCalculationService(prismaService);

    const scores = await scoreService.calculateScores(newAssignment.id);

    console.log('✅ Scores calculados!\n');
    console.log('📊 RESULTADOS DO SISTEMA:\n');
    console.log('Dimensão | Score');
    console.log('-'.repeat(50));

    Object.entries(scores.scores).forEach(([key, result]) => {
        console.log(`${result.traitName.padEnd(30)} | ${result.normalizedScore}`);
    });

    // 8. Salvar no banco
    console.log('\n💾 Salvando resultado no banco...\n');

    await prisma.assessmentResult.create({
        data: {
            assignmentId: newAssignment.id,
            scores: scores.scores as any
        }
    });

    console.log('✅ Resultado salvo!');

    // 9. Comparação com planilha
    console.log('\n📊 COMPARAÇÃO COM PLANILHA:\n');
    console.log('Dimensão | Sistema | Planilha | Diferença');
    console.log('-'.repeat(70));

    const planilhaScores = {
        'CONCRETO-ABSTRATO': 84,
        'ADAPTÁVEL-ESTRUTURADO': 51,
        'INTROVERSÃO-EXTROVERSÃO': 72,
        'EMOÇÃO-RAZÃO': 80,
        'LÓGICO-SENTIMENTAL': 54
    };

    Object.entries(scores.scores).forEach(([key, result]) => {
        // Tentar encontrar correspondência na planilha
        let planilhaScore = null;
        let dimensionName = '';

        for (const [pName, pScore] of Object.entries(planilhaScores)) {
            if (result.traitName.includes(pName.split('-')[0]) ||
                pName.includes(result.traitName.split('-')[0])) {
                planilhaScore = pScore;
                dimensionName = pName;
                break;
            }
        }

        if (planilhaScore !== null) {
            const diff = result.normalizedScore - planilhaScore;
            const diffStr = diff > 0 ? `+${diff}` : diff.toString();
            const status = Math.abs(diff) <= 5 ? '✅' : '❌';

            console.log(`${dimensionName.padEnd(30)} |   ${result.normalizedScore.toString().padStart(3)}   |    ${planilhaScore.toString().padStart(3)}    |   ${diffStr.padStart(4)} ${status}`);
        }
    });

    console.log('\n' + '='.repeat(80));
    console.log('RESUMO');
    console.log('='.repeat(80));
    console.log(`
✅ TESTE CRIADO COM SUCESSO!

📋 Assignment ID: ${newAssignment.id}
👤 Usuário: ${user.name}
📊 Respostas: ${responsesToCreate.length}

🔗 Acesse o relatório em:
   /dashboard/reports/${newAssignment.id}

⚠️ IMPORTANTE:
- Este teste usa as respostas EXATAS da planilha
- Calculado com nossa fórmula nova (1-4)
- Comparação direta com planilha do especialista

📊 ANÁLISE:
- Se diferenças forem pequenas (±5): ✅ Sistema correto!
- Se diferenças forem grandes (>10): ❌ Investigar mais
    `);

    await prisma.$disconnect();
}

createTestFromSpreadsheet().catch(console.error);
