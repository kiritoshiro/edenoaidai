<?php

// Pirmam giesmių tekstų perkėlimui per SSH:
//   php import-cli.php /kelias/iki/db.json
// Audio kategorijos ir priskyrimai indeksuojami iš files/audio aplankų.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/lib/import.php';

$dbFile = $argv[1] ?? '';

if ($dbFile === '' || !is_file($dbFile)) {
    fwrite(STDERR, "Naudojimas: php import-cli.php db.json\n");
    exit(1);
}

$db = pdo();

try {
    $songs = validate_songs_json(json_decode((string) file_get_contents($dbFile), true));
    backup_database($db, 'db');
    $count = import_songs($db, $songs);
    echo "Importuota giesmių: $count\n";

    $result = sync_audio_library($db, true);
    echo "Indeksuota audio kategorijų: {$result['categories']}\n";
    echo "Priskirta MP3 failų: {$result['audioFiles']}\n";
} catch (InvalidArgumentException $e) {
    fwrite(STDERR, 'Klaida: ' . $e->getMessage() . "\n");
    exit(1);
}
