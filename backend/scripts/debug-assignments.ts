
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'delara99@gmail.com'; // User 1

    console.log(`Searching for user: ${email}`);
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            assignments: {
                include: {
                    assessment: true,
                    result: true
                }
            },
            connectionsSent: {
                include: { userB: true }
            },
            connectionsReceived: {
                include: { userA: true }
            }
        }
    });

    const u = user as any;

    if (!u) {
        console.log('User not found');
        return;
    }

    console.log(`User found: ${u.name} (${u.id})`);
    console.log('Assignments:');
    if (u.assignments) {
        u.assignments.forEach((a: any) => {
            console.log(`- ID: ${a.id}`);
            console.log(`  Assessment: ${a.assessment.title} (Type: ${a.assessment.type})`);
            console.log(`  Status: '${a.status}'`);
            console.log(`  CompletedAt: ${a.completedAt}`);
            console.log(`  Has Result: ${!!a.result}`);
        });
    }

    console.log('Connections:');
    const connections = [...(u.connectionsSent || []), ...(u.connectionsReceived || [])];
    for (const conn of connections) {
        const partner = conn.userAId === u.id ? conn.userB : conn.userA;
        console.log(`- Connection with: ${partner.name} (${partner.email})`);
        console.log(`  Connection ID: ${conn.id}`);

        // Check partner assignments
        const partnerUser = await prisma.user.findUnique({
            where: { id: partner.id },
            include: {
                assignments: {
                    include: { assessment: true, result: true }
                }
            }
        }) as any;

        if (partnerUser) {
            console.log(`  Partner Assignments:`);
            partnerUser.assignments.forEach((a: any) => {
                console.log(`    - Assessment: ${a.assessment.title} (Type: ${a.assessment.type})`);
                console.log(`      Status: '${a.status}'`);
                console.log(`      CompletedAt: ${a.completedAt}`);
                console.log(`      Has Result: ${!!a.result}`);
            });
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
