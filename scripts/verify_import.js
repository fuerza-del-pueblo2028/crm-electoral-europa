const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
    console.log('🔍 Verificando datos importados...\n');

    // Contar recintos
    const { count: recintos, error: recintosError } = await supabase
        .from('europa_recintos_electorales')
        .select('*', { count: 'exact', head: true });

    if (recintosError) {
        console.log('❌ Error contando recintos:', recintosError.message);
    } else {
        console.log(`✅ Recintos importados: ${recintos}`);
    }

    // Contar presidentes
    const { count: presidentes, error: presidentesError } = await supabase
        .from('europa_presidentes_dm')
        .select('*', { count: 'exact', head: true });

    if (presidentesError) {
        console.log('❌ Error contando presidentes:', presidentesError.message);
    } else {
        console.log(`✅ Presidentes DM importados: ${presidentes}`);
    }

    // Mostrar algunos recintos de cada seccional
    console.log('\n📊 Recintos por seccional:');
    const seccionales = ['Madrid', 'Barcelona', 'Milano', 'Holanda', 'Valencia', 'Zurich'];

    for (const seccional of seccionales) {
        const { count, error } = await supabase
            .from('europa_recintos_electorales')
            .select('*', { count: 'exact', head: true })
            .eq('seccional', seccional);

        if (!error) {
            console.log(`  ${seccional}: ${count} recintos`);
        }
    }

    // Mostrar algunos presidentes
    console.log('\n👥 Presidentes DM por provincia (top 5):');
    const { data: provincias, error: provError } = await supabase
        .from('europa_presidentes_dm')
        .select('condado_provincia')
        .not('condado_provincia', 'is', null)
        .limit(100);

    if (!provError && provincias) {
        const counts = {};
        provincias.forEach(p => {
            const prov = p.condado_provincia;
            counts[prov] = (counts[prov] || 0) + 1;
        });

        Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([prov, count]) => {
                console.log(`  ${prov}: ${count} presidentes`);
            });
    }

    console.log('\n' + '='.repeat(50));
    if (recintos > 0 || presidentes > 0) {
        console.log('✅ ÉXITO: Datos importados correctamente');
    } else {
        console.log('⚠️  ADVERTENCIA: No se encontraron datos');
    }
}

verifyData().catch(console.error);

