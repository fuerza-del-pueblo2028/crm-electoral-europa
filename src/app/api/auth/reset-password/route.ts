import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { cedula } = await request.json();

        if (!cedula) {
            return NextResponse.json({ error: 'Cédula requerida' }, { status: 400 });
        }

        const cleanCedula = cedula.replace(/-/g, "").trim();
        let formattedCedula = cleanCedula;
        if (cleanCedula.length === 11) {
            formattedCedula = `${cleanCedula.substring(0, 3)}-${cleanCedula.substring(3, 10)}-${cleanCedula.substring(10)}`;
        }

        // 1. Buscar en afiliados (ya que es el caso más común de olvido)
        let user = null;
        let table = 'afiliados';

        const { data: affData } = await supabaseAdmin
            .from('afiliados')
            .select('id, email, nombre, apellidos')
            .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
            .maybeSingle();

        if (affData) {
            user = { ...affData, nombreCompleto: `${affData.nombre} ${affData.apellidos}` };
        } else {
            // 2. Buscar en usuarios
            const { data: usrData } = await supabaseAdmin
                .from('usuarios')
                .select('id, email, nombre')
                .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
                .maybeSingle();

            if (usrData) {
                user = { ...usrData, nombreCompleto: usrData.nombre };
                table = 'usuarios';
            }
        }

        if (!user) {
            // Retornamos genérico para no filtrar qué cédulas existen
            return NextResponse.json({ success: true, message: 'Si la cédula existe y tiene correo, se ha enviado un enlace.' });
        }

        if (!user.email) {
            return NextResponse.json({
                error: 'Este usuario no tiene un correo electrónico registrado. Por favor, contacta a tu operador o presidente de seccional para restablecer tu acceso manualmente.'
            }, { status: 400 });
        }

        // 3. Generar token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora de validez

        // 4. Guardar token en BD
        await supabaseAdmin
            .from(table)
            .update({
                reset_token: resetToken,
                reset_token_expires: expiresAt.toISOString()
            })
            .eq('id', user.id);

        // 5. Enviar email con Resend
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://centinelaelectoralsaeeuropa.com';
        const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

        try {
            await resend.emails.send({
                from: 'Fuerza del Pueblo Europa <no-reply@centinelaelectoralsaeeuropa.com>',
                to: [user.email],
                subject: 'Recuperación de Contraseña - CRM Electoral',
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #005c2b; padding: 20px; text-align: center;">
                            <h2 style="color: white; margin: 0;">Recuperación de Acceso</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p>Hola ${user.nombreCompleto},</p>
                            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el CRM Electoral.</p>
                            <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace es válido por 1 hora.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" style="background-color: #005c2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer mi contraseña</a>
                            </div>
                            <p style="font-size: 12px; color: #666;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo válida.</p>
                        </div>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error("Error enviando email:", emailErr);
            return NextResponse.json({ error: 'Error al enviar el correo de recuperación' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Si la cédula existe y tiene correo, se ha enviado un enlace.' });

    } catch (error: any) {
        console.error("Reset Password API Error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
