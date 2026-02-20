import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        // Buscar token en afiliados
        let user: any = null;
        let table = 'afiliados';

        const { data: affData } = await supabaseAdmin
            .from('afiliados')
            .select('id, reset_token_expires')
            .eq('reset_token', token)
            .maybeSingle();

        if (affData) {
            user = affData;
        } else {
            // Buscar en usuarios
            const { data: usrData } = await supabaseAdmin
                .from('usuarios')
                .select('id, reset_token_expires')
                .eq('reset_token', token)
                .maybeSingle();

            if (usrData) {
                user = usrData;
                table = 'usuarios';
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'El enlace es inválido o no existe' }, { status: 400 });
        }

        // Verificar expiración
        const expiresAt = new Date(user.reset_token_expires);
        if (new Date() > expiresAt) {
            return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 });
        }

        // Hashear
        const hash = await bcrypt.hash(newPassword, 10);

        // Actualizar y quemar el token
        const { error: updateError } = await supabaseAdmin
            .from(table)
            .update({
                password_hash: hash,
                must_change_password: false,
                reset_token: null,
                reset_token_expires: null
            })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, message: 'Contraseña restablecida exitosamente' });

    } catch (error: any) {
        console.error("Verify Reset Error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
