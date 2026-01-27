
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway'
        }
    }
});

async function main() {
    console.log("--- CHECKING ASSIGNMENTS ---");
    const email = 'delara99@gmail.com'; // Ou usar o ID do usuário se souber

    const user = await prisma.user.findFirst({ where: { email: { contains: 'delara' } } });
    if (!user) return console.log("User not found");

    console.log(`User found: ${user.name} (${user.id})`);

    const assignments = await prisma.assessmentAssignment.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: 'desc' },
        include: { result: true }
    });

    console.log(`Found ${assignments.length} assignments.`);

    assignments.forEach((a, idx) => {
        console.log(`\n[${idx}] Date: ${a.completedAt} | Type: ${a.assessmentId} | Status: ${a.status}`);
        const scores = (a.result as any)?.scores;
        if (scores) {
            // Check Extraversion interpretation
            const e = scores.E || scores.EXTRAVERSION;
            const text = e?.customTexts?.text_interpretation || e?.text_interpretation || e?.interpretation || "N/A";
            console.log(`    Validation Text (E): ${text.substring(0, 100)}...`);

            // Check facets to be sure it's rich
            const facets = scores.facets || [];
            console.log(`    Facets Count: ${facets.length}`);
        } else {
            console.log("    No scores.");
        }
    });

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
