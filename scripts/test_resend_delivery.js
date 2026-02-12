const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env.local (ajustar path segun ubicacion del script)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.RESEND_API_KEY) {
    console.error("❌ Error: RESEND_API_KEY no encontrada en .env.local");
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function testSend() {
    const args = process.argv.slice(2);
    const toArgIndex = args.indexOf('--to');
    const to = toArgIndex !== -1 ? args[toArgIndex + 1] : null;

    if (!to || !to.includes('@')) {
        console.error("❌ Error: Debes especificar un email válido con --to email@ejemplo.com");
        process.exit(1);
    }

    console.log(`📧 Intentando enviar correo de prueba a: ${to}`);
    console.log(`🔑 Usando API Key: ...${process.env.RESEND_API_KEY?.slice(-5)}`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Secretaría Asuntos Electorales <info@centinelaelectoralsaeeuropa.com>',
            to: [to],
            // Responder a un correo válido ayuda a evitar spam
            reply_to: 'info@centinelaelectoralsaeeuropa.com',
            subject: 'Prueba de Diagnóstico - CRM Electoral',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h1 style="color: #005c2b;">Prueba de Diagnóstico</h1>
                    <p>Este es un correo de prueba para verificar la configuración de Resend.</p>
                    <p><strong>Hora de envío:</strong> ${new Date().toLocaleString()}</p>
                    <hr/>
                    <p style="font-size: 12px; color: #666;">Si recibes esto, la configuración de dominio y API Key es correcta.</p>
                </div>
            `
        });

        if (error) {
            console.error("\n❌ ERROR DEVUELTO POR RESEND:");
            console.error(JSON.stringify(error, null, 2));
        } else {
            console.log("\n✅ ÉXITO SEGÚN LA API:");
            console.log(JSON.stringify(data, null, 2));
            console.log("\n⚠️ NOTA: 'Éxito' significa que Resend aceptó la solicitud.");
            console.log("Por favor verifica tu bandeja de entrada (y SPAM).");
        }

    } catch (err) {
        console.error("\n❌ EXCEPCIÓN NO CONTROLADA:");
        console.error(err);
    }
}

testSend();
