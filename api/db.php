<?php
// Simple SQLite helper for product and order persistence.
// Creates data/database.sqlite and initializes tables on first use.

$dbFile = __DIR__ . '/../data/database.sqlite';
$dir = dirname($dbFile);
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

$pdo = new PDO('sqlite:' . $dbFile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA journal_mode = WAL;');
$pdo->exec('PRAGMA foreign_keys = ON;');

$pdo->exec('CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    cat TEXT NOT NULL,
    emoji TEXT,
    image TEXT,
    weight TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    originalPrice INTEGER,
    badge TEXT,
    rating REAL DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    description TEXT,
    stock INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    isNew INTEGER DEFAULT 0,
    deleted INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
);');

$pdo->exec('CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    items TEXT NOT NULL,
    shipping TEXT,
    payment TEXT,
    customer TEXT,
    total INTEGER,
    date TEXT,
    status TEXT
);');

function ensureSeedProducts(PDO $pdo) {
    $count = $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
    if ($count > 0) {
        return;
    }

    $seedFile = __DIR__ . '/../data/products.json';
    if (!file_exists($seedFile)) {
        return;
    }

    $raw = file_get_contents($seedFile);
    $items = json_decode($raw, true) ?: [];
    $stmt = $pdo->prepare('INSERT INTO products (id, name, cat, emoji, image, weight, price, originalPrice, badge, rating, reviews, description, stock, featured, isNew, deleted, createdAt, updatedAt) VALUES (:id, :name, :cat, :emoji, :image, :weight, :price, :originalPrice, :badge, :rating, :reviews, :description, :stock, :featured, :isNew, 0, :createdAt, :updatedAt)');
    $now = date('c');

    foreach ($items as $item) {
        $stmt->execute([
            ':id' => $item['id'],
            ':name' => $item['name'],
            ':cat' => $item['cat'],
            ':emoji' => $item['emoji'] ?? null,
            ':image' => $item['image'] ?? null,
            ':weight' => $item['weight'] ?? null,
            ':price' => $item['price'] ?? 0,
            ':originalPrice' => $item['originalPrice'] ?? null,
            ':badge' => $item['badge'] ?? null,
            ':rating' => $item['rating'] ?? 0,
            ':reviews' => $item['reviews'] ?? 0,
            ':description' => $item['desc'] ?? $item['description'] ?? null,
            ':stock' => $item['stock'] ?? 0,
            ':featured' => $item['featured'] ? 1 : 0,
            ':isNew' => $item['isNew'] ? 1 : 0,
            ':createdAt' => $now,
            ':updatedAt' => $now,
        ]);
    }
}

ensureSeedProducts($pdo);

function getSettingsAdminKey() {
    $settingsFile = __DIR__ . '/../data/settings.json';
    if (!file_exists($settingsFile)) {
        return 'sembako-admin';
    }
    $raw = file_get_contents($settingsFile);
    $settings = json_decode($raw, true) ?: [];
    return $settings['adminKey'] ?? 'sembako-admin';
}

function isAdminRequest($payload = []) {
    $provided = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $parts = explode(' ', trim($_SERVER['HTTP_AUTHORIZATION']));
        if (count($parts) === 2 && strtolower($parts[0]) === 'bearer') {
            $provided = $parts[1];
        }
    }
    if (!$provided && isset($payload['adminKey'])) {
        $provided = $payload['adminKey'];
    }
    if (!$provided && isset($_REQUEST['adminKey'])) {
        $provided = $_REQUEST['adminKey'];
    }
    return $provided === getSettingsAdminKey();
}
