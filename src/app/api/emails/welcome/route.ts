import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, nombre } = body;

        console.log(`[Welcome Email] Sending to: ${email}`);

        // Validaciones
        if (!email) {
            console.error('[Welcome Email] Missing email');
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!nombre) {
            console.warn('[Welcome Email] Missing nombre, using default');
        }

        // Verificar API Key
        const apiKey = process.env.RESEND_API_KEY;
        console.log('[Welcome Email] API Key check:', {
            exists: !!apiKey,
            length: apiKey?.length,
            starts_with_re: apiKey?.startsWith('re_'),
            is_placeholder: apiKey?.includes('PLACEHOLDER')
        });

        if (!apiKey || apiKey.includes('PLACEHOLDER')) {
            console.warn('[Welcome Email] RESEND_API_KEY not configured. Email skipped.');
            return NextResponse.json({
                success: false,
                warning: 'Email service not configured'
            }, { status: 200 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://centinelaelectoralsaeeuropa.com';

        // Enviar email
        const { data, error } = await resend.emails.send({
            from: 'Fuerza del Pueblo Europa <no-reply@centinelaelectoralsaeeuropa.com>',
            to: [email],
            subject: '¡Bienvenido a la Fuerza del Pueblo!',
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #005c2b; padding: 20px; text-align: center;">
                         <h1 style="color: white; margin: 0;">¡Bienvenido${nombre ? `, ${nombre}` : ''}!</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p style="font-size: 16px; line-height: 1.5;">Es un honor darte la bienvenida a la Plataforma Electoral de la Fuerza del Pueblo en Europa "CRM Electoral".</p>
                        <p style="font-size: 16px; line-height: 1.5;">Tu registro ha sido procesado exitosamente y ya formas parte de nuestra base de datos oficial. Estamos a tu disposición.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #005c2b; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold;">Tus credenciales de acceso:</p>
                            <ul style="margin-top: 10px; margin-bottom: 0;">
                                <li><strong>Usuario:</strong> Tu número de cédula</li>
                                <li><strong>Contraseña:</strong> Los últimos 6 dígitos de tu cédula</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${appUrl}" style="background-color: #005c2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Acceder al Portal</a>
                        </div>
                    </div>
                    <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                        <p>© ${new Date().getFullYear()} Fuerza del Pueblo - Secretaría de Asuntos Electorales Europa</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('[Welcome Email] Resend error:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to send email',
                details: error
            }, { status: 500 });
        }

        console.log('[Welcome Email] ✅ Sent successfully:', data?.id);
        return NextResponse.json({
            success: true,
            messageId: data?.id
        });

    } catch (error: any) {
        console.error('[Welcome Email] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}
