import * as XLSX from 'xlsx';
import * as path from 'path';

/**
 * SCRIPT: Inspecionar Planilha
 * Mostra estrutura da planilha para entender formato
 */

async function inspectSpreadsheet() {
    const excelPath = path.join(__dirname, '../data/specialist-spreadsheets/respostas-cristiano.xlsx');

    console.log('='.repeat(80));
    console.log('INSPEÇÃO DA PLANILHA');
    console.log('='.repeat(80));
    console.log(`\nArquivo: ${excelPath}\n`);

    const workbook = XLSX.readFile(excelPath);

    console.log(`Planilhas encontradas: ${workbook.SheetNames.length}`);
    workbook.SheetNames.forEach((name, i) => {
        console.log(`  ${i + 1}. ${name}`);
    });

    // Ler primeira planilha
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`\n📊 Analisando planilha: "${sheetName}"\n`);
    console.log(`Total de linhas: ${data.length}\n`);

    // Mostrar primeiras 20 linhas
    console.log('PRIMEIRAS 20 LINHAS (formato RAW):\n');
    data.slice(0, 20).forEach((row: any, index) => {
        console.log(`Linha ${index + 1}:`, JSON.stringify(row));
    });

    // Tentar ler como objeto
    const dataAsObjects = XLSX.utils.sheet_to_json(worksheet);

    console.log(`\n\nPRIMEIROS 5 OBJETOS:\n`);
    dataAsObjects.slice(0, 5).forEach((obj: any, index) => {
        console.log(`\nObjeto ${index + 1}:`);
        console.log(JSON.stringify(obj, null, 2));
    });

    console.log('\n' + '='.repeat(80));
}

inspectSpreadsheet().catch(console.error);
