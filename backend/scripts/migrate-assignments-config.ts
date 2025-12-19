/**
 * Script de Migração: Vincular Assignments Existentes às Configurações Ativas
 * 
 * Este script:
 * 1. Adiciona a coluna configId (se não existir)
 * 2. Vincula todos os assignments existentes à configuração ativa do tenant
 * 3. Verifica e reporta o resultado
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando migração de assignments...\n');

    try {
        // STEP 1: Adicionar coluna configId (se não existir)
        console.log('📋 STEP 1: Verificando estrutura da tabela...');

        try {
            await prisma.$executeRaw`
                ALTER TABLE assessment_assignments 
                ADD COLUMN IF NOT EXISTS configId VARCHAR(191) NULL
            `;
            console.log('✅ Coluna configId verificada/adicionada\n');
        } catch (error: any) {
            if (error.message.includes('Duplicate column')) {
                console.log('✅ Coluna configId já existe\n');
            } else {
                throw error;
            }
        }

        // STEP 2: Adicionar foreign key (se não existir)
        console.log('📋 STEP 2: Verificando foreign key...');

        try {
            await prisma.$executeRaw`
                ALTER TABLE assessment_assignments 
                ADD CONSTRAINT assessment_assignments_configId_fkey 
                FOREIGN KEY (configId) REFERENCES bigfive_configs(id) 
                ON DELETE SET NULL ON UPDATE CASCADE
            `;
            console.log('✅ Foreign key adicionada\n');
        } catch (error: any) {
            if (error.message.includes('Duplicate key')) {
                console.log('✅ Foreign key já existe\n');
            } else {
                console.log('⚠️  Foreign key pode já existir, continuando...\n');
            }
        }

        // STEP 3: Contar assignments sem configId
        console.log('📊 STEP 3: Analisando assignments...');

        const totalAssignments = await prisma.assessmentAssignment.count();
        const assignmentsWithoutConfig = await prisma.assessmentAssignment.count({
            where: {
                configId: null
            }
        });

        console.log(`   Total de assignments: ${totalAssignments}`);
        console.log(`   Sem configId: ${assignmentsWithoutConfig}`);
        console.log(`   Com configId: ${totalAssignments - assignmentsWithoutConfig}\n`);

        if (assignmentsWithoutConfig === 0) {
            console.log('✅ Todos os assignments já possuem configId vinculado!');
            return;
        }

        // STEP 4: Vincular assignments às configs ativas
        console.log('🔄 STEP 4: Vinculando assignments às configurações ativas...');

        // Buscar todos os assignments sem config
        const assignmentsToUpdate = await prisma.assessmentAssignment.findMany({
            where: {
                configId: null
            },
            include: {
                user: {
                    select: {
                        tenantId: true
                    }
                }
            }
        });

        let updatedCount = 0;
        let errors = 0;

        for (const assignment of assignmentsToUpdate) {
            try {
                // Buscar config ativa do tenant
                const activeConfig = await prisma.bigFiveConfig.findFirst({
                    where: {
                        tenantId: assignment.user.tenantId,
                        isActive: true
                    }
                });

                if (activeConfig) {
                    await prisma.assessmentAssignment.update({
                        where: { id: assignment.id },
                        data: { configId: activeConfig.id }
                    });
                    updatedCount++;
                } else {
                    console.log(`   ⚠️  Tenant ${assignment.user.tenantId} não possui configuração ativa`);
                    errors++;
                }
            } catch (error) {
                console.error(`   ❌ Erro ao atualizar assignment ${assignment.id}:`, error);
                errors++;
            }
        }

        console.log(`\n✅ Migração concluída!`);
        console.log(`   Assignments atualizados: ${updatedCount}`);
        console.log(`   Erros: ${errors}\n`);

        // STEP 5: Verificação final
        console.log('📊 STEP 5: Verificação final...');

        const finalCount = await prisma.assessmentAssignment.count({
            where: {
                configId: null
            }
        });

        console.log(`   Assignments ainda sem configId: ${finalCount}`);

        if (finalCount === 0) {
            console.log('\n🎉 SUCESSO! Todos os assignments possuem configId vinculado!\n');
        } else {
            console.log('\n⚠️  Alguns assignments ainda não possuem configId.');
            console.log('   Possível causa: Tenants sem configuração ativa.\n');
        }

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Erro fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
