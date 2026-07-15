<?php

// Tik vietiniam kūrimui: php -S localhost:8000 router.php (iš server/ aplanko)

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

if (preg_match('#^/api(/|$)#', $path)) {
    require __DIR__ . '/api/index.php';
    return true;
}

$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false; // statinius failus atiduoda pats serveris
}

$index = __DIR__ . '/index.html';
if (is_file($index)) {
    readfile($index);
    return true;
}

http_response_code(404);
echo 'index.html dar nesukurtas - paleiskite "npm run release" frontend aplanke';
