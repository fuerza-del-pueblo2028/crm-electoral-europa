const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeo de nombres de hojas a seccionales
const SHEET_TO_SECCIONAL = {
    'Seccional de Madrid': 'Madrid',
    'Seccional de Barcelona': 'Barcelona',
    'Seccional de Milano': 'Milano',
    'Seccional de Holanda': 'Holanda',
    'Seccional de Valencia': 'Valencia',
    'Seccional de Zurich': 'Zurich'
};

// Función para limpiar y normalizar texto
function cleanText(text) {
    if (!text) return null;
    return String(text).trim().replace(/\s+/g, ' ');
}

// Función para convertir número a entero
function toInt(val) {
    if (!val) return 0;
    const num = parseInt(String(val).replace(/[,\.]/g, ''));
    return isNaN(num) ? 0 : num;
}

// Procesar hoja de recintos
async function processRecintosSheet(sheetName, worksheet) {
    const seccional = SHEET_TO_SECCIONAL[sheetName];
    if (!seccional) {
        console.log(`⏭️  Saltando hoja: ${sheetName} (no es una seccional de recintos)`);
        return { inserted: 0, errors: 0 };
    }

    console.log(`\n📋 Procesando: ${sheetName} → Seccional ${seccional}`);

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Encontrar la fila de headers
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (row.some(cell => String(cell).includes('Número Recinto'))) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.error(`❌ No se encontraron headers en ${sheetName}`);
        return { inserted: 0, errors: 1 };
    }

    console.log(`   Headers encontrados en fila ${headerRowIndex}`);
    const headers = data[headerRowIndex];

    // Mapear columnas
    const colMap = {};
    headers.forEach((header, idx) => {
        const h = String(header).toLowerCase();
        if (h.includes('país')) colMap.pais = idx;
        if (h.includes('número recinto') || h.includes('numero recinto')) colMap.numero = idx;
        if (h.includes('recintos') && !h.includes('número')) colMap.nombre = idx;
        if (h.includes('zona')) colMap.zona = idx;
        if (h.includes('dirección') || h.includes('direccion')) colMap.direccion = idx;
        if (h.includes('electores') && !h.includes('colegios')) colMap.electores = idx;
        if (h.includes('total de colegios')) colMap.total_colegios = idx;
        if (h.includes('colegios n')) colMap.colegios_nums = idx;
    });

    console.log(`   Columnas mapeadas:`, colMap);

    // Procesar filas de datos
    const recintos = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];

        // Saltear filas vacías o separadores
        const numeroRecinto = cleanText(row[colMap.numero]);
        if (!numeroRecinto || numeroRecinto.includes('===') || numeroRecinto.length < 3) {
            continue;
        }

        const nombreRecinto = cleanText(row[colMap.nombre]);
        if (!nombreRecinto || nombreRecinto.length < 3) {
            continue;
        }

        const recinto = {
            seccional,
            numero_recinto: numeroRecinto,
            nombre_recinto: nombreRecinto,
            pais: cleanText(row[colMap.pais]) || null,
            zona_ciudad: cleanText(row[colMap.zona]) || '',
            direccion: cleanText(row[colMap.direccion]) || '',
            total_electores: toInt(row[colMap.electores]),
            total_colegios: toInt(row[colMap.total_colegios]),
            colegios_numeros: cleanText(row[colMap.colegios_nums]) || ''
        };

        recintos.push(recinto);
    }

    console.log(`   📊 ${recintos.length} recintos encontrados`);

    // Insertar en Supabase (con upsert para evitar duplicados)
    let inserted = 0;
    let errors = 0;

    for (const recinto of recintos) {
        const { error } = await supabase
            .from('europa_recintos_electorales')
            .upsert(recinto, {
                onConflict: 'seccional,numero_recinto',
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`   ❌ Error insertando ${recinto.numero_recinto}:`, error.message);
            errors++;
        } else {
            inserted++;
        }
    }

    console.log(`   ✅ ${inserted} recintos insertados, ${errors} errores`);
    return { inserted, errors };
}

