import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const TENANT_ID = '020bae32-797c-4b37-b427-c1f82fc2b6d9';

    console.log('Criando config para tenant:', TENANT_ID);

    // Desativar antigas
    await prisma.bigFiveConfig.updateMany({
        where: { tenantId: TENANT_ID },
        data: { isActive: false }
    });

    // Criar nova
    const config = await prisma.bigFiveConfig.create({
        data: { tenant: { connect: { id: TENANT_ID } }, isActive: true }
    });

    console.log('✅ Config criada:', config.id);
}

main().finally(() => prisma.$disconnect());
