const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkMilano() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    let output = '';
    const log = (msg) => { console.log(msg); output += msg + '\n'; };

    log('Checking Recintos for Milano...\n');

    const { data, error } = await supabase
        .from('europa_recintos_electorales')
        .select('*')
        .eq('seccional', 'Milano');

    if (error) {
        log('Error fetching data: ' + JSON.stringify(error));
        fs.writeFileSync('milano_report.txt', output);
        return;
    }

    log(`Found ${data.length} records for Milano.`);

    // Sort by numero_recinto to match UI potentially (string sort)
    data.sort((a, b) => (a.numero_recinto || '').localeCompare(b.numero_recinto || ''));

    data.forEach(r => {
        log(`[${r.id}] Num: "${r.numero_recinto}" | Name: "${r.nombre_recinto}" | Created: ${r.created_at || 'N/A'}`);
    });

    fs.writeFileSync('milano_report.txt', output);
}

checkMilano().catch(console.error);

