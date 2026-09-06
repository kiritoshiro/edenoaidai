<?php

declare(strict_types=1);

ini_set('display_errors', '0');

set_exception_handler(function (Throwable $e): void {
    error_log('[edeno-aidai] ' . $e);
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['error' => 'Serverio klaida'], JSON_UNESCAPED_UNICODE);
    exit;
});

require_once __DIR__ . '/lib/common.php';
require_once __DIR__ . '/lib/import.php';
require_once __DIR__ . '/lib/github.php';

// ─── Maršruto išskaidymas ────────────────────────────────────────────

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$path = preg_replace('#^.*?/api(?=/|$)#', '', $uri) ?? '/';
$segments = array_map('rawurldecode', array_values(array_filter(
    explode('/', $path),
    fn (string $segment) => $segment !== '',
)));
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$first = $segments[0] ?? '';
$isPublic =
    ($first === '' && $method === 'GET') ||
    ($first === 'public' && $method === 'GET') ||
    ($first === 'login' && $method === 'POST') ||
    ($first === 'logout' && $method === 'POST');

if (!$isPublic) {
    require_auth();
}

// ─── Failų įkėlimo pagalbininkai ─────────────────────────────────────

function uploaded_file(int $maxBytes): array
{
    $file = $_FILES['file'] ?? null;
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        fail(400, 'Nepridėtas failas');
    }
    if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
        fail(413, 'Failas per didelis (padidinkite upload_max_filesize PHP nustatymuose)');
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        fail(400, 'Nepavyko įkelti failo');
    }
    if (($file['size'] ?? 0) > $maxBytes) {
        fail(413, 'Failas per didelis');
    }
    return $file;
}

function save_upload(array $file, string $target): void
{
    $dir = dirname($target);
    if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
        fail(500, 'Nepavyko sukurti failų aplanko (patikrinkite teises)');
    }
    $moved = is_uploaded_file($file['tmp_name'])
        ? move_uploaded_file($file['tmp_name'], $target)
        : rename($file['tmp_name'], $target);
    if (!$moved) {
        fail(500, 'Nepavyko išsaugoti failo (patikrinkite aplanko teises)');
    }
}

function has_extension(array $file, array $extensions, array $mimeParts): bool
{
    $name = strtolower((string) ($file['name'] ?? ''));
    $mime = strtolower((string) ($file['type'] ?? ''));
    foreach ($extensions as $extension) {
        if (str_ends_with($name, $extension)) {
            return true;
        }
    }
    foreach ($mimeParts as $part) {
        if ($part !== '' && str_contains($mime, $part)) {
            return true;
        }
    }
    return false;
}

// ─── Maršrutai ───────────────────────────────────────────────────────

// GET /api
if ($segments === [] && $method === 'GET') {
    json_out(['name' => 'Edeno Aidai backend (PHP)', 'ok' => true]);
}

// GET /api/public/db.json  |  /api/public/tracks.json
if ($first === 'public' && $method === 'GET' && count($segments) === 2) {
    $db = pdo();
    if ($segments[1] === 'db.json') {
        json_out(build_public_db($db));
    }
    if ($segments[1] === 'tracks.json') {
        // Aplankai indeksuojami kiekvieną kartą atnaujinant programėlės duomenis.
        sync_audio_library($db);
        json_out(build_public_tracks($db));
    }
}

// GET /api/export/database
if ($first === 'export' && $method === 'GET' && count($segments) === 2 && $segments[1] === 'database') {
    $db = pdo();
    // Keep the exported recording assignments aligned with the current audio
    // folder structure before taking the snapshot.
    sync_audio_library($db);
    json_download(
        build_database_export($db),
        'edeno-aidai-database-' . gmdate('Y-m-d-His') . '.json',
    );
}

// GET /api/github/commits | /api/github/releases
if ($first === 'github' && $method === 'GET' && count($segments) === 2) {
    try {
        if ($segments[1] === 'commits') {
            json_out([
                'repository' => github_settings()['owner'] . '/' . github_settings()['repo'],
                'branch' => github_settings()['branch'],
                'items' => github_commits(),
            ]);
        }
        if ($segments[1] === 'releases') {
            json_out([
                'repository' => github_settings()['owner'] . '/' . github_settings()['repo'],
                'branch' => github_settings()['branch'],
                'items' => github_releases(),
            ]);
        }
    } catch (Throwable $e) {
        fail(502, $e->getMessage());
    }
}

// POST /api/update – update to a selected commit or release.
if ($first === 'update' && $method === 'POST' && count($segments) === 1) {
    $body = read_json_body();
    try {
        json_out(github_update(
            trim((string) ($body['source'] ?? '')),
            trim((string) ($body['ref'] ?? '')),
        ));
    } catch (InvalidArgumentException $e) {
        fail(400, $e->getMessage());
    } catch (Throwable $e) {
        fail(502, $e->getMessage());
    }
}

// POST /api/login
if ($first === 'login' && $method === 'POST') {
    $ip = client_ip();
    check_login_rate($ip);
    $hash = (string) (config()['admin_password_hash'] ?? '');
    if ($hash === '') {
        fail(500, 'Nenustatyta administratoriaus slaptažodžio maiša (config.php)');
    }
    $password = (string) (read_json_body()['password'] ?? '');
    if ($password === '' || !password_verify($password, $hash)) {
        record_login_failure($ip);
        fail(401, 'Neteisingas slaptažodis');
    }
    clear_login_failures($ip);
    do_login();
    json_out(['ok' => true]);
}

// POST /api/logout
if ($first === 'logout' && $method === 'POST') {
    do_logout();
    json_out(['ok' => true]);
}

// GET /api/me
if ($first === 'me' && $method === 'GET') {
    json_out(['role' => 'admin']);
}

// ─── Giesmės ─────────────────────────────────────────────────────────

if ($first === 'songs') {
    $db = pdo();
    sync_audio_library($db);

    // GET /api/songs
    if (count($segments) === 1 && $method === 'GET') {
        $rows = $db->query('SELECT * FROM songs ORDER BY CAST(song_id AS UNSIGNED), song_id')->fetchAll();
        $lists = fetch_lists_map($db);
        json_out(array_map(
            fn ($row) => song_to_api($row, $lists[$row['song_id']] ?? []),
            $rows,
        ));
    }

    // POST /api/songs
    if (count($segments) === 1 && $method === 'POST') {
        $body = read_json_body();
        $song = sanitize_song($body);
        if (($song['song_id'] ?? '') === '') {
            fail(400, 'Trūksta giesmės numerio');
        }
        assert_song_id($song['song_id']);
        if (($song['title'] ?? '') === '') {
            fail(400, 'Trūksta pavadinimo');
        }
        try {
            $db->prepare(
                'INSERT INTO songs (song_id, title, verse, body, slides_json, copyright)
                 VALUES (?, ?, ?, ?, ?, ?)',
            )->execute([
                $song['song_id'],
                $song['title'],
                $song['verse'] ?? '',
                $song['body'] ?? '',
                $song['slides_json'] ?? '[]',
                $song['copyright'] ?? '',
            ]);
        } catch (PDOException $e) {
            if ((int) $e->errorInfo[1] === 1062) {
                fail(409, 'Giesmė tokiu numeriu jau yra');
            }
            throw $e;
        }
        json_out(song_to_api([
            'song_id' => $song['song_id'],
            'title' => $song['title'],
            'verse' => $song['verse'] ?? '',
            'body' => $song['body'] ?? '',
            'slides_json' => $song['slides_json'] ?? '[]',
            'copyright' => $song['copyright'] ?? '',
        ]), 201);
    }

    if (count($segments) >= 2) {
        $songId = assert_song_id($segments[1]);

        // GET /api/songs/{id}
        if (count($segments) === 2 && $method === 'GET') {
            $row = fetch_song($db, $songId);
            if (!$row) {
                fail(404, 'Giesmė nerasta');
            }
            json_out(song_to_api($row, fetch_lists_for($db, $songId)));
        }

        // PUT /api/songs/{id}
        if (count($segments) === 2 && $method === 'PUT') {
            if (!fetch_song($db, $songId)) {
                fail(404, 'Giesmė nerasta');
            }
            $body = read_json_body();
            $patch = sanitize_song($body);
            unset($patch['song_id']); // numeris nekeičiamas

            if ($patch) {
                $columns = [];
                $values = [];
                foreach ($patch as $column => $value) {
                    $columns[] = "$column = ?";
                    $values[] = $value;
                }
                $values[] = $songId;
                $db->prepare('UPDATE songs SET ' . implode(', ', $columns) . ' WHERE song_id = ?')
                    ->execute($values);
            }
            json_out(['ok' => true]);
        }

        // DELETE /api/songs/{id}
        if (count($segments) === 2 && $method === 'DELETE') {
            $statement = $db->prepare('DELETE FROM songs WHERE song_id = ?');
            $statement->execute([$songId]);
            if ($statement->rowCount() === 0) {
                fail(404, 'Giesmė nerasta');
            }
            json_out(['ok' => true]);
        }

        // GET /api/songs/{id}/files
        if (count($segments) === 3 && $segments[2] === 'files' && $method === 'GET') {
            $row = fetch_song($db, $songId);
            if (!$row) {
                fail(404, 'Giesmė nerasta');
            }
            $audio = [];
            foreach (fetch_track_types($db) as $type) {
                $audio[$type['name']] = is_file(files_dir() . "/audio/{$type['name']}/$songId.mp3");
            }

            $notes = [];
            foreach (FORMATS as $format) {
                $notes[$format] = admin_note_file_entries($songId, $format);
            }

            $notePages = note_pages_for_song($songId);
            json_out([
                'pages' => detected_note_page_count($notePages),
                'notePages' => $notePages,
                'audio' => $audio,
                'notes' => $notes,
            ]);
        }
    }
}

