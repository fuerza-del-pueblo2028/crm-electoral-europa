const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.RESEND_API_KEY) {
    console.error("❌ Error: RESEND_API_KEY no encontrada");
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function testContactForm() {
    console.log("📨 Simulando envío de formulario de contacto...");

    // Datos simulados del formulario
    const formData = {
        nombre: "Usuario de Prueba",
        email: "ls311524@outlook.com", // Usamos tu email para que puedas ver el reply-to funcionar
        asunto: "Prueba de Integración - Formulario Contacto",
        mensaje: "Hola, este es un mensaje de prueba para verificar que el formulario de contacto envía los correos correctamente a la administración."
    };

    try {
        const { data, error } = await resend.emails.send({
            from: 'Formulario de Contacto <noreply@centinelaelectoralsaeeuropa.com>',
            to: ['info@centinelaelectoralsaeeuropa.com'],
            replyTo: formData.email,
            subject: `[TEST] ${formData.asunto}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #005c2b; border-bottom: 2px solid #005c2b; padding-bottom: 10px;">Nuevo Mensaje de Contacto (SIMULACRO)</h2>
                    
                    <p><strong>Nombre:</strong> ${formData.nombre}</p>
                    <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
                    <p><strong>Asunto:</strong> ${formData.asunto}</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #666;">Mensaje:</h3>
                        <p style="white-space: pre-wrap;">${formData.mensaje}</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("❌ Error en Resend:", error);
        } else {
            console.log("✅ Correo enviado con éxito.");
            console.log("ID:", data.id);
            console.log("-----------------------------------------");
            console.log(`Debe llegar a: info@centinelaelectoralsaeeuropa.com (o donde tengas redirigido ese correo)`);
            console.log(`Al responder, debe ir a: ${formData.email}`);
        }

    } catch (err) {
        console.error("❌ Excepción:", err);
    }
}

testContactForm();
