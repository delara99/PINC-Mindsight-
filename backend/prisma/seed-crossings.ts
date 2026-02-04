
import { PrismaClient } from '@prisma/client';
import { crossingsData } from './seeds/crossings-data';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Adding TalkingTo Crossings...');

    for (const crossing of crossingsData) {
        const exists = await prisma.talkingToCrossing.findFirst({
            where: {
                subtraitA: crossing.subtraitA,
                subtraitB: crossing.subtraitB
            }
        });

        if (exists) {
            console.log(`⚠️ Crossing ${crossing.subtraitA} vs ${crossing.subtraitB} already exists. Updating...`);
            await prisma.talkingToCrossing.update({
                where: { id: exists.id },
                data: {
                    text: crossing.text,
                    textInverse: crossing.textInverse,
                    dichotomy: crossing.dichotomy,
                    dimension: crossing.dimension
                }
            });
        } else {
            await prisma.talkingToCrossing.create({
                data: {
                    dimension: crossing.dimension,
                    dichotomy: crossing.dichotomy,
                    subtraitA: crossing.subtraitA,
                    subtraitB: crossing.subtraitB,
                    text: crossing.text,
                    textInverse: crossing.textInverse
                }
            });
            console.log(`✅ Created ${crossing.subtraitA} vs ${crossing.subtraitB}`);
        }
    }

    console.log('🚀 Crossings seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
