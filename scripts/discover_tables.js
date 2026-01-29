const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Intentando descubrir las tablas de Europa...\n');
console.log(`Conectando a: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverTables() {
    // Intentar con diferentes nombres posibles
    const possibleTables = [
        'europa_recintos_electorales',
        'europa_recintos',
        'recintos_europa',
        'europa_presidentes_dm',
        'presidentes_dm',
        'europa_colegios',
        'colegios_europa'
    ];

    console.log('Probando diferentes nombres de tablas...\n');

    for (const tableName of possibleTables) {
        const { data, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (!error) {
            console.log(`✅ ENCONTRADA: ${tableName} (${data !== null ? 'accesible' : 'existe pero no accesible'})`);
        } else if (error.code === 'PGRST116') {
            console.log(`❌ NO EXISTE: ${tableName}`);
        } else {
            console.log(`⚠️  EXISTE PERO BLOQUEADA: ${tableName} - ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('CONCLUSIÓN:');
    console.log('Si ves "BLOQUEADA", las tablas existen pero el RLS está activo.');
    console.log('Si ves "NO EXISTE", las tablas no se crearon correctamente.');
    console.log('Si ves "ENCONTRADA", todo está bien y podemos importar.');
}

discoverTables().catch(console.error);

