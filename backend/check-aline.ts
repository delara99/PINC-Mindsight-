import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAline() {
    const aline = await prisma.user.findFirst({
        where: { email: 'aline@empresa.com' }
    });

    if (!aline) {
        console.log('❌ ALINE NÃO ENCONTRADA!');
        await prisma.$disconnect();
        return;
    }

    console.log('✅ Aline encontrada:', aline.id);

    const assignments = await prisma.assessmentAssignment.findMany({
        where: { userId: aline.id },
        include: {
            assessment: { select: { title: true } },
            result: true,
            responses: true
        }
    });

    console.log('\n📋 Assignments:', assignments.length);
    assignments.forEach(a => {
        console.log('  - Status:', a.status);
        console.log('    Avaliação:', a.assessment.title);
        console.log('    Respostas:', a.responses.length);
        console.log('    Tem resultado?', !!a.result);
        console.log('');
    });

    await prisma.$disconnect();
}

checkAline();
