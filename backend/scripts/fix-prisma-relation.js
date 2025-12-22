const fs = require('fs');
const path = 'backend/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('interpretativeTexts BigFiveInterpretativeText[]')) {
    const anchor = 'traits      BigFiveTraitConfig[]';
    if (content.includes(anchor)) {
        content = content.replace(anchor, anchor + '\n  interpretativeTexts BigFiveInterpretativeText[]');
        fs.writeFileSync(path, content, 'utf-8');
        console.log('Relation added to BigFiveConfig');
    } else {
        // Tentar outra âncora se falhar (ex: assignments)
        const anchor2 = 'assignments AssessmentAssignment[]';
        if (content.includes(anchor2)) {
            content = content.replace(anchor2, anchor2 + '\n  interpretativeTexts BigFiveInterpretativeText[]');
            fs.writeFileSync(path, content, 'utf-8');
            console.log('Relation added to BigFiveConfig (anchor 2)');
        } else {
            console.log('Could not find anchor in BigFiveConfig');
        }
    }
} else {
    console.log('Relation already exists');
}
