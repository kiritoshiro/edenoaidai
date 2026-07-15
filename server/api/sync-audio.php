<?php

// Rankinis audio aplankų indekso atnaujinimas iš komandinės eilutės:
//   php api/sync-audio.php

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/lib/common.php';

try {
    $result = sync_audio_library(pdo(), true);
    echo "Audio indeksas atnaujintas.\n";
    echo "Kategorijų: {$result['categories']}\n";
    echo "Priskirtų MP3 failų: {$result['audioFiles']}\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'Klaida: ' . $error->getMessage() . "\n");
    exit(1);
}
