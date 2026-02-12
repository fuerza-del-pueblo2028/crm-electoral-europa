const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually since we might not have 'dotenv'
// Assumes .env.local is in the root CWD
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

async function debugData() {
    console.log("--- Debugging Cedula Mismatch ---");

    // 1. Fetch sample from elecciones_padron
    const { data: padronData, error: padronError } = await supabase
        .from('elecciones_padron')
        .select('*')
        .limit(5);

    if (padronError) {
        console.error("Error fetching padron:", padronError);
        return;
    }

    console.log(`\n1. Sample from 'elecciones_padron' (${padronData.length} records):`);
    padronData.forEach(p => {
        console.log(`   - Cedula: '${p.cedula}' | Name: ${p.nombre}`);
    });

    // 2. Fetch sample from afiliados
    const { data: afiliadosData, error: affError } = await supabase
        .from('afiliados')
        .select('*')
        .limit(5);

    if (affError) {
        console.error("Error fetching afiliados:", affError);
        return;
    }

    console.log(`\n2. Sample from 'afiliados' (${afiliadosData.length} records):`);
    afiliadosData.forEach(a => {
        console.log(`   - Cedula: '${a.cedula}' | Seccional: ${a.seccional} | Name: ${a.nombres}`);
    });

    // 3. Try to find a match for the first padron entry in afiliados using different formats
    if (padronData.length > 0) {
        const testCedula = padronData[0].cedula;
        console.log(`\n3. Searching for match for Cedula: '${testCedula}' in afiliados...`);

        // Exact match
        const { data: exactMatch } = await supabase.from('afiliados').select('*').eq('cedula', testCedula);
        console.log(`   - Exact match found? ${exactMatch && exactMatch.length > 0 ? 'YES' : 'NO'}`);

        // Formatted match (remove dashes)
        const strippedCedula = testCedula.replace(/-/g, '').replace(/\s/g, '');
        const { data: strippedMatch } = await supabase.from('afiliados').select('*').eq('cedula', strippedCedula);
        console.log(`   - Stripped match ('${strippedCedula}') found? ${strippedMatch && strippedMatch.length > 0 ? 'YES' : 'NO'}`);
    }
}

debugData();
