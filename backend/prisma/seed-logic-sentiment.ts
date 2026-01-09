
import { PrismaClient, AudienceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Seed Lógica vs Sentimento...');

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('❌ Nenhum tenant encontrado.');
        return;
    }
    console.log(`🏢 Tenant: ${tenant.name} (${tenant.id})`);

    // ==========================================
    // 1. CRIAR SEÇÃO NO RELATÓRIO
    // ==========================================
    const sectionTitle = "Dimensão Lógica vs Sentimento";
    const sectionCode = "LOGIC_VS_SENTIMENT";

    await prisma.interpretationSection.deleteMany({
        where: { code: sectionCode }
    });

    // O template lista TODOS os códigos possíveis desta família.
    // Como o Engine retorna VAZIO para padrões não detectados, apenas o correto aparecerá.
    const template = `
<div class="mb-4">
  <!-- Padrão 1: Crítico-Independente-Competitivo -->
  <h3 class="text-xl font-bold text-violet-700 mb-2">{{PATTERN_LOGIC_CIC_NAME}}</h3>
  <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{PATTERN_LOGIC_CIC_DESC}}</div>

  <!-- Adicione aqui os outros 7 códigos conforme forem criados -->
  <!-- {{PATTERN_LOGIC_CIT_NAME}} ... -->
</div>
    `.trim();

    const section = await prisma.interpretationSection.create({
        data: {
            tenantId: tenant.id,
            code: sectionCode,
            title: sectionTitle,
            displayOrder: 2,
            active: true,
            template: template,
            audience: AudienceType.CLIENT
        }
    });
    console.log(`✅ Seção criada: ${section.title}`);

    // ==========================================
    // 2. CRIAR PADRÃO 1 (Exemplo Imagem)
    // ==========================================
    const patternCode = "LOGIC_CIC"; // Crítico-Independente-Competitivo

    // Textão da Imagem
    const description = `Você é "Crítico, Independente e Competitivo". Pessoas com essa combinação tendem a ser extremamente lógicos e objetivos em suas análises. Encontram facilmente falhas e acham natural apontar aquilo que precisa ser melhorado e costumam se mostrar imparciais e até distantes em relação aos sentimentos das pessoas.

Você toma decisões considerando a relação custo x benefício, sendo inclusive atento às suas próprias necessidades e objetivos. Você pesa as opções de forma impessoal, evitando a influência de sentimentos ou a opinião das pessoas, que podem ter maior peso na medida em que se mostrem mais ou menos competentes e capazes de argumentar com lógica. Quando você está diante de erros, costuma ser direto e objetivo e, quando confrontado, quase nunca leva a crítica para o lado pessoal. Buscam prioritariamente a eficiência.

Na atuação em grupo, você valoriza sua autonomia e o respeito à própria individualidade e sabe respeitar as figuras de autoridade. Prefere realizar as tarefas que lhes competem de forma autônoma aplicando suas habilidades. Pode resistir a seguir e se conformar com normas de grupo que não lhe pareçam razoáveis, o que pode levar a desafios de colaboração. Quando negocia, você tem clareza em relação às vantagens pessoais que deseja, assim como sobre os resultados que almeja, o que o torna pronto para competir e defender seus interesses. Espera que o outro haja da mesma forma, pois acredita que cada um deva ser responsável por seus próprios interesses.`;

    await prisma.interpretationPattern.deleteMany({
        where: { code: patternCode }
    });

    const pattern = await prisma.interpretationPattern.create({
        data: {
            tenantId: tenant.id,
            code: patternCode,
            name: "Lógica: Crítico, Independente e Competitivo",
            description: description,
            priority: 10,
            active: true,
            // Lógica Simplificada para MVP:
            // Crítico (<45 Amabilidade) E Independente (<45 Extroversão)
            conditions: [
                {
                    trait: "amabilidade",
                    operator: "lt",
                    value: 45
                },
                {
                    trait: "extroversao",
                    operator: "lt",
                    value: 45
                }
            ]
        }
    });

    console.log(`✅ Padrão criado: ${pattern.name} (${pattern.code})`);
    console.log('🚀 Seed concluído!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
