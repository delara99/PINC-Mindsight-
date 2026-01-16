const mysql = require('mysql2/promise');

const MAPPING = {
    // EXTRAVERSION
    'falante': 'EXTRAVERSION_F2', // Gregariedade
    'seletivo': 'EXTRAVERSION_F2',
    'interativo': 'EXTRAVERSION_F2',
    'ouvinte': 'EXTRAVERSION_F2',
    'ativo': 'EXTRAVERSION_F4', // Atividade
    'reflexivo': 'EXTRAVERSION_F4',
    'contido': 'EXTRAVERSION_F3', // Assertividade
    'afirmativo': 'EXTRAVERSION_F3',

    // AGREEABLENESS
    'crítico': 'AGREEABLENESS_F2', // Franqueza
    'conectado': 'AGREEABLENESS_F3', // Altruísmo
    'tolerante': 'AGREEABLENESS_F4', // Complacência
    'competitivo': 'AGREEABLENESS_F4',
    'colaborativo': 'AGREEABLENESS_F4',
    'independente': 'AGREEABLENESS_F3',

    // CONSCIENTIOUSNESS
    'aventureiro': 'CONSCIENTIOUSNESS_F6', // Ponderação
    'disciplinado': 'CONSCIENTIOUSNESS_F5', // Autodisciplina
    'planejado': 'CONSCIENTIOUSNESS_F2', // Ordem
    'espontâneo': 'CONSCIENTIOUSNESS_F2',
    'flexível': 'CONSCIENTIOUSNESS_F3', // Senso de dever (aprox)
    'persistente': 'CONSCIENTIOUSNESS_F4', // Esforço

    // OPENNESS
    'aberto': 'OPENNESS_F4', // Ações
    'prático': 'OPENNESS_F5', // Ideias (Inverso)
    'conceitual': 'OPENNESS_F5',
    'realista': 'OPENNESS_F1', // Fantasia
    'imaginativo': 'OPENNESS_F1',
    'conservador': 'OPENNESS_F6', // Valores

    // NEUROTICISM
    'inquieto': 'NEUROTICISM_F1', // Ansiedade
    'despreocupado': 'NEUROTICISM_F1',
    'inseguro': 'NEUROTICISM_F4', // Embaraço
    'autoconfiante': 'NEUROTICISM_F4',
    'irritável': 'NEUROTICISM_F2', // Hostilidade
    'tranquilo': 'NEUROTICISM_F2',
    'reativo': 'NEUROTICISM_F5', // Impulsividade
    'controlado': 'NEUROTICISM_F5'
};

async function mapFacets() {
    console.log('=== MAPEAMENTO DE FACETAS NAS PERGUNTAS ===');
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const modelId = '4942ae96-4ce2-41ed-a21d-27a8bbb6e4d7';

        // Buscar perguntas do modelo
        const [questions] = await connection.execute('SELECT id, subtrait FROM questions WHERE assessmentModelId = ?', [modelId]);

        console.log(`Verificando ${questions.length} perguntas...`);
        let updated = 0;

        for (const q of questions) {
            if (!q.subtrait) continue;

            const facetKey = MAPPING[q.subtrait];
            if (facetKey) {
                await connection.execute('UPDATE questions SET facetKey = ? WHERE id = ?', [facetKey, q.id]);
                updated++;
            } else {
                console.warn(`⚠️ Sem mapeamento para subtrait: ${q.subtrait}`);
            }
        }

        console.log(`✅ ${updated} perguntas atualizadas com facetKey!`);

        // Correção Adicional: Atualizar isReverse baseado na lógica que defini acima?
        // Na importação eu usei (1) para reverse.
        // O sistema deve funcionar se o weight estiver certo.

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await connection.end();
    }
}

mapFacets();
