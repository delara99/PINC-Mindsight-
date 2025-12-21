const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

function getBackPath(filePath) {
    // filePath example: app/dashboard/page.tsx
    // path.dirname: app/dashboard
    // relative to root from app/dashboard is ../../

    // Normalize path just in case
    const normalized = path.normalize(filePath);
    const dir = path.dirname(normalized);

    // Count segments
    const segments = dir.split(path.sep).filter(s => s !== '.' && s !== '');

    let back = '';
    for (let i = 0; i < segments.length; i++) {
        back += '../';
    }
    return back;
}

const files = getAllFiles('app');

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const backPath = getBackPath(file);

    // Substituir @/src por backPath + src
    // Regex: from '@/(src/.*?)'
    const regex = /from ['"]@\/(src\/.*?)['"]/g;

    if (regex.test(content)) {
        const newContent = content.replace(regex, (match, p1) => {
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
