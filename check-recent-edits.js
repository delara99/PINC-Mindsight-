const mysql = require('mysql2/promise');

async function checkRecentEdits() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        console.log('=== VERIFICANDO EDIÇÕES RECENTES ===\n');

        // 1. Textos editados nos últimos 30 minutos
        const [recent] = await connection.execute(`
            SELECT 
                configId,
                traitKey,
                scoreRange,
                category,
                context,
                text,
                LENGTH(text) as text_length,
                updatedAt
            FROM bigfive_interpretative_texts
            WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
            ORDER BY updatedAt DESC
            LIMIT 20
        `);

        console.log(`Textos editados nos últimos 30min: ${recent.length}\n`);

        if (recent.length > 0) {
            recent.forEach((t, i) => {
                console.log(`${i + 1}. ${t.traitKey} / ${t.scoreRange} / ${t.category}`);
                console.log(`   ConfigId: ${t.configId}`);
                console.log(`   Context: ${t.context || 'N/A'}`);
                console.log(`   Text Length: ${t.text_length} caracteres`);
                console.log(`   Text: "${t.text}"`);
                console.log(`   Updated: ${t.updatedAt}`);
                console.log('');
            });
        } else {
            console.log('⚠️  Nenhuma edição nos últimos 30 minutos!\n');
        }

        // 2. Verificar configs ativas
        console.log('--- Configs Ativas ---');
        const [activeConfigs] = await connection.execute(`
            SELECT 
                id,
                name,
                tenantId,
                (SELECT COUNT(*) FROM bigfive_interpretative_texts WHERE configId = bigfive_configs.id) as total_textos,
                (SELECT COUNT(*) FROM bigfive_interpretative_texts WHERE configId = bigfive_configs.id AND LENGTH(text) = 0) as textos_vazios
            FROM bigfive_configs
            WHERE isActive = 1
            ORDER BY tenantId
        `);

        console.table(activeConfigs);

        // 3. Alertas
        activeConfigs.forEach(c => {
            if (c.textos_vazios > 0) {
                console.log(`⚠️  Config "${c.name}" tem ${c.textos_vazios} textos VAZIOS!`);
            }
        });

    } finally {
        await connection.end();
    }
}

checkRecentEdits().catch(console.error);
