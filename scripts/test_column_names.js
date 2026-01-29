const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Verificando estructura de tabla en Supabase...\n');

// Método alternativo: intentar insertar con diferentes nombres de columna
async function testColumnNames() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Con 'colegios'
    console.log('Test 1: Intentando con columna "colegios"');
    const test1 = {
        seccional: 'Madrid',
        numero_recinto: 'TEST-001',
        nombre_recinto: 'Test',
        zona_ciudad: 'Test',
        total_electores: 100,
        total_colegios: 1,
        colegios: '001, 002'
    };

    const { error: error1 } = await supabase
        .from('europa_recintos_electorales')
        .insert(test1)
        .select();

    if (error1) {
        console.log('❌ Error con "colegios":', error1.message);
    } else {
        console.log('✅ Funciona con "colegios"');
        await supabase.from('europa_recintos_electorales').delete().eq('numero_recinto', 'TEST-001');
    }

    // Test 2: Con 'colegios_numeros'
    console.log('\nTest 2: Intentando con columna "colegios_numeros"');
    const test2 = {
        seccional: 'Madrid',
        numero_recinto: 'TEST-002',
        nombre_recinto: 'Test',
        zona_ciudad: 'Test',
        total_electores: 100,
        total_colegios: 1,
        colegios_numeros: '001, 002'
    };

    const { error: error2 } = await supabase
        .from('europa_recintos_electorales')
        .insert(test2)
        .select();

    if (error2) {
        console.log('❌ Error con "colegios_numeros":', error2.message);
    } else {
        console.log('✅ Funciona con "colegios_numeros"');
        await supabase.from('europa_recintos_electorales').delete().eq('numero_recinto', 'TEST-002');
    }

    console.log('\n' + '='.repeat(50));
    console.log('Conclusión:');
    if (!error1) {
        console.log('✅ Usar: colegios');
    } else if (!error2) {
        console.log('✅ Usar: colegios_numeros');
    } else {
        console.log('❌ Ninguna funcionó. Necesitas ejecutar el SQL en Supabase Dashboard.');
    }
}

testColumnNames().catch(console.error);

