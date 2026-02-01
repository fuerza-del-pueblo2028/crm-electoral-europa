/**
 * Script de Backup Automático - CRM Electoral
 * 
 * Este script exporta toda la base de datos a archivos JSON
 * y crea un ZIP comprimido con timestamp.
 * 
 * Uso:
 *   node scripts/backup.js
 * 
 * Requiere variables de entorno:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (para acceso completo)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Falta configuración de Supabase');
    console.error('Asegúrate de tener SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Tablas a respaldar
const TABLES = [
    'afiliados',
    'afiliados_historial',
    'usuarios',
    'actas_electorales',
    'comunicaciones',
    'europa_colegios',
    'europa_presidentes_dm',
    'europa_recintos_electorales'
];

async function backupTable(tableName) {
    console.log(`📦 Exportando tabla: ${tableName}...`);

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) {
            console.warn(`⚠️  No se pudo exportar ${tableName}:`, error.message);
            return { table: tableName, records: 0, data: [] };
        }

        console.log(`   ✅ ${data.length} registros exportados`);
        return { table: tableName, records: data.length, data };
    } catch (err) {
        console.warn(`⚠️  Error al exportar ${tableName}:`, err.message);
        return { table: tableName, records: 0, data: [] };
    }
}

async function backupStorage() {
    console.log('📦 Exportando índice del Storage...');

    try {
        const { data, error } = await supabase
            .storage
            .from('fotos_afiliados')
            .list('carnets');

        if (error) {
            console.warn('⚠️  No se pudo listar archivos del Storage:', error.message);
            return [];
        }

        // Generar URLs públicas
        const fileList = data.map(file => ({
            name: file.name,
            size: file.metadata?.size,
            created_at: file.created_at,
            url: supabase.storage.from('fotos_afiliados').getPublicUrl(`carnets/${file.name}`).data.publicUrl
        }));

        console.log(`   ✅ ${fileList.length} archivos indexados`);
        return fileList;
    } catch (err) {
        console.warn('⚠️  Error al indexar Storage:', err.message);
        return [];
    }
}

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupDir = path.join(__dirname, '..', 'backups', `backup_${timestamp}`);

    // Crear directorio de backup
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('\n🚀 Iniciando backup del CRM Electoral...\n');
    console.log(`📁 Directorio: ${backupDir}\n`);

    // Backup de cada tabla
    const results = [];
    for (const tableName of TABLES) {
        const result = await backupTable(tableName);
        results.push(result);

        // Guardar JSON
        const filePath = path.join(backupDir, `${tableName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2));
    }

    // Backup del Storage
    const storageIndex = await backupStorage();
    const storageFilePath = path.join(backupDir, 'storage_index.json');
    fs.writeFileSync(storageFilePath, JSON.stringify(storageIndex, null, 2));

    // Metadata del backup
    const metadata = {
        timestamp: new Date().toISOString(),
        tables: results.map(r => ({ name: r.table, records: r.records })),
        storage_files: storageIndex.length,
        supabase_url: SUPABASE_URL,
        version: '1.0.0'
    };

    const metadataPath = path.join(backupDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Crear ZIP
    console.log('\n📦 Comprimiendo backup...');
    const zipPath = path.join(__dirname, '..', 'backups', `backup_${timestamp}.zip`);

    await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`✅ Backup comprimido: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(backupDir, false);
        archive.finalize();
    });

    // Eliminar directorio temporal
    fs.rmSync(backupDir, { recursive: true, force: true });

    // Resumen
    console.log('\n✅ BACKUP COMPLETADO\n');
    console.log('📊 Resumen:');
    results.forEach(r => {
        console.log(`   - ${r.table}: ${r.records} registros`);
    });
    console.log(`   - Storage: ${storageIndex.length} archivos`);
    console.log(`\n📦 Archivo: ${zipPath}\n`);

    return zipPath;
}

// Ejecutar backup
createBackup()
    .then(zipPath => {
        console.log('🎉 Backup finalizado exitosamente');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error durante el backup:', err);
        process.exit(1);
    });
