import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestScenarios() {
    console.log('🎯 Criando cenários de teste para Big Five...\n');

    try {
        // 1. Buscar a avaliação Big Five
        const bigFiveAssessment = await prisma.assessmentModel.findFirst({
            where: { type: 'BIG_FIVE' },
            include: { questions: true }
        });

        if (!bigFiveAssessment) {
            throw new Error('❌ Avaliação Big Five não encontrada! Execute seed-big-five.ts primeiro.');
        }

        console.log(`✅ Avaliação encontrada: ${bigFiveAssessment.title}`);
        console.log(`📊 Total de perguntas: ${bigFiveAssessment.questions.length}\n`);

        // 2. Buscar ou criar usuários de teste
        const testUsers = [
            { email: 'cliente@empresa.com', name: 'Cliente Teste' },
            { email: 'roberto@teste.com', name: 'roberto' },
            { email: 'gilda@teste.com', name: 'Gilda' }
        ];

        const users = [];
        for (const userData of testUsers) {
            const user = await prisma.user.findUnique({
                where: { email: userData.email }
            });

            if (user) {
                users.push(user);
                console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);
            } else {
                console.log(`⚠️  Usuário ${userData.email} não encontrado`);
            }
        }

        if (users.length === 0) {
            throw new Error('❌ Nenhum usuário de teste encontrado!');
        }

        console.log(`\n📝 Criando ${users.length} cenários de teste...\n`);

        // 3. Criar assignments e respostas para cada usuário
        const profiles = [
            {
                name: 'Perfil Criativo (Alto em Abertura)',
                responses: generateCreativeProfile(bigFiveAssessment.questions)
            },
            {
                name: 'Perfil Organizado (Alto em Conscienciosidade)',
                responses: generateOrganizedProfile(bigFiveAssessment.questions)
            },
            {
                name: 'Perfil Extrovertido (Alto em Extroversão)',
                responses: generateExtrovertProfile(bigFiveAssessment.questions)
            }
        ];

        for (let i = 0; i < users.length && i < profiles.length; i++) {
            const user = users[i];
            const profile = profiles[i];

            console.log(`\n👤 Criando cenário para: ${user.name}`);
            console.log(`   Perfil: ${profile.name}`);

            // Verificar se já existe assignment
            let assignment = await prisma.assessmentAssignment.findFirst({
                where: {
                    userId: user.id,
                    assessmentId: bigFiveAssessment.id
                }
            });

            if (assignment) {
                console.log(`   ⚠️  Assignment já existe. Removendo para recriar...`);
                await prisma.assessmentAssignment.delete({
                    where: { id: assignment.id }
                });
            }

            // Criar novo assignment
            assignment = await prisma.assessmentAssignment.create({
                data: {
                    userId: user.id,
                    assessmentId: bigFiveAssessment.id,
                    status: 'COMPLETED',
                    assignedAt: new Date(),
                    completedAt: new Date()
                }
            });

            console.log(`   ✅ Assignment criado: ${assignment.id}`);

            // Criar respostas
            for (const response of profile.responses) {
                await prisma.assessmentResponse.create({
                    data: {
                        assignmentId: assignment.id,
                        questionId: response.questionId,
                        answer: response.value  // Campo correto é 'answer'
                    }
                });
            }

            console.log(`   ✅ ${profile.responses.length} respostas criadas`);
            console.log(`   📊 Acesse: /dashboard/assessments/results/${assignment.id}`);
        }

        console.log(`\n\n🎉 Cenários de teste criados com sucesso!`);
        console.log(`\n📋 Resumo:`);
        console.log(`   - ${users.length} usuários com avaliações`);
        console.log(`   - ${bigFiveAssessment.questions.length} perguntas por avaliação`);
        console.log(`   - 3 perfis diferentes simulados`);
        console.log(`\n🚀 Para testar:`);
        console.log(`   1. Faça login com um dos usuários:`);
        users.forEach(u => console.log(`      - ${u.email}`));
        console.log(`   2. Acesse: /dashboard/my-assessments`);
        console.log(`   3. Veja seus resultados Big Five!`);

    } catch (error) {
        console.error('\n❌ Erro ao criar cenários:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Gera perfil CRIATIVO (alto em abertura, médio-baixo em outros)
function generateCreativeProfile(questions: any[]) {
    return questions.map(q => {
        const trait = q.traitKey?.split('::')[0];
        const isInverted = q.text.includes('(INV)');

        let baseValue = 3; // Padrão médio

        if (trait === 'Abertura à Experiência') {
            baseValue = isInverted ? 1 : 5; // Muito alto
        } else if (trait === 'Conscienciosidade') {
            baseValue = isInverted ? 4 : 2; // Baixo
        } else if (trait === 'Extroversão') {
            baseValue = isInverted ? 3 : 3; // Médio
        } else if (trait === 'Amabilidade') {
            baseValue = isInverted ? 2 : 4; // Alto
        } else if (trait === 'Estabilidade Emocional') {
            baseValue = isInverted ? 3 : 3; // Médio
        }

        // Adicionar variação aleatória (-1 a +1)
        const variation = Math.floor(Math.random() * 3) - 1;
        const value = Math.max(1, Math.min(5, baseValue + variation));

        return {
            questionId: q.id,
            value
        };
    });
}

// Gera perfil ORGANIZADO (alto em conscienciosidade)
function generateOrganizedProfile(questions: any[]) {
    return questions.map(q => {
        const trait = q.traitKey?.split('::')[0];
        const isInverted = q.text.includes('(INV)');

        let baseValue = 3;

        if (trait === 'Abertura à Experiência') {
            baseValue = isInverted ? 3 : 3; // Médio
        } else if (trait === 'Conscienciosidade') {
            baseValue = isInverted ? 1 : 5; // Muito alto
        } else if (trait === 'Extroversão') {
            baseValue = isInverted ? 4 : 2; // Baixo
        } else if (trait === 'Amabilidade') {
            baseValue = isInverted ? 2 : 4; // Alto
        } else if (trait === 'Estabilidade Emocional') {
            baseValue = isInverted ? 2 : 4; // Alto
        }

        const variation = Math.floor(Math.random() * 3) - 1;
        const value = Math.max(1, Math.min(5, baseValue + variation));

        return {
            questionId: q.id,
            value
        };
    });
}

// Gera perfil EXTROVERTIDO (alto em extroversão e amabilidade)
function generateExtrovertProfile(questions: any[]) {
    return questions.map(q => {
        const trait = q.traitKey?.split('::')[0];
        const isInverted = q.text.includes('(INV)');

        let baseValue = 3;

        if (trait === 'Abertura à Experiência') {
            baseValue = isInverted ? 2 : 4; // Alto
        } else if (trait === 'Conscienciosidade') {
            baseValue = isInverted ? 3 : 3; // Médio
        } else if (trait === 'Extroversão') {
            baseValue = isInverted ? 1 : 5; // Muito alto
        } else if (trait === 'Amabilidade') {
            baseValue = isInverted ? 1 : 5; // Muito alto
        } else if (trait === 'Estabilidade Emocional') {
            baseValue = isInverted ? 2 : 4; // Alto
        }

        const variation = Math.floor(Math.random() * 3) - 1;
        const value = Math.max(1, Math.min(5, baseValue + variation));

        return {
            questionId: q.id,
            value
        };
    });
}

// Executar
createTestScenarios()
    .then(() => {
        console.log('\n✅ Processo finalizado!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });
