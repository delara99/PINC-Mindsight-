
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway'
        }
    }
});

async function main() {
    console.log("Deep Integrity Check of Assessment Result JSON...");

    // User Henrique or Delara
    const user = await prisma.user.findFirst({ where: { email: { contains: 'delara' } } });
    if (!user) return console.log("User not found");

    const assignment = await prisma.assessmentAssignment.findFirst({
        where: { userId: user.id, status: 'COMPLETED', assessment: { type: 'BIG_FIVE' } },
        orderBy: { completedAt: 'desc' },
        include: { result: true }
    });

    if (!assignment?.result?.scores) return console.log("No scores found");

    const scores: any = assignment.result.scores;

    console.log("\n--- JSON STRUCTURE (Sample Trait: EXTRAVERSION/E) ---");
    // Check if 'E' or 'EXTRAVERSION' exists and print keys
    const val = scores['E'] || scores['EXTRAVERSION'] || scores['Extraversion'];

    if (val) {
        console.log("Keys found in score object:", Object.keys(val));
        console.log("Interpretation field:", val.interpretation ? "EXISTS" : "MISSING");
        console.log("Text Interpretation field:", val.text_interpretation ? "EXISTS" : "MISSING");
        if (val.customTexts) {
            console.log("CustomTexts found:", val.customTexts);
        } else {
            console.log("CustomTexts: MISSING");
        }

        if (val.interpretation) console.log("Sample Interpretation:", val.interpretation.substring(0, 50) + "...");
    } else {
        console.log("Trait E/EXTRAVERSION not found in root keys:", Object.keys(scores));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
