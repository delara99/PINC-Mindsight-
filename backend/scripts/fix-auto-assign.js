const fs = require('fs');

const files = [
    'backend/src/user/user.controller.ts',
    'backend/src/assessment/assessment.controller.ts'
];

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf-8');
        let modified = false;

        // Pattern 1: user.tenantId
        const regex1 = /where:\s*\{\s*tenantId:\s*user\.tenantId,\s*type:\s*'BIG_FIVE'\s*\}/g;
        if (regex1.test(content)) {
             content = content.replace(regex1, "where: { tenantId: user.tenantId, type: 'BIG_FIVE' }, orderBy: { createdAt: 'desc' }");
             modified = true;
             console.log(`Updated ${file} (Pattern: user.tenantId)`);
        }

        // Pattern 2: assignment.user.tenantId
        const regex2 = /where:\s*\{\s*tenantId:\s*assignment\.user\.tenantId,\s*type:\s*'BIG_FIVE'\s*\}/g;
        if (regex2.test(content)) {
             content = content.replace(regex2, "where: { tenantId: assignment.user.tenantId, type: 'BIG_FIVE' }, orderBy: { createdAt: 'desc' }");
             modified = true;
             console.log(`Updated ${file} (Pattern: assignment.user.tenantId)`);
        }

        if (modified) {
            fs.writeFileSync(file, content, 'utf-8');
        } else {
            console.log(`No matches found in ${file}`);
        }
    } catch (e) {
        console.error(`Error processing ${file}: ${e.message}`);
    }
});
