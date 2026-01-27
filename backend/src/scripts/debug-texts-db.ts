
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway'
        }
    }
});

async function main() {
    console.log("--- DEBUGGING INTERPRETATIVE TEXTS ---");

    // 1. Check distinct keys/categories to understand structure
    console.log("\n1. SAMPLE TEXTS (Top 10):");
    const samples = await prisma.bigFiveInterpretativeText.findMany({
        take: 10,
        select: { id: true, traitKey: true, scoreRange: true, category: true, text: true }
    });

    samples.forEach(s => {
        console.log(`[${s.traitKey}] [${s.scoreRange}] [${s.category}]: ${s.text.substring(0, 50)}...`);
    });

    // 2. Check Specific Trait (EXTRAVERSION) to see available ranges and categories
    console.log("\n2. EXTRAVERSION ANALYSIS:");
    const extraversionTexts = await prisma.bigFiveInterpretativeText.findMany({
        where: { traitKey: { contains: 'EXTRA' } } // Loose search
    });

    console.log(`Found ${extraversionTexts.length} texts matching 'EXTRA'.`);
    const uniqueCategories = [...new Set(extraversionTexts.map(t => t.category))];
    const uniqueRanges = [...new Set(extraversionTexts.map(t => t.scoreRange))];
    const uniqueKeys = [...new Set(extraversionTexts.map(t => t.traitKey))];

    console.log("Unique Categories:", uniqueCategories);
    console.log("Unique Ranges:", uniqueRanges);
    console.log("Unique Keys:", uniqueKeys);

    // 3. Check for specific 'Diplomata Social' text mentioned by user previously
    console.log("\n3. SEARCH FOR RICH TEXT ('Diplomata'):");
    const rich = await prisma.bigFiveInterpretativeText.findFirst({
        where: { text: { contains: 'Diplomata' } }
    });
    if (rich) {
        console.log("FOUND 'Diplomata' text!");
        console.log("  TraitKey:", rich.traitKey);
        console.log("  Range:", rich.scoreRange);
        console.log("  Category:", rich.category);
    } else {
        console.log("NOT FOUND 'Diplomata' text in database.");
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
