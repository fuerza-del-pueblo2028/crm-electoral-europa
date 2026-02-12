
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.RESEND_API_KEY) {
    console.error("❌ Error: RESEND_API_KEY no encontrada en .env.local");
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function testSend() {
    const args = process.argv.slice(2);
    const toArgIndex = args.indexOf('--to');
    const to = toArgIndex !== -1 ? args[toArgIndex + 1] : 'luis.sanchez@centinelaelectoralsaeeuropa.com'; // Default fallback or error

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
            subject: 'Prueba de Diagnóstico - CRM Electoral',
            html: `
                <h1>Prueba de Diagnóstico</h1>
                <p>Este es un correo de prueba para verificar la configuración de Resend.</p>
                <p>Hora de envío: ${new Date().toISOString()}</p>
                <hr/>
                <p>Si recibes esto, la configuración de dominio y API Key es correcta.</p>
            `
        });

        if (error) {
            console.error("\n❌ ERROR DEVUELTO POR RESEND:");
            console.error(JSON.stringify(error, null, 2));
        } else {
            console.log("\n✅ ÉXITO SEGÚN LA API:");
            console.log(JSON.stringify(data, null, 2));
            console.log("\n⚠️ NOTA: 'Éxito' en la API significa que Resend aceptó la solicitud.");
            console.log("Si no llega, revisa carpeta de SPAM o los logs en el dashboard de Resend.");
        }

    } catch (err) {
        console.error("\n❌ EXCEPCIÓN NO CONTROLADA:");
        console.error(err);
    }
}

testSend();
