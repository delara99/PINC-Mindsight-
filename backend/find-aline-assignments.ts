import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAlineAssignments() {
    const aline = await prisma.user.findFirst({
        where: { email: 'aline@empresa.com' }
    });

    if (!aline) {
        console.log('❌ Aline não encontrada');
        await prisma.$disconnect();
        return;
    }

    const assignments = await prisma.assessmentAssignment.findMany({
        where: { userId: aline.id },
        include: {
            assessment: { select: { title: true } },
            result: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log('📋 Últimos assignments de Aline:\n');
    assignments.forEach(a => {
        console.log('ID:', a.id);
        console.log('Status:', a.status);
        console.log('Avaliação:', a.assessment.title);
        console.log('Resultado?', !!a.result);
        console.log('---');
    });

    await prisma.$disconnect();
}

findAlineAssignments();
