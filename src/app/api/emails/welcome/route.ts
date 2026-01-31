import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, nombre } = body;

        console.log(`[Email Service] Attempting to send welcome email to: ${email}`);

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('PLACEHOLDER')) {
            console.warn('[Email Service] RESEND_API_KEY is missing or invalid. Skipping email.');
            return NextResponse.json({ success: false, warning: 'API Key not configured' }, { status: 200 });
        }

        const { data, error } = await resend.emails.send({
            from: 'Secretaría Asuntos Electorales <info@centinelaelectoralsaeeuropa.com>',
            to: [email],
            subject: '¡Bienvenido a la Fuerza del Pueblo!',
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #005c2b; padding: 20px; text-align: center;">
                         <h1 style="color: white; margin: 0;">¡Bienvenido, ${nombre}!</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p style="font-size: 16px; line-height: 1.5;">Nos complace darte la bienvenida a la Secretaría de Asuntos Electorales de la Fuerza del Pueblo en Europa.</p>
                        <p style="font-size: 16px; line-height: 1.5;">Tu registro ha sido completado exitosamente y ya formas parte de nuestra base de datos oficial.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #005c2b; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold;">Tus credenciales de acceso:</p>
                            <ul style="margin-top: 10px; margin-bottom: 0;">
                                <li><strong>Usuario:</strong> Tu número de cédula</li>
                                <li><strong>Contraseña:</strong> Los últimos 6 dígitos de tu cédula</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background-color: #005c2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Acceder al Portal</a>
                        </div>
                    </div>
                    <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                        <p>© ${new Date().getFullYear()} Fuerza del Pueblo - Secretaría de Asuntos Electorales Europa</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('[Email Service] Error from Resend:', error);
            return NextResponse.json({ error }, { status: 500 });
        }

        console.log('[Email Service] Email sent successfully:', data);
        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[Email Service] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
