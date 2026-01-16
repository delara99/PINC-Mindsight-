const mysql = require('mysql2/promise');

async function verifySync() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const mainConfig = 'b8d11272-fb89-4284-b51d-991486e05a45';   // Onde você edita
        const reportConfig = 'ae20b456-7a25-4ee2-aac0-f373af106d3e'; // Config do relatório

        console.log('=== VERIFICAÇÃO DE SINCRONIZAÇÃO EM TEMPO REAL ===\n');

        // 1. Pegar o último texto editado na Main Config
        const [lastEdit] = await connection.execute(`
            SELECT traitKey, scoreRange, category, text, updatedAt, id
            FROM bigfive_interpretative_texts
            WHERE configId = ?
            ORDER BY updatedAt DESC
            LIMIT 1
        `, [mainConfig]);

        if (lastEdit.length === 0) {
            console.log('⚠️ Nenhum texto encontrado na config principal.');
            return;
        }

        const source = lastEdit[0];
        console.log(`📝 Última edição na Main Config:`);
        console.log(`   Trait: ${source.traitKey} | Range: ${source.scoreRange} | Cat: ${source.category}`);
        console.log(`   Texto: "${source.text.substring(0, 50)}..."`);
        console.log(`   Horário: ${source.updatedAt.toISOString()}`);
        console.log('');

        // 2. Verificar se esse texto existe IDÊNTICO na Report Config
        const [target] = await connection.execute(`
            SELECT text, updatedAt
            FROM bigfive_interpretative_texts
            WHERE configId = ?
            AND traitKey = ?
            AND scoreRange = ?
            AND category = ?
        `, [reportConfig, source.traitKey, source.scoreRange, source.category]);

        if (target.length === 0) {
            console.log('❌ FALHA: Texto correspondente NÃO encontrado na config do relatório.');
        } else {
            console.log(`🔄 Verificando config do Relatório:`);
            console.log(`   Texto: "${target[0].text.substring(0, 50)}..."`);

            // Comparar textos
            if (target[0].text === source.text) {
                console.log('\n✅ SUCESSO! O texto foi sincronizado automaticamente!');

                // Verificar delay de sincronização
                const diffValues = Math.abs(new Date(target[0].updatedAt) - new Date(source.updatedAt));
                if (diffValues < 5000) { // 5 segundos
                    console.log('🚀 Sincronização foi instantânea (mesmo timestamp)!');
                } else {
                    console.log(`⏱️ Sincronizado com diferença de tempo (normal se houve delay de rede).`);
                }
            } else {
                console.log('\n⚠️ ATENÇÃO: Os textos existem mas são DIFERENTES!');
                console.log(`   Main:   "${source.text}"`);
                console.log(`   Report: "${target[0].text}"`);
                console.log('   A automação pode não ter rodado ainda ou falhou.');
            }
        }

    } finally {
        await connection.end();
    }
}

verifySync().catch(console.error);
