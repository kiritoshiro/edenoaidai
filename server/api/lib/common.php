<?php

declare(strict_types=1);

const SONG_ID_RE = '/^[A-Za-z0-9 _-]{1,20}$/';
const TYPE_RE = '/^[a-z0-9&+_-]{1,40}$/i';
const FORMATS = ['svg', 'jpg'];
const TRACK_ICON_EXTENSIONS = ['svg', 'png', 'webp', 'jpg', 'jpeg'];
const SESSION_HOURS = 12;

// ─── Konfigūracija ir DB ─────────────────────────────────────────────

function config(): array
{
    static $config = null;
    if ($config === null) {
        $file = dirname(__DIR__) . '/config.php';
        if (!is_file($file)) {
            fail(500, 'Trūksta api/config.php (nukopijuokite iš config.example.php ir užpildykite)');
        }
        $config = require $file;
    }
    return $config;
}

function pdo(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config();
        $dsn = "mysql:host={$c['db_host']};dbname={$c['db_name']};charset=utf8mb4";
        try {
            $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            ensure_schema($pdo);
        } catch (PDOException $e) {
            error_log('[edeno-aidai] DB: ' . $e->getMessage());
            fail(500, 'Nepavyko prisijungti prie duomenų bazės (patikrinkite config.php)');
        }
    }
    return $pdo;
}

function ensure_schema(PDO $db): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    $table = $db->query("SHOW TABLES LIKE 'songs'")->fetchColumn();
    if ($table !== false) {
        $column = $db->query("SHOW COLUMNS FROM songs LIKE 'slides_json'")->fetchColumn();
        if ($column === false) {
            $db->exec('ALTER TABLE songs ADD COLUMN slides_json MEDIUMTEXT NULL AFTER body');
        }
    }
    $ready = true;
}

function files_dir(): string
{
    return rtrim(config()['files_dir'], '/');
}

function storage_dir(): string
{
    return rtrim(config()['storage_dir'], '/');
}

function audio_dir(): string
{
    return files_dir() . '/audio';
}

// ─── HTTP pagalbininkai ──────────────────────────────────────────────

function json_out(mixed $data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $code, string $message): never
{
    json_out(['error' => $message], $code);
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        fail(400, 'Netinkamas JSON');
    }
    return $data;
}

// ─── Validacija ──────────────────────────────────────────────────────

function assert_song_id(string $value): string
{
    if (!preg_match(SONG_ID_RE, $value)) {
        fail(400, 'Netinkamas giesmės numeris');
    }
    return $value;
}

function assert_type(string $value): string
{
    if (!preg_match(TYPE_RE, $value)) {
        fail(400, 'Netinkamas įrašo tipo vardas');
    }
    return $value;
}

function assert_format(string $value): string
{
    if (!in_array($value, FORMATS, true)) {
        fail(400, 'Formatas turi būti svg arba jpg');
    }
    return $value;
}

function assert_page(mixed $value): int
{
    $page = filter_var($value ?? 0, FILTER_VALIDATE_INT);
    if ($page === false || $page < 0 || $page > 8) {
        fail(400, 'Puslapis turi būti 0–8');
    }
    return $page;
}

function notes_file_name(string $songId, int $page, string $format): string
{
    return $page === 0 ? "$songId.$format" : "{$songId}_{$page}.$format";
}

function note_pages_for_format(string $songId, string $format): array
{
    $pages = [];
    for ($page = 0; $page <= 8; $page++) {
        $file = notes_file_name($songId, $page, $format);
        if (is_file(files_dir() . "/notes/$format/$file")) {
            $pages[] = $page;
        }
    }
    return $pages;
}

function note_pages_for_song(string $songId): array
{
    $result = [];
    foreach (FORMATS as $format) {
        $result[$format] = note_pages_for_format($songId, $format);
    }
    return $result;
}

function detected_note_page_count(array $notePages): int
{
    $highest = -1;
    foreach ($notePages as $pages) {
        if ($pages) {
            $highest = max($highest, max($pages));
        }
    }
    return $highest + 1;
}

function admin_note_file_entries(string $songId, string $format): array
{
    $existingPages = note_pages_for_format($songId, $format);
    $existing = array_flip($existingPages);
    $lastPage = $existingPages ? min(8, max($existingPages) + 1) : 0;
    $entries = [];

    // Include existing pages, gaps, and one empty slot for the next upload.
    for ($page = 0; $page <= $lastPage; $page++) {
        $entries[] = [
            'page' => $page,
            'file' => notes_file_name($songId, $page, $format),
            'exists' => isset($existing[$page]),
        ];
    }
    return $entries;
}

