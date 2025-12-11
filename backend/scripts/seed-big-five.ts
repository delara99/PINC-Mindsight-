import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBigFiveInventory() {
    console.log('🌱 Iniciando seed do Inventário Big Five...');

    try {
        // Buscar um tenant existente
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            throw new Error('Nenhum tenant encontrado. Crie um tenant primeiro.');
        }

        console.log(`📍 Usando tenant: ${tenant.name} (${tenant.id})`);

        // Criar avaliação principal
        const assessment = await prisma.assessmentModel.create({
            data: {
                title: 'Inventário de Personalidade Big Five - Profissional',
                description: 'Avaliação científica de personalidade baseada no modelo Big Five, voltada para contexto organizacional e desenvolvimento profissional.',
                type: 'BIG_FIVE',
                tenantId: tenant.id,
            }
        });

        console.log(`✅ Avaliação criada: ${assessment.id}`);

        // Array com todas as 100 perguntas
        const questions = [
            // ========================================
            // TRAÇO 1: ABERTURA À EXPERIÊNCIA (20 perguntas)
            // ========================================

            // Faceta 1.1: Curiosidade Intelectual
            { trait: 'Abertura à Experiência', facet: 'Curiosidade Intelectual', text: 'Gosto de aprender sobre assuntos novos, mesmo que não estejam relacionados ao meu trabalho', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Curiosidade Intelectual', text: 'Prefiro seguir métodos já testados a experimentar novas abordagens', type: 'inverted', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Curiosidade Intelectual', text: 'Sinto-me motivado quando preciso resolver problemas complexos', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Curiosidade Intelectual', text: 'Evito ler sobre temas que não conheço profundamente', type: 'inverted', weight: 1.0 },

            // Faceta 1.2: Criatividade
            { trait: 'Abertura à Experiência', facet: 'Criatividade', text: 'Costumo propor soluções inovadoras para desafios do dia a dia', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Criatividade', text: 'Prefiro seguir procedimentos padrão em vez de criar novos processos', type: 'inverted', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Criatividade', text: 'Gosto de imaginar diferentes cenários antes de tomar decisões', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Criatividade', text: 'Raramente penso em formas alternativas de executar minhas tarefas', type: 'inverted', weight: 1.0 },

            // Faceta 1.3: Abertura Cultural
            { trait: 'Abertura à Experiência', facet: 'Abertura Cultural', text: 'Aprecio trabalhar com pessoas de diferentes origens e culturas', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Abertura Cultural', text: 'Sinto-me desconfortável quando os padrões da equipe mudam', type: 'inverted', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Abertura Cultural', text: 'Valorizo perspectivas diferentes das minhas em discussões profissionais', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Abertura Cultural', text: 'Prefiro ambientes de trabalho homogêneos e previsíveis', type: 'inverted', weight: 1.0 },

            // Faceta 1.4: Sensibilidade Estética
            { trait: 'Abertura à Experiência', facet: 'Sensibilidade Estética', text: 'Valorizo quando o ambiente de trabalho é visualmente agradável', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Sensibilidade Estética', text: 'A aparência dos espaços e materiais não influencia minha produtividade', type: 'inverted', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Sensibilidade Estética', text: 'Presto atenção aos detalhes visuais em apresentações e documentos', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Sensibilidade Estética', text: 'Aspectos estéticos são irrelevantes no contexto profissional para mim', type: 'inverted', weight: 1.0 },

            // Faceta 1.5: Abertura para Mudanças
            { trait: 'Abertura à Experiência', facet: 'Abertura para Mudanças', text: 'Adapto-me facilmente quando surgem novas tecnologias ou sistemas', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Abertura para Mudanças', text: 'Mudanças repentinas na rotina me deixam ansioso e improdutivo', type: 'inverted', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Abertura para Mudanças', text: 'Vejo reestruturações organizacionais como oportunidades de crescimento', type: 'normal', weight: 1.0 },
            { trait: 'Abertura à Experiência', facet: 'Abertura para Mudanças', text: 'Prefiro que as coisas permaneçam como estão, mesmo que possam melhorar', type: 'inverted', weight: 1.0 },

            // ========================================
            // TRAÇO 2: CONSCIENCIOSIDADE (20 perguntas)
            // ========================================

            // Faceta 2.1: Organização
            { trait: 'Conscienciosidade', facet: 'Organização', text: 'Mantenho meu espaço de trabalho e arquivos sempre organizados', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Organização', text: 'Frequentemente preciso procurar documentos porque não sei onde guardei', type: 'inverted', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Organização', text: 'Crio sistemas para gerenciar minhas tarefas e compromissos', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Organização', text: 'Deixo papéis e materiais espalhados até precisar deles novamente', type: 'inverted', weight: 1.0 },

            // Faceta 2.2: Responsabilidade
            { trait: 'Conscienciosidade', facet: 'Responsabilidade', text: 'Cumpro prazos mesmo quando isso exige esforço extra', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Responsabilidade', text: 'Já entreguei trabalhos atrasados sem avisar antecipadamente', type: 'inverted', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Responsabilidade', text: 'Assumo total responsabilidade pelos resultados das minhas tarefas', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Responsabilidade', text: 'Costumo atribuir atrasos a fatores externos fora do meu controle', type: 'inverted', weight: 1.0 },

            // Faceta 2.3: Autodisciplina
            { trait: 'Conscienciosidade', facet: 'Autodisciplina', text: 'Consigo manter o foco mesmo em tarefas monótonas ou repetitivas', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Autodisciplina', text: 'Frequentemente adio tarefas desagradáveis até o último momento', type: 'inverted', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Autodisciplina', text: 'Estabeleço rotinas de trabalho e as sigo consistentemente', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Autodisciplina', text: 'Perco facilmente a concentração quando estou trabalhando sozinho', type: 'inverted', weight: 1.0 },

            // Faceta 2.4: Meticulosidade
            { trait: 'Conscienciosidade', facet: 'Meticulosidade', text: 'Reviso meu trabalho múltiplas vezes antes de considerar finalizado', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Meticulosidade', text: 'Costumo entregar trabalhos sem revisar todos os detalhes', type: 'inverted', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Meticulosidade', text: 'Presto atenção a pequenos erros que outros podem não notar', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Meticulosidade', text: 'Acredito que perfeição excessiva é perda de tempo', type: 'inverted', weight: 1.0 },

            // Faceta 2.5: Orientação para Objetivos
            { trait: 'Conscienciosidade', facet: 'Orientação para Objetivos', text: 'Defino metas claras de curto e longo prazo para minha carreira', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Orientação para Objetivos', text: 'Raramente penso no que quero alcançar profissionalmente', type: 'inverted', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Orientação para Objetivos', text: 'Priorizo tarefas alinhadas aos objetivos estratégicos da empresa', type: 'normal', weight: 1.0 },
            { trait: 'Conscienciosidade', facet: 'Orientação para Objetivos', text: 'Trabalho mais por obrigação do que por propósito ou direção', type: 'inverted', weight: 1.0 },

            // ========================================
            // TRAÇO 3: EXTROVERSÃO (20 perguntas)
            // ========================================

            // Faceta 3.1: Sociabilidade
            { trait: 'Extroversão', facet: 'Sociabilidade', text: 'Sinto-me energizado quando trabalho em equipe', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Sociabilidade', text: 'Prefiro trabalhar sozinho a participar de reuniões em grupo', type: 'inverted', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Sociabilidade', text: 'Faço questão de conhecer novos colegas e mantê-los próximos', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Sociabilidade', text: 'Evito conversas informais no ambiente de trabalho', type: 'inverted', weight: 1.0 },

            // Faceta 3.2: Assertividade
            { trait: 'Extroversão', facet: 'Assertividade', text: 'Defendo minhas ideias com firmeza em reuniões', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Assertividade', text: 'Raramente expresso discordância, mesmo quando penso diferente', type: 'inverted', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Assertividade', text: 'Tomo a iniciativa de liderar projetos quando vejo oportunidade', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Assertividade', text: 'Espero que outros assumam a liderança em situações de decisão', type: 'inverted', weight: 1.0 },

            // Faceta 3.3: Energia e Atividade
            { trait: 'Extroversão', facet: 'Energia e Atividade', text: 'Mantenho um ritmo acelerado de trabalho ao longo do dia', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Energia e Atividade', text: 'Prefiro ambientes calmos onde posso trabalhar em ritmo moderado', type: 'inverted', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Energia e Atividade', text: 'Gosto de estar envolvido em múltiplos projetos simultaneamente', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Energia e Atividade', text: 'Sinto-me sobrecarregado quando há muitas atividades acontecendo', type: 'inverted', weight: 1.0 },

            // Faceta 3.4: Busca por Emoções Positivas
            { trait: 'Extroversão', facet: 'Busca por Emoções Positivas', text: 'Procuro criar um clima leve e positivo no ambiente de trabalho', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Busca por Emoções Positivas', text: 'Mantenho distância emocional dos colegas, focando apenas em resultados', type: 'inverted', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Busca por Emoções Positivas', text: 'Celebro conquistas da equipe, mesmo as pequenas', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Busca por Emoções Positivas', text: 'Evito demonstrar entusiasmo em público, mesmo quando estou feliz', type: 'inverted', weight: 1.0 },

            // Faceta 3.5: Expressividade
            { trait: 'Extroversão', facet: 'Expressividade', text: 'Comunico minhas opiniões de forma clara e direta', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Expressividade', text: 'Fico desconfortável ao expor meus pensamentos em público', type: 'inverted', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Expressividade', text: 'Gosto de apresentações e situações onde posso falar para grupos', type: 'normal', weight: 1.0 },
            { trait: 'Extroversão', facet: 'Expressividade', text: 'Prefiro comunicação escrita a verbal sempre que possível', type: 'inverted', weight: 1.0 },

            // ========================================
            // TRAÇO 4: AMABILIDADE (20 perguntas)
            // ========================================

            // Faceta 4.1: Empatia
            { trait: 'Amabilidade', facet: 'Empatia', text: 'Percebo quando colegas estão enfrentando dificuldades e ofereço ajuda', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Empatia', text: 'Raramente me preocupo com o estado emocional dos outros no trabalho', type: 'inverted', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Empatia', text: 'Consigo me colocar no lugar de outras pessoas antes de criticar', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Empatia', text: 'Foco nos resultados sem considerar o impacto emocional nas pessoas', type: 'inverted', weight: 1.0 },

            // Faceta 4.2: Cooperação
            { trait: 'Amabilidade', facet: 'Cooperação', text: 'Prefiro colaborar a competir com meus colegas de equipe', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Cooperação', text: 'Vejo colegas como concorrentes na busca por reconhecimento', type: 'inverted', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Cooperação', text: 'Compartilho conhecimento e recursos que podem beneficiar o grupo', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Cooperação', text: 'Guardo informações importantes para manter vantagem competitiva', type: 'inverted', weight: 1.0 },

            // Faceta 4.3: Confiança
            { trait: 'Amabilidade', facet: 'Confiança', text: 'Acredito que a maioria das pessoas age com boas intenções', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Confiança', text: 'Desconfio das motivações dos outros até que provem o contrário', type: 'inverted', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Confiança', text: 'Dou o benefício da dúvida quando há mal-entendidos', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Confiança', text: 'Sempre questiono se as pessoas estão sendo sinceras comigo', type: 'inverted', weight: 1.0 },

            // Faceta 4.4: Altruísmo
            { trait: 'Amabilidade', facet: 'Altruísmo', text: 'Ajudo colegas mesmo quando isso atrasa minhas próprias tarefas', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Altruísmo', text: 'Só ajudo outros se houver algum retorno direto para mim', type: 'inverted', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Altruísmo', text: 'Voluntariamente assumo trabalhos extras para facilitar a vida da equipe', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Altruísmo', text: 'Evito me envolver em problemas que não são minha responsabilidade', type: 'inverted', weight: 1.0 },

            // Faceta 4.5: Modéstia
            { trait: 'Amabilidade', facet: 'Modéstia', text: 'Reconheço as contribuições dos outros antes de destacar as minhas', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Modéstia', text: 'Faço questão de deixar claro quando um sucesso foi mérito meu', type: 'inverted', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Modéstia', text: 'Fico desconfortável quando recebo elogios públicos excessivos', type: 'normal', weight: 1.0 },
            { trait: 'Amabilidade', facet: 'Modéstia', text: 'Espero reconhecimento sempre que faço algo além do esperado', type: 'inverted', weight: 1.0 },

            // ========================================
            // TRAÇO 5: ESTABILIDADE EMOCIONAL (20 perguntas)
            // ========================================

            // Faceta 5.1: Controle de Ansiedade
            { trait: 'Estabilidade Emocional', facet: 'Controle de Ansiedade', text: 'Mantenho a calma mesmo sob prazos apertados e pressão intensa', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Controle de Ansiedade', text: 'Fico extremamente ansioso quando surgem imprevistos no trabalho', type: 'inverted', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Controle de Ansiedade', text: 'Consigo relaxar facilmente após um dia estressante', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Controle de Ansiedade', text: 'Levo preocupações do trabalho para casa com frequência', type: 'inverted', weight: 1.0 },

            // Faceta 5.2: Resiliência a Críticas
            { trait: 'Estabilidade Emocional', facet: 'Resiliência a Críticas', text: 'Aceito feedback negativo como oportunidade de melhoria', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Resiliência a Críticas', text: 'Levo críticas profissionais para o lado pessoal', type: 'inverted', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Resiliência a Críticas', text: 'Consigo separar minha autoestima do desempenho em tarefas específicas', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Resiliência a Críticas', text: 'Fico magoado quando meu trabalho não é elogiado como esperava', type: 'inverted', weight: 1.0 },

            // Faceta 5.3: Controle de Humor
            { trait: 'Estabilidade Emocional', facet: 'Controle de Humor', text: 'Mantenho comportamento estável, independente de frustrações pessoais', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Controle de Humor', text: 'Meu humor varia bastante ao longo do dia de trabalho', type: 'inverted', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Controle de Humor', text: 'Consigo me recompor rapidamente após situações desagradáveis', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Controle de Humor', text: 'Quando algo me irrita, fico remoendo o problema por horas', type: 'inverted', weight: 1.0 },

            // Faceta 5.4: Confiança em Si Mesmo
            { trait: 'Estabilidade Emocional', facet: 'Confiança em Si Mesmo', text: 'Confio nas minhas capacidades para resolver desafios complexos', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Confiança em Si Mesmo', text: 'Frequentemente duvido se estou fazendo as escolhas certas', type: 'inverted', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Confiança em Si Mesmo', text: 'Sinto-me seguro ao tomar decisões importantes sem supervisão', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Confiança em Si Mesmo', text: 'Preciso de validação constante antes de me sentir confiante', type: 'inverted', weight: 1.0 },

            // Faceta 5.5: Gestão de Estresse
            { trait: 'Estabilidade Emocional', facet: 'Gestão de Estresse', text: 'Desenvolvi estratégias eficazes para lidar com sobrecarga de trabalho', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Gestão de Estresse', text: 'Quando estou estressado, meu desempenho cai significativamente', type: 'inverted', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Gestão de Estresse', text: 'Consigo priorizar tarefas mesmo em momentos de alta demanda', type: 'normal', weight: 1.0 },
            { trait: 'Estabilidade Emocional', facet: 'Gestão de Estresse', text: 'Sinto-me paralisado quando preciso lidar com múltiplas urgências', type: 'inverted', weight: 1.0 },
        ];

        // Criar perguntas no banco
        let order = 1;
        for (const q of questions) {
            await prisma.question.create({
                data: {
                    assessmentModelId: assessment.id,
                    text: `${q.text} (${q.type === 'inverted' ? 'INV' : 'DIR'})`,
                    traitKey: `${q.trait}::${q.facet}`,
                    weight: q.weight,
                }
            });

            // Log progressivo
            if (order % 20 === 0) {
                console.log(`✅ ${order}/100 perguntas criadas...`);
            }
            order++;
        }

        console.log(`\n🎉 Seed concluído com sucesso!`);
        console.log(`📊 Avaliação ID: ${assessment.id}`);
        console.log(`✅ Total de perguntas: ${questions.length}`);
        console.log(`\n📈 Distribuição:`);
        console.log(`   - Abertura à Experiência: 20 perguntas`);
        console.log(`   - Conscienciosidade: 20 perguntas`);
        console.log(`   - Extroversão: 20 perguntas`);
        console.log(`   - Amabilidade: 20 perguntas`);
        console.log(`   - Estabilidade Emocional: 20 perguntas`);

    } catch (error) {
        console.error('❌ Erro ao criar inventário:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar seed
seedBigFiveInventory()
    .then(() => {
        console.log('\n✅ Processo finalizado!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });
