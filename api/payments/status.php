<?php
header('Content-Type: application/json');
// GET ?txId=...
$txId = $_GET['txId'] ?? null;
if (!$txId) { echo json_encode(['success'=>false,'error'=>'txId required']); http_response_code(400); exit; }

$paymentsFile = __DIR__ . '/../../data/payments.json';
$payments = json_decode(file_get_contents($paymentsFile), true) ?: [];

$rec = null;
foreach ($payments as $p) { if ($p['txId'] === $txId) { $rec = $p; break; } }
if (!$rec) { echo json_encode(['success'=>false,'error'=>'not found']); http_response_code(404); exit; }

echo json_encode(['success'=>true,'payment'=>$rec]);
exit;
