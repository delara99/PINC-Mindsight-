import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SEED DO MOTOR DE CÁLCULO
 * 
 * Este script popula as tabelas do Motor de Cálculo com as configurações
 * atuais extraídas do score-calculation.service.ts
 * 
 * Tabelas populadas:
 * - calculation_question_mappings: Mapeamento de questões para dimensões/facetas
 * - calculation_formulas: Fórmulas de cálculo (normalização, agregação, etc)
 * - calculation_classifications: Ranges de classificação (VERY_LOW, LOW, etc)
 */

async function main() {
    console.log('🔧 Iniciando seed do Motor de Cálculo...\n');

    // ============================================
    // 1. FÓRMULAS DE CÁLCULO
    // ============================================
    console.log('📐 Criando fórmulas de cálculo...');

    // Fórmula de Normalização (1-6 para 0-100)
    await prisma.calculationFormula.upsert({
        where: { name: 'NORMALIZATION_1_6_TO_0_100' },
        update: {
            formula: {
                type: 'NORMALIZATION',
                inputMin: 1,
                inputMax: 6,
                outputMin: 0,
                outputMax: 100,
                formula: '((value - 1) / 5) * 100',
                description: 'Converte escala Likert 1-6 para percentual 0-100'
            },
            description: `
**Fórmula de Normalização de Scores**

Converte respostas da escala Likert (1 a 6) para percentual (0 a 100).

**Lógica:**
- Escala de entrada: 1 (mínimo) a 6 (máximo)
- Range: 5 (6 - 1)
- Fórmula: ((valor - 1) / 5) × 100

**Exemplos:**
- Resposta 1 → ((1-1)/5)×100 = 0%
- Resposta 3.5 → ((3.5-1)/5)×100 = 50%
- Resposta 6 → ((6-1)/5)×100 = 100%

**Clamping:**
- Valores < 1 são ajustados para 1
- Valores > 6 são ajustados para 6
- Resultado final é arredondado para inteiro
            `.trim(),
            example: `
Entrada: 4.2
Cálculo: ((4.2 - 1) / 5) × 100 = 64%
Saída: 64
            `.trim()
        },
        create: {
            name: 'NORMALIZATION_1_6_TO_0_100',
            type: 'NORMALIZATION',
            formula: {
                type: 'NORMALIZATION',
                inputMin: 1,
                inputMax: 6,
                outputMin: 0,
                outputMax: 100,
                formula: '((value - 1) / 5) * 100'
            },
            minValue: 0,
            maxValue: 100,
            precision: 0,
            description: 'Fórmula de normalização de escala Likert 1-6 para percentual 0-100',
            example: 'Entrada: 4.2 → Saída: 64'
        }
    });

    // Fórmula de Inversão de Questões
    await prisma.calculationFormula.upsert({
        where: { name: 'REVERSE_SCORING_1_6' },
        update: {
            formula: {
                type: 'REVERSE',
                scale: 6,
                formula: '7 - value',
                description: 'Inverte questões reversas na escala 1-6'
            },
            description: `
**Fórmula de Inversão de Questões Reversas**

Algumas questões são formuladas de forma inversa e precisam ter seus valores invertidos antes do cálculo.

**Lógica:**
- Escala: 1 a 6
- Fórmula: 7 - valor

**Exemplos:**
- Resposta 1 (discordo totalmente) → 7-1 = 6 (concordo totalmente)
- Resposta 2 → 7-2 = 5
- Resposta 6 (concordo totalmente) → 7-6 = 1 (discordo totalmente)

**Quando aplicar:**
- Apenas em questões marcadas com isReverse = true
- A inversão acontece ANTES da normalização
            `.trim()
        },
        create: {
            name: 'REVERSE_SCORING_1_6',
            type: 'REVERSE',
            formula: {
                type: 'REVERSE',
                scale: 6,
                formula: '7 - value'
            },
            minValue: 1,
            maxValue: 6,
            precision: 1,
            description: 'Fórmula de inversão para questões reversas',
            example: 'Entrada: 2 → Saída: 5'
        }
    });

    // Fórmula de Agregação de Facetas
    await prisma.calculationFormula.upsert({
        where: { name: 'FACET_WEIGHTED_AVERAGE' },
        update: {
            formula: {
                type: 'WEIGHTED_AVERAGE',
                formula: 'sum(value × weight) / sum(weight)',
                description: 'Média ponderada das questões de uma faceta'
            },
            description: `
**Fórmula de Agregação de Facetas (Subtraços)**

Calcula o score de uma faceta baseado nas questões que a compõem.

**Lógica:**
- Cada questão tem um peso (weight), geralmente 1.0
- Fórmula: Σ(valor × peso) / Σ(peso)

**Exemplo:**
Faceta "Comunicação" com 3 questões:
- Q1: valor=5, peso=1 → 5×1 = 5
- Q2: valor=4, peso=1 → 4×1 = 4
- Q3: valor=6, peso=1 → 6×1 = 6

Cálculo: (5+4+6) / (1+1+1) = 15/3 = 5.0

**Nota:**
- Questões reversas já foram invertidas antes desta etapa
- O resultado ainda está na escala 1-6
- Será normalizado para 0-100 posteriormente
            `.trim(),
            example: `
Questões: [5, 4, 6] com pesos [1, 1, 1]
Cálculo: (5×1 + 4×1 + 6×1) / (1+1+1) = 5.0
            `.trim()
        },
        create: {
            name: 'FACET_WEIGHTED_AVERAGE',
            type: 'FACET',
            formula: {
                type: 'WEIGHTED_AVERAGE',
                formula: 'sum(value × weight) / sum(weight)'
            },
            minValue: 1,
            maxValue: 6,
            precision: 2,
            description: 'Média ponderada para cálculo de facetas',
            example: 'Questões [5,4,6] → Média: 5.0'
        }
    });

    // Fórmula de Agregação de Dimensões
    await prisma.calculationFormula.upsert({
        where: { name: 'DIMENSION_SIMPLE_AVERAGE' },
        update: {
            formula: {
                type: 'SIMPLE_AVERAGE',
                formula: 'sum(facetScores) / count(facets)',
                description: 'Média simples dos scores normalizados das facetas'
            },
            description: `
**Fórmula de Agregação de Dimensões (Traços Principais)**

Calcula o score de uma dimensão (O, C, E, A, N) baseado nas facetas que a compõem.

**Regra do Especialista:**
"O resultado do traço maior deve ser a média simples das pontuações obtidas nos seus respectivos subtraços"

**Lógica:**
- Cada faceta já foi normalizada para 0-100
- Fórmula: Σ(scores das facetas) / número de facetas

**Exemplo:**
Dimensão "Extroversão" com 4 facetas:
- Comunicação: 75%
- Sociabilidade: 60%
- Assertividade: 80%
- Energia: 70%

Cálculo: (75 + 60 + 80 + 70) / 4 = 71.25% → arredonda para 71%

**Importante:**
- Usa scores JÁ NORMALIZADOS (0-100)
- Média SIMPLES (não ponderada)
- Resultado é arredondado para inteiro
            `.trim(),
            example: `
Facetas: [75%, 60%, 80%, 70%]
Cálculo: (75+60+80+70)/4 = 71.25%
Resultado: 71%
            `.trim()
        },
        create: {
            name: 'DIMENSION_SIMPLE_AVERAGE',
            type: 'DIMENSION',
            formula: {
                type: 'SIMPLE_AVERAGE',
                formula: 'sum(facetScores) / count(facets)'
            },
            minValue: 0,
            maxValue: 100,
            precision: 0,
            description: 'Média simples das facetas para calcular dimensão',
            example: 'Facetas [75,60,80,70] → Dimensão: 71'
        }
    });

    console.log('✅ Fórmulas criadas com sucesso!\n');

    // ============================================
    // 2. CLASSIFICAÇÕES (RANGES)
    // ============================================
    console.log('📊 Criando classificações de níveis...');

    const dimensions = ['EXTRAVERSION', 'AGREEABLENESS', 'CONSCIENTIOUSNESS', 'OPENNESS', 'NEUROTICISM'];
    const classifications = [
        { level: 'VERY_LOW', minScore: 0, maxScore: 20, label: 'Muito Baixo', color: '#EF4444', priority: 1 },
        { level: 'LOW', minScore: 21, maxScore: 40, label: 'Baixo', color: '#F59E0B', priority: 2 },
        { level: 'AVERAGE', minScore: 41, maxScore: 60, label: 'Médio', color: '#10B981', priority: 3 },
        { level: 'HIGH', minScore: 61, maxScore: 80, label: 'Alto', color: '#3B82F6', priority: 4 },
        { level: 'VERY_HIGH', minScore: 81, maxScore: 100, label: 'Muito Alto', color: '#8B5CF6', priority: 5 }
    ];

    for (const dim of dimensions) {
        for (const classif of classifications) {
            await prisma.calculationClassification.upsert({
                where: {
                    dimension_level: {
                        dimension: dim,
                        level: classif.level
                    }
                },
                update: {
                    minScore: classif.minScore,
                    maxScore: classif.maxScore,
                    label: classif.label,
                    color: classif.color,
                    priority: classif.priority,
                    description: `Score entre ${classif.minScore}% e ${classif.maxScore}%`
                },
                create: {
                    dimension: dim,
                    level: classif.level,
                    minScore: classif.minScore,
                    maxScore: classif.maxScore,
                    label: classif.label,
                    color: classif.color,
                    priority: classif.priority,
                    description: `Score entre ${classif.minScore}% e ${classif.maxScore}%`
                }
            });
        }
    }

    console.log('✅ Classificações criadas com sucesso!\n');

    console.log('🎉 Seed do Motor de Cálculo concluído!');
    console.log('\n📋 Resumo:');
    console.log('   - 4 fórmulas de cálculo documentadas');
    console.log('   - 25 classificações de níveis (5 dimensões × 5 níveis)');
    console.log('\n💡 Próximo passo: Popular mapeamento de questões (calculation_question_mappings)');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
