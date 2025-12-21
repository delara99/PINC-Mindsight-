
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function audit() {
    console.log('--- INICIANDO AUDITORIA GLOBAL DE INTEGRIDADE ---');

    // Busca todos os assignments marcados como COMPLETOS
    const completedAssignments = await prisma.assessmentAssignment.findMany({
        where: {
            status: 'COMPLETED',
            assessment: {
                type: 'BIG_FIVE'
            }
        },
        include: {
            result: true,
            responses: true,
            user: {
                select: { email: true, name: true }
            }
        }
    });

    console.log(`Total de testes Big Five COMPLETOS encontrados: ${completedAssignments.length}`);

    let problemCount = 0;
    const problems: any[] = [];

    for (const a of completedAssignments) {
        // Se não tem resultado associado...
        if (!a.result) {
            problemCount++;
            problems.push({
                id: a.id,
                email: a.user.email,
                name: a.user.name,
                hasResponses: a.responses.length > 0
            });
        }
    }

    if (problemCount === 0) {
        console.log('\n✅ AUDITORIA APROVADA: Todos os testes completos possuem resultados válidos!');
        console.log('O sistema está 100% íntegro.');
    } else {
        console.error(`\n⚠️ ALERTA: Encontrados ${problemCount} testes COMPLETOS sem resultados salvos!`);
        console.log('Lista de usuários afetados:');
        problems.forEach(p => {
            console.log(` - [${p.email}] (${p.name}) | ID: ${p.id} | Tem Respostas? ${p.hasResponses ? 'SIM' : 'NÃO'}`);
        });

        console.log('\nSUGESTÃO: Rode um script de reparo para recalcular as notas desses usuários baseados nas respostas.');
    }
}

audit()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
