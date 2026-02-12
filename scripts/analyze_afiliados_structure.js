const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function analyzeStructure() {
    let report = '';
    const log = (msg, obj) => {
        const str = obj ? msg + ' ' + JSON.stringify(obj, null, 2) : msg;
        console.log(str);
        report += str + '\n';
    };

    log('Analizando estructura de la tabla afiliados...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verificar columnas seleccionando 1 registro (si existe)
    log('1. Verificando existencia de columnas seccional y cargo_organizacional...');

    // Intentamos seleccionar las columnas específicas
    const { data: sampleData, error: sampleError } = await supabase
        .from('afiliados')
        .select('id, seccional, cargo_organizacional')
        .limit(1);

    if (sampleError) {
        log('❌ Error seleccionando columnas: ' + sampleError.message);
        log('Esto indica que probablemente las columnas no existen o hay un error de RLS.');
    } else {
        log('✅ Columnas detectadas correctamente (la consulta Select no falló).');
        if (sampleData.length > 0) {
            log('Muestra de datos:', sampleData[0]);
        } else {
            log('La tabla está vacía, pero la estructura parece correcta.');
        }
    }

    // 2. Analizar distribución de datos
    log('\n2. Analizando distribución de datos por Cargo Organizacional...');

    // Obtenemos todos los registros (cuidado si son muchos, pero para análisis está bien)
    // El límite por defecto de supabase es 1000, así que debería estar bien.
    const { data: cargoData, error: cargoError } = await supabase
        .from('afiliados')
        .select('cargo_organizacional')
        .limit(2000);

    if (cargoError) {
        log('❌ Error obteniendo datos para análisis: ' + cargoError.message);
    } else {
        const distribution = {};
        let nullCount = 0;

        if (cargoData) {
            cargoData.forEach(row => {
                const cargo = row.cargo_organizacional;
                if (cargo) {
                    distribution[cargo] = (distribution[cargo] || 0) + 1;
                } else {
                    nullCount++;
                }
            });
        }

        log('Distribución por Cargo Organizacional:');
        log(JSON.stringify(distribution, null, 2));
        log(`Registros sin cargo definido (NULL): ${nullCount}`);

        // Verificar si cumple con los requerimientos
        const requiredRoles = ['Miembro Dirección Central', 'Presidente DM', 'Presidente DB'];
        const existingRoles = Object.keys(distribution);
        const missingRoles = requiredRoles.filter(r => !existingRoles.some(e => e.includes(r)));

        if (missingRoles.length > 0) {
            log('\n⚠️ ADVERTENCIA: No se encontraron afiliados con los siguientes roles requeridos: ' + JSON.stringify(missingRoles));
        } else {
            log('\n✅ Se encontraron afiliados con todos los roles principales.');
        }
    }

    // 3. Analizar distribución por Seccional
    log('\n3. Analizando distribución de datos por Seccional...');

    const { data: seccionalData, error: seccionalError } = await supabase
        .from('afiliados')
        .select('seccional')
        .limit(2000);

    if (seccionalError) {
        log('❌ Error obteniendo datos para análisis de seccional: ' + seccionalError.message);
    } else {
        const distribution = {};
        let nullCount = 0;

        if (seccionalData) {
            seccionalData.forEach(row => {
                const secc = row.seccional;
                if (secc) {
                    distribution[secc] = (distribution[secc] || 0) + 1;
                } else {
                    nullCount++;
                }
            });
        }

        log('Distribución por Seccional:');
        log(JSON.stringify(distribution, null, 2));
        log(`Registros sin seccional definida (NULL): ${nullCount}`);
    }

    fs.writeFileSync('analysis_report.txt', report);
    console.log('Reporte guardado en analysis_report.txt');
}

analyzeStructure().catch(console.error);
