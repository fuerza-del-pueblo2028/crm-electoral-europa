const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkAll() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    let report = '';
    const log = (msg) => { console.log(msg); report += msg + '\n'; };

    log('Checking ALL Recintos for suspicious entries...\n');

    const { data, error } = await supabase
        .from('europa_recintos_electorales')
        .select('*');

    if (error) {
        log('Error fetching data: ' + JSON.stringify(error));
    } else {
        log(`Total records: ${data.length}`);

        // Check for loose numbers around 151
        const targetNums = ['151', '00151', '152', '00152'];
        const found = data.filter(r => targetNums.includes(r.numero_recinto) || r.numero_recinto.includes('151'));

        if (found.length > 0) {
            log('Found records matching "151" (or similar):');
            found.forEach(r => {
                log(`[${r.id}] Seccional: "${r.seccional}" | Num: "${r.numero_recinto}" | Name: "${r.nombre_recinto}"`);
            });
        } else {
            log('No records found for number 151.');
        }

        // Check for records created recently (after import time)
        // Import time seems to be around 2026-01-22T01:52:21
        // Let's look for anything created after 02:00:00 UTC
        const importTime = new Date('2026-01-22T02:00:00Z').getTime();
        const newRecords = data.filter(r => new Date(r.created_at).getTime() > importTime);

        if (newRecords.length > 0) {
            log(`\nFound ${newRecords.length} records created after 02:00 UTC today:`);
            newRecords.forEach(r => {
                log(`[${r.id}] Seccional: "${r.seccional}" | Num: "${r.numero_recinto}" | Name: "${r.nombre_recinto}" | Created: ${r.created_at}`);
            });
        } else {
            log('\nNo new records found created after 02:00 UTC.');
        }

        // Identify the bad header row
        const badRow = data.find(r => r.numero_recinto === 'Número Recinto');
        if (badRow) {
            log(`\nConfirmed BAD HEADER ROW: ID=${badRow.id}`);
        }
    }

    fs.writeFileSync('all_report.txt', report);
}

checkAll().catch(err => {
    console.error(err);
    fs.writeFileSync('all_report.txt', 'CRITICAL ERROR: ' + err.toString());
});

