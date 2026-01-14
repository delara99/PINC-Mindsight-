const mysql = require('mysql2/promise');

async function checkRecentTexts() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        console.log('=== TEXTOS MAIS RECENTES (últimos 15min) ===\n');

        const [rows] = await connection.execute(`
            SELECT 
                id,
                configId,
                traitKey,
                scoreRange,
                category,
                context,
                text,
                updatedAt
            FROM bigfive_interpretative_texts
            WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
            ORDER BY updatedAt DESC
            LIMIT 10
        `);

        if (rows.length === 0) {
            console.log('⚠️  NENHUM texto atualizado nos últimos 15 minutos!');
            console.log('Isso significa que as edições NÃO estão sendo salvas no banco.\n');

            console.log('=== Verificando textos da última hora ===\n');
            const [rows2] = await connection.execute(`
                SELECT 
                    id,
                    configId,
                    traitKey,
                    scoreRange,
                    category,
                    LEFT(text, 80) as preview,
                    updatedAt
                FROM bigfive_interpretative_texts
                WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                ORDER BY updatedAt DESC
                LIMIT 10
            `);
            console.table(rows2);
        } else {
            console.log(`✅ Encontrados ${rows.length} textos editados recentemente:\n`);
            rows.forEach((row, idx) => {
                console.log(`--- TEXTO ${idx + 1} ---`);
                console.log(`Config: ${row.configId}`);
                console.log(`Trait: ${row.traitKey} | Range: ${row.scoreRange}`);
                console.log(`Category: ${row.category} | Context: ${row.context || 'N/A'}`);
                console.log(`Text: "${row.text}"`);
                console.log(`Updated: ${row.updatedAt}`);
                console.log('');
            });
        }

    } finally {
        await connection.end();
    }
}

checkRecentTexts().catch(console.error);