// ─── Sesija / prisijungimas ──────────────────────────────────────────

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('EA_ADMIN');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function is_logged_in(): bool
{
    start_session();
    if (empty($_SESSION['admin'])) {
        return false;
    }
    if (time() - (int) ($_SESSION['login_time'] ?? 0) > SESSION_HOURS * 3600) {
        do_logout();
        return false;
    }
    return true;
}

function require_auth(): void
{
    if (!is_logged_in()) {
        fail(401, 'Reikia prisijungti');
    }
}

function do_login(): void
{
    start_session();
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    $_SESSION['login_time'] = time();
}

function do_logout(): void
{
    start_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function client_ip(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 45);
}

function check_login_rate(string $ip): void
{
    $db = pdo();
    $db->prepare('DELETE FROM login_attempts WHERE window_start < (NOW() - INTERVAL 15 MINUTE)')->execute();
    $statement = $db->prepare('SELECT attempts FROM login_attempts WHERE ip = ?');
    $statement->execute([$ip]);
    $attempts = $statement->fetchColumn();
    if ($attempts !== false && (int) $attempts >= 20) {
        fail(429, 'Per daug bandymų. Pabandykite po 15 minučių.');
    }
}

function record_login_failure(string $ip): void
{
    pdo()->prepare(
        'INSERT INTO login_attempts (ip, attempts, window_start) VALUES (?, 1, NOW())
         ON DUPLICATE KEY UPDATE attempts = attempts + 1',
    )->execute([$ip]);
}

function clear_login_failures(string $ip): void
{
    pdo()->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);
}

// ─── Giesmių forma (DB eilutė <-> API) ───────────────────────────────

function normalize_song_slides(mixed $value): array
{
    if (!is_array($value) || !array_is_list($value)) {
        return [];
    }

    $slides = [];
    foreach (array_slice($value, 0, 100) as $entry) {
        if (!is_array($entry) || !is_string($entry['text'] ?? null)) {
            continue;
        }
        $text = preg_replace('/<br\s*\/?>/i', "\n", $entry['text']) ?? '';
        $text = preg_replace(
            '/<\/(?:article|div|h[1-6]|li|p|section)>/i',
            "\n",
            $text,
        ) ?? '';
        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? '';
        $text = trim($text);
        if ($text === '') {
            continue;
        }
        $isChorus = (bool) ($entry['isChorus'] ?? false);
        $slides[] = [
            'text' => mb_substr($text, 0, 20000),
            'isChorus' => $isChorus,
            'chorusAfter' => !$isChorus && ($entry['chorusAfter'] ?? true) !== false,
        ];
    }
    return $slides;
}

function decode_song_slides(mixed $value): array
{
    if (!is_string($value) || trim($value) === '') {
        return [];
    }
    $decoded = json_decode($value, true);
    return normalize_song_slides($decoded);
}

function song_to_api(array $row, ?array $lists = null): array
{
    $notePages = note_pages_for_song((string) $row['song_id']);
    $song = [
        'songId' => $row['song_id'],
        'title' => $row['title'],
        'verse' => $row['verse'] ?? '',
        'body' => $row['body'] ?? '',
        'slides' => decode_song_slides($row['slides_json'] ?? null),
        'copyright' => $row['copyright'] ?? '',
        'notePages' => $notePages,
    ];
    $pageCount = detected_note_page_count($notePages);
    if ($pageCount > 0) {
        // Compatibility for older installed clients; new clients use notePages.
        $song['pages'] = $pageCount;
    }
    if ($lists !== null) {
        $song['lists'] = $lists;
    }
    return $song;
}

function sanitize_song(array $input): array
{
    $song = [];
    if (isset($input['songId']) && is_string($input['songId'])) {
        $song['song_id'] = trim($input['songId']);
    }
    if (isset($input['title'])) {
        $title = $input['title'];
        if (is_array($title)) {
            $title = implode(' / ', array_map('strval', $title));
        }
        if (is_string($title)) {
            $song['title'] = $title;
        }
    }
    foreach (['verse', 'body', 'copyright'] as $field) {
        if (isset($input[$field]) && is_string($input[$field])) {
            $song[$field] = $input[$field];
        }
    }
    if (array_key_exists('slides', $input)) {
        $song['slides_json'] = json_encode(
            normalize_song_slides($input['slides']),
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        );
    }
    return $song;
}

