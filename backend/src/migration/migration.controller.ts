import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/migration')
@UseGuards(AuthGuard('jwt'))
export class MigrationController {
    constructor(private prisma: PrismaService) { }

    /**
     * Endpoint para executar migração de configs
     * Apenas SUPER_ADMIN pode executar
     */
    @Post('link-assignments-to-configs')
    async linkAssignmentsToConfigs(@Request() req) {
        // Verificar permissão
        if (req.user.role !== 'SUPER_ADMIN') {
            return {
                success: false,
                message: 'Apenas SUPER_ADMIN pode executar migrações'
            };
        }

        const log: string[] = [];

        try {
            log.push('🚀 Iniciando migração de assignments...\n');

            // STEP 1: Adicionar coluna (se não existir)
            log.push('📋 STEP 1: Verificando estrutura da tabela...');

            try {
                // Verificar se a coluna existe
                const result = await this.prisma.$queryRaw<any[]>`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'assessment_assignments' 
                    AND COLUMN_NAME = 'configId'
                `;

                if (result.length === 0) {
                    // Coluna não existe, criar
                    await this.prisma.$executeRaw`
                        ALTER TABLE assessment_assignments 
                        ADD COLUMN configId VARCHAR(191) NULL
                    `;
                    log.push('✅ Coluna configId adicionada\n');
                } else {
                    log.push('✅ Coluna configId já existe\n');
                }
            } catch (error: any) {
                log.push(`⚠️  Erro ao verificar/criar coluna: ${error.message}\n`);
            }

            // STEP 2: Contar assignments sem configId
            log.push('📊 STEP 2: Analisando assignments...');

            const totalAssignments = await this.prisma.assessmentAssignment.count();
            const assignmentsWithoutConfig = await this.prisma.assessmentAssignment.count({
                where: {
                    configId: null
                }
            });

            log.push(`   Total de assignments: ${totalAssignments}`);
            log.push(`   Sem configId: ${assignmentsWithoutConfig}`);
            log.push(`   Com configId: ${totalAssignments - assignmentsWithoutConfig}\n`);

            if (assignmentsWithoutConfig === 0) {
                log.push('✅ Todos os assignments já possuem configId vinculado!');
                return {
                    success: true,
                    message: 'Migração não necessária - todos os assignments já possuem configId',
                    log: log
                };
            }

            // STEP 3: Vincular assignments às configs ativas
            log.push('🔄 STEP 3: Vinculando assignments às configurações ativas...\n');

            // Buscar todos os assignments sem config
            const assignmentsToUpdate = await this.prisma.assessmentAssignment.findMany({
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
            const errorDetails: string[] = [];

            for (const assignment of assignmentsToUpdate) {
                try {
                    // Buscar config ativa do tenant
                    const activeConfig = await this.prisma.bigFiveConfig.findFirst({
                        where: {
                            tenantId: assignment.user.tenantId,
                            isActive: true
                        }
                    });

                    if (activeConfig) {
                        await this.prisma.assessmentAssignment.update({
                            where: { id: assignment.id },
                            data: { configId: activeConfig.id }
                        });
                        updatedCount++;
                    } else {
                        const msg = `Tenant ${assignment.user.tenantId} não possui configuração ativa`;
                        log.push(`   ⚠️  ${msg}`);
                        errorDetails.push(msg);
                        errors++;
                    }
                } catch (error: any) {
                    const msg = `Erro ao atualizar assignment ${assignment.id}: ${error.message}`;
                    log.push(`   ❌ ${msg}`);
                    errorDetails.push(msg);
                    errors++;
                }
            }

            log.push(`\n✅ Migração concluída!`);
            log.push(`   Assignments atualizados: ${updatedCount}`);
            log.push(`   Erros: ${errors}\n`);

            // STEP 4: Verificação final
            log.push('📊 STEP 4: Verificação final...');

            const finalCount = await this.prisma.assessmentAssignment.count({
                where: {
                    configId: null
                }
            });

            log.push(`   Assignments ainda sem configId: ${finalCount}`);

            if (finalCount === 0) {
                log.push('\n🎉 SUCESSO! Todos os assignments possuem configId vinculado!\n');
            } else {
                log.push('\n⚠️  Alguns assignments ainda não possuem configId.');
                log.push('   Possível causa: Tenants sem configuração ativa.\n');
            }

            return {
                success: true,
                message: 'Migração executada com sucesso',
                stats: {
                    total: totalAssignments,
                    updated: updatedCount,
                    errors: errors,
                    remaining: finalCount
                },
                errorDetails: errorDetails,
                log: log
            };

        } catch (error: any) {
            log.push(`\n❌ Erro fatal: ${error.message}`);
            return {
                success: false,
                message: 'Erro ao executar migração',
                error: error.message,
                log: log
            };
        }
    }
}
