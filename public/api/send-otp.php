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
$nombre = $input['nombre'] ?? 'Afiliado';

if (empty($email) || empty($otp)) {
    echo json_encode(["success" => false, "message" => "Email y OTP son requeridos"]);
    exit();
}

$apiKey = 're_Ciu9s2MT_4gsuZyDXGbEojKNAZQuAJPg1'; // API Key Real

$url = 'https://api.resend.com/emails';

$data = [
    'from' => 'Seguridad Electoral <info@centinelaelectoralsaeeuropa.com>',
    'to' => [$email],
    'subject' => 'Tu Código de Acceso - Elecciones Internas',
    'html' => "
    <div style='font-family: sans-serif; color: #333; max-width: 400px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;'>
        <div style='background-color: #005c2b; padding: 20px; text-align: center;'>
                <h2 style='color: white; margin: 0; font-size: 18px;'>Código de Verificación</h2>
        </div>
        <div style='padding: 30px 20px; text-align: center; background-color: #fff;'>
            <p style='margin-bottom: 20px; font-size: 14px; color: #666;'>Hola " . htmlspecialchars($nombre) . ", usa el siguiente código para ingresar a la cabina de votación:</p>
            
            <div style='background-color: #f0fdf4; border: 2px dashed #005c2b; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                <span style='font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #005c2b;'>" . htmlspecialchars($otp) . "</span>
            </div>
            
            <p style='font-size: 12px; color: #999; margin-top: 20px;'>Este código expira en 10 minutos.<br>Si no solicitaste este código, ignora este mensaje.</p>
        </div>
        <div style='background-color: #f9fafb; padding: 15px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee;'>
            FP Europa · Sistema de Votación Segura
        </div>
    </div>
    "
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode(["success" => true, "data" => json_decode($response)]);
} else {
    echo json_encode(["success" => false, "error" => "Error de Resend: " . $response]);
}
?>