// Procesar hoja de Presidentes DM
async function processPresidentesSheet(worksheet) {
    console.log(`\n👥 Procesando: Presidentes Direcciones Medias`);

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Primera fila debe ser headers
    if (data.length === 0) {
        console.error(`❌ Hoja vacía`);
        return { inserted: 0, errors: 1 };
    }

    const headers = data[0];
    console.log(`   Headers:`, headers);

    // Mapear columnas
    const colMap = {};
    headers.forEach((header, idx) => {
        const h = String(header).toLowerCase();
        if (h.includes('código') || h.includes('codigo')) colMap.codigo = idx;
        if (h.includes('tipo')) colMap.tipo = idx;
        if (h.includes('recinto')) colMap.recinto = idx;
        if (h.includes('país') || h.includes('pais')) colMap.pais = idx;
        if (h.includes('estado') || h.includes('autónoma')) colMap.estado = idx;
        if (h.includes('condado') || h.includes('provincia')) colMap.provincia = idx;
        if (h.includes('presidente') && !h.includes('total')) colMap.nombre = idx;
        if (h.includes('cédula') || h.includes('cedula')) colMap.cedula = idx;
        if (h.includes('celular')) colMap.celular = idx;
        if (h === 'Total' || h === 'total') colMap.total = idx;
        if (h.includes('afiliados')) colMap.afiliados = idx;
        if (h.includes('status')) colMap.status = idx;
        if (h.includes('fecha')) colMap.fecha = idx;
    });

    console.log(`   Columnas mapeadas:`, colMap);

    // Procesar presidentes
    const presidentes = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];

        const nombre = cleanText(row[colMap.nombre]);
        if (!nombre || nombre.length < 3) continue;

        const presidente = {
            codigo: cleanText(row[colMap.codigo]) || null,
            tipo_localidad: cleanText(row[colMap.tipo]) || 'Exterior',
            nombre_completo: nombre,
            cedula: cleanText(row[colMap.cedula]) || null,
            celular: cleanText(row[colMap.celular]) || null,
            pais: cleanText(row[colMap.pais]) || '',
            estado_ca: cleanText(row[colMap.estado]) || null,
            condado_provincia: cleanText(row[colMap.provincia]) || null,
            recinto_referencia: cleanText(row[colMap.recinto]) || null,
            total_dm: toInt(row[colMap.total]),
            total_afiliados: toInt(row[colMap.afiliados]),
            status: cleanText(row[colMap.status]) || null,
            fecha: row[colMap.fecha] ? parseFloat(row[colMap.fecha]) : null
        };

        presidentes.push(presidente);
    }

    console.log(`   📊 ${presidentes.length} presidentes encontrados`);

    // Insertar en Supabase
    let inserted = 0;
    let errors = 0;

    for (const presidente of presidentes) {
        const { error } = await supabase
            .from('europa_presidentes_dm')
            .insert(presidente);

        if (error) {
            console.error(`   ❌ Error insertando ${presidente.nombre_completo}:`, error.message);
            errors++;
        } else {
            inserted++;
        }
    }

    console.log(`   ✅ ${inserted} presidentes insertados, ${errors} errores`);
    return { inserted, errors };
}

// Función principal
async function importData() {
    console.log('🚀 Iniciando importación de datos de Europa...\n');
    console.log(`📡 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Supabase Key: ${supabaseKey ? '✓ Configurado' : '✗ No encontrado'}\n`);

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables de entorno no configuradas');
        process.exit(1);
    }

    // Leer archivo Excel
    const path = require('path');
    const workbook = XLSX.readFile(path.join(__dirname, 'datos_europa.xlsx'));
    console.log(`📄 Hojas encontradas: ${workbook.SheetNames.join(', ')}\n`);

    const stats = {
        recintos: { inserted: 0, errors: 0 },
        presidentes: { inserted: 0, errors: 0 }
    };

    // Procesar cada hoja
    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        if (sheetName.includes('Presidentes')) {
            const result = await processPresidentesSheet(worksheet);
            stats.presidentes.inserted += result.inserted;
            stats.presidentes.errors += result.errors;
        } else if (SHEET_TO_SECCIONAL[sheetName]) {
            const result = await processRecintosSheet(sheetName, worksheet);
            stats.recintos.inserted += result.inserted;
            stats.recintos.errors += result.errors;
        } else {
            console.log(`⏭️  Saltando hoja: ${sheetName}`);
        }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(60));
    console.log(`Recintos:`);
    console.log(`  ✅ Insertados: ${stats.recintos.inserted}`);
    console.log(`  ❌ Errores: ${stats.recintos.errors}`);
    console.log(`\nPresidentes DM:`);
    console.log(`  ✅ Insertados: ${stats.presidentes.inserted}`);
    console.log(`  ❌ Errores: ${stats.presidentes.errors}`);
    console.log('='.repeat(60));

    console.log('\n✅ Importación completada!');
}

// Ejecutar
importData().catch(console.error);

