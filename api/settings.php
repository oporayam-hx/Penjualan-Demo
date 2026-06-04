<?php
header('Content-Type: application/json');

$dataFile = __DIR__ . '/../data/settings.json';
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode(["adminKey"=>"sembako-admin"], JSON_PRETTY_PRINT));
}

$raw = file_get_contents($dataFile);
$settings = json_decode($raw, true) ?: [];

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return public-safe settings
    $public = [
        'payment' => [
            'provider' => $settings['payment']['provider'] ?? null,
            'mode' => $settings['payment']['mode'] ?? null,
            'enabled_methods' => $settings['payment']['public']['enabled_methods'] ?? ($settings['payment']['enabled_methods'] ?? [])
        ],
        'shipping' => [
            'methods' => $settings['shipping']['methods'] ?? [],
            'default' => $settings['shipping']['default'] ?? null,
            'free_shipping_threshold' => $settings['shipping']['free_shipping_threshold'] ?? 0
        ]
    ];

    echo json_encode(['success' => true, 'settings' => $public]);
    exit;
}

if ($method === 'POST') {
    // Require JSON body
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        http_response_code(400);
        exit;
    }

    // Basic auth: require adminKey
    $provided = $input['adminKey'] ?? '';
    $stored = $settings['adminKey'] ?? '';
    if (!$stored) {
        echo json_encode(['success' => false, 'error' => 'Server not configured']);
        http_response_code(500);
        exit;
    }
    if ($provided !== $stored) {
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        http_response_code(401);
        exit;
    }

    // Merge allowed fields
    $allowedPayment = ['provider','mode','enabled_methods','webhook_secret'];
    $allowedShipping = ['methods','default','free_shipping_threshold'];

    if (isset($input['payment'])) {
        foreach ($input['payment'] as $k => $v) {
            if (in_array($k, $allowedPayment)) {
                $settings['payment'][$k] = $v;
            }
        }
    }

    if (isset($input['shipping'])) {
        foreach ($input['shipping'] as $k => $v) {
            if (in_array($k, $allowedShipping)) {
                $settings['shipping'][$k] = $v;
            }
        }
    }

    // Save file
    if (file_put_contents($dataFile, json_encode($settings, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true, 'settings' => $settings]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to save settings']);
        http_response_code(500);
    }
    exit;
}

// Other methods
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
exit;
