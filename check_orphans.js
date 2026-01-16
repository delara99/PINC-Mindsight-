const mysql = require('mysql2/promise');

async function checkOrphanFacets() {
    console.log('=== VERIFICAÇÃO DE FACETAS SEM PERGUNTAS ===');
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const modelId = '4942ae96-4ce2-41ed-a21d-27a8bbb6e4d7';
        const configId = 'ae20b456-7a25-4ee2-aac0-f373af106d3e';

        // 1. Pegar todas as Facetas do Sistema
        const [allFacets] = await connection.execute(`
            SELECT f.facetKey, f.name as facetName, t.traitKey 
            FROM bigfive_facet_configs f
            JOIN bigfive_trait_configs t ON f.traitId = t.id
            WHERE t.configId = ?
            ORDER BY t.traitKey, f.facetKey
        `, [configId]);

        // 2. Pegar Facetas Cobertas pelas Perguntas
        const [covered] = await connection.execute(`
            SELECT DISTINCT facetKey 
            FROM questions 
            WHERE assessmentModelId = ? AND facetKey IS NOT NULL
        `, [modelId]);

        const coveredKeys = covered.map(c => c.facetKey);

        console.log(`Total de Facetas no Sistema: ${allFacets.length}`);
        console.log(`Facetas Cobertas: ${coveredKeys.length}`);

        console.log('\n--- FACETAS VAZIAS (SEM PERGUNTAS) ---');
        const orphans = allFacets.filter(f => !coveredKeys.includes(f.facetKey));

        if (orphans.length === 0) {
            console.log('✅ Nenhuma! Todas as facetas têm perguntas.');
        } else {
            orphans.forEach(f => {
                console.log(`❌ [${f.traitKey}] ${f.facetKey} - ${f.facetName}`);
            });
        }

        // Sugestão de Subtraços disponíveis para preencher
        const [availableSubtraits] = await connection.execute(`
            SELECT DISTINCT subtrait, traitKey 
            FROM questions 
            WHERE assessmentModelId = ?
            ORDER BY traitKey, subtrait
        `, [modelId]);

        console.log('\n--- SUGESTÃO: SUBTRAÇOS DISPONÍVEIS ---');
        // Agrupar por Traço
        const subtraitsByTrait = {};
        availableSubtraits.forEach(s => {
            if (!subtraitsByTrait[s.traitKey]) subtraitsByTrait[s.traitKey] = [];
            subtraitsByTrait[s.traitKey].push(s.subtrait);
        });
        console.table(subtraitsByTrait);

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await connection.end();
    }
}

checkOrphanFacets();
