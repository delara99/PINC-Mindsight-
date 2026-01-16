const mysql = require('mysql2/promise');

async function removeDuplicates() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const configId = 'ae20b456-7a25-4ee2-aac0-f373af106d3e';
        console.log('=== REMOVENDO DUPLICATAS DA CONFIG DO RELATÓRIO ===\n');

        // Buscar duplicatas (mesmo trait, range, category)
        const [duplicates] = await connection.execute(`
            SELECT traitKey, scoreRange, category, COUNT(*) as qtd
            FROM bigfive_interpretative_texts
            WHERE configId = ?
            GROUP BY traitKey, scoreRange, category
            HAVING qtd > 1
        `, [configId]);

        console.log(`${duplicates.length} grupos de duplicatas encontrados.`);

        for (const dup of duplicates) {
            console.log(`Processando: ${dup.traitKey} / ${dup.scoreRange} / ${dup.category} (${dup.qtd} textos)`);

            // Buscar IDs ordenados por data (mais recente primeiro)
            const [texts] = await connection.execute(`
                SELECT id, text, updatedAt 
                FROM bigfive_interpretative_texts
                WHERE configId = ? 
                AND traitKey = ? 
                AND scoreRange = ? 
                AND category = ?
                ORDER BY updatedAt DESC
            `, [configId, dup.traitKey, dup.scoreRange, dup.category]);

            // Manter o primeiro (index 0), deletar o resto
            const toKeep = texts[0];
            const toDelete = texts.slice(1);

            console.log(`   ✅ Manter: "${toKeep.text.substring(0, 30)}..." (${toKeep.updatedAt})`);

            for (const del of toDelete) {
                console.log(`   ❌ Deletar: "${del.text.substring(0, 30)}..." (${del.updatedAt})`);
                await connection.execute(`DELETE FROM bigfive_interpretative_texts WHERE id = ?`, [del.id]);
            }
        }

        console.log('\n✅ Limpeza concluída!');

    } finally {
        await connection.end();
    }
}

removeDuplicates().catch(console.error);
