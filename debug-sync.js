const mysql = require('mysql2/promise');

async function debugSyncLogic() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        console.log('=== DEBUG LÓGICA DE SYNC ===\n');

        const configId = 'b8d11272-fb89-4284-b51d-991486e05a45';

        // Simular a lógica do Backend
        const syncConfigs = [
            'b8d11272-fb89-4284-b51d-991486e05a45',
            'ae20b456-7a25-4ee2-aac0-f373af106d3e'
        ];

        console.log(`Config ID testado: ${configId}`);
        console.log(`Está na lista de sync? ${syncConfigs.includes(configId)}`);

        if (syncConfigs.includes(configId)) {
            const target = syncConfigs.find(id => id !== configId);
            console.log(`Target Config ID: ${target}`);

            // Verificar se target existe
            const [rows] = await connection.execute('SELECT id, name FROM bigfive_configs WHERE id = ?', [target]);
            if (rows.length > 0) {
                console.log(`✅ Target Config existe: ${rows[0].name}`);
            } else {
                console.log(`❌ Target Config NÃO existe no banco!`);
            }
        }

    } finally {
        await connection.end();
    }
}

debugSyncLogic().catch(console.error);
