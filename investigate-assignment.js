const mysql = require('mysql2/promise');

async function investigateAssignment() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const assignmentId = '7f92a9ad-6895-40c3-aa8c-77a07f34de06';

        console.log('=== 🔍 INVESTIGANDO RELATÓRIO ===');
        console.log(`ID: ${assignmentId}\n`);

        // 1. Buscar assignment e tenant do usuário
        console.log('--- 1. Informações do Assignment ---');
        const [assignment] = await connection.execute(`
            SELECT 
                a.id,
                a.userId,
                a.configId,
                a.status,
                a.completedAt,
                u.tenantId
            FROM assessment_assignments a
            INNER JOIN users u ON u.id = a.userId
            WHERE a.id = ?
        `, [assignmentId]);

        if (assignment.length === 0) {
            console.log('❌ Assignment não encontrado!');
            return;
        }

        console.table(assignment);
        const configId = assignment[0].configId;
        const tenantId = assignment[0].tenantId;

        console.log(`\nConfig usada: ${configId || 'NENHUMA'}`);
        console.log(`Tenant: ${tenantId}\n`);

        // 2. Se NÃO tem configId, buscar ativa
        let actualConfigId = configId;
        if (!configId) {
            console.log('⚠️  Assignment SEM configId! Buscando config ativa do tenant...\n');
            const [activeConfig] = await connection.execute(`
                SELECT id, name FROM bigfive_configs
                WHERE tenantId = ? AND isActive = 1
                LIMIT 1
            `, [tenantId]);

            if (activeConfig.length > 0) {
                actualConfigId = activeConfig[0].id;
                console.log(`Config ATIVA encontrada: ${actualConfigId} (${activeConfig[0].name})\n`);
            }
        }

        if (!actualConfigId) {
            console.log('❌ Nenhuma config encontrada!');
            return;
        }

        // 3. Detalhes da config usada
        console.log('--- 2. Config Usada no Relatório ---');
        const [configDetails] = await connection.execute(`
            SELECT 
                id,
                name,
                isActive,
                (SELECT COUNT(*) FROM bigfive_interpretative_texts WHERE configId = bigfive_configs.id) as total_textos
            FROM bigfive_configs
            WHERE id = ?
        `, [actualConfigId]);

        console.table(configDetails);

        // 4. Amostra de textos
        console.log('\n--- 3. Amostra de Textos Nesta Config ---');
        const [texts] = await connection.execute(`
            SELECT 
                traitKey,
                scoreRange,
                category,
                LEFT(text, 70) as preview
            FROM bigfive_interpretative_texts
            WHERE configId = ?
            ORDER BY updatedAt DESC
            LIMIT 5
        `, [actualConfigId]);

        console.table(texts);

        // 5. Configs com edições recentes
        console.log('\n--- 4. Configs com Textos Editados Recentemente ---');
        const [recentEdits] = await connection.execute(`
            SELECT DISTINCT
                c.id,
                c.name,
                c.isActive,
                COUNT(t.id) as textos_editados,
                MAX(t.updatedAt) as ultima_edicao
            FROM bigfive_configs c
            INNER JOIN bigfive_interpretative_texts t ON t.configId = c.id
            WHERE c.tenantId = ? AND t.updatedAt >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
            GROUP BY c.id, c.name, c.isActive
            ORDER BY ultima_edicao DESC
        `, [tenantId]);

        console.table(recentEdits);

        // 6. DIAGNÓSTICO
        console.log('\n=== 🎯 DIAGNÓSTICO FINAL ===\n');

        if (recentEdits.length === 0) {
            console.log('⚠️  Nenhuma edição nas últimas 2 horas!');
            console.log('Os textos mostrados são antigos.\n');
            return;
        }

        const editedConfig = recentEdits[0];

        if (editedConfig.id === actualConfigId) {
            console.log('✅ TUDO CERTO!');
            console.log(`Config usada no relatório (${actualConfigId}) é a mesma que você editou.\n`);
            console.log('Se ainda vê placeholders:');
            console.log('  1. Limpe COMPLETAMENTE o cache (Ctrl+Shift+Del)');
            console.log('  2. Hard refresh (Ctrl+Shift+R)');
            console.log('  3. Tente modo anônimo\n');
        } else {
            console.log('🚨 PROBLEMA ENCONTRADO!\n');
            console.log(`Relatório usa config: ${actualConfigId} (${configDetails[0].name})`);
            console.log(`Mas você editou config: ${editedConfig.id} (${editedConfig.name})\n`);
            console.log('💡 SOLUÇÃO:\n');

            if (configId) {
                console.log('Este assignment já tem configId fixo. Opções:\n');
                console.log(`A) Editar textos na config CORRETA (${actualConfigId}):`);
                console.log(`   → Dashboard > Configurações > Matriz de Interpretação`);
                console.log(`   → Selecionar config "${configDetails[0].name}"`);
                console.log(`   → Editar textos\n`);
                console.log(`B) OU copiar textos da config editada para esta:`);
                console.log(`   (Requer query SQL manual)\n`);
            } else {
                console.log('Executar estas queries:\n');
                console.log(`-- 1. Atualizar assignment para usar config editada:`);
                console.log(`UPDATE assessment_assignments SET configId = '${editedConfig.id}' WHERE id = '${assignmentId}';\n`);
                console.log(`-- 2. Garantir que config editada está ativa:`);
                console.log(`UPDATE bigfive_configs SET isActive = 1 WHERE id = '${editedConfig.id}';`);
                console.log(`UPDATE bigfive_configs SET isActive = 0 WHERE id != '${editedConfig.id}' AND tenantId = '${tenantId}';\n`);
            }
        }

    } finally {
        await connection.end();
    }
}

investigateAssignment().catch(console.error);
