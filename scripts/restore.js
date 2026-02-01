/**
 * Script de Restauración de Backup - CRM Electoral
 * 
 * Restaura un backup desde un archivo ZIP.
 * 
 * ADVERTENCIA: Este script SOBRESCRIBE todos los datos existentes.
 * Úsalo solo en casos de emergencia o en una base de datos de prueba.
 * 
 * Uso:
 *   node scripts/restore.js backup_2026-02-01.zip
 * 
 * Requiere variables de entorno:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const readline = require('readline');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Falta configuración de Supabase');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function askConfirmation(message) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(`${message} (escribe 'SI' para confirmar): `, answer => {
            rl.close();
            resolve(answer.toUpperCase() === 'SI');
        });
    });
}

async function restoreTable(tableName, data) {
    console.log(`📥 Restaurando tabla: ${tableName}...`);

    if (!data || data.length === 0) {
        console.log(`   ⚠️  Tabla vacía, omitiendo`);
        return;
    }

    try {
        // Eliminar registros existentes (CUIDADO!)
        const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .neq('id', 0); // Elimina todo

        if (deleteError) {
            console.error(`   ❌ Error al limpiar ${tableName}:`, deleteError.message);
            return;
        }

        // Insertar datos en lotes de 100
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);

            const { error: insertError } = await supabase
                .from(tableName)
                .insert(batch);

            if (insertError) {
                console.error(`   ❌ Error al insertar lote en ${tableName}:`, insertError.message);
                continue;
            }

            console.log(`   ✅ Insertados ${Math.min(i + batchSize, data.length)}/${data.length} registros`);
        }

        console.log(`   ✅ Restauración de ${tableName} completada`);
    } catch (err) {
        console.error(`   ❌ Error restaurando ${tableName}:`, err.message);
    }
}

async function restoreBackup(zipPath) {
    if (!fs.existsSync(zipPath)) {
        console.error(`❌ Archivo no encontrado: ${zipPath}`);
        process.exit(1);
    }

    // Descomprimir
    const extractDir = path.join(__dirname, '..', 'backups', 'temp_restore');
    if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    console.log('\n📦 Descomprimiendo backup...\n');

    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();

    // Leer metadata
    const metadataPath = path.join(extractDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
        console.error('❌ Metadata no encontrada en el backup');
        process.exit(1);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    console.log('📊 Información del Backup:\n');
    console.log(`   Fecha: ${new Date(metadata.timestamp).toLocaleString('es-ES')}`);
    console.log(`   Tablas: ${metadata.tables.length}`);
    console.log(`   Archivos Storage: ${metadata.storage_files}\n`);

    // Confirma
    console.log('⚠️  ADVERTENCIA: Esta operación SOBRESCRIBIRÁ todos los datos actuales.\n');
    const confirmed = await askConfirmation('¿Estás seguro de continuar?');

    if (!confirmed) {
        console.log('\n❌ Restauración cancelada por el usuario');
        fs.rmSync(extractDir, { recursive: true, force: true });
        process.exit(0);
    }

    console.log('\n🚀 Iniciando restauración...\n');

    // Restaurar cada tabla
    for (const tableInfo of metadata.tables) {
        const tablePath = path.join(extractDir, `${tableInfo.name}.json`);

        if (!fs.existsSync(tablePath)) {
            console.warn(`⚠️  Archivo no encontrado: ${tableInfo.name}.json`);
            continue;
        }

        const data = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
        await restoreTable(tableInfo.name, data);
    }

    // Limpiar
    fs.rmSync(extractDir, { recursive: true, force: true });

    console.log('\n✅ RESTAURACIÓN COMPLETADA\n');
    console.log('📝 Notas:');
    console.log('   - Los archivos del Storage NO se restauran automáticamente');
    console.log('   - Verifica que todo funcione correctamente');
    console.log('   - Considera crear un nuevo backup después de verificar\n');
}

// Ejecutar
const zipPath = process.argv[2];

if (!zipPath) {
    console.error('❌ Uso: node scripts/restore.js <archivo_backup.zip>');
    process.exit(1);
}

restoreBackup(zipPath)
    .then(() => {
        console.log('🎉 Proceso completado');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error durante la restauración:', err);
        process.exit(1);
    });
