const mysql = require('mysql2/promise');

async function fixConfig() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const tenantId = 'fae01157-a152-4a37-ab18-9efcc165a01e';
        const configComTextos = 'b8d11272-fb89-4284-b51d-991486e05a45';

        console.log('=== CORRIGINDO CONFIGURAÇÃO ===\n');

        // 1. Verificar se config com textos existe
        const [config] = await connection.execute(`
            SELECT id, name, tenantId, isActive FROM bigfive_configs WHERE id = ?
        `, [configComTextos]);

        if (config.length === 0) {
            console.log('❌ Config com textos não encontrada!');
            return;
        }

        console.log('Config com textos editados:');
        console.table(config);

        // 2. Atualizar tenantId dessa config
        console.log(`\n1. Vinculando config ao tenant correto...`);
        await connection.execute(`
            UPDATE bigfive_configs 
            SET tenantId = ?, isActive = 1
            WHERE id = ?
        `, [tenantId, configComTextos]);
        console.log('✅ Config vinculada e ativada!');

        // 3. Desativar outras configs desse tenant
        console.log(`\n2. Desativando outras configs do tenant...`);
        const [result] = await connection.execute(`
            UPDATE bigfive_configs 
            SET isActive = 0 
            WHERE tenantId = ? AND id != ?
        `, [tenantId, configComTextos]);
        console.log(`✅ ${result.affectedRows} config(s) desativada(s)`);

        // 4. Verificar
        console.log(`\n3. Verificando configuração final...`);
        const [final] = await connection.execute(`
            SELECT 
                id, 
                name, 
                isActive,
                (SELECT COUNT(*) FROM bigfive_interpretative_texts WHERE configId = bigfive_configs.id) as textos
            FROM bigfive_configs
            WHERE tenantId = ?
        `, [tenantId]);

        console.table(final);

        console.log('\n✅ CORREÇÃO CONCLUÍDA!');
        console.log('\nPróximos passos:');
        console.log('1. Limpe cache do browser (Ctrl+Shift+Del)');
        console.log('2. Reabra o relatório');
        console.log('3. Os textos editados devem aparecer agora!');

    } finally {
        await connection.end();
    }
}

fixConfig().catch(console.error);
