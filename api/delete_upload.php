<?php
header('Content-Type: application/json');

$uploadDir = realpath(__DIR__ . '/../uploads') . DIRECTORY_SEPARATOR;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid payload']);
    http_response_code(400);
    exit;
}

$paths = [];
if (isset($input['path'])) $paths[] = $input['path'];
if (isset($input['paths']) && is_array($input['paths'])) $paths = array_merge($paths, $input['paths']);

$deleted = [];
$errors = [];

foreach ($paths as $p) {
    // Normalize
    $p = str_replace('..', '', $p);
    $p = ltrim($p, '/\\');

    // Only allow files inside uploads/
    if (strpos($p, 'uploads/') !== 0) {
        $errors[] = "Skipping invalid path: $p";
        continue;
    }

    $full = realpath(__DIR__ . '/../' . $p);
    if (!$full) {
        $errors[] = "File not found: $p";
        continue;
    }

    // Ensure file is within upload dir
    if (strpos($full, $uploadDir) !== 0) {
        $errors[] = "Forbidden: $p";
        continue;
    }

    if (is_file($full)) {
        if (unlink($full)) {
            $deleted[] = $p;
        } else {
            $errors[] = "Failed to delete: $p";
        }
    } else {
        $errors[] = "Not a file: $p";
    }
}

echo json_encode(['success' => true, 'deleted' => $deleted, 'errors' => $errors]);
exit;
