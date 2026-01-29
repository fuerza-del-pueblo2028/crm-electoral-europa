const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function investigateRecintos() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Investigating Recintos Data...\n');

    const { data, error } = await supabase
        .from('europa_recintos_electorales')
        .select('id, seccional, numero_recinto, nombre_recinto')
        .order('seccional');

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    // Process data
    const recintos = data.map(r => ({
        ...r,
        num: parseInt(r.numero_recinto)
    })).sort((a, b) => a.num - b.num);

    const bySeccional = {};
    const allNumbers = new Set();
    const numberToSeccional = {};

    data.forEach(r => {
        if (!bySeccional[r.seccional]) {
            bySeccional[r.seccional] = [];
        }
        const num = parseInt(r.numero_recinto);
        bySeccional[r.seccional].push(num);
        allNumbers.add(num);
        numberToSeccional[num] = r.seccional;
    });

    const fs = require('fs');
    let report = '';
    const log = (msg) => { console.log(msg); report += msg + '\n'; };

    log('--- Summary by Seccional ---');
    for (const [secc, nums] of Object.entries(bySeccional)) {
        nums.sort((a, b) => a - b);
        const min = nums[0];
        const max = nums[nums.length - 1];
        const count = nums.length;
        log(`${secc}: Count=${count}, Range=[${min} - ${max}]`);
    }

    console.log('\n--- Missing Range Analysis (151 - 354) ---');
    const missingRange = [];
    const foundInOther = [];

    for (let i = 151; i <= 354; i++) {
        if (!allNumbers.has(i)) {
            missingRange.push(i);
        } else {
            foundInOther.push({ num: i, seccional: numberToSeccional[i] });
        }
    }

    if (missingRange.length > 0) {
        log(`Gap detected: ${missingRange.length} numbers are missing entirely from the database in the range 151-354.`);
        if (missingRange.length < 20) {
            log('Missing numbers: ' + missingRange.join(', '));
        } else {
            log('First 10 missing: ' + missingRange.slice(0, 10).join(', '));
            log('Last 10 missing: ' + missingRange.slice(-10).join(', '));
        }
    } else {
        log('No totally missing numbers in range 151-354.');
    }

    if (foundInOther.length > 0) {
        log('\nSome numbers in the suspected gap exist in other Seccionales:');
        const breakdown = {};
        foundInOther.forEach(item => {
            if (!breakdown[item.seccional]) breakdown[item.seccional] = 0;
            breakdown[item.seccional]++;
        });
        log(JSON.stringify(breakdown, null, 2));
    }

    // Check specific Valencia gap if any
    const valenciaNums = bySeccional['Valencia'] || [];
    if (valenciaNums.length > 0) {
        log(`\nValencia starts at: ${valenciaNums[0]}`);
        log(`Valencia ends at: ${valenciaNums[valenciaNums.length - 1]}`);
    } else {
        log('\nNo records found for Valencia.');
    }

    fs.writeFileSync('investigation_report.txt', report);


}

investigateRecintos().catch(console.error);

