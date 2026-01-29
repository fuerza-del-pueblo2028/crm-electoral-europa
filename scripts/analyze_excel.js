const XLSX = require('xlsx');
const fs = require('fs');

// Leer el archivo Excel
const workbook = XLSX.readFile('datos_europa.xlsx');

console.log('=== HOJAS ENCONTRADAS ===');
console.log(workbook.SheetNames);
console.log('\n');

// Procesar cada hoja
workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    console.log(`\n=== HOJA ${index + 1}: ${sheetName} ===`);
    console.log(`Total de filas: ${data.length}`);

    // Mostrar primeras 5 filas
    console.log('\nPrimeras filas:');
    data.slice(0, 5).forEach((row, i) => {
        console.log(`Fila ${i}:`, row);
    });

    // Detectar headers (primera fila no vacía)
    let headerRow = null;
    for (let i = 0; i < data.length; i++) {
        if (data[i].some(cell => cell && cell.toString().trim() !== '')) {
            headerRow = data[i];
            console.log(`\nHeaders (fila ${i}):`, headerRow);
            break;
        }
    }

    console.log('\n' + '='.repeat(60));
});

// Guardar análisis completo en JSON
const analysis = {};
workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    analysis[sheetName] = {
        totalRows: data.length,
        firstRows: data.slice(0, 10),
        headers: data.find(row => row.some(cell => cell && cell.toString().trim() !== ''))
    };
});

fs.writeFileSync('datos_europa_analysis.json', JSON.stringify(analysis, null, 2));
console.log('\n\n✅ Análisis guardado en datos_europa_analysis.json');

