
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found!');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function debugLogin(cedulaInput: string) {
    console.log(`🔍 Debugging login for: ${cedulaInput}`);

    const cleanCedula = cedulaInput.replace(/-/g, "").trim();
    let formattedCedula = cleanCedula;
    if (cleanCedula.length === 11) {
        formattedCedula = `${cleanCedula.substring(0, 3)}-${cleanCedula.substring(3, 10)}-${cleanCedula.substring(10)}`;
    }

    console.log(`   Clean: ${cleanCedula}`);
    console.log(`   Formatted: ${formattedCedula}`);

    console.log('--- Checking "usuarios" table ---');
    const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
        .maybeSingle();

    if (userError) console.error('Error fetching usuario:', userError);
    if (userData) {
        console.log('✅ Found in "usuarios":');
        console.log('   ID:', userData.id);
        console.log('   Cedula:', userData.cedula);
        console.log('   Role:', userData.rol);
        console.log('   Password (plain):', userData.password);
    } else {
        console.log('❌ Not found in "usuarios".');
    }

    console.log('--- Checking "afiliados" table ---');
    const { data: affiliateData, error: affError } = await supabaseAdmin
        .from('afiliados')
        .select('*')
        .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
        .maybeSingle();

    if (affError) console.error('Error fetching afiliado:', affError);
    if (affiliateData) {
        console.log('✅ Found in "afiliados":');
        console.log('   ID:', affiliateData.id);
        console.log('   Cedula:', affiliateData.cedula);

        const dbCedulaClean = affiliateData.cedula.replace(/-/g, "").trim();
        const expectedPassword = dbCedulaClean.substring(Math.max(0, dbCedulaClean.length - 6));
        console.log('   Expected Affiliate Password (last 6):', expectedPassword);
    } else {
        console.log('❌ Not found in "afiliados".');
    }
}

debugLogin('00100180025');
