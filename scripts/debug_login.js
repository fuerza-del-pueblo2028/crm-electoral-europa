
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function log(msg) {
    console.log(msg);
    fs.appendFileSync('debug_log.txt', msg + '\n', 'utf8');
}

if (!serviceRoleKey) {
    log('❌ SUPABASE_SERVICE_ROLE_KEY not found!');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function debugLogin(cedulaInput) {
    fs.writeFileSync('debug_log.txt', '', 'utf8'); // Clear log
    log(`🔍 Debugging login for: ${cedulaInput}`);

    const cleanCedula = cedulaInput.replace(/-/g, "").trim();
    let formattedCedula = cleanCedula;
    if (cleanCedula.length === 11) {
        formattedCedula = `${cleanCedula.substring(0, 3)}-${cleanCedula.substring(3, 10)}-${cleanCedula.substring(10)}`;
    }

    log(`   Clean: ${cleanCedula}`);
    log(`   Formatted: ${formattedCedula}`);

    log('--- Checking "usuarios" table ---');
    const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
        .maybeSingle();

    if (userError) log('Error fetching usuario: ' + JSON.stringify(userError));
    if (userData) {
        log('✅ Found in "usuarios":');
        log('   ID: ' + userData.id);
        log('   Cedula: ' + userData.cedula);
        log('   Role: ' + userData.rol);
        log('   Password (plain): ' + userData.password);
    } else {
        log('❌ Not found in "usuarios".');
    }

    log('--- Checking "afiliados" table ---');
    const { data: affiliateData, error: affError } = await supabaseAdmin
        .from('afiliados')
        .select('*')
        .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
        .maybeSingle();

    if (affError) log('Error fetching afiliado: ' + JSON.stringify(affError));
    if (affiliateData) {
        log('✅ Found in "afiliados":');
        log('   ID: ' + affiliateData.id);
        log('   Cedula: ' + affiliateData.cedula);

        const dbCedulaClean = affiliateData.cedula.replace(/-/g, "").trim();
        const expectedPassword = dbCedulaClean.substring(Math.max(0, dbCedulaClean.length - 6));
        log('   Expected Affiliate Password (last 6): ' + expectedPassword);
    } else {
        log('❌ Not found in "afiliados".');
    }
}

debugLogin('00100180025');
