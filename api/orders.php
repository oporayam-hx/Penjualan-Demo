<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

function sendJson($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

if ($method === 'GET') {
    if (!isAdminRequest($_GET)) {
        sendJson(['success' => false, 'error' => 'Unauthorized'], 401);
    }

    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if ($id) {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$order) {
            sendJson(['success' => false, 'error' => 'Order not found'], 404);
        }
        sendJson(['success' => true, 'order' => $order]);
    }

    $stmt = $pdo->query('SELECT * FROM orders ORDER BY date DESC');
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendJson(['success' => true, 'orders' => $orders]);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'POST') {
    if (empty($input['id']) || empty($input['items']) || !isset($input['total'])) {
        sendJson(['success' => false, 'error' => 'Missing order id, items, or total'], 400);
    }

    $stmt = $pdo->prepare('INSERT OR REPLACE INTO orders (id, items, shipping, payment, customer, total, date, status) VALUES (:id, :items, :shipping, :payment, :customer, :total, :date, :status)');
    $stmt->execute([
        ':id' => $input['id'],
        ':items' => json_encode($input['items'], JSON_UNESCAPED_UNICODE),
        ':shipping' => json_encode($input['shipping'] ?? [], JSON_UNESCAPED_UNICODE),
        ':payment' => $input['payment'] ?? null,
        ':customer' => json_encode($input['customer'] ?? [], JSON_UNESCAPED_UNICODE),
        ':total' => (int)$input['total'],
        ':date' => $input['date'] ?? date('c'),
        ':status' => $input['status'] ?? 'pending',
    ]);

    sendJson(['success' => true, 'orderId' => $input['id']]);
}

sendJson(['success' => false, 'error' => 'Method not allowed'], 405);