// ─── Įrašų tipai ─────────────────────────────────────────────────────

if ($first === 'tracks') {
    $db = pdo();
    sync_audio_library($db);

    // GET /api/tracks
    if (count($segments) === 1 && $method === 'GET') {
        json_out(build_public_tracks($db));
    }

    // POST /api/tracks – sukuria kategorijos aplanką; DB užpildo skeneris
    if (count($segments) === 1 && $method === 'POST') {
        $body = read_json_body();
        $name = assert_type(trim((string) ($body['name'] ?? '')));
        $label = trim((string) ($body['label'] ?? ''));
        if ($label === '') {
            $label = track_label_from_name($name);
        }
        $folder = audio_dir() . "/$name";
        if (is_dir($folder)) {
            fail(409, 'Toks audio kategorijos aplankas jau yra');
        }
        if (!mkdir($folder, 0775, true) && !is_dir($folder)) {
            fail(500, 'Nepavyko sukurti audio kategorijos aplanko');
        }
        sync_audio_library($db, true);
        $db->prepare('UPDATE track_types SET label = ? WHERE name = ?')->execute([$label, $name]);
        $statement = $db->prepare('SELECT * FROM track_types WHERE name = ?');
        $statement->execute([$name]);
        json_out(track_to_api($db, $statement->fetch()), 201);
    }

    if (count($segments) >= 2) {
        $name = assert_type($segments[1]);

        // PUT /api/tracks/{name}
        if (count($segments) === 2 && $method === 'PUT') {
            $body = read_json_body();
            $statement = $db->prepare('SELECT * FROM track_types WHERE name = ?');
            $statement->execute([$name]);
            $row = $statement->fetch();
            if (!$row) {
                fail(404, 'Tipas nerastas');
            }
            if (isset($body['label']) && is_string($body['label'])) {
                $label = trim($body['label']) !== '' ? trim($body['label']) : $name;
                $db->prepare('UPDATE track_types SET label = ? WHERE name = ?')->execute([$label, $name]);
                $row['label'] = $label;
            }
            json_out(track_to_api($db, $row));
        }

        // DELETE /api/tracks/{name}
        if (count($segments) === 2 && $method === 'DELETE') {
            $folder = audio_dir() . "/$name";
            if (!is_dir($folder)) {
                fail(404, 'Audio kategorijos aplankas nerastas');
            }
            foreach (scandir($folder) ?: [] as $entry) {
                if ($entry === '.' || $entry === '..') {
                    continue;
                }
                $path = $folder . '/' . $entry;
                if (is_file($path) && strtolower(pathinfo($entry, PATHINFO_EXTENSION)) === 'mp3') {
                    fail(409, 'Kategorijoje dar yra MP3 failų. Pirmiausia juos pašalinkite.');
                }
            }
            foreach (scandir($folder) ?: [] as $entry) {
                if ($entry === '.' || $entry === '..') {
                    continue;
                }
                $path = $folder . '/' . $entry;
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            if (!@rmdir($folder)) {
                fail(500, 'Nepavyko pašalinti kategorijos aplanko');
            }
            sync_audio_library($db, true);
            json_out(['ok' => true]);
        }

        // POST /api/tracks/{name}/icon – ikona laikoma pačiame kategorijos aplanke
        if (count($segments) === 3 && $segments[2] === 'icon' && $method === 'POST') {
            $folder = audio_dir() . "/$name";
            if (!is_dir($folder)) {
                fail(404, 'Audio kategorijos aplankas nerastas');
            }
            $file = uploaded_file(2 * 1024 * 1024);
            $extension = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
            if (!in_array($extension, TRACK_ICON_EXTENSIONS, true)) {
                fail(400, 'Ikona turi būti SVG, PNG, WEBP arba JPG failas');
            }
            foreach (TRACK_ICON_EXTENSIONS as $oldExtension) {
                @unlink($folder . "/icon.$oldExtension");
            }
            $fileName = "icon.$extension";
            save_upload($file, $folder . '/' . $fileName);
            sync_audio_library($db, true);
            $statement = $db->prepare('SELECT * FROM track_types WHERE name = ?');
            $statement->execute([$name]);
            json_out(track_to_api($db, $statement->fetch()));
        }
    }
}

// ─── Audio ir natų failai ────────────────────────────────────────────

if ($first === 'files' && count($segments) === 4) {
    $db = pdo();

    // /api/files/audio/{type}/{songId}
    if ($segments[1] === 'audio') {
        $type = assert_type($segments[2]);
        $songId = assert_song_id($segments[3]);
        $target = files_dir() . "/audio/$type/$songId.mp3";

        if ($method === 'POST') {
            $statement = $db->prepare('SELECT 1 FROM track_types WHERE name = ?');
            $statement->execute([$type]);
            if (!$statement->fetchColumn()) {
                fail(400, 'Nežinomas įrašo tipas');
            }
            $file = uploaded_file(40 * 1024 * 1024);
            if (!has_extension($file, ['.mp3'], ['mpeg', 'mp3'])) {
                fail(400, 'Audio failas turi būti MP3');
            }
            save_upload($file, $target);
            sync_audio_library($db, true);
            json_out(['ok' => true, 'file' => "audio/$type/$songId.mp3"]);
        }

        if ($method === 'DELETE') {
            if (!is_file($target)) {
                fail(404, 'Failas nerastas');
            }
            unlink($target);
            sync_audio_library($db, true);
            json_out(['ok' => true]);
        }
    }

    // /api/files/notes/{format}/{songId}?page=N
    if ($segments[1] === 'notes') {
        $format = assert_format($segments[2]);
        $songId = assert_song_id($segments[3]);
        $page = assert_page($_GET['page'] ?? 0);
        $target = files_dir() . "/notes/$format/" . notes_file_name($songId, $page, $format);

        if ($method === 'POST') {
            $file = uploaded_file(15 * 1024 * 1024);
            $valid = $format === 'svg'
                ? has_extension($file, ['.svg'], ['svg'])
                : has_extension($file, ['.jpg', '.jpeg'], ['jpeg']);
            if (!$valid) {
                fail(400, $format === 'svg' ? 'Failas turi būti SVG' : 'Failas turi būti JPG');
            }
            save_upload($file, $target);
            json_out(['ok' => true, 'file' => "notes/$format/" . notes_file_name($songId, $page, $format)]);
        }

        if ($method === 'DELETE') {
            if (!is_file($target)) {
                fail(404, 'Failas nerastas');
            }
            unlink($target);
            json_out(['ok' => true]);
        }
    }
}

// ─── Viso failo importas / atsarginės kopijos ────────────────────────

if ($first === 'import' && count($segments) === 2 && $method === 'POST') {
    $db = pdo();
    $file = uploaded_file(20 * 1024 * 1024);
    $parsed = json_decode((string) file_get_contents($file['tmp_name']), true);
    if ($parsed === null) {
        fail(400, 'Failas nėra tinkamas JSON');
    }

    try {
        if ($segments[1] === 'db') {
            if (($parsed['format'] ?? '') === 'edeno-aidai-database') {
                $export = validate_database_export($parsed);
                backup_database($db, 'db');
                $result = import_database($db, $export['songs'], $export['trackTypes']);
                json_out([
                    'ok' => true,
                    'format' => 'edeno-aidai-database',
                    'count' => $result['songs'],
                    'trackTypes' => $result['trackTypes'],
                ]);
            }

            $rows = validate_songs_json($parsed);
            backup_database($db, 'db');
            $count = import_songs($db, $rows);
            json_out(['ok' => true, 'count' => $count]);
        }
    } catch (InvalidArgumentException $e) {
        fail(400, $e->getMessage());
    }
}

// GET /api/backups
if ($first === 'backups' && $method === 'GET') {
    json_out(list_backups());
}

fail(404, 'Nerasta');
