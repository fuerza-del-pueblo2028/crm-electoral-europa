const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
        }
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
        }
    });
} catch (e) {
    console.error("Error reading .env.local", e);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatches() {
    console.log("--- Analyzing Padron vs Afiliados Match ---");

    // 1. Fetch ALL from padron (it's small)
    const { data: padron, error: pErr } = await supabase.from('elecciones_padron').select('*');
    if (pErr) { console.error("Padron Error:", pErr); return; }

    console.log(`Total Padron Records: ${padron.length}`);

    // 2. Normalize Padron Cedulas
    const normalizedPadron = padron.map(p => ({
        ...p,
        cleanCedula: p.cedula.replace(/-/g, '').replace(/\s/g, '')
    }));

    // 3. Fetch matched afiliados
    // We can't fetch ALL afiliados (might be huge), so let's fetch matches for our clean cedulas
    const cleanCedulas = normalizedPadron.map(p => p.cleanCedula);

    // Fetch in specific cedulas
    const { data: afiliados, error: aErr } = await supabase
        .from('afiliados')
        .select('*')
        .in('cedula', cleanCedulas);

    if (aErr) { console.error("Afiliados Error:", aErr); return; }

    console.log(`Matched Afiliados Records: ${afiliados.length} (out of ${padron.length} in padron)`);

    // 4. Analyze Mismatches & Seccional Values
    let matchCount = 0;
    const seccionalesFound = new Set();

    normalizedPadron.forEach(p => {
        const match = afiliados.find(a => a.cedula === p.cleanCedula);
        if (match) {
            matchCount++;
            seccionalesFound.add(match.seccional);
            console.log(`[MATCH] ${p.nombre} (${p.cedula}) -> Seccional: '${match.seccional}'`);
        } else {
            console.log(`[NO_MATCH] ${p.nombre} (${p.cedula}) -> Clean: ${p.cleanCedula} not found in afiliados response.`);
        }
    });

    console.log("\n--- Summary ---");
    console.log(`Matches: ${matchCount} / ${padron.length}`);
    console.log("Unique Seccionales Found:", Array.from(seccionalesFound));
}

checkMatches();
