const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
    console.log('🔍 Test rápido de inserción...\n');

    const testData = {
        seccional: 'Madrid',
        numero_recinto: 'TEST-999',
        nombre_recinto: 'Recinto de Prueba',
        zona_ciudad: 'Test Ciudad',
        total_electores: 500,
        total_colegios: 2,
        colegios_numeros: '001, 002'
    };

    console.log('Intentando insertar registro de prueba...');
    const { data, error } = await supabase
        .from('europa_recintos_electorales')
        .insert(testData)
        .select();

    if (error) {
        console.log('\n❌ ERROR:', error.message);
        if (error.message.includes('row-level security')) {
            console.log('\n⚠️  EL RLS SIGUE ACTIVO');
            console.log('Por favor ejecuta disable_rls.sql en Supabase SQL Editor');
        } else if (error.message.includes('colegios_numeros')) {
            console.log('\n⚠️  PROBLEMA CON NOMBRE DE COLUMNA');
            console.log('La columna colegios_numeros no existe en la tabla');
        }
    } else {
        console.log('\n✅ ÉXITO! El registro se insertó correctamente');
        console.log('Datos insertados:', data);

        // Limpiar
        await supabase
            .from('europa_recintos_electorales')
            .delete()
            .eq('numero_recinto', 'TEST-999');
        console.log('✅ Registro de prueba eliminado');

        console.log('\n🎯 TODO LISTO PARA IMPORTAR');
        console.log('Ejecuta: node import_europa_data.js');
    }
}

quickTest().catch(console.error);

