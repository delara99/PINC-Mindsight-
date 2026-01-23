const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection('mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway');

    // Buscar questões do modelo específico
    const [rows] = await conn.execute(
        'SELECT id, traitKey, facetKey, concept, subtrait, isReverse FROM questions WHERE assessmentModelId = ? ORDER BY id',
        ['4942ae96-4ce2-41ed-a21d-27a8bbb6e4d7']
    );

    console.log('Total de questões neste modelo:', rows.length);
    console.log('\nPrimeiras 10 questões:');
    console.table(rows.slice(0, 10));

    // Agrupar por dimensão
    const byDimension = {};
    rows.forEach(q => {
        const dim = q.traitKey || 'UNKNOWN';
        if (!byDimension[dim]) byDimension[dim] = [];
        byDimension[dim].push(q);
    });

    console.log('\nQuestões por dimensão:');
    Object.keys(byDimension).forEach(dim => {
        console.log(`  ${dim}: ${byDimension[dim].length} questões`);
    });

    // Salvar JSON completo
    const fs = require('fs');
    fs.writeFileSync('/tmp/questions-mapping.json', JSON.stringify(rows, null, 2));
    console.log('\nDados salvos em /tmp/questions-mapping.json');

    await conn.end();
})();
