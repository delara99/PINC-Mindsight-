import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAllPasswords() {
    try {
        // Gerar hash da senha "123"
        const newPassword = '123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log('🔐 Alterando todas as senhas para: 123');
        console.log('📝 Hash gerado:', hashedPassword);
        console.log('');

        // Atualizar todos os usuários
        const result = await prisma.user.updateMany({
            data: {
                password: hashedPassword
            }
        });

        console.log(`✅ ${result.count} senhas atualizadas com sucesso!`);
        console.log('');
        console.log('📋 Agora todos os usuários podem logar com senha: 123');
        console.log('   - admin@sistema.com : 123');
        console.log('   - cliente@empresa.com : 123');
        console.log('   - wagner@empresa.com : 123');
        console.log('   - E todos os outros usuários...');

    } catch (error) {
        console.error('❌ Erro ao atualizar senhas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAllPasswords();
