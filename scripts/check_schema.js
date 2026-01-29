const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // Intentar hacer un SELECT para ver la estructura
    const { data, error } = await supabase
        .from('europa_recintos_electorales')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Primera fila (si existe):', data);
        if (data && data.length > 0) {
            console.log('\nColumnas disponibles:', Object.keys(data[0]));
        }
    }

    // Intentar insertar un registro de prueba
    console.log('\n--Testing inserción--');
    const testRecinto = {
        seccional: 'Madrid',
        numero_recinto: 'TEST-001',
        nombre_recinto: 'Test Recinto',
        zona_ciudad: 'Test',
        total_electores: 100,
        total_colegios: 1
    };

    const { data: insertData, error: insertError } = await supabase
        .from('europa_recintos_electorales')
        .insert(testRecinto)
        .select();

    if (insertError) {
        console.error('Error en inserción de prueba:', insertError.message);
    } else {
        console.log('Inserción exitosa:', insertData);

        // Eliminar el registro de prueba
        await supabase
            .from('europa_recintos_electorales')
            .delete()
            .eq('numero_recinto', 'TEST-001');
        console.log('Registro de prueba eliminado');
    }
}

checkSchema().catch(console.error);

