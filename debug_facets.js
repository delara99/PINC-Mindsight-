const mysql = require('mysql2/promise');

async function debugCalculation() {
    console.log('=== DEBUG CÁLCULO FACETAS ===');
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const assignmentId = '66773080-983c-4f0e-8b73-f3dc8dfa88a2';

        // 1. Pegar respostas
        const [responses] = await connection.execute(`
            SELECT r.answer, q.traitKey, q.facetKey, q.text 
            FROM assessment_responses r
            JOIN questions q ON r.questionId = q.id
            WHERE r.assignmentId = ?
        `, [assignmentId]);

        console.log(`Respostas encontradas: ${responses.length}`);

        if (responses.length === 0) {
            console.log('❌ Nenhuma resposta encontrada! O usuário respondeu mesmo?');
            return;
        }

        // 2. Agrupar por Faceta
        const facets = {};
        let missingFacet = 0;

        responses.forEach(r => {
            if (!r.facetKey) {
                missingFacet++;
                // console.log(`  ⚠️ Pergunta sem faceta: "${r.text.substring(0,30)}..." (${r.traitKey})`);
            } else {
                if (!facets[r.facetKey]) facets[r.facetKey] = { count: 0, sum: 0 };
                facets[r.facetKey].count++;
                facets[r.facetKey].sum += Number(r.answer);
            }
        });

        console.log(`Perguntas com faceta: ${responses.length - missingFacet}`);
        console.log(`Perguntas SEM faceta : ${missingFacet}`);

        console.log('\n--- RESULTADO DAS FACETAS (PREVIEW) ---');
        console.table(Object.entries(facets).map(([k, v]) => ({
            key: k,
            count: v.count,
            avg: (v.sum / v.count).toFixed(2)
        })).slice(0, 10)); // Mostrar só as 10 primeiras

        // 3. Verificar Config
        // O código usa a config para saber quais facetas retornar.
        // Se a faceta existir na resposta mas não na config, ela é ignorada?
        // Vamos checar quais facetas existem na config 'ae20b456-7a25-4ee2-aac0-f373af106d3e'
        const configId = 'ae20b456-7a25-4ee2-aac0-f373af106d3e';
        const [configFacets] = await connection.execute(`
            SELECT f.facetKey 
            FROM bigfive_facet_configs f 
            JOIN bigfive_trait_configs t ON f.traitId = t.id 
            WHERE t.configId = ?
        `, [configId]);

        const validFacets = configFacets.map(f => f.facetKey);
        console.log(`\nFacetas na Configuração (${validFacets.length}):`);

        // Cruzamento
        const calcKeys = Object.keys(facets);
        const match = calcKeys.filter(k => validFacets.includes(k));
        const missing = calcKeys.filter(k => !validFacets.includes(k));

        console.log(`✅ Facetas calculadas que existem na config: ${match.length}`);
        console.log(`❌ Facetas calculadas que NÃO existem na config: ${missing.length}`);
        if (missing.length > 0) console.log('Exemplos:', missing.slice(0, 5));

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await connection.end();
    }
}

debugCalculation();
