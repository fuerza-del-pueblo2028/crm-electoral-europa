const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPasswords() {
    console.log('Iniciando reseteo de contraseñas...');

    // 1. Obtener usuarios que NO son administrador ni operador
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('id, cedula, rol, nombre')
        .not('rol', 'eq', 'administrador')
        .not('rol', 'eq', 'operador');

    if (error) {
        console.error('Error al obtener usuarios:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No se encontraron usuarios que cumplan la condición (No Admin/No Oper).');
        return;
    }

    console.log(`Se encontraron ${users.length} usuarios para procesar.`);

    for (const user of users) {
        // Limpiar cédula (quitar guiones y espacios)
        const cleanCedula = user.cedula.replace(/-/g, '').trim();

        // Obtener los últimos 6 dígitos
        if (cleanCedula.length < 6) {
            console.warn(`Cédula demasiado corta para ${user.nombre}: ${user.cedula}`);
            continue;
        }

        const newPassword = cleanCedula.substring(cleanCedula.length - 6);

        // Actualizar contraseña
        const { error: updateError } = await supabase
            .from('usuarios')
            .update({ password: newPassword })
            .eq('id', user.id);

        if (updateError) {
            console.error(`Error actualizando a ${user.nombre}:`, updateError);
        } else {
            console.log(`Contraseña reseteada para ${user.nombre} (${user.rol})`);
        }
    }

    console.log('Proceso de reseteo finalizado.');
}

resetPasswords();

