const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkAffiliatesRLS() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    let report = '';
    const log = (msg) => { console.log(msg); report += msg + '\n'; };

    log('Verificando RLS de tabla afiliados...\n');

    // Intentar eliminar un registro de prueba
    const testId = 'test-delete-' + Date.now();

    // Primero intentar insertar
    log('1. Intentando insertar registro de prueba...');
    const { data: insertData, error: insertError } = await supabase
        .from('afiliados')
        .insert([{
            nombre: 'TEST',
            apellidos: 'DELETE',
            cedula: '99999999999',
            seccional: 'Madrid',
            validado: false,
            role: 'Miembro'
        }])
        .select();

    if (insertError) {
        log('   ERROR al insertar: ' + JSON.stringify(insertError));
    } else {
        const insertedId = insertData[0]?.id;
        log('   ✓ Insertado con ID: ' + insertedId);

        // Intentar eliminar
        log('\n2. Intentando eliminar el registro...');
        const { error: deleteError } = await supabase
            .from('afiliados')
            .delete()
            .eq('id', insertedId);

        if (deleteError) {
            log('   ERROR al eliminar: ' + JSON.stringify(deleteError));
            log('   Código de error: ' + deleteError.code);
        } else {
            log('   ✓ Eliminación exitosa');

            // Verificar que se eliminó
            const { data: checkData } = await supabase
                .from('afiliados')
                .select('id')
                .eq('id', insertedId);

            if (checkData && checkData.length > 0) {
                log('   ⚠️ ADVERTENCIA: El registro AÚN EXISTE después de "eliminar"');
            } else {
                log('   ✓ Confirmado: Registro eliminado de la base de datos');
            }
        }
    }

    fs.writeFileSync('afiliados_rls_report.txt', report);
    log('\n✓ Reporte guardado en afiliados_rls_report.txt');
}

checkAffiliatesRLS().catch(err => {
    console.error(err);
    fs.writeFileSync('afiliados_rls_report.txt', 'ERROR CRÍTICO: ' + err.toString());
});

