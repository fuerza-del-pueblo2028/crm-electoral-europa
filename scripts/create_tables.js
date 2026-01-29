const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../.env.local' });

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🚀 Creando tablas en Supabase...\n');
console.log(`📡 URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno no configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Leer el archivo SQL
const sqlContent = fs.readFileSync('supabase_europa_schema.sql', 'utf8');

// Dividir en statements individuales (aproximadamente)
const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📄 ${statements.length} statements SQL encontrados\n`);

async function createTables() {
    console.log('⚠️  NOTA: Este script usa la anon key que tiene permisos limitados.');
    console.log('⚠️  Para crear tablas, necesitas usar el SERVICE_ROLE_KEY o ejecutar');
    console.log('⚠️  el SQL directamente en el SQL Editor de Supabase Dashboard.\n');
    console.log('🔗 Abre: https://supabase.com/dashboard/project/oydqzttivnrqxlziwnwn/sql\n');
    console.log('📋 Copia y pega el contenido de: supabase_europa_schema.sql\n');
    console.log('Presiona CTRL+C para cancelar o espera 5 segundos...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Intentar verificar si las tablas ya existen
    console.log('\n🔍 Verificando tablas existentes...\n');

    const tables = ['europa_recintos_electorales', 'europa_presidentes_dm', 'europa_colegios'];

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('count')
            .limit(1);

        if (error) {
            console.log(`❌ ${table}: No existe (${error.message})`);
        } else {
            console.log(`✅ ${table}: Ya existe`);
        }
    }

    console.log('\n📖 INSTRUCCIONES:');
    console.log('1. Abre https://supabase.com/dashboard/project/oydqzttivnrqxlziwnwn/sql');
    console.log('2. Copia el contenido de supabase_europa_schema.sql');
    console.log('3. Pégalo en el SQL Editor');
    console.log(`4. Click en "RUN"`);
    console.log('5. Ejecuta este script de nuevo para verificar');
}

createTables().catch(console.error);

