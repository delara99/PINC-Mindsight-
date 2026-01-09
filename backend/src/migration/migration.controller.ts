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

    /**
     * Endpoint para criar configurações padrão para tenants sem config ativa
     * SUPER_ADMIN only
     */
    @Post('create-default-configs')
    async createDefaultConfigs(@Request() req) {
        if (req.user.role !== 'SUPER_ADMIN') {
            return {
                success: false,
                message: 'Apenas SUPER_ADMIN pode executar migrações'
            };
        }

        const log: string[] = [];

        try {
            log.push('🚀 Iniciando criação de configurações padrão...\n');

            // STEP 1: Buscar tenants sem config ativa
            log.push('📋 STEP 1: Buscando tenants sem configuração ativa...');

            const allTenants = await this.prisma.tenant.findMany({
                include: {
                    bigFiveConfigs: {
                        where: { isActive: true }
                    }
                }
            });

            const tenantsWithoutConfig = allTenants.filter(t => t.bigFiveConfigs.length === 0);

            log.push(`   Total de tenants: ${allTenants.length}`);
            log.push(`   Tenants sem config ativa: ${tenantsWithoutConfig.length}\n`);

            if (tenantsWithoutConfig.length === 0) {
                log.push('✅ Todos os tenants já possuem configuração ativa!');
                return {
                    success: true,
                    message: 'Todos os tenants já possuem configuração',
                    log: log
                };
            }

            // STEP 2: Criar configurações padrão
            log.push('🔄 STEP 2: Criando configurações padrão...\n');

            let created = 0;
            let errors = 0;

            for (const tenant of tenantsWithoutConfig) {
                try {
                    // Criar configuração Big Five padrão
                    const config = await this.prisma.bigFiveConfig.create({
                        data: {
                            tenantId: tenant.id,
                            name: 'Configuração Padrão PINC',
                            isActive: true,
                            veryLowMax: 20,
                            lowMax: 40,
                            averageMax: 60,
                            highMax: 80,
                            primaryColor: '#4F46E5',
                            companyLogo: null,
                            reportHeader: 'Relatório de Avaliação Comportamental',
                            reportFooter: 'PINC Mindsight - Análise Big Five',
                            traits: {
                                create: [
                                    {
                                        traitKey: 'OPENNESS',
                                        name: 'Abertura a Experiências',
                                        description: 'Imaginação, curiosidade, criatividade',
                                        icon: '🎨',
                                        weight: 1.0,
                                        veryLowText: 'Prefere rotinas e o familiar. Pragmático e tradicional.',
                                        lowText: 'Levemente convencional. Prefere o conhecido ao novo.',
                                        averageText: 'Equilíbrio entre criatividade e praticidade.',
                                        highText: 'Curioso e imaginativo. Aprecia novidades.',
                                        veryHighText: 'Extremamente criativo. Sempre busca novas experiências.',
                                        facets: {
                                            create: [
                                                { facetKey: 'IMAGINATION', name: 'Imaginação', description: 'Capacidade criativa', weight: 1.0 },
                                                { facetKey: 'ARTISTIC_INTERESTS', name: 'Interesses Artísticos', description: 'Apreciação estética', weight: 1.0 },
                                                { facetKey: 'EMOTIONALITY', name: 'Emotividade', description: 'Consciência emocional', weight: 1.0 }
                                            ]
                                        }
                                    },
                                    {
                                        traitKey: 'CONSCIENTIOUSNESS',
                                        name: 'Conscienciosidade',
                                        description: 'Organização, responsabilidade, disciplina',
                                        icon: '📋',
                                        weight: 1.0,
                                        veryLowText: 'Espontâneo e flexível. Pode ser desorganizado.',
                                        lowText: 'Levemente desorganizado. Prefere flexibilidade.',
                                        averageText: 'Equilíbrio entre organização e flexibilidade.',
                                        highText: 'Organizado e responsável. Cumpre compromissos.',
                                        veryHighText: 'Extremamente disciplinado. Planejamento impecável.',
                                        facets: {
                                            create: [
                                                { facetKey: 'SELF_EFFICACY', name: 'Autoeficácia', description: 'Confiança nas próprias capacidades', weight: 1.0 },
                                                { facetKey: 'ORDERLINESS', name: 'Organização', description: 'Preferência por ordem', weight: 1.0 },
                                                { facetKey: 'DUTIFULNESS', name: 'Senso de Dever', description: 'Comprometimento com obrigações', weight: 1.0 }
                                            ]
                                        }
                                    },
                                    {
                                        traitKey: 'EXTRAVERSION',
                                        name: 'Extroversão',
                                        description: 'Sociabilidade, assertividade, energia',
                                        icon: '🎉',
                                        weight: 1.0,
                                        veryLowText: 'Reservado e introspectivo. Precisa de tempo a sós.',
                                        lowText: 'Levemente reservado. Prefere grupos pequenos.',
                                        averageText: 'Equilíbrio entre socialização e introspecção.',
                                        highText: 'Sociável e energético. Gosta de interações.',
                                        veryHighText: 'Extremamente extrovertido. Centro das atenções.',
                                        facets: {
                                            create: [
                                                { facetKey: 'FRIENDLINESS', name: 'Amabilidade', description: 'Facilidade para fazer amigos', weight: 1.0 },
                                                { facetKey: 'GREGARIOUSNESS', name: 'Gregarismo', description: 'Preferência por companhia', weight: 1.0 },
                                                { facetKey: 'ASSERTIVENESS', name: 'Assertividade', description: 'Capacidade de se expressar', weight: 1.0 }
                                            ]
                                        }
                                    },
                                    {
                                        traitKey: 'AGREEABLENESS',
                                        name: 'Amabilidade',
                                        description: 'Empatia, cooperação, confiança',
                                        icon: '🤝',
                                        weight: 1.0,
                                        veryLowText: 'Competitivo e direto. Prioriza objetivos próprios.',
                                        lowText: 'Levemente cético. Protege seus interesses.',
                                        averageText: 'Equilíbrio entre cooperação e assertividade.',
                                        highText: 'Empático e cooperativo. Valoriza harmonia.',
                                        veryHighText: 'Extremamente altruísta. Sempre ajuda os outros.',
                                        facets: {
                                            create: [
                                                { facetKey: 'TRUST', name: 'Confiança', description: 'Tendência a confiar nos outros', weight: 1.0 },
                                                { facetKey: 'MORALITY', name: 'Moralidade', description: 'Honestidade e integridade', weight: 1.0 },
                                                { facetKey: 'ALTRUISM', name: 'Altruísmo', description: 'Preocupação com bem-estar alheio', weight: 1.0 }
                                            ]
                                        }
                                    },
                                    {
                                        traitKey: 'NEUROTICISM',
                                        name: 'Neuroticismo',
                                        description: 'Estabilidade emocional, ansiedade, controle',
                                        icon: '🧠',
                                        weight: 1.0,
                                        veryLowText: 'Extremamente calmo. Raramente se preocupa.',
                                        lowText: 'Geralmente tranquilo. Lida bem com stress.',
                                        averageText: 'Equilíbrio emocional. Ansiedade ocasional.',
                                        highText: 'Sensível emocionalmente. Pode ser ansioso.',
                                        veryHighText: 'Muito sensível. Facilmente estressado.',
                                        facets: {
                                            create: [
                                                { facetKey: 'ANXIETY', name: 'Ansiedade', description: 'Tendência a se preocupar', weight: 1.0 },
                                                { facetKey: 'ANGER', name: 'Raiva', description: 'Facilidade para irritação', weight: 1.0 },
                                                { facetKey: 'SELF_CONSCIOUSNESS', name: 'Autoconsciência', description: 'Sensibilidade a julgamentos', weight: 1.0 }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    });

                    log.push(`✅ Config criada para tenant: ${tenant.id}`);
                    created++;

                } catch (error: any) {
                    log.push(`❌ Erro ao criar config para tenant ${tenant.id}: ${error.message}`);
                    errors++;
                }
            }

            log.push(`\n✅ Processo concluído!`);
            log.push(`   Configs criadas: ${created}`);
            log.push(`   Erros: ${errors}\n`);

            return {
                success: true,
                message: 'Configurações padrão criadas com sucesso',
                stats: {
                    total: tenantsWithoutConfig.length,
                    created: created,
                    errors: errors
                },
                log: log
            };

        } catch (error: any) {
            log.push(`\n❌ Erro fatal: ${error.message}`);
            return {
                success: false,
                message: 'Erro ao criar configurações',
                error: error.message,
                log: log
            };
        }
    }

    /**
     * Endpoint para aplicar migração da Camada Interpretativa Avançada
     * SUPER_ADMIN only
     */
    @Post('apply-interpretation-layer')
    async applyInterpretationLayer(@Request() req) {
        if (req.user.role !== 'SUPER_ADMIN') {
            return {
                success: false,
                message: 'Apenas SUPER_ADMIN pode executar migrações'
            };
        }

        const log: string[] = [];

        try {
            log.push('🚀 Iniciando migração da Camada Interpretativa Avançada...\n');

            // STEP 1: Verificar se as tabelas existem
            log.push('📋 STEP 1: Verificando estrutura do banco...');

            const tables = [
                'interpretation_patterns',
                'psychological_needs',
                'pattern_needs',
                'result_needs',
                'interpretation_sections'
            ];

            for (const table of tables) {
                try {
                    const result = await this.prisma.$queryRaw<any[]>`
                        SELECT TABLE_NAME 
                        FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = ${table}
                    `;

                    if (result.length > 0) {
                        log.push(`✅ Tabela ${table} existe`);
                    } else {
                        log.push(`❌ Tabela ${table} NÃO existe - executando db push necessário`);
                    }
                } catch (error: any) {
                    log.push(`⚠️  Erro ao verificar tabela ${table}: ${error.message}`);
                }
            }

            log.push('\n📊 STEP 2: Criando dados iniciais...\n');

            // STEP 2: Criar padrões interpretativos iniciais
            log.push('🎯 Criando Padrões Interpretativos...');

            const patternsData = [
                {
                    code: 'SOCIAL_PROFILE',
                    name: 'Perfil Social',
                    description: 'Alta extroversão combinada com alta amabilidade',
                    conditions: { E: { min: 70 }, A: { min: 70 } },
                    priority: 100
                },
                {
                    code: 'STRUCTURED_PROFILE',
                    name: 'Perfil Estruturado',
                    description: 'Alta conscienciosidade com baixa abertura',
                    conditions: { C: { min: 80 }, O: { max: 40 } },
                    priority: 90
                },
                {
                    code: 'EXPLORER_PROFILE',
                    name: 'Perfil Explorador',
                    description: 'Alta abertura combinada com alta extroversão',
                    conditions: { O: { min: 70 }, E: { min: 70 } },
                    priority: 85
                },
                {
                    code: 'ANALYTICAL_PROFILE',
                    name: 'Perfil Analítico',
                    description: 'Baixa extroversão com alta conscienciosidade',
                    conditions: { E: { max: 40 }, C: { min: 70 } },
                    priority: 80
                }
            ];

            let patternsCreated = 0;
            const createdPatterns: any[] = [];

            for (const pattern of patternsData) {
                try {
                    const exists = await this.prisma.$queryRaw<any[]>`
                        SELECT id FROM interpretation_patterns WHERE code = ${pattern.code}
                    `;

                    if (!exists || exists.length === 0) {
                        await this.prisma.$executeRaw`
                            INSERT INTO interpretation_patterns 
                            (id, code, name, description, conditions, priority, active, created_at, updated_at)
                            VALUES (
                                UUID(),
                                ${pattern.code},
                                ${pattern.name},
                                ${pattern.description},
                                ${JSON.stringify(pattern.conditions)},
                                ${pattern.priority},
                                1,
                                NOW(),
                                NOW()
                            )
                        `;

                        createdPatterns.push(pattern);
                        patternsCreated++;
                        log.push(`✅ Padrão criado: ${pattern.name}`);
                    } else {
                        log.push(`⏭️  Padrão já existe: ${pattern.name}`);
                    }
                } catch (error: any) {
                    log.push(`❌ Erro ao criar padrão ${pattern.name}: ${error.message}`);
                }
            }

            log.push(`\n📦 Padrões criados: ${patternsCreated}\n`);

            // STEP 3: Criar necessidades psicológicas
            log.push('💡 Criando Necessidades Psicológicas...');

            const needsData = [
                {
                    code: 'BELONGING',
                    name: 'Pertencimento',
                    clientTitle: 'Necessidade de Pertencer',
                    clientDescription: 'Você precisa sentir que faz parte de um grupo ou comunidade.',
                    clientImpact: 'Isso afeta sua motivação e bem-estar no trabalho e nas relações.',
                    specialistTitle: 'Necessidade Psicológica: Pertencimento',
                    specialistDescription: 'Necessidade fundamental de conexão social e aceitação grupal.',
                    specialistAnalysis: 'Indivíduos com alta necessidade de pertencimento prosperam em ambientes colaborativos.',
                    favorableEnvironments: JSON.stringify(['Trabalho em equipe', 'Cultura colaborativa', 'Eventos sociais']),
                    unfavorableEnvironments: JSON.stringify(['Trabalho isolado', 'Competição agressiva', 'Falta de feedback']),
                    recommendations: JSON.stringify(['Busque projetos em equipe', 'Participe de grupos de interesse'])
                },
                {
                    code: 'AUTONOMY',
                    name: 'Autonomia',
                    clientTitle: 'Necessidade de Autonomia',
                    clientDescription: 'Você precisa de liberdade para tomar suas próprias decisões.',
                    clientImpact: 'Microgerenciamento pode afetar negativamente sua performance.',
                    specialistTitle: 'Necessidade Psicológica: Autonomia',
                    specialistDescription: 'Necessidade de autodeterminação e controle sobre ações.',
                    specialistAnalysis: 'Requer ambientes com alto grau de liberdade decisória.',
                    favorableEnvironments: JSON.stringify(['Home office', 'Projetos independentes', 'Flexibilidade']),
                    unfavorableEnvironments: JSON.stringify(['Microgerenciamento', 'Regras rígidas', 'Hierarquia vertical']),
                    recommendations: JSON.stringify(['Negocie flexibilidade', 'Busque projetos com autonomia'])
                },
                {
                    code: 'STRUCTURE',
                    name: 'Estrutura',
                    clientTitle: 'Necessidade de Estrutura',
                    clientDescription: 'Você funciona melhor com processos claros e organizados.',
                    clientImpact: 'Ambiguidade e caos podem gerar estresse e perda de produtividade.',
                    specialistTitle: 'Necessidade Psicológica: Estrutura',
                    specialistDescription: 'Necessidade de previsibilidade, ordem e clareza de expectativas.',
                    specialistAnalysis: 'Indivíduos orientados a estrutura prosperam com processos definidos.',
                    favorableEnvironments: JSON.stringify(['Processos claros', 'Metas definidas', 'Rotinas estabelecidas']),
                    unfavorableEnvironments: JSON.stringify(['Ambiguidade', 'Mudanças frequentes', 'Desorganização']),
                    recommendations: JSON.stringify(['Crie checklists', 'Defina processos pessoais'])
                }
            ];

            let needsCreated = 0;

            for (const need of needsData) {
                try {
                    // Escapar aspas para SQL
                    const escapeSql = (str: string) => str.replace(/'/g, "''");

                    await this.prisma.$executeRaw`
                        INSERT INTO psychological_needs 
                        (id, code, name, client_title, client_description, client_impact,
                         specialist_title, specialist_description, specialist_analysis,
                         favorable_environments, unfavorable_environments, recommendations,
                         active, created_at, updated_at)
                        VALUES (
                            UUID(),
                            ${need.code},
                            ${need.name},
                            ${need.clientTitle},
                            ${need.clientDescription},
                            ${need.clientImpact},
                            ${need.specialistTitle},
                            ${need.specialistDescription},
                            ${need.specialistAnalysis},
                            ${need.favorableEnvironments},
                            ${need.unfavorableEnvironments},
                            ${need.recommendations},
                            1,
                            NOW(),
                            NOW()
                        )
                        ON DUPLICATE KEY UPDATE updated_at = NOW()
                    `;

                    needsCreated++;
                    log.push(`✅ Necessidade criada: ${need.name}`);
                } catch (error: any) {
                    log.push(`⚠️  ${need.name}: ${error.message}`);
                }
            }

            log.push(`\n📦 Necessidades criadas: ${needsCreated}\n`);

            log.push('\n✅ Migração da Camada Interpretativa concluída com sucesso!\n');

            return {
                success: true,
                message: 'Camada Interpretativa aplicada com sucesso',
                stats: {
                    patternsCreated,
                    needsCreated
                },
                log: log
            };

        } catch (error: any) {
            log.push(`\n❌ Erro fatal: ${error.message}`);
            return {
                success: false,
                message: 'Erro ao aplicar migração',
                error: error.message,
                log: log
            };
        }
    }
}