function fetch_song(PDO $db, string $songId): ?array
{
    $statement = $db->prepare('SELECT * FROM songs WHERE song_id = ?');
    $statement->execute([$songId]);
    $row = $statement->fetch();
    return $row === false ? null : $row;
}

function fetch_lists_map(PDO $db): array
{
    $map = [];
    $rows = $db->query(
        'SELECT st.song_id, st.type_name
         FROM song_tracks st
         JOIN track_types t ON t.name = st.type_name
         ORDER BY t.sort_order, t.name',
    )->fetchAll();
    foreach ($rows as $row) {
        $map[$row['song_id']][] = $row['type_name'];
    }
    return $map;
}

function fetch_lists_for(PDO $db, string $songId): array
{
    $statement = $db->prepare(
        'SELECT st.type_name
         FROM song_tracks st
         JOIN track_types t ON t.name = st.type_name
         WHERE st.song_id = ?
         ORDER BY t.sort_order, t.name',
    );
    $statement->execute([$songId]);
    return array_column($statement->fetchAll(), 'type_name');
}

function sync_lists(PDO $db, string $songId, array $lists): void
{
    $valid = array_column($db->query('SELECT name FROM track_types')->fetchAll(), 'name');
    $wanted = array_values(array_unique(array_filter(
        $lists,
        fn ($name) => is_string($name) && in_array($name, $valid, true),
    )));

    $db->prepare('DELETE FROM song_tracks WHERE song_id = ?')->execute([$songId]);
    $insert = $db->prepare('INSERT INTO song_tracks (song_id, type_name) VALUES (?, ?)');
    foreach ($wanted as $name) {
        $insert->execute([$songId, $name]);
    }
}

// ─── Audio aplankų indeksavimas ──────────────────────────────────────

function track_label_from_name(string $name): string
{
    $label = str_replace(['&', '+'], [' & ', ' + '], $name);
    $label = preg_replace('/[_-]+/', ' ', $label) ?? $label;
    $label = preg_replace('/\s+/', ' ', trim($label)) ?? trim($label);
    return $label === '' ? $name : mb_convert_case($label, MB_CASE_TITLE, 'UTF-8');
}

function find_track_icon(string $folder, string $name): ?string
{
    $candidates = [];
    foreach (TRACK_ICON_EXTENSIONS as $extension) {
        $candidates[] = "icon.$extension";
    }
    foreach (TRACK_ICON_EXTENSIONS as $extension) {
        $candidates[] = "$name.$extension";
    }

    $entries = scandir($folder) ?: [];
    $caseMap = [];
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        $caseMap[strtolower($entry)] = $entry;
    }

    foreach ($candidates as $candidate) {
        $actual = $caseMap[strtolower($candidate)] ?? null;
        if ($actual !== null && is_file($folder . '/' . $actual)) {
            return $actual;
        }
    }

    // Jei nėra icon.* failo, paimama pirmoji kategorijos aplanko šaknyje
    // esanti palaikomo formato paveikslėlio byla.
    $images = [];
    foreach ($entries as $entry) {
        $path = $folder . '/' . $entry;
        if (!is_file($path)) {
            continue;
        }
        $extension = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        if (in_array($extension, TRACK_ICON_EXTENSIONS, true)) {
            $images[] = $entry;
        }
    }
    natcasesort($images);
    return $images ? array_values($images)[0] : null;
}

function audio_category_directories(): array
{
    $root = audio_dir();
    if (!is_dir($root) && !mkdir($root, 0775, true) && !is_dir($root)) {
        throw new RuntimeException('Nepavyko sukurti audio aplanko');
    }

    $directories = [];
    foreach (scandir($root) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..' || str_starts_with($entry, '.')) {
            continue;
        }
        if (!preg_match(TYPE_RE, $entry)) {
            error_log("[edeno-aidai] Praleistas netinkamas audio aplanko vardas: $entry");
            continue;
        }
        $path = $root . '/' . $entry;
        if (is_dir($path)) {
            $directories[$entry] = $path;
        }
    }
    uksort($directories, 'strnatcasecmp');
    return $directories;
}

/**
 * Aplankas yra tiesos šaltinis:
 *   files/audio/<kategorija>/<songId>.mp3
 *   files/audio/<kategorija>/icon.svg (taip pat png/webp/jpg)
 *
 * Kategorijos, ikonos ir MP3 priskyrimai perrašomi MySQL lentelėse.
 * Esamas administratoriaus pakeistas kategorijos label išsaugomas.
 */
