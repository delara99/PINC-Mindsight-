const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles || [];

    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function getBackPath(filePath) {
    // filePath example: src/components/auth/file.tsx
    // dir: src/components/auth
    // relative to root: ../../../

    // Normalize path just in case
    const normalized = path.normalize(filePath);
    const dir = path.dirname(normalized);

    // Count segments relative to root (assuming script is run from root)
    const segments = dir.split(path.sep).filter(s => s !== '.' && s !== '');

    let back = '';
    for (let i = 0; i < segments.length; i++) {
        back += '../';
    }
    return back;
}

// BUSCAR EM APP E SRC
const files = [...getAllFiles('app'), ...getAllFiles('src')];

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const backPath = getBackPath(file);

    // Substituir @/src por backPath + src
    // Regex: from '@/(src/.*?)'
    const regex = /from ['"]@\/(src\/.*?)['"]/g;

    if (regex.test(content)) {
        const newContent = content.replace(regex, (match, p1) => {
            // Se estivermos dentro de src, backPath volta para root, e depois entra em src
            return `from '${backPath}${p1}'`;
        });

        if (content !== newContent) {
            console.log(`Fixing ${file}`);
            fs.writeFileSync(file, newContent);
            count++;
        }
    }
});

console.log(`Fixed ${count} files.`);
