
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function recalc() {
    const assignmentId = 'b23001a0-9d1d-4b0c-94c5-9e194f78b51a'; // ID DO TESTE8 COMPLETED

    console.log(`Recalculando scores para: ${assignmentId}`);

    // Cria scores simulados (Médios para todos os traços)
    const scores = {
        'OPENNESS': 65,         // Alto
        'CONSCIENTIOUSNESS': 75, // Muito Alto
        'EXTRAVERSION': 45,     // Médio
        'AGREEABLENESS': 55,    // Médio
        'NEUROTICISM': 30       // Baixo
    };

    console.log('Scores gerados:', scores);

    // Upsert (Cria ou Atualiza)
    // Precisamos saber se já existe result
    const existingResult = await prisma.assessmentResult.findUnique({
        where: { assignmentId }
    });

    if (existingResult) {
        console.log('Atualizando resultado existente...');
        await prisma.assessmentResult.update({
            where: { assignmentId },
            data: { scores }
        });
    } else {
        console.log('Criando novo resultado...');
        await prisma.assessmentResult.create({
            data: {
                assignmentId,
                scores
            }
        });
    }

    console.log('✅ RESULTADO SALVO COM SUCESSO! AGORA TESTE O RELACIONAL!');
}

recalc()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
