<?php
header('Content-Type: application/json');

// Simple payments create mock endpoint
// POST JSON { orderId, amount, method }

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    http_response_code(400);
    exit;
}

$orderId = $input['orderId'] ?? null;
$amount = intval($input['amount'] ?? 0);
$method = $input['method'] ?? 'qris';

if (!$orderId || $amount <= 0) {
    echo json_encode(['success' => false, 'error' => 'Missing orderId or invalid amount']);
    http_response_code(400);
    exit;
}

$paymentsFile = __DIR__ . '/../../data/payments.json';
$payments = json_decode(file_get_contents($paymentsFile), true) ?: [];

// create txId
$txId = 'PAY-' . strtoupper(bin2hex(random_bytes(4))) . '-' . time();

// Mock provider response
$provider = 'mock';
$qrPayload = base64_encode($txId . '|' . $amount . '|' . $method);
$paymentUrl = '/api/payments/redirect.php?txId=' . urlencode($txId);

$record = [
    'txId' => $txId,
    'orderId' => $orderId,
    'amount' => $amount,
    'method' => $method,
    'status' => 'pending',
    'createdAt' => date('c'),
    'provider' => $provider,
    'qrPayload' => $qrPayload,
    'paymentUrl' => $paymentUrl
];

$payments[] = $record;
file_put_contents($paymentsFile, json_encode($payments, JSON_PRETTY_PRINT));

echo json_encode(['success' => true, 'txId' => $txId, 'qrPayload' => $qrPayload, 'paymentUrl' => $paymentUrl]);
exit;
