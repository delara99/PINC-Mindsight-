const mysql = require('mysql2/promise');

async function restoreConfig() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const originalTenant = 'c2c1f3a8-d1a7-48fc-abd9-1f783e2f2246';
        const reportTenant = 'fae01157-a152-4a37-ab18-9efcc165a01e';
        const configId = 'b8d11272-fb89-4284-b51d-991486e05a45';

        console.log('=== RESTAURANDO CONFIGURAÇÃO ORIGINAL ===\n');

        // 1. Restaurar config para tenant original
        console.log('1. Restaurando config para tenant original...');
        await connection.execute(`
            UPDATE bigfive_configs 
            SET tenantId = ?, isActive = 1
            WHERE id = ?
        `, [originalTenant, configId]);
        console.log('✅ Config restaurada!\n');

        // 2. Criar config para o outro tenant copiando os textos
        console.log('2. Criando config NOVA para tenant do relatório...');

        // Verificar se já existe
        const [existing] = await connection.execute(`
            SELECT id FROM bigfive_configs 
            WHERE tenantId = ? AND isActive = 1
            LIMIT 1
        `, [reportTenant]);

        if (existing.length > 0) {
            console.log(`⚠️  Já existe config ativa: ${existing[0].id}`);
            console.log('Vou copiar os textos editados para ela...\n');

            // Copiar textos
            await connection.execute(`
                INSERT INTO bigfive_interpretative_texts 
                (id, configId, traitKey, scoreRange, category, context, text, createdAt, updatedAt)
                SELECT 
                    UUID(),
                    ? as configId,
                    traitKey,
                    scoreRange,
                    category,
                    context,
                    text,
                    NOW(),
                    NOW()
                FROM bigfive_interpretative_texts
                WHERE configId = ?
                AND updatedAt >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
                ON DUPLICATE KEY UPDATE
                    text = VALUES(text),
                    updatedAt = NOW()
            `, [existing[0].id, configId]);

            console.log('✅ Textos copiados!\n');
        } else {
            console.log('Criando nova config...\n');

            const newConfigId = require('crypto').randomUUID();

            // Criar config
            await connection.execute(`
                INSERT INTO bigfive_configs 
                (id, name, tenantId, isActive, veryLowMax, lowMax, averageMax, highMax, createdAt, updatedAt)
                VALUES (?, 'Configuração Big Five', ?, 1, 20, 40, 60, 80, NOW(), NOW())
            `, [newConfigId, reportTenant]);

            // Copiar TODOS os textos
            await connection.execute(`
                INSERT INTO bigfive_interpretative_texts 
                (id, configId, traitKey, scoreRange, category, context, text, createdAt, updatedAt)
                SELECT 
                    UUID(),
                    ? as configId,
                    traitKey,
                    scoreRange,
                    category,
                    context,
                    text,
                    NOW(),
                    NOW()
                FROM bigfive_interpretative_texts
                WHERE configId = ?
            `, [newConfigId, configId]);

            console.log(`✅ Nova config criada: ${newConfigId}\n`);
        }

        // 3. Verificar resultado
        console.log('3. Verificando configs finais...\n');

        console.log(`--- Tenant Original (${originalTenant}): ---`);
        const [config1] = await connection.execute(`
            SELECT id, name, isActive,
                (SELECT COUNT(*) FROM bigfive_interpretative_texts WHERE configId = bigfive_configs.id) as textos
            FROM bigfive_configs
            WHERE tenantId = ?
        `, [originalTenant]);
        console.table(config1);

        console.log(`\n--- Tenant do Relatório (${reportTenant}): ---`);
        const [config2] = await connection.execute(`
            SELECT id, name, isActive,
                (SELECT COUNT(*) FROM bigfive_interpretative_texts WHERE configId = bigfive_configs.id) as textos
            FROM bigfive_configs
            WHERE tenantId = ?
        `, [reportTenant]);
        console.table(config2);

        console.log('\n✅ CORREÇÃO CONCLUÍDA!');
        console.log('\nResultado:');
        console.log('- Tenant original: Config restaurada com seus textos');
        console.log('- Tenant do relatório: Textos copiados');
        console.log('\nLimpe cache e recarregue a página de Métricas de Avaliação!');

    } finally {
        await connection.end();
    }
}

restoreConfig().catch(console.error);
