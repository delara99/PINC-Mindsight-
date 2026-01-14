const mysql = require('mysql2/promise');

async function checkOtherConfig() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        console.log('=== AMOSTRA DE TEXTOS DA CONFIG "Configuração Padrão" ===\n');

        const [rows] = await connection.execute(`
            SELECT 
                traitKey,
                scoreRange,
                category,
                LEFT(text, 150) as preview
            FROM bigfive_interpretative_texts
            WHERE configId = '74204744-fb79-4fb5-8f15-750d07e403d3'
            AND traitKey = 'EXTRAVERSION'
            AND scoreRange IN ('VERY_LOW', 'LOW')
            LIMIT 10
        `);

        console.table(rows);

    } finally {
        await connection.end();
    }
}

checkOtherConfig().catch(console.error);
