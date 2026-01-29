<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

$email = $input['email'] ?? '';
$otp = $input['otp'] ?? '';
$nombre = $input['nombre'] ?? 'Votante';

if (empty($email) || empty($otp)) {
    echo json_encode(["success" => false, "message" => "Email y OTP son requeridos"]);
    exit();
}

// Configuración del correo
$to = $email;
$subject = "Tu Código de Verificación - Elecciones Internas FP";
$message = "
<html>
<head>
    <title>Código de Verificación</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
        <div style='text-align: center; margin-bottom: 20px;'>
            <h2 style='color: #00843D;'>Fuerza del Pueblo</h2>
            <p style='font-weight: bold;'>Secretaría de Asuntos Electorales</p>
        </div>
        <p>Hola <strong>$nombre</strong>,</p>
        <p>Has solicitado un código de verificación para participar en las elecciones internas. Tu código es:</p>
        <div style='background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #00843D; border-radius: 5px; margin: 20px 0;'>
            $otp
        </div>
        <p>Este código es válido por 10 minutos. No lo compartas con nadie.</p>
        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
        <p style='font-size: 12px; color: #777;'>Este es un mensaje automático, por favor no respondas a este correo.</p>
    </div>
</body>
</html>
";

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: CRM Electoral <no-reply@centinelaelectoralsaeeuropa.com>" . "\r\n";

// Enviar correo
if (mail($to, $subject, $message, $headers)) {
    echo json_encode(["success" => true, "message" => "OTP enviado correctamente"]);
} else {
    echo json_encode(["success" => false, "message" => "Error al enviar el correo"]);
}
?>
