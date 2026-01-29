const fs = require('fs');

const data = JSON.parse(fs.readFileSync('datos_europa_analysis.json', 'utf8'));

const missingStart = 151;
const missingEnd = 355;
const found = [];

console.log('Scanning JSON for missing recintos...');

function scanRows(rows, seccionalName) {
    if (!rows || !Array.isArray(rows)) return;

    rows.forEach(row => {
        // Row is an array of strings/numbers.
        // We look for the number in the row corresponding to "Número Recinto".
        // Based on previous view, it's often index 1 or 2 depending on the sheet.
        // Let's just search all columns for the number matching our range.

        row.forEach(cell => {
            if (typeof cell === 'string' || typeof cell === 'number') {
                const num = parseInt(cell);
                if (!isNaN(num) && num >= missingStart && num <= missingEnd) {
                    // Verify if it looks like a recinto number (often padded like 00151)
                    // But parseInt handles 00151 as 151.
                    // To be sure it's a recinto ID, we might check context, but for now just logging presence is enough.

                    // Optimization: avoid duplicates in 'found' list if possible, or just log everything.
                    found.push({
                        seccional: seccionalName,
                        value: cell,
                        fullRow: row
                    });
                }
            }
        });
    });
}

for (const [key, value] of Object.entries(data)) {
    console.log(`Scanning ${key}...`);
    // The JSON structure has 'firstRows', but 'totalRows' suggests there might be more not in 'firstRows'?
    // Wait, 'datos_europa_analysis.json' only had 'firstRows' in the view?
    // If the JSON is truncated or only contains a sample, I can't be sure 100%.
    // But usually analysis JSONs might be summaries.
    // Let's check 'firstRows'. If the analysis file is just a preview, I might need to parse the Excel directly.
    // But let's check what we have.
    scanRows(value.firstRows, key);
}

console.log(`\nFound ${found.length} potential matches.`);
if (found.length > 0) {
    console.log('Sample matches:');
    found.slice(0, 5).forEach(f => console.log(`${f.seccional}: ${f.value}`));
} else {
    console.log('No matches found in the analysis JSON preview.');
    console.log('Note: This analysis file might only contain the first few rows of each sheet.');
}

