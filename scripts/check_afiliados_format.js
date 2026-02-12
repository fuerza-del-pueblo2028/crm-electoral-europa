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
} catch (e) { }

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDashes() {
    console.log("🔍 Checking 'afiliados' for dashes in cedula...");

    const { data, error } = await supabase
        .from('afiliados')
        .select('cedula')
        .ilike('cedula', '%-%'); // Search for dashes

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} records with dashes in 'afiliados'.`);
    if (data.length > 0) {
        console.log("Sample:", data.slice(0, 3));
    } else {
        console.log("No records with dashes found.");
    }
}

checkDashes();
