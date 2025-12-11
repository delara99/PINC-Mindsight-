import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAssignment() {
    const assignmentId = 'd57362a8-b538-4ff9-9c3a-7bdc48ccdef7';

    const assignment = await prisma.assessmentAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            user: { select: { name: true, email: true } },
            assessment: { select: { title: true } },
            result: true,
            responses: true
        }
    });

    if (!assignment) {
        console.log('❌ Assignment NÃO existe!');
        await prisma.$disconnect();
        return;
    }

    console.log('✅ Assignment encontrado!');
    console.log('   Usuário:', assignment.user.name);
    console.log('   Status:', assignment.status);
    console.log('   Respostas:', assignment.responses.length);
    console.log('   Tem resultado?', !!assignment.result);

    if (assignment.result) {
        console.log('   Resultado ID:', assignment.result.id);
        console.log('   Scores:', JSON.stringify(assignment.result.scores, null, 2));
    }

    await prisma.$disconnect();
}

checkAssignment();
