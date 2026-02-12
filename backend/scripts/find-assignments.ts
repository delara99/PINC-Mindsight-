import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAssignments() {
    console.log('Buscando assignments completados...\n');

    const assignments = await prisma.assessmentAssignment.findMany({
        where: {
            status: 'COMPLETED'
        },
        include: {
            user: {
                select: { name: true, email: true }
            },
            result: {
                select: { id: true }
            }
        },
        orderBy: {
            completedAt: 'desc'
        },
        take: 10
    });

    console.log(`Total de assignments completados: ${assignments.length}\n`);

    assignments.forEach((a, idx) => {
        console.log(`${idx + 1}. ID: ${a.id}`);
        console.log(`   User: ${a.user.name} (${a.user.email})`);
        console.log(`   Completed: ${a.completedAt}`);
        console.log(`   Has Result: ${a.result ? 'SIM' : 'NÃO'}`);
        console.log('');
    });

    await prisma.$disconnect();
}

findAssignments().catch(console.error);
