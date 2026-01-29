// Intentemos importar directamente y ver qué pasa
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function quickImport() {
    console.log('🚀 Intentando importar un recinto de prueba...\n');

    const testRecinto = {
        seccional: 'Madrid',
        numero_recinto: '00063',
        nombre_recinto: 'QUINTA DE SERVAJTE SALA DE ESPOSICIONES',
        zona_ciudad: 'ALCALÁ',
        direccion: 'C/ Navarro y Ledesma 1,3.28007',
        total_electores: 1156,
        total_colegios: 2,
        colegios: '230 y 231'
    };

    const { data, error } = await supabase
        .from('europa_recintos_electorales')
        .upsert(testRecinto, { onConflict: 'seccional,numero_recinto' })
        .select();

    if (error) {
        console.log('❌ ERROR:', error.message);
        console.log('\nCódigo de error:', error.code);
        console.log('Detalles:', error.details);

        if (error.message.includes('row-level security')) {
            console.log('\n⚠️  EL RLS SIGUE ACTIVO - NECESITAS DESACTIVARLO EN SUPABASE');
            console.log('Ejecuta en SQL Editor:');
            console.log('ALTER TABLE europa_recintos_electorales DISABLE ROW LEVEL SECURITY;');
        }
    } else {
        console.log('✅ ÉXITO! Recinto insertado:', data);
        console.log('\n🎯 Ahora puedes ejecutar: node import_europa_data.js');
    }

    // Verificar cuántos hay
    const { count } = await supabase
        .from('europa_recintos_electorales')
        .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total de recintos en la BD: ${count || 'No accesible'}`);
}

quickImport().catch(console.error);

