const fs = require('fs');
const filePath = 'backend/src/assessment/assessment.service.ts';
let content = fs.readFileSync(filePath, 'utf-8');

if (content.includes('facetKey: q.facetKey')) {
    console.log('⚠️ Arquivo já parece ter facetKey. Verifique.');
} else {
    // Injetar facetKey
    content = content.replace(
        /traitKey: q\.traitKey,/g, 
        'traitKey: q.traitKey, facetKey: q.facetKey || null,'
    );

    // Injetar isReverse
    content = content.replace(
        /weight: Number\(q\.weight\) \|\| 1/g,
        'weight: Number(q.weight) || 1, isReverse: q.isReverse || false'
    );

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✅ Service corrigido: Campos facetKey e isReverse adicionados.');
}
