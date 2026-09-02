<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

function sendJson($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function normalizeProductRow(array $row) {
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'cat' => $row['cat'],
        'emoji' => $row['emoji'],
        'image' => $row['image'],
        'weight' => $row['weight'],
        'price' => (int)$row['price'],
        'originalPrice' => $row['originalPrice'] !== null ? (int)$row['originalPrice'] : null,
        'badge' => $row['badge'],
        'rating' => (float)$row['rating'],
        'reviews' => (int)$row['reviews'],
        'desc' => $row['description'],
        'stock' => (int)$row['stock'],
        'featured' => (bool)$row['featured'],
        'isNew' => (bool)$row['isNew'],
    ];
}

if ($method === 'GET') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    $cat = isset($_GET['cat']) ? trim($_GET['cat']) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;

    if ($id !== null) {
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id AND deleted = 0');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            sendJson(['success' => false, 'error' => 'Product not found'], 404);
        }
        sendJson(['success' => true, 'product' => normalizeProductRow($row)]);
    }

    $query = 'SELECT * FROM products WHERE deleted = 0';
    $params = [];

    if ($cat) {
        if ($cat === 'promo') {
            $query .= ' AND originalPrice IS NOT NULL AND originalPrice > price';
        } else {
            $query .= ' AND cat = :cat';
            $params[':cat'] = $cat;
        }
    }

    if ($search) {
        $query .= ' AND (LOWER(name) LIKE :search OR LOWER(cat) LIKE :search OR LOWER(description) LIKE :search)';
        $params[':search'] = '%' . strtolower($search) . '%';
    }

    $query .= ' ORDER BY featured DESC, id ASC';
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $products = array_map('normalizeProductRow', $rows);
    sendJson(['success' => true, 'products' => $products]);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

if (!isAdminRequest($input)) {
    sendJson(['success' => false, 'error' => 'Unauthorized'], 401);
}

if ($method === 'POST') {
    $required = ['name', 'cat', 'weight'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || trim((string)$input[$field]) === '') {
            sendJson(['success' => false, 'error' => "Field {$field} is required"], 400);
        }
    }
    if (!isset($input['price']) || !is_numeric($input['price']) || $input['price'] < 0) {
        sendJson(['success' => false, 'error' => 'Field price is required and must be a non-negative number'], 400);
    }
    if (!isset($input['stock']) || !is_numeric($input['stock']) || $input['stock'] < 0) {
        sendJson(['success' => false, 'error' => 'Field stock is required and must be a non-negative number'], 400);
    }

    $stmt = $pdo->prepare('INSERT INTO products (name, cat, emoji, image, weight, price, originalPrice, badge, rating, reviews, description, stock, featured, isNew, deleted, createdAt, updatedAt) VALUES (:name, :cat, :emoji, :image, :weight, :price, :originalPrice, :badge, :rating, :reviews, :description, :stock, :featured, :isNew, 0, :createdAt, :updatedAt)');
    $now = date('c');
    $stmt->execute([
        ':name' => $input['name'],
        ':cat' => $input['cat'],
        ':emoji' => $input['emoji'] ?? null,
        ':image' => $input['image'] ?? null,
        ':weight' => $input['weight'],
        ':price' => (int)$input['price'],
        ':originalPrice' => isset($input['originalPrice']) ? ($input['originalPrice'] !== '' ? (int)$input['originalPrice'] : null) : null,
        ':badge' => $input['badge'] ?? null,
        ':rating' => isset($input['rating']) ? (float)$input['rating'] : 0,
        ':reviews' => isset($input['reviews']) ? (int)$input['reviews'] : 0,
        ':description' => $input['desc'] ?? $input['description'] ?? null,
        ':stock' => (int)$input['stock'],
        ':featured' => !empty($input['featured']) ? 1 : 0,
        ':isNew' => !empty($input['isNew']) ? 1 : 0,
        ':createdAt' => $now,
        ':updatedAt' => $now,
    ]);

    $productId = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id');
    $stmt->execute([':id' => $productId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    sendJson(['success' => true, 'product' => normalizeProductRow($row)]);
}

if ($method === 'PUT') {
    $id = $input['id'] ?? null;
    if (!$id) {
        sendJson(['success' => false, 'error' => 'Product id is required'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$product) {
        sendJson(['success' => false, 'error' => 'Product not found'], 404);
    }

    $fields = ['name','cat','emoji','image','weight','price','originalPrice','badge','rating','reviews','stock','featured','isNew','desc','description'];
    $updates = [];
    $params = [':id' => $id];
    if (isset($input['name'])) { $updates[] = 'name = :name'; $params[':name'] = $input['name']; }
    if (isset($input['cat'])) { $updates[] = 'cat = :cat'; $params[':cat'] = $input['cat']; }
    if (array_key_exists('emoji', $input)) { $updates[] = 'emoji = :emoji'; $params[':emoji'] = $input['emoji']; }
    if (array_key_exists('image', $input)) { $updates[] = 'image = :image'; $params[':image'] = $input['image']; }
    if (isset($input['weight'])) { $updates[] = 'weight = :weight'; $params[':weight'] = $input['weight']; }
    if (isset($input['price'])) { $updates[] = 'price = :price'; $params[':price'] = (int)$input['price']; }
    if (array_key_exists('originalPrice', $input)) { $updates[] = 'originalPrice = :originalPrice'; $params[':originalPrice'] = $input['originalPrice'] !== '' ? (int)$input['originalPrice'] : null; }
    if (array_key_exists('badge', $input)) { $updates[] = 'badge = :badge'; $params[':badge'] = $input['badge'] ?? null; }
    if (isset($input['rating'])) { $updates[] = 'rating = :rating'; $params[':rating'] = (float)$input['rating']; }
    if (isset($input['reviews'])) { $updates[] = 'reviews = :reviews'; $params[':reviews'] = (int)$input['reviews']; }
    if (isset($input['stock'])) { $updates[] = 'stock = :stock'; $params[':stock'] = (int)$input['stock']; }
    if (isset($input['featured'])) { $updates[] = 'featured = :featured'; $params[':featured'] = !empty($input['featured']) ? 1 : 0; }
    if (isset($input['isNew'])) { $updates[] = 'isNew = :isNew'; $params[':isNew'] = !empty($input['isNew']) ? 1 : 0; }
    if (isset($input['desc'])) { $updates[] = 'description = :description'; $params[':description'] = $input['desc']; }
    if (isset($input['description'])) { $updates[] = 'description = :description'; $params[':description'] = $input['description']; }

    if (empty($updates)) {
        sendJson(['success' => false, 'error' => 'No fields to update'], 400);
    }

    $updates[] = 'updatedAt = :updatedAt';
    $params[':updatedAt'] = date('c');

    $query = 'UPDATE products SET ' . implode(', ', $updates) . ' WHERE id = :id';
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);

    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    sendJson(['success' => true, 'product' => normalizeProductRow($row)]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? ($input['id'] ?? null);
    if (!$id) {
        sendJson(['success' => false, 'error' => 'Product id is required'], 400);
    }
    $stmt = $pdo->prepare('UPDATE products SET deleted = 1, updatedAt = :updatedAt WHERE id = :id');
    $stmt->execute([':id' => $id, ':updatedAt' => date('c')]);
    sendJson(['success' => true]);
}

sendJson(['success' => false, 'error' => 'Method not allowed'], 405);
