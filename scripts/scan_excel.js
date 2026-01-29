const XLSX = require('xlsx');
const fs = require('fs');

console.log('Reading Excel file...');
const workbook = XLSX.readFile('datos_europa.xlsx');
const sheetNames = workbook.SheetNames;

console.log('Sheets found:', sheetNames.join(', '));

const missingStart = 151;
const missingEnd = 355;
const found = [];

sheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    console.log(`Scanning sheet: ${sheetName} (${range.e.r + 1} rows)`);

    // Convert to JSON to verify content easily
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                let num = parseInt(cell);
                // Check if it's a string looking like a number
                if (typeof cell === 'string') {
                    // Remove non-numeric chars if needed, but simple parseInt is safer to avoid false positives
                    // Recinto IDs are usually like '00151'
                    if (cell.match(/^\d+$/)) {
                        num = parseInt(cell);
                    }
                }

                if (!isNaN(num) && num >= missingStart && num <= missingEnd) {
                    // Try to filter out noise (like totals or unrelated numbers)
                    // Recinto numbers usually have a specific column.
                    // But scanning all is safer to find "lost" records.

                    found.push({
                        sheet: sheetName,
                        row: rowIndex + 1,
                        col: colIndex,
                        value: cell,
                        context: row.join(' | ').substring(0, 100) // snippet
                    });
                }
            }
        });
    });
});

console.log('\n--- Scan Results ---');
if (found.length > 0) {
    console.log(`Found ${found.length} potential matches in the missing range [${missingStart}-${missingEnd}].`);

    console.log('Sample matches:');
    found.slice(0, 20).forEach(f => {
        console.log(`[${f.sheet} R${f.row}] Val: ${f.value} | Context: ${f.context}`);
    });
} else {
    console.log('NO matches found in the entire Excel file for the range 151-355.');
    console.log('The missing recintos are NOT in the source file.');
}

