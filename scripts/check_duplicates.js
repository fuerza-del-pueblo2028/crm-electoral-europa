// Script para verificar duplicados en la base de datos de Supabase
// Ejecutar con: node scripts/check_duplicates.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDuplicates() {
    console.log('🔍 Verificando duplicados en la base de datos...\n');

    const results = {
        afiliados: { duplicates: [], total: 0 },
        usuarios: { duplicates: [], total: 0 },
        estructura_europa: { duplicates: [], total: 0 }
    };

    // 1. Verificar duplicados en afiliados (por cedula)
    try {
        const { data: afiliados, error } = await supabase
            .from('afiliados')
            .select('cedula, nombre, apellido');

        if (error) {
            console.log('❌ Error al consultar afiliados:', error.message);
        } else {
            results.afiliados.total = afiliados?.length || 0;
            const cedulaCount = {};
            afiliados?.forEach(a => {
                const cedula = a.cedula?.replace(/-/g, '');
                if (cedulaCount[cedula]) {
                    cedulaCount[cedula].push(a);
                } else {
                    cedulaCount[cedula] = [a];
                }
            });

            Object.entries(cedulaCount).forEach(([cedula, items]) => {
                if (items.length > 1) {
                    results.afiliados.duplicates.push({ cedula, count: items.length, items });
                }
            });

            console.log(`✅ Afiliados: ${results.afiliados.total} registros`);
            if (results.afiliados.duplicates.length > 0) {
                console.log(`   ⚠️  ${results.afiliados.duplicates.length} cédulas duplicadas encontradas`);
                results.afiliados.duplicates.slice(0, 5).forEach(d => {
                    console.log(`      - Cedula ${d.cedula}: ${d.count} duplicados`);
                });
            } else {
                console.log('   ✓ Sin duplicados');
            }
        }
    } catch (e) {
        console.log('❌ Error en afiliados:', e.message);
    }

    // 2. Verificar duplicados en usuarios (por email)
    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('email, nombre, rol');

        if (error) {
            console.log('❌ Error al consultar usuarios:', error.message);
        } else {
            results.usuarios.total = usuarios?.length || 0;
            const emailCount = {};
            usuarios?.forEach(u => {
                const email = u.email?.toLowerCase();
                if (emailCount[email]) {
                    emailCount[email].push(u);
                } else {
                    emailCount[email] = [u];
                }
            });

            Object.entries(emailCount).forEach(([email, items]) => {
                if (items.length > 1) {
                    results.usuarios.duplicates.push({ email, count: items.length, items });
                }
            });

            console.log(`\n✅ Usuarios: ${results.usuarios.total} registros`);
            if (results.usuarios.duplicates.length > 0) {
                console.log(`   ⚠️  ${results.usuarios.duplicates.length} emails duplicados encontrados`);
                results.usuarios.duplicates.forEach(d => {
                    console.log(`      - ${d.email}: ${d.count} duplicados`);
                });
            } else {
                console.log('   ✓ Sin duplicados');
            }
        }
    } catch (e) {
        console.log('❌ Error en usuarios:', e.message);
    }

    // 3. Verificar duplicados en europa_presidentes_dm (por nombre+cargo)
    try {
        const { data: estructura, error } = await supabase
            .from('europa_presidentes_dm')
            .select('nombre, cargo, seccional');

        if (error) {
            console.log('❌ Error al consultar europa_presidentes_dm:', error.message);
        } else {
            results.europa_presidentes_dm.total = estructura?.length || 0;
            const nombreCargoCount = {};
            estructura?.forEach(e => {
                const key = `${e.nombre}|${e.cargo}`;
                if (nombreCargoCount[key]) {
                    nombreCargoCount[key].push(e);
                } else {
                    nombreCargoCount[key] = [e];
                }
            });

            Object.entries(nombreCargoCount).forEach(([key, items]) => {
                if (items.length > 1) {
                    const [nombre, cargo] = key.split('|');
                    results.estructura_europa.duplicates.push({ nombre, cargo, count: items.length });
                }
            });

            console.log(`\n✅ Estructura Europa: ${results.estructura_europa.total} registros`);
            if (results.estructura_europa.duplicates.length > 0) {
                console.log(`   ⚠️  ${results.estructura_europa.duplicates.length} entradas duplicadas encontradas`);
                results.estructura_europa.duplicates.forEach(d => {
                    console.log(`      - "${d.nombre}" (${d.cargo}): ${d.count} duplicados`);
                });
            } else {
                console.log('   ✓ Sin duplicados');
            }
        }
    } catch (e) {
        console.log('❌ Error en estructura_europa:', e.message);
    }

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(50));
    console.log(`Afiliados: ${results.afiliados.total} total, ${results.afiliados.duplicates.length} duplicados`);
    console.log(`Usuarios: ${results.usuarios.total} total, ${results.usuarios.duplicates.length} duplicados`);
    console.log(`Estructura: ${results.estructura_europa.total} total, ${results.estructura_europa.duplicates.length} duplicados`);

    const totalDuplicates = results.afiliados.duplicates.length +
        results.usuarios.duplicates.length +
        results.estructura_europa.duplicates.length;

    if (totalDuplicates === 0) {
        console.log('\n✅ La base de datos está limpia - Sin duplicados encontrados');
    } else {
        console.log(`\n⚠️  Se encontraron ${totalDuplicates} tipos de duplicados en total`);
    }

    return results;
}

checkDuplicates()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
