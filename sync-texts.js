const mysql = require('mysql2/promise');

async function syncTexts() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const sourceConfig = 'b8d11272-fb89-4284-b51d-991486e05a45'; // Onde você edita
        const targetConfig = 'ae20b456-7a25-4ee2-aac0-f373af106d3e'; // Config do relatório

        console.log('=== SINCRONIZANDO TEXTOS ===\n');
        console.log(`De: ${sourceConfig} (Big Five - Configuração Completa)`);
        console.log(`Para: ${targetConfig} (Configuração Big Five)\n`);

        // 1. Deletar textos antigos da config de destino
        console.log('1. Removendo textos antigos da config destino...');
        const [deleted] = await connection.execute(`
            DELETE FROM bigfive_interpretative_texts 
            WHERE configId = ?
        `, [targetConfig]);
        console.log(`   ✅ ${deleted.affectedRows} textos removidos\n`);

        // 2. Copiar TODOS os textos da config source para target
        console.log('2. Copiando textos atualizados...');
        const [copied] = await connection.execute(`
            INSERT INTO bigfive_interpretative_texts 
            (id, configId, traitKey, scoreRange, category, context, text, createdAt, updatedAt)
            SELECT 
                UUID() as id,
                ? as configId,
                traitKey,
                scoreRange,
                category,
                context,
                text,
                NOW() as createdAt,
                NOW() as updatedAt
            FROM bigfive_interpretative_texts
            WHERE configId = ?
        `, [targetConfig, sourceConfig]);
        console.log(`   ✅ ${copied.affectedRows} textos copiados\n`);

        // 3. Verificar textos copiados
        console.log('3. Verificando textos "TESTE FUNCIONOU" na config destino...');
        const [verify] = await connection.execute(`
            SELECT traitKey, scoreRange, category, LEFT(text, 50) as preview
            FROM bigfive_interpretative_texts
            WHERE configId = ? AND text LIKE '%TESTE FUNCIONOU%'
        `, [targetConfig]);

        console.table(verify);

        if (verify.length > 0) {
            console.log(`\n✅ SUCESSO! ${verify.length} textos "TESTE FUNCIONOU" copiados!`);
            console.log('\n🎯 PRÓXIMO PASSO:');
            console.log('1. Limpe cache do browser (Ctrl+Shift+Del)');
            console.log('2. Abra relatório em aba anônima');
            console.log('3. Os textos devem aparecer agora!');
        } else {
            console.log('\n⚠️  Nenhum texto "TESTE FUNCIONOU" encontrado após cópia!');
        }

    } finally {
        await connection.end();
    }
}

syncTexts().catch(console.error);
