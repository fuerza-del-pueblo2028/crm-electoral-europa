const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
} catch (e) { console.error(e); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("🔍 Inspecting 'elecciones_padron' schema...");

    // We can't query information_schema easily via supabase-js without permissions or RPC.
    // So we will try to INSERT a row with just a dummy cedula (PK) and catch the error to see WHICH column fails.

    // Attempt 1: Just cedula (assuming it's the only strictly required business field)
    const { error: e1 } = await supabase.from('elecciones_padron').insert([{ cedula: 'TEST_001' }]);
    if (e1) console.log("Trial 1 (Cedula only) Error:", e1.message, e1.details);
    else { console.log("Trial 1 success (deleted afterwards)"); await supabase.from('elecciones_padron').delete().eq('cedula', 'TEST_001'); }

    // Attempt 2: Cedula + Nombre
    const { error: e2 } = await supabase.from('elecciones_padron').insert([{ cedula: 'TEST_002', nombre: 'Test Name' }]);
    if (e2) console.log("Trial 2 (Cedula+Nombre) Error:", e2.message, e2.details);
    else { console.log("Trial 2 success"); await supabase.from('elecciones_padron').delete().eq('cedula', 'TEST_002'); }

}

inspect();
