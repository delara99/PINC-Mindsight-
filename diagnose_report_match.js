const mysql = require('mysql2/promise');

async function diagnoseReport() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const assignmentId = '7f92a9ad-6895-40c3-aa8c-77a07f34de06';
        const configId = 'ae20b456-7a25-4ee2-aac0-f373af106d3e';

        console.log('=== DIAGNÓSTICO DO RELATÓRIO ===\n');

        // 1. Pegar os Scores do Candidato (JSON)
        const [rows] = await connection.execute(`
            SELECT calculatedScores 
            FROM assessment_assignments 
            WHERE id = ?
        `, [assignmentId]);

        if (rows.length === 0) {
            console.log('❌ Assignment não encontrado!');
            return;
        }

        const scores = rows[0].calculatedScores; // É um JSON object
        console.log('📊 SCORES DO CANDIDATO:');
        console.table(scores);

        // Definir ranges padrão (para simular a lógica do backend)
        // veryLow: 0-20, low: 20-40, average: 40-60, high: 60-80, veryHigh: 80-100
        function getRange(score) {
            if (score <= 20) return 'VERY_LOW';
            if (score <= 40) return 'LOW';
            if (score <= 60) return 'AVERAGE';
            if (score <= 80) return 'HIGH';
            return 'VERY_HIGH';
        }

        // 2. Para cada traço, verificar qual texto o sistema busca vs. qual existe
        const traits = ['EXTRAVERSION', 'OPENNESS', 'CONSCIENTIOUSNESS', 'AGREEABLENESS', 'NEUROTICISM'];

        console.log('\n🔍 VERIFICAÇÃO DE MATCH DE TEXTOS:');

        for (const trait of traits) {
            const score = scores[trait]?.score || 0; // valor 0-100
            const range = getRange(score);

            console.log(`\n🔹 ${trait} (Score: ${score} -> Range: ${range})`);

            // Buscar texto no banco para esse range exato
            const [texts] = await connection.execute(`
                SELECT category, LEFT(text, 50) as text_preview, id
                FROM bigfive_interpretative_texts
                WHERE configId = ? 
                AND traitKey = ? 
                AND scoreRange = ?
            `, [configId, trait, range]);

            if (texts.length > 0) {
                console.log(`   ✅ Encontrados ${texts.length} textos para este range:`);
                texts.forEach(t => {
                    console.log(`      - [${t.category}]: "${t.text_preview}..."`);
                });
            } else {
                console.log(`   ❌ NENHUM texto encontrado para ${trait} no range ${range}!`);
                console.log(`      (O sistema vai mostrar placeholder ou vazio)`);

                // Verificar se existe texto para OUTROS ranges (só para confirmar se o usuário editou o range errado)
                const [otherRanges] = await connection.execute(`
                    SELECT scoreRange, COUNT(*) as qtd
                    FROM bigfive_interpretative_texts
                    WHERE configId = ? AND traitKey = ?
                    GROUP BY scoreRange
                `, [configId, trait]);

                if (otherRanges.length > 0) {
                    console.log(`      ⚠️  Você tem textos para outros ranges:`);
                    otherRanges.forEach(o => console.log(`          - ${o.scoreRange}: ${o.qtd} textos`));
                }
            }
        }

    } finally {
        await connection.end();
    }
}

diagnoseReport().catch(console.error);
