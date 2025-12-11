import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Criar Tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'empresa-demo' },
        update: {},
        create: {
            name: 'Empresa Demo',
            slug: 'empresa-demo',
            plan: 'ENTERPRISE',
        },
    });
    console.log('✅ Tenant criado:', tenant.name);

    // Hash da senha
    const hashedPassword = await bcrypt.hash('123', 10);

    // Criar Admin Master
    const admin = await prisma.user.upsert({
        where: { email: 'admin@empresa.com' },
        update: {},
        create: {
            email: 'admin@empresa.com',
            password: hashedPassword,
            name: 'Admin Master',
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
            credits: 0,
        },
    });
    console.log('✅ Admin criado:', admin.email);

    // Criar Cliente
    const cliente = await prisma.user.upsert({
        where: { email: 'cliente@empresa.com' },
        update: {},
        create: {
            email: 'cliente@empresa.com',
            password: hashedPassword,
            name: 'Cliente Teste',
            role: 'MEMBER',
            tenantId: tenant.id,
            credits: 5, // 5 créditos para teste
            userType: 'INDIVIDUAL',
        },
    });
    console.log('✅ Cliente criado:', cliente.email, '- Créditos:', cliente.credits);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📋 Credenciais:');
    console.log('   Admin: admin@empresa.com / 123');
    console.log('   Cliente: cliente@empresa.com / 123');
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
