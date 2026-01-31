<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Aumentar el límite de tiempo de ejecución para lotes grandes
set_time_limit(300);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
// Esperamos un array de emails en 'destinatarios' [{email, nombre}]
$destinatarios = $input['destinatarios'] ?? [];
$asunto = $input['asunto'] ?? '';
$mensaje = $input['mensaje'] ?? '';

if (empty($destinatarios) || empty($asunto) || empty($mensaje)) {
    echo json_encode(["success" => false, "message" => "Destinatarios, asunto y mensaje requeridos"]);
    exit();
}

$apiKey = 're_Ciu9s2MT_4gsuZyDXGbEojKNAZQuAJPg1'; // API Key Real
$url = 'https://api.resend.com/emails/batch';

// Preparar el lote para Resend (Max 100 recomendado por request, aquí asumimos que el frontend maneja la paginación de lotes)
$batchData = [];

foreach ($destinatarios as $dest) {
    if (empty($dest['email']))
        continue;

    $batchData[] = [
        'from' => 'Secretaría Asuntos Electorales <info@centinelaelectoralsaeeuropa.com>',
        'to' => [$dest['email']],
        'subject' => $asunto,
        'html' => "
            <div style='font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;'>
                <div style='background-color: #005c2b; padding: 15px; text-align: center;'>
                        <h2 style='color: white; margin: 0;'>Comunicado Oficial</h2>
                </div>
                <div style='padding: 20px; border: 1px solid #eee;'>
                    <p>Estimado/a " . htmlspecialchars($dest['nombre']) . ",</p>
                    <div style='white-space: pre-line; line-height: 1.6;'>
                        " . nl2br(htmlspecialchars($mensaje)) . "
                    </div>
                </div>
                <div style='font-size: 11px; text-align: center; color: #888; margin-top: 20px;'>
                    <p>Recibes este correo porque estás registrado en el CRM Electoral de la FP Europa.</p>
                </div>
            </div>
        "
    ];
}

if (empty($batchData)) {
    echo json_encode(["success" => false, "message" => "No hay destinatarios válidos"]);
    exit();
}

// Enviar a Resend
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($batchData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode(["success" => true, "count" => count($batchData), "data" => json_decode($response)]);
} else {
    echo json_encode(["success" => false, "error" => "Error de Resend: " . $response, "curl_error" => $curlError]);
}
?>