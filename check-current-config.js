const mysql = require('mysql2/promise');

async function checkCurrentConfig() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const reportTenant = 'fae01157-a152-4a37-ab18-9efcc165a01e';

        console.log('=== VERIFICANDO CONFIG ATUAL DO RELATÓRIO ===\n');

        // 1. Config ativa do tenant
        const [active] = await connection.execute(`
            SELECT id, name, isActive,
                (SELECT COUNT(*) FROM bigfive_interpretative_texts WHERE configId = bigfive_configs.id) as textos
            FROM bigfive_configs
            WHERE tenantId = ? AND isActive = 1
        `, [reportTenant]);

        console.log('Config ATIVA do tenant:');
        console.table(active);

        if (active.length === 0) {
            console.log('❌ Nenhuma config ativa!');
            return;
        }

        // 2. Amostra de textos da config ativa
        console.log('\n--- Amostra de Textos Desta Config ---');
        const [texts] = await connection.execute(`
            SELECT 
                traitKey,
                scoreRange,
                category,
                LEFT(text, 80) as preview
            FROM bigfive_interpretative_texts
            WHERE configId = ?
            ORDER BY updatedAt DESC
            LIMIT 5
        `, [active[0].id]);

        console.table(texts);

        // 3. Verificar se há textos "TESTE X" (os editados pelo usuário)
        const [testeTexts] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM bigfive_interpretative_texts
            WHERE configId = ? AND text LIKE '%TESTE%'
        `, [active[0].id]);

        console.log(`\nTextos com "TESTE" (editados): ${testeTexts[0].count}`);

        // 4. Buscar a config COM os textos TESTE
        console.log('\n--- Config com textos TESTE ---');
        const [configWithTests] = await connection.execute(`
            SELECT DISTINCT
                c.id,
                c.name,
                c.tenantId,
                c.isActive,
                COUNT(t.id) as textos_teste
            FROM bigfive_configs c
            INNER JOIN bigfive_interpretative_texts t ON t.configId = c.id
            WHERE t.text LIKE '%TESTE%'
            GROUP BY c.id, c.name, c.tenantId, c.isActive
            ORDER BY textos_teste DESC
        `);

        console.table(configWithTests);

        // SOLUÇÃO
        if (testeTexts[0].count === 0 && configWithTests.length > 0) {
            console.log('\n🚨 PROBLEMA: Config ativa NÃO tem os textos editados!');
            console.log(`\nTextos "TESTE" estão na config: ${configWithTests[0].id}`);
            console.log('Tenant dessa config:', configWithTests[0].tenantId);
            console.log('\n💡 SOLUÇÃO: Copiar textos TESTE para a config ativa!\n');
        }

    } finally {
        await connection.end();
    }
}

checkCurrentConfig().catch(console.error);
