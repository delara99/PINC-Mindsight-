
import { InterpretationEngineService } from './src/interpretation/interpretation-engine.service';
import { PrismaService } from './src/prisma/prisma.service';

async function run() {
    console.log('🚀 Iniciando Diagnóstico Local da Camada Interpretativa...');

    const prisma = new PrismaService();
    // Forçar log de query para ver se conecta
    // (prisma as any).on('query', (e) => console.log(e.query));

    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    const engine = new InterpretationEngineService(prisma);

    // DADOS REAIS DA SUA IMAGEM
    const scoresInput = {
        extroversao: { score: 45, normalizedScore: 45 },
        amabilidade: { score: 25, normalizedScore: 25 },
        conscienciosidade: { score: 40, normalizedScore: 40 },
        neuroticismo: { score: 75, normalizedScore: 75 },
        abertura: { score: 50, normalizedScore: 50 }
    };

    console.log('\n📊 Scores de Entrada (Simulados):', JSON.stringify(scoresInput));

    try {
        console.log('\n🕵️ Executando Engine...');
        const sections = await engine.generateAdvancedSections(scoresInput);

        console.log('\n--- RESULTADO DA ANÁLISE ---');
        console.log(`Seções Geradas: ${sections.length}`);

        if (sections.length > 0) {
            sections.forEach(s => {
                console.log(`\n[${s.title}] (Ordem: ${s.order})`);
                console.log('Conteúdo (Início):', s.content.substring(0, 100) + '...');
            });
            console.log('\n✅ SUCESSO: O sistema está gerando interpretações!');
        } else {
            console.log('❌ FALHA: Nenhuma seção foi gerada.');

            console.log('\n🔎 Investigando Padrões no Banco...');
            const patterns = await prisma.interpretationPattern.findMany({
                where: { active: true },
                select: { id: true, name: true, conditions: true }
            });
            console.log(`Padrões Ativos Encontrados: ${patterns.length}`);
            patterns.forEach(p => {
                console.log(` - "${p.name}": ${JSON.stringify(p.conditions)}`);
            });
        }

    } catch (error) {
        console.error('❌ ERRO CRÍTICO:', error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
