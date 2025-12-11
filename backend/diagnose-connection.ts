import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    console.log('🔍 Diagnóstico completo:\n');

    // 1. Buscar assignment
    const assignment = await prisma.assessmentAssignment.findUnique({
        where: { id: 'f85796dc-3899-4e4c-a1c3-22d3c295cff7' },
        include: { user: { select: { id: true, name: true, email: true } } }
    });

    if (!assignment) {
        console.log('❌ Assignment não encontrado!');
        return;
    }

    console.log('📋 Assignment:');
    console.log('  ID:', assignment.id);
    console.log('  Dono:', assignment.user.name, '(' + assignment.userId + ')');
    console.log('');

    // 2. Buscar usuário Wagner
    const wagner = await prisma.user.findFirst({
        where: { email: 'wagner@empresa.com' }
    });

    if (!wagner) {
        console.log('❌ Wagner não encontrado!');
        return;
    }

    console.log('👤 Wagner:', wagner.id);
    console.log('');

    // 3. Buscar conexão
    const conn = await prisma.connection.findFirst({
        where: {
            OR: [
                { userAId: assignment.userId, userBId: wagner.id, status: 'ACTIVE' },
                { userAId: wagner.id, userBId: assignment.userId, status: 'ACTIVE' }
            ]
        },
        include: {
            userA: { select: { name: true } },
            userB: { select: { name: true } },
            sharingSettings: true
        }
    });

    if (!conn) {
        console.log('❌ Conexão ATIVA não encontrada!');

        // Buscar todas conexões
        const allConns = await prisma.connection.findMany({
            where: {
                OR: [
                    { userAId: assignment.userId, userBId: wagner.id },
                    { userAId: wagner.id, userBId: assignment.userId }
                ]
            }
        });

        console.log('Conexões existentes:', allConns.length);
        allConns.forEach(c => console.log('  - Status:', c.status));

        await prisma.$disconnect();
        return;
    }

    console.log('✅ Conexão encontrada!');
    console.log('  UserA:', conn.userA.name);
    console.log('  UserB:', conn.userB.name);
    console.log('  Status:', conn.status);
    console.log('');

    console.log('📊 Sharing Settings:');
    conn.sharingSettings.forEach(s => {
        console.log('  User:', s.userId);
        console.log('  shareResults:', s.shareResults);
        console.log('  shareResponses:', s.shareResponses);
        console.log('');
    });

    const ownerSettings = conn.sharingSettings.find(s => s.userId === assignment.userId);
    console.log('🎯 Dono do assignment compartilha?', ownerSettings?.shareResults);

    await prisma.$disconnect();
}

diagnose();
