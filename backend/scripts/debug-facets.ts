
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'delara99@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            assignments: {
                where: { status: 'COMPLETED' },
                include: { result: true },
                take: 1
            }
        }
    });

    if (user && user.assignments.length > 0) {
        const result = user.assignments[0].result;
        console.log('User Result ID:', result?.id);
        if (result && result.scores) {
            console.log('Scores keys:', Object.keys(result.scores));
            const scores = result.scores as any;
            console.log('Facets:', JSON.stringify(scores.facets, null, 2));
        } else {
            console.log('No scores found');
        }
    } else {
        console.log('No completed assignment found for user');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
