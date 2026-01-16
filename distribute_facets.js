const mysql = require('mysql2/promise');

// Mapeamento: Subtraço -> [Lista de Facetas para Distribuir]
const DISTRIBUTION_MAP = {
    // EXTRAVERSION
    'falante': ['EXTRAVERSION_F2'], // Gregariedade (Fixa, são muitas perguntas)
    'seletivo': ['EXTRAVERSION_F2'],
    'ouvinte': ['EXTRAVERSION_F2'],
    'interativo': ['EXTRAVERSION_F1', 'EXTRAVERSION_F5'], // Cordialidade, Busca Sensações
    'ativo': ['EXTRAVERSION_F4', 'EXTRAVERSION_F6'], // Atividade, Emoções Positivas
    'reflexivo': ['EXTRAVERSION_F4', 'EXTRAVERSION_F6'],
    'contido': ['EXTRAVERSION_F3'], // Assertividade
    'afirmativo': ['EXTRAVERSION_F3'],

    // AGREEABLENESS
    'crítico': ['AGREEABLENESS_F2'], // Franqueza
    'conectado': ['AGREEABLENESS_F1', 'AGREEABLENESS_F6', 'AGREEABLENESS_F3'], // Confiança, Sensibilidade, Altruísmo
    'tolerante': ['AGREEABLENESS_F4'], // Complacência
    'colaborativo': ['AGREEABLENESS_F4'],
    'competitivo': ['AGREEABLENESS_F5'], // Modéstia
    'independente': ['AGREEABLENESS_F1'],

    // CONSCIENTIOUSNESS
    'disciplinado': ['CONSCIENTIOUSNESS_F5', 'CONSCIENTIOUSNESS_F1'], // Autodisciplina, Competência
    'planejado': ['CONSCIENTIOUSNESS_F2'], // Ordem
    'espontâneo': ['CONSCIENTIOUSNESS_F2'],
    'flexível': ['CONSCIENTIOUSNESS_F3', 'CONSCIENTIOUSNESS_F4'], // Senso Dever, Esforço
    'persistente': ['CONSCIENTIOUSNESS_F3', 'CONSCIENTIOUSNESS_F4'],
    'aventureiro': ['CONSCIENTIOUSNESS_F6'], // Ponderação

    // NEUROTICISM
    'inquieto': ['NEUROTICISM_F1'], // Ansiedade
    'despreocupado': ['NEUROTICISM_F1'],
    'inseguro': ['NEUROTICISM_F3', 'NEUROTICISM_F4', 'NEUROTICISM_F6'], // Depressão, Embaraço, Vulnerabilidade
    'autoconfiante': ['NEUROTICISM_F3', 'NEUROTICISM_F4', 'NEUROTICISM_F6'],
    'irritável': ['NEUROTICISM_F2'], // Hostilidade
    'tranquilo': ['NEUROTICISM_F2'],
    'reativo': ['NEUROTICISM_F5'], // Impulsividade
    'controlado': ['NEUROTICISM_F5'],

    // OPENNESS
    'aberto': ['OPENNESS_F6', 'OPENNESS_F4', 'OPENNESS_F3'], // Valores, Ações, Sentimentos
    'conservador': ['OPENNESS_F6', 'OPENNESS_F4', 'OPENNESS_F3'],
    'prático': ['OPENNESS_F5'], // Ideias
    'conceitual': ['OPENNESS_F5'],
    'realista': ['OPENNESS_F1', 'OPENNESS_F2'], // Fantasia, Estética
    'imaginativo': ['OPENNESS_F1', 'OPENNESS_F2']
};

async function distributeFacets() {
    console.log('=== DISTRIBUIÇÃO INTELIGENTE DE FACETAS ===');
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const modelId = '4942ae96-4ce2-41ed-a21d-27a8bbb6e4d7';

        // Para cada Subtraço, buscar perguntas e distribuir
        for (const [subtrait, targetFacets] of Object.entries(DISTRIBUTION_MAP)) {
            const [questions] = await connection.execute(
                'SELECT id, text FROM questions WHERE assessmentModelId = ? AND subtrait = ?',
                [modelId, subtrait]
            );

            if (questions.length === 0) continue;

            console.log(`Distribuiu ${questions.length} perguntas de '${subtrait}' para [${targetFacets.join(', ')}]`);

            // Round Robin
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const facetToUse = targetFacets[i % targetFacets.length]; // 0, 1, 2, 0, 1...

                await connection.execute('UPDATE questions SET facetKey = ? WHERE id = ?', [facetToUse, q.id]);
            }
        }

        console.log('\n✅ Distribuição Concluída!');

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await connection.end();
    }
}

distributeFacets();
