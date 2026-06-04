<?php
header('Content-Type: application/json');
// Mock webhook to update payment status
// POST JSON { txId, status }
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) { echo json_encode(['success'=>false,'error'=>'invalid json']); http_response_code(400); exit; }
$txId = $input['txId'] ?? null;
$status = $input['status'] ?? null;
if (!$txId || !$status) { echo json_encode(['success'=>false,'error'=>'missing']); http_response_code(400); exit; }

$paymentsFile = __DIR__ . '/../../data/payments.json';
$payments = json_decode(file_get_contents($paymentsFile), true) ?: [];
$found = false;
for ($i=0;$i<count($payments);$i++) {
    if ($payments[$i]['txId'] === $txId) {
        $payments[$i]['status'] = $status;
        if ($status === 'paid') $payments[$i]['paidAt'] = date('c');
        $found = true; break;
    }
}
if ($found) {
    file_put_contents($paymentsFile, json_encode($payments, JSON_PRETTY_PRINT));
    echo json_encode(['success'=>true]);
} else {
    echo json_encode(['success'=>false,'error'=>'not found']); http_response_code(404);
}
exit;