function sync_audio_library(PDO $db, bool $force = false): array
{
    static $result = null;
    if ($result !== null && !$force) {
        return $result;
    }

    $storage = storage_dir();
    if (!is_dir($storage) && !mkdir($storage, 0775, true) && !is_dir($storage)) {
        throw new RuntimeException('Nepavyko sukurti storage aplanko');
    }
    $lockHandle = fopen($storage . '/audio-index.lock', 'c');
    if ($lockHandle === false || !flock($lockHandle, LOCK_EX)) {
        throw new RuntimeException('Nepavyko užrakinti audio indekso');
    }

    try {
        $directories = audio_category_directories();
        $existingTypes = [];
    foreach ($db->query('SELECT * FROM track_types')->fetchAll() as $row) {
        $existingTypes[$row['name']] = $row;
    }
    $knownSongs = array_flip(array_column(
        $db->query('SELECT song_id FROM songs')->fetchAll(),
        'song_id',
    ));

    $db->beginTransaction();
    try {
        $upsertType = $db->prepare(
            'INSERT INTO track_types (name, label, icon, sort_order)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE icon = VALUES(icon), sort_order = VALUES(sort_order)',
        );
        $deleteAssignments = $db->prepare('DELETE FROM song_tracks WHERE type_name = ?');
        $insertAssignment = $db->prepare(
            'INSERT IGNORE INTO song_tracks (song_id, type_name) VALUES (?, ?)',
        );

        $names = [];
        $audioCount = 0;
        $sortOrder = 1;

        foreach ($directories as $name => $folder) {
            $names[] = $name;
            $label = isset($existingTypes[$name]) && trim((string) $existingTypes[$name]['label']) !== ''
                ? (string) $existingTypes[$name]['label']
                : track_label_from_name($name);
            $iconFile = find_track_icon($folder, $name);
            $icon = $iconFile === null ? null : "audio/$name/$iconFile";

            $upsertType->execute([$name, $label, $icon, $sortOrder++]);
            $deleteAssignments->execute([$name]);

            $files = scandir($folder) ?: [];
            natcasesort($files);
            foreach ($files as $file) {
                $path = $folder . '/' . $file;
                if (!is_file($path) || strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== 'mp3') {
                    continue;
                }
                $songId = trim(pathinfo($file, PATHINFO_FILENAME));
                if (!preg_match(SONG_ID_RE, $songId)) {
                    error_log("[edeno-aidai] Praleistas netinkamo numerio audio failas: $name/$file");
                    continue;
                }
                if (!isset($knownSongs[$songId])) {
                    error_log("[edeno-aidai] Audio failui nėra giesmės DB: $name/$file");
                    continue;
                }
                $insertAssignment->execute([$songId, $name]);
                $audioCount++;
            }
        }

        if ($names) {
            $placeholders = implode(',', array_fill(0, count($names), '?'));
            $db->prepare("DELETE FROM track_types WHERE name NOT IN ($placeholders)")
                ->execute($names);
        } else {
            $db->exec('DELETE FROM track_types');
        }

        $db->commit();
        $result = [
            'categories' => count($names),
            'audioFiles' => $audioCount,
        ];
        return $result;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    } finally {
        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }
}

// ─── Įrašų tipai ─────────────────────────────────────────────────────

function fetch_track_types(PDO $db): array
{
    return $db->query('SELECT * FROM track_types ORDER BY sort_order, name')->fetchAll();
}

function track_to_api(PDO $db, array $row): array
{
    $statement = $db->prepare(
        'SELECT song_id FROM song_tracks WHERE type_name = ?
         ORDER BY CAST(song_id AS UNSIGNED), song_id',
    );
    $statement->execute([$row['name']]);
    return [
        'name' => $row['name'],
        'label' => $row['label'],
        'icon' => $row['icon'],
        'tracks' => array_column($statement->fetchAll(), 'song_id'),
    ];
}

// ─── Vieši JSON (db.json / tracks.json pavidalas kaip anksčiau) ──────

function build_public_db(PDO $db): array
{
    $rows = $db->query('SELECT * FROM songs ORDER BY CAST(song_id AS UNSIGNED), song_id')->fetchAll();
    return array_map(fn ($row) => song_to_api($row), $rows);
}

function build_public_tracks(PDO $db): array
{
    return array_map(fn ($row) => track_to_api($db, $row), fetch_track_types($db));
}
