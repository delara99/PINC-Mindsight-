import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * SCRIPT: Ler Planilha e Criar Teste
 * 
 * Lê arquivo Excel com respostas do especialista e cria teste no sistema
 */

async function readSpreadsheetAndCreateTest() {
    console.log('='.repeat(80));
    console.log('LER PLANILHA E CRIAR TESTE');
    console.log('='.repeat(80));

    // 1. Caminho do arquivo Excel
    const excelPath = path.join(__dirname, '../data/specialist-spreadsheets/respostas-cristiano.xlsx');

    console.log(`\n📁 Procurando arquivo: ${excelPath}\n`);

    let workbook;
    try {
        workbook = XLSX.readFile(excelPath);
    } catch (error) {
        console.log('❌ ERRO: Arquivo não encontrado!');
        console.log('');
        console.log('Por favor, coloque o arquivo Excel em:');
        console.log('  backend/data/specialist-spreadsheets/respostas-cristiano.xlsx');
        console.log('');
        console.log('O arquivo deve conter:');
        console.log('  - Coluna com número da questão (1-126)');
        console.log('  - Coluna com resposta (1-4)');
        console.log('');
        await prisma.$disconnect();
        return;
    }

    console.log('✅ Arquivo encontrado!');
    console.log(`   Planilhas disponíveis: ${workbook.SheetNames.join(', ')}\n`);

    // 2. Ler primeira planilha
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Lendo planilha: ${sheetName}`);
    console.log(`   Total de linhas: ${data.length}\n`);

    // 3. Extrair respostas
    // Assumindo que a planilha tem colunas: "Questão" e "Resposta"
    // Ajuste os nomes das colunas conforme necessário
    const respostas: Record<number, number> = {};

    console.log('📋 Primeiras 10 linhas da planilha:\n');
    console.log('Questão | Resposta');
    console.log('-'.repeat(30));

    data.forEach((row: any, index) => {
        // Tentar diferentes formatos de coluna
        const questao = row['Questão'] || row['Questao'] || row['questao'] || row['Q'] || row['q'] || (index + 1);
        const resposta = row['Resposta'] || row['resposta'] || row['R'] || row['r'] || row['Answer'] || row['answer'];

        if (questao && resposta) {
            const q = typeof questao === 'number' ? questao : parseInt(questao);
            const r = typeof resposta === 'number' ? resposta : parseInt(resposta);

            if (!isNaN(q) && !isNaN(r) && r >= 1 && r <= 4) {
                respostas[q] = r;

                if (index < 10) {
                    console.log(`   ${q.toString().padStart(3)}   |    ${r}`);
                }
            }
        }
    });

    const totalRespostas = Object.keys(respostas).length;
    console.log(`\n✅ Total de respostas válidas extraídas: ${totalRespostas}`);

    if (totalRespostas === 0) {
        console.log('\n❌ ERRO: Nenhuma resposta válida encontrada!');
        console.log('');
        console.log('Verifique se a planilha tem as colunas corretas:');
        console.log('  - "Questão" ou "Q" (número 1-126)');
        console.log('  - "Resposta" ou "R" (número 1-4)');
        console.log('');
        console.log('Colunas encontradas na planilha:');
        if (data.length > 0) {
            console.log('  ', Object.keys(data[0]).join(', '));
        }
        await prisma.$disconnect();
        return;
    }

    if (totalRespostas < 126) {
        console.log(`⚠️  ATENÇÃO: Esperado 126 respostas, mas apenas ${totalRespostas} foram encontradas.`);
        console.log('Continuando mesmo assim...\n');
    }

    // 4. Buscar usuário (Cristiano)
    const user = await prisma.user.findUnique({
        where: { email: 'cristianoan04ii@gmail.com' }
    });

    if (!user) {
        console.log('❌ Usuário não encontrado!');
        await prisma.$disconnect();
        return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

    // 5. Buscar assessment (TalkingTO)
    const assessment = await prisma.assessmentModel.findFirst({
        where: {
            title: {
                contains: 'TalkingTO'
            }
        },
        include: {
            questions: {
                orderBy: { createdAt: 'asc' }
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

    // 6. Criar mapeamento de sequência → questionId
    const sequenceToQuestionId = new Map<string, string>();
    assessment.questions.forEach((q, index) => {
        // Usar índice + 1 como sequência (1-126)
        sequenceToQuestionId.set((index + 1).toString(), q.id);
    });

    // 7. Preparar respostas para inserção
    const responsesToCreate = [];

    for (const [sequenceStr, answer] of Object.entries(respostas)) {
        const questionId = sequenceToQuestionId.get(sequenceStr);

        if (!questionId) {
            console.log(`⚠️  Questão ${sequenceStr} não encontrada no assessment`);
            continue;
        }

        responsesToCreate.push({
            questionId,
            answer
        });
    }

    console.log(`\n📊 Respostas válidas para inserir: ${responsesToCreate.length}`);

    // 8. Criar novo assignment
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

    // 9. Calcular scores
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

    // 10. Salvar no banco
    console.log('\n💾 Salvando resultado no banco...\n');

    await prisma.assessmentResult.create({
        data: {
            assignmentId: newAssignment.id,
            scores: scores.scores as any
        }
    });

    console.log('✅ Resultado salvo!');

    // 11. Comparação com planilha
    console.log('\n📊 COMPARAÇÃO COM PLANILHA:\n');
    console.log('Dimensão | Sistema | Planilha | Diferença | Status');
    console.log('-'.repeat(80));

    const planilhaScores = {
        'CONCRETO-ABSTRATO': 84,
        'ADAPTÁVEL-ESTRUTURADO': 51,
        'INTROVERSÃO-EXTROVERSÃO': 72,
        'EMOÇÃO-RAZÃO': 80,
        'LÓGICO-SENTIMENTAL': 54
    };

    let totalDiff = 0;
    let count = 0;

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
            const status = Math.abs(diff) <= 5 ? '✅ OK' : Math.abs(diff) <= 10 ? '⚠️  ATENÇÃO' : '❌ ERRO';

            totalDiff += Math.abs(diff);
            count++;

            console.log(`${dimensionName.padEnd(30)} |   ${result.normalizedScore.toString().padStart(3)}   |    ${planilhaScore.toString().padStart(3)}    |   ${diffStr.padStart(4)}    | ${status}`);
        }
    });

    const avgDiff = count > 0 ? parseFloat((totalDiff / count).toFixed(1)) : 0;

    console.log('\n' + '='.repeat(80));
    console.log('RESUMO');
    console.log('='.repeat(80));
    console.log(`
✅ TESTE CRIADO COM SUCESSO!

📋 Assignment ID: ${newAssignment.id}
👤 Usuário: ${user.name}
📊 Respostas: ${responsesToCreate.length}

📊 ANÁLISE DE DIFERENÇAS:
   Diferença média: ${avgDiff} pontos
   ${avgDiff <= 5 ? '✅ EXCELENTE! Sistema está correto!' : avgDiff <= 10 ? '⚠️  ATENÇÃO: Diferenças moderadas' : '❌ ERRO: Diferenças grandes - investigar!'}

🔗 Acesse o relatório em:
   /dashboard/reports/${newAssignment.id}

📝 PRÓXIMOS PASSOS:
${avgDiff <= 5 ?
            '   ✅ Sistema validado! Pode usar em produção.' :
            '   ❌ Investigar causas das diferenças:\n' +
            '      1. Verificar questões invertidas\n' +
            '      2. Verificar agrupamento de facetas\n' +
            '      3. Comparar fórmulas em detalhes'
        }
    `);

    await prisma.$disconnect();
}

readSpreadsheetAndCreateTest().catch(console.error);
