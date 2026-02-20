import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { signToken } from '@/lib/token';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { tempUserId, tempUserRole, newPassword } = await request.json();

        if (!tempUserId || !tempUserRole || !newPassword) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
        }

        const table = tempUserRole === 'afiliado' ? 'afiliados' : 'usuarios';

        // 1. Obtener datos del usuario
        const { data: user, error: fetchError } = await supabaseAdmin
            .from(table)
            .select('*')
            .eq('id', tempUserId)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // 2. Hashear nueva contraseña
        const hash = await bcrypt.hash(newPassword, 10);

        // 3. Actualizar BD
        const { error: updateError } = await supabaseAdmin
            .from(table)
            .update({
                password_hash: hash,
                must_change_password: false
            })
            .eq('id', tempUserId);

        if (updateError) {
            console.error("Error actualizando contraseña:", updateError);
            return NextResponse.json({ error: 'Error al actualizar contraseña' }, { status: 500 });
        }

        // 4. Generar el JWT ahora que la contraseña fue cambiada
        const authenticatedUser = {
            id: user.id,
            cedula: user.cedula,
            nombre: tempUserRole === 'afiliado' ? `${user.nombre} ${user.apellidos}` : user.nombre,
            rol: tempUserRole === 'afiliado' ? 'afiliado' : user.rol,
            seccional: user.seccional,
            activo: user.activo !== undefined ? user.activo : true
        };

        const token = await signToken(authenticatedUser);

        // 5. Configurar cookie segura
        const response = NextResponse.json({ success: true, user: authenticatedUser });

        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 horas
        });

        return response;

    } catch (error: any) {
        console.error("Change Password Error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
