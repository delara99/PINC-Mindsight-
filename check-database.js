const mysql = require('mysql2/promise');

async function checkDatabase() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        console.log('✅ Conectado ao banco de dados!\n');

        // Query 1: Contar textos
        console.log('=== QUERY 1: Total de textos interpretativos ===');
        const [rows1] = await connection.execute('SELECT COUNT(*) as total FROM bigfive_interpretative_texts');
        console.log('Total de textos:', rows1[0].total);
        console.log('');

        // Query 2: Detalhes dos textos
        console.log('=== QUERY 2: Amostra de textos (5 primeiros) ===');
        const [rows2] = await connection.execute(`
            SELECT 
                id,
                configId,
                traitKey,
                scoreRange,
                category,
                LEFT(text, 60) as preview
            FROM bigfive_interpretative_texts
            ORDER BY createdAt DESC
            LIMIT 5
        `);
        console.table(rows2);
        console.log('');

        // Query 3: Agrupamento por config/trait/range
        console.log('=== QUERY 3: Textos agrupados ===');
        const [rows3] = await connection.execute(`
            SELECT 
                configId,
                traitKey,
                scoreRange,
                COUNT(*) as quantidade
            FROM bigfive_interpretative_texts
            GROUP BY configId, traitKey, scoreRange
            ORDER BY configId, traitKey, scoreRange
            LIMIT 20
        `);
        console.table(rows3);
        console.log('');

        // Query 4: Verificar configs ativas
        console.log('=== QUERY 4: Configurações ativas ===');
        const [rows4] = await connection.execute(`
            SELECT 
                id,
                name,
                tenantId,
                isActive,
                (SELECT COUNT(*) FROM bigfive_interpretative_texts WHERE configId = bigfive_configs.id) as textos_count
            FROM bigfive_configs
            ORDER BY createdAt DESC
            LIMIT 5
        `);
        console.table(rows4);

    } catch (error) {
        console.error('❌ Erro ao executar queries:', error);
    } finally {
        await connection.end();
        console.log('\n✅ Conexão fechada');
    }
}

checkDatabase().catch(console.error);
