const mysql = require('mysql2/promise');

async function cloneConfig() {
    console.log('=== CLONANDO ESTRUTURA BIG FIVE ===');
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const sourceId = 'b8d11272-fb89-4284-b51d-991486e05a45'; // Config COMPLETA (Fonte)
        const targetId = 'ae20b456-7a25-4ee2-aac0-f373af106d3e'; // Config Relatório (Destino VAZIO)

        // 1. Limpar destino (só para garantir)
        // Primeiro deletar facetas
        const [targetTraits] = await connection.execute('SELECT id FROM bigfive_trait_configs WHERE configId = ?', [targetId]);
        if (targetTraits.length > 0) {
            const ids = targetTraits.map(t => t.id);
            // Delete facets
            await connection.query('DELETE FROM bigfive_facet_configs WHERE traitId IN (?)', [ids]);
            // Delete traits
            await connection.query('DELETE FROM bigfive_trait_configs WHERE configId = ?', [targetId]);
            console.log('🧹 Limpeza prévia realizada no destino.');
        }

        // 2. Ler Traços da Fonte
        const [traits] = await connection.execute('SELECT * FROM bigfive_trait_configs WHERE configId = ?', [sourceId]);
        console.log(`📋 ${traits.length} traços encontrados na fonte.`);

        for (const trait of traits) {
            // Criar Traço no Destino
            const [res] = await connection.execute(`
                INSERT INTO bigfive_trait_configs (
                    id, configId, traitKey, name, description, weight, 
                    veryLowText, lowText, averageText, highText, veryHighText, 
                    isActive, icon
                ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                targetId, trait.traitKey, trait.name, trait.description, trait.weight,
                trait.veryLowText, trait.lowText, trait.averageText, trait.highText, trait.veryHighText,
                trait.isActive, trait.icon
            ]);

            // Pegar ID do novo traço criado (MySQL não retorna ID UUID gerado facilmente se for trigger, mas vamos assumir que precisamos buscar)
            // Na verdade, UUID() do MySQL gera id novo. Mas eu preciso saber qual é para inserir as facetas.
            // Vou ter que buscar de volta pelo traitKey.
            const [newTraitArr] = await connection.execute('SELECT id FROM bigfive_trait_configs WHERE configId = ? AND traitKey = ?', [targetId, trait.traitKey]);
            const newTraitId = newTraitArr[0].id;

            // 3. Ler Facetas desse Traço na Fonte
            const [facets] = await connection.execute('SELECT * FROM bigfive_facet_configs WHERE traitId = ?', [trait.id]);

            for (const facet of facets) {
                await connection.execute(`
                    INSERT INTO bigfive_facet_configs (
                        id, traitId, facetKey, name, description, weight,
                        veryLowText, lowText, averageText, highText, veryHighText,
                        isActive
                    ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    newTraitId, facet.facetKey, facet.name, facet.description, facet.weight,
                    facet.veryLowText, facet.lowText, facet.averageText, facet.highText, facet.veryHighText,
                    facet.isActive
                ]);
            }
            console.log(`   ✅ Traço ${trait.traitKey} clonado com ${facets.length} facetas.`);
        }

        console.log('\n🚀 Clonagem concluída com sucesso!');

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await connection.end();
    }
}

cloneConfig();
