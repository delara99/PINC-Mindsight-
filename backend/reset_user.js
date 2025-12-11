
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.user.update({
        where: { email: 'henrique.lara@icloud.com' },
        data: { status: 'pending' },
    });
    console.log('User henrique.lara@icloud.com reset to pending');
}

main()
    .catch((e) => {
        // console.error(e);
        console.log('User not found or error, skipping reset');
        process.exit(0);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
