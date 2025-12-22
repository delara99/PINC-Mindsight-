const fs = require('fs');
const path = 'backend/src/reports/interpretation.service.ts';
let content = fs.readFileSync(path, 'utf-8');

// 1. Adicionar include
if (!content.includes('interpretativeTexts: true')) {
    content = content.replace(
        'traits: {',
        'interpretativeTexts: true,\n                traits: {'
    );
}

// 2. Injetar lógica de mapping e extração
const pushPoint = 'report.traits.push({';
if (content.includes(pushPoint) && !content.includes('customTexts:')) {
    
    const logic = `
            // Mapear Level para Enum
            const levelMap: Record<string, string> = {
                'Muito Baixo': 'VERY_LOW',
                'Baixo': 'LOW',
                'Médio': 'AVERAGE',
                'Alto': 'HIGH',
                'Muito Alto': 'VERY_HIGH'
            };
            const rangeEnum = levelMap[level] || 'AVERAGE';
            
            // Filtrar textos da config
            // @ts-ignore
            const relevantTexts = config.interpretativeTexts ? config.interpretativeTexts.filter((t: any) => 
                t.traitKey === trait.traitKey && t.scoreRange === rangeEnum
            ) : [];
    `;
    
    content = content.replace(pushPoint, logic + '\n            ' + pushPoint);
    
    const customTextsField = `
                customTexts: {
                    summary: relevantTexts.find((t: any) => t.category === 'SUMMARY')?.text,
                    practicalImpact: relevantTexts.filter((t: any) => t.category === 'PRACTICAL_IMPACT').map((t: any) => ({ context: t.context, text: t.text })),
                    expertSynthesis: relevantTexts.find((t: any) => t.category === 'EXPERT_SYNTHESIS')?.text,
                    expertHypothesis: relevantTexts.filter((t: any) => t.category === 'EXPERT_HYPOTHESIS').map((t: any) => ({ type: t.context, text: t.text }))
                },
    `;
    content = content.replace('facets: facets', 'facets: facets,\n' + customTextsField);
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Interpretation Service updated');
