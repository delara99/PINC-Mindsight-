import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

/**
 * SCRIPT: Análise Completa da Planilha do Especialista (Versão Atualizada)
 * Foco: Extrair Questões Invertidas e Fórmula de Normalização
 */

async function analyzeSpreadsheet() {
    console.log('='.repeat(80));
    console.log('ANÁLISE COMPLETA DA PLANILHA DO ESPECIALISTA');
    console.log('='.repeat(80));

    const excelPath = path.join(__dirname, '../data/specialist-spreadsheets/respostas-cristiano.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`\n✅ Planilha: ${workbook.SheetNames[0]}\n`);

    const questoes: any[] = [];
    const questoesInvertidas: number[] = [];
    const dimensoes: Record<string, number[]> = {};
    const facetas: Record<string, number[]> = {};

    // Para análise da fórmula
    const examples: Record<number, { conv14: number, percent: number, count: number }> = {};

    data.forEach((row: any) => {
        const questao = row['__EMPTY'];

        if (typeof questao === 'number' && questao >= 1 && questao <= 126) {
            const info = {
                numero: questao,
                dicotomia: row['__EMPTY_2'],
                subtraco: row['__EMPTY_4'],
                positivoNegativo: row['__EMPTY_6'], // 1 ou -1
                resposta: 0
            };

            // Detectar resposta
            if (row['__EMPTY_8']) info.resposta = 1;
            else if (row['__EMPTY_9']) info.resposta = 2;
            else if (row['__EMPTY_10']) info.resposta = 3;
            else if (row['__EMPTY_11']) info.resposta = 4;

            questoes.push(info);

            // Invertidas
            if (info.positivoNegativo === -1) {
                questoesInvertidas.push(questao);
            }

            // Dimensões
            if (info.dicotomia) {
                if (!dimensoes[info.dicotomia]) dimensoes[info.dicotomia] = [];
                dimensoes[info.dicotomia].push(questao);
            }

            // Facetas
            if (info.subtraco) {
                if (!facetas[info.subtraco]) facetas[info.subtraco] = [];
                facetas[info.subtraco].push(questao);
            }

            // ANÁLISE DE FÓRMULA (apenas questões NÃO invertidas para clareza)
            if (info.resposta > 0 && info.positivoNegativo === 1) {
                // Tenta pegar valor conv 1-4 (colunas 12-15)
                const cols14 = [row['__EMPTY_12'], row['__EMPTY_13'], row['__EMPTY_14'], row['__EMPTY_15']];
                const val14 = cols14.find(v => v !== undefined && v !== null && v !== 0);

                // Tenta pegar valor % (colunas 17-20)
                const colsPercent = [row['__EMPTY_17'], row['__EMPTY_18'], row['__EMPTY_19'], row['__EMPTY_20']];
                const valPercent = colsPercent.find(v => v !== undefined && v !== null);

                if (val14 && valPercent !== undefined) {
                    if (!examples[info.resposta]) {
                        examples[info.resposta] = { conv14: val14, percent: valPercent, count: 0 };
                    }
                    examples[info.resposta].count++;
                }
            }
        }
    });

    console.log('📊 ESTATÍSTICAS:\n');
    console.log(`Total de questões: ${questoes.length}`);
    console.log(`Questões invertidas: ${questoesInvertidas.length}\n`);

    // 1. QUESTÕES INVERTIDAS
    console.log('='.repeat(80));
    console.log('1. QUESTÕES INVERTIDAS NA PLANILHA');
    console.log('='.repeat(80));
    console.log(`\n${questoesInvertidas.sort((a, b) => a - b).join(', ')}\n`);

    // 2. FÓRMULA DE NORMALIZAÇÃO
    console.log('='.repeat(80));
    console.log('2. ANÁLISE DA FÓRMULA DE NORMALIZAÇÃO');
    console.log('='.repeat(80));
    console.log('');
    console.log('Valor Resposta | Conv 1-4 | Valor % | Quantas Ocorrências');
    console.log('-'.repeat(80));

    Object.keys(examples).sort().forEach(resp => {
        const ex = examples[parseInt(resp)];
        console.log(`   ${resp}           |    ${ex.conv14}     |  ${ex.percent.toFixed(4)} |        ${ex.count}`);
    });

    console.log('');

    // EXPORTAR JSON
    const analise = {
        totalQuestoes: questoes.length,
        questoesInvertidas,
        dimensoes,
        facetas,
        questoes: questoes.map(q => ({
            numero: q.numero,
            dimensao: q.dicotomia,
            faceta: q.subtraco,
            invertida: q.positivoNegativo === -1
        }))
    };

    const outputPath = path.join(__dirname, '../data/specialist-spreadsheets/analise-planilha.json');
    fs.writeFileSync(outputPath, JSON.stringify(analise, null, 2));
    console.log(`✅ JSON exportado para: ${outputPath}\n`);
}

analyzeSpreadsheet().catch(console.error);
