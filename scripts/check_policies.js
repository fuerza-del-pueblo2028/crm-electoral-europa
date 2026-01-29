const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkPolicies() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    let report = '';
    const log = (msg) => { console.log(msg); report += msg + '\n'; };

    log('Checking Policies (Corrected)...\n');

    const testNum = '99999';
    const testRecord = {
        // id: Omitted, let Supabase generate UUID
        seccional: 'Milano',
        numero_recinto: testNum,
        nombre_recinto: 'TEST RECINTO RLS CHECK',
        zona_ciudad: 'TEST ZONE',
        direccion: 'TEST ADDR',
        total_electores: 0,
        total_colegios: 0
    };

    log('Attempting to insert test record: ' + JSON.stringify(testRecord));
    const { data: insertedData, error: insertError } = await supabase
        .from('europa_recintos_electorales')
        .insert([testRecord])
        .select();

    if (insertError) {
        log('Insert Failed: ' + JSON.stringify(insertError));
    } else {
        log('Insert Success. Returned data: ' + JSON.stringify(insertedData));

        // If select() worked during insert, RLS likely allows selecting own rows?
        // But let's try a fresh select to be sure

        const { data, error: selectError } = await supabase
            .from('europa_recintos_electorales')
            .select('*')
            .eq('numero_recinto', testNum);

        if (selectError) {
            log('Select Failed: ' + JSON.stringify(selectError));
        } else if (data.length === 0) {
            log('Select returned NO rows. RLS might be hiding the inserted row.');
        } else {
            log('Read Success! Found: ' + JSON.stringify(data[0]));

            log('Cleaning up...');
            await supabase.from('europa_recintos_electorales').delete().eq('numero_recinto', testNum);
        }
    }

    fs.writeFileSync('policy_report.txt', report);
}

checkPolicies().catch(err => {
    console.error(err);
    fs.writeFileSync('policy_report.txt', 'CRITICAL ERROR: ' + err.toString());
});

