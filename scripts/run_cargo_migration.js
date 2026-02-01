const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://iqoefipqfmmtqpynoxbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxb2VmaXBxZm1tdHFweW5veGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyNzUxNTksImV4cCI6MjA1Mjg1MTE1OX0._gP0M_fHs6pN6_4fIW8w5bGLxIhD36cHm3NeW3wL-6U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🔄 Ejecutando migración: Agregar campo cargo_organizacional...\n');

    try {
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'add_cargo_organizacional.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Extraer solo la línea de ALTER TABLE
        const alterStatement = `ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS cargo_organizacional TEXT;`;

        console.log('📝 Ejecutando:', alterStatement);

        // Ejecutar el SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: alterStatement
        });

        if (error) {
            // Si el RPC no existe, intentar directamente
            console.log('⚠️  RPC exec_sql no disponible, intentando método alternativo...');

            // Verificar si la columna ya existe
            const { data: columns } = await supabase
                .from('afiliados')
                .select('cargo_organizacional')
                .limit(1);

            if (columns) {
                console.log('✅ La columna cargo_organizacional ya existe en la tabla afiliados');
            } else {
                console.log('⚠️  No se pudo verificar. Por favor ejecuta manualmente en Supabase SQL Editor:');
                console.log('\n' + alterStatement + '\n');
            }
        } else {
            console.log('✅ Columna agregada exitosamente');
        }

        // Verificar la estructura
        console.log('\n🔍 Verificando estructura de la tabla...');
        const { data: testData, error: testError } = await supabase
            .from('afiliados')
            .select('id, nombre, cargo_organizacional')
            .limit(1);

        if (!testError) {
            console.log('✅ Verificación exitosa. Campo cargo_organizacional disponible.');
            console.log('📊 Datos de prueba:', testData);
        } else {
            console.log('⚠️  Error en verificación:', testError.message);
        }

        console.log('\n✨ Proceso completado');

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        console.log('\n📝 Por favor ejecuta manualmente este SQL en Supabase SQL Editor:');
        console.log('\nALTER TABLE afiliados ADD COLUMN IF NOT EXISTS cargo_organizacional TEXT;\n');
    }
}

runMigration();
