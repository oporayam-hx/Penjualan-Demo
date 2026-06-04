<?php
// Simple upload endpoint for admin image uploads
// Usage: POST multipart/form-data with field name "image"
// Saves uploaded image to ../uploads/ and returns JSON { success: true, path: 'uploads/...' }

header('Content-Type: application/json');

// Allow only from same origin in dev; adjust CORS for production if needed
// header('Access-Control-Allow-Origin: *');

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    http_response_code(405);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded or upload error']);
    http_response_code(400);
    exit;
}

$file = $_FILES['image'];
// Basic validation
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($mime, $allowed)) {
    echo json_encode(['success' => false, 'error' => 'Invalid file type']);
    http_response_code(400);
    exit;
}

$ext = '';
switch ($mime) {
    case 'image/jpeg': $ext = '.jpg'; break;
    case 'image/png': $ext = '.png'; break;
    case 'image/webp': $ext = '.webp'; break;
    case 'image/gif': $ext = '.gif'; break;
}

$basename = bin2hex(random_bytes(8));
$filename = time() . '_' . $basename . $ext;
$dest = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file']);
    http_response_code(500);
    exit;
}

$publicPath = 'uploads/' . $filename;
// Resize image to max 800x800 and create thumbnail 200x200 using GD
$savedPath = $dest;
$thumbName = 'thumb_' . $filename;
$thumbPath = $uploadDir . $thumbName;

// Load image
switch ($mime) {
    case 'image/jpeg': $src = imagecreatefromjpeg($dest); break;
    case 'image/png': $src = imagecreatefrompng($dest); break;
    case 'image/webp':
        if (function_exists('imagecreatefromwebp')) {
            $src = imagecreatefromwebp($dest);
        } else {
            $src = imagecreatefrompng($dest);
        }
        break;
    case 'image/gif': $src = imagecreatefromgif($dest); break;
    default: $src = null; break;
}

if ($src) {
    $w = imagesx($src);
    $h = imagesy($src);

    // Resize main image to max 800x800
    $max = 800;
    $scale = min(1, $max / max($w, $h));
    $nw = (int)($w * $scale);
    $nh = (int)($h * $scale);
    if ($scale < 1) {
        $dst = imagecreatetruecolor($nw, $nh);
        // preserve transparency for PNG/WebP/GIF
        if (in_array($mime, ['image/png','image/webp','image/gif'])) {
            imagecolortransparent($dst, imagecolorallocatealpha($dst, 0, 0, 0, 127));
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
        }
        imagecopyresampled($dst, $src, 0,0,0,0, $nw, $nh, $w, $h);
        // overwrite saved file
        switch ($mime) {
            case 'image/jpeg': imagejpeg($dst, $savedPath, 85); break;
            case 'image/png': imagepng($dst, $savedPath); break;
            case 'image/webp': if (function_exists('imagewebp')) imagewebp($dst, $savedPath); else imagepng($dst, $savedPath); break;
            case 'image/gif': imagegif($dst, $savedPath); break;
        }
        imagedestroy($dst);
    }

    // Create thumbnail 200x200 (cover crop)
    $thumbSize = 200;
    $ratio = max($thumbSize / $w, $thumbSize / $h);
    $cropW = (int)($thumbSize / $ratio);
    $cropH = (int)($thumbSize / $ratio);
    $sx = intval(($w - $cropW) / 2);
    $sy = intval(($h - $cropH) / 2);
    $tgt = imagecreatetruecolor($thumbSize, $thumbSize);
    if (in_array($mime, ['image/png','image/webp','image/gif'])) {
        imagecolortransparent($tgt, imagecolorallocatealpha($tgt, 0, 0, 0, 127));
        imagealphablending($tgt, false);
        imagesavealpha($tgt, true);
    }
    imagecopyresampled($tgt, $src, 0,0, $sx, $sy, $thumbSize, $thumbSize, $cropW, $cropH);
    switch ($mime) {
        case 'image/jpeg': imagejpeg($tgt, $thumbPath, 85); break;
        case 'image/png': imagepng($tgt, $thumbPath); break;
        case 'image/webp': if (function_exists('imagewebp')) imagewebp($tgt, $thumbPath); else imagepng($tgt, $thumbPath); break;
        case 'image/gif': imagegif($tgt, $thumbPath); break;
    }
    imagedestroy($tgt);
    imagedestroy($src);
}

echo json_encode(['success' => true, 'path' => $publicPath, 'thumbnail' => 'uploads/' . $thumbName]);
exit;
