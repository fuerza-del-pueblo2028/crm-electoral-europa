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

async function backfillPadron() {
    console.log("🚀 Starting Padron Backfill...");

    // 1. Fetch all affiliates
    // Using simple pagination loop just in case, though for <1000 it's fine in one go.
    // Max 1000 per request usually.
    let allAffiliates = [];
    const { data, error } = await supabase.from('afiliados').select('*');

    if (error) {
        console.error("Error fetching afiliados:", error);
        return;
    }

    allAffiliates = data || [];
    console.log(`📥 Fetched ${allAffiliates.length} affiliates from 'afiliados' table.`);

    if (allAffiliates.length === 0) {
        console.log("No affiliates to migrate.");
        return;
    }

    // 2. Prepare data for 'elecciones_padron'
    // Filter out rows without cedula or name
    const validAffiliates = allAffiliates.filter(a => a.cedula && a.nombre);

    const padronRows = validAffiliates.map(a => ({
        nombre: (a.nombre || '') + (a.apellidos ? ' ' + a.apellidos : ''),
        cedula: a.cedula.replace(/\D/g, ''), // Normalize: Remove non-digits
        // Email is required (NOT NULL). Generate placeholder if missing.
        email: a.email || `no-email-${a.cedula.replace(/\D/g, '')}@system.local`,
        fecha_nacimiento: a.fecha_nacimiento || '1900-01-01' // Fallback for date too just in case
    }));

    console.log(`🔄 Prepared ${padronRows.length} valid rows from ${allAffiliates.length} total.`);

    if (padronRows.length === 0) {
        console.log("❌ No valid rows to insert.");
        return;
    }

    // 3. Upsert
    const { data: insertData, error: insertError } = await supabase
        .from('elecciones_padron')
        .upsert(padronRows, { onConflict: 'cedula', ignoreDuplicates: true });

    if (insertError) {
        console.error("❌ Error running upsert:", insertError);
    } else {
        console.log("✅ Backfill Complete!");
        console.log("   (Note: 'ignoreDuplicates: true' means existing padron members were not overwritten)");

        // 4. Verify count
        const { count } = await supabase.from('elecciones_padron').select('*', { count: 'exact', head: true });
        console.log(`📊 Total records in 'elecciones_padron' now: ${count}`);
    }
}

backfillPadron();
