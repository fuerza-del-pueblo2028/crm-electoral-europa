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
$nombre = $input['nombre'] ?? '';

if (empty($email)) {
    echo json_encode(["success" => false, "message" => "Email es requerido"]);
    exit();
}

$apiKey = 're_Ciu9s2MT_4gsuZyDXGbEojKNAZQuAJPg1'; // API Key Real

$url = 'https://api.resend.com/emails';

$data = [
    'from' => 'Secretaría Asuntos Electorales <info@centinelaelectoralsaeeuropa.com>',
    'to' => [$email],
    'subject' => '¡Bienvenido a la Fuerza del Pueblo!',
    'html' => "
    <div style='font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;'>
        <div style='background-color: #005c2b; padding: 20px; text-align: center;'>
                <h1 style='color: white; margin: 0;'>¡Bienvenido, " . htmlspecialchars($nombre) . "!</h1>
        </div>
        <div style='padding: 20px;'>
            <p style='font-size: 16px; line-height: 1.5;'>Nos complace darte la bienvenida a la Secretaría de Asuntos Electorales de la Fuerza del Pueblo en Europa.</p>
            <p style='font-size: 16px; line-height: 1.5;'>Tu registro ha sido completado exitosamente y ya formas parte de nuestra base de datos oficial.</p>
            
            <div style='background-color: #f9f9f9; padding: 15px; border-left: 4px solid #005c2b; margin: 20px 0;'>
                <p style='margin: 0; font-weight: bold;'>Tus credenciales de acceso:</p>
                <ul style='margin-top: 10px; margin-bottom: 0;'>
                    <li><strong>Usuario:</strong> Tu número de cédula</li>
                    <li><strong>Contraseña:</strong> Los últimos 6 dígitos de tu cédula</li>
                </ul>
            </div>
            
            <div style='text-align: center; margin-top: 30px;'>
                <a href='https://tudominio.com' style='background-color: #005c2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Acceder al Portal</a>
            </div>
        </div>
        <div style='background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #888;'>
            <p>© " . date("Y") . " Fuerza del Pueblo - Secretaría de Asuntos Electorales Europa</p>
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