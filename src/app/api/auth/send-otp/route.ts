import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inicializar Resend con la key ya configurada en .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, otp, nombre } = body;

        console.log(`[Auth Service] Solicitud OTP para: ${email}`);

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email y OTP son requeridos' }, { status: 400 });
        }

        // SEGURIDAD: Verificar que el email no esté duplicado en el padrón
        // "Candado de Seguridad": Un email = Un Votante.
        const { count, error: countError } = await supabase
            .from('elecciones_padron')
            .select('*', { count: 'exact', head: true })
            .eq('email', email);

        if (countError) {
            console.error('[Auth Service] Error verificando duplicados:', countError);
            // Fallback: Permitir envío si falla la verificación para no bloquear por error de DB, 
            // o Bloquear si se prefiere seguridad estricta. Optamos por loguear.
        }

        if (count && count > 1) {
            console.warn(`[Auth Service] BLOQUEADO: El email ${email} está asociado a ${count} cuentas.`);
            return NextResponse.json({
                error: 'Por seguridad, este correo electrónico no puede recibir códigos porque está asociado a varios usuarios. Contacte soporte.'
            }, { status: 403 });
        }

        // Enviar correo con Resend
        const { data, error } = await resend.emails.send({
            from: 'Seguridad Electoral <info@centinelaelectoralsaeeuropa.com>', // Usando el dominio verificado
            to: [email],
            subject: 'Tu Código de Acceso - Elecciones Internas',
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 400px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #005c2b; padding: 20px; text-align: center;">
                         <h2 style="color: white; margin: 0; font-size: 18px;">Código de Verificación</h2>
                    </div>
                    <div style="padding: 30px 20px; text-align: center; background-color: #fff;">
                        <p style="margin-bottom: 20px; font-size: 14px; color: #666;">Hola ${nombre || 'Afiliado'}, usa el siguiente código para ingresar a la cabina de votación:</p>
                        
                        <div style="background-color: #f0fdf4; border: 2px dashed #005c2b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #005c2b;">${otp}</span>
                        </div>
                        
                        <p style="font-size: 12px; color: #999; margin-top: 20px;">Este código expira en 10 minutos.<br>Si no solicitaste este código, ignora este mensaje.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee;">
                        FP Europa · Sistema de Votación Segura
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('[Auth Service] Error enviando email:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('[Auth Service] OTP enviado con éxito:', data);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Auth Service] Excepción no controlada:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
