<?php

// Local development only: run `php -S localhost:8000 router.php` from server/.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

if (preg_match('#^/api(/|$)#', $path)) {
    require __DIR__ . '/api/index.php';
    return true;
}

$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false; // Let PHP's development server return existing static files.
}

$index = __DIR__ . '/index.html';
if (is_file($index)) {
    readfile($index);
    return true;
}

http_response_code(404);
echo 'index.html has not been built; run "npm run release" in the frontend directory';
