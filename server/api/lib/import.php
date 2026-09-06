<?php

declare(strict_types=1);

require_once __DIR__ . '/common.php';

// Visos funkcijos meta InvalidArgumentException su lietuvišku pranešimu,
// kad tą patį kodą galėtų naudoti ir API, ir import-cli.php.

function validate_songs_json(mixed $parsed): array
{
    if (!is_array($parsed) || $parsed === [] || array_is_list($parsed) === false) {
        throw new InvalidArgumentException('db.json turi būti netuščias giesmių masyvas');
    }
    $rows = [];
    $seen = [];
    foreach ($parsed as $entry) {
        if (!is_array($entry)) {
            throw new InvalidArgumentException('Rastas netinkamas įrašas');
        }
        $songId = (string) ($entry['songId'] ?? '');
        if (!preg_match(SONG_ID_RE, $songId)) {
            throw new InvalidArgumentException('Netinkamas giesmės numeris: ' . json_encode($entry['songId'] ?? null, JSON_UNESCAPED_UNICODE));
        }
        if (isset($seen[$songId])) {
            throw new InvalidArgumentException("Pasikartojantis numeris: $songId");
        }
        $seen[$songId] = true;

        $row = sanitize_song($entry);
        $row['song_id'] = $songId;
        $row += [
            'title' => '',
            'verse' => '',
            'body' => '',
            'slides_json' => '[]',
            'copyright' => '',
        ];
        $rows[] = $row;
    }
    return $rows;
}

function validate_tracks_json(mixed $parsed): array
{
    if (!is_array($parsed) || array_is_list($parsed) === false) {
        throw new InvalidArgumentException('Įrašų tipai turi būti masyvas');
    }
    $types = [];
    foreach ($parsed as $index => $entry) {
        if (!is_array($entry) || !preg_match(TYPE_RE, (string) ($entry['name'] ?? ''))) {
            throw new InvalidArgumentException('Rastas netinkamas įrašo tipas');
        }
        $name = (string) $entry['name'];
        $label = isset($entry['label']) && is_string($entry['label']) && trim($entry['label']) !== ''
            ? trim($entry['label'])
            : $name;
        $sortOrder = isset($entry['sort_order']) && is_numeric($entry['sort_order'])
            ? max(0, (int) $entry['sort_order'])
            : $index + 1;
        $types[] = [
            'name' => $name,
            'label' => $label,
            'icon' => isset($entry['icon']) && is_string($entry['icon']) ? $entry['icon'] : null,
            'sort_order' => $sortOrder,
            'tracks' => array_values(array_filter(
                is_array($entry['tracks'] ?? null) ? array_map('strval', $entry['tracks']) : [],
                fn ($id) => preg_match(SONG_ID_RE, $id) === 1,
            )),
        ];
    }
    return $types;
}

function validate_database_export(mixed $parsed): array
{
    if (!is_array($parsed) || ($parsed['format'] ?? '') !== 'edeno-aidai-database') {
        throw new InvalidArgumentException('Tai nėra Edeno Aidai pilnos duomenų bazės failas');
    }
    if ((int) ($parsed['version'] ?? 0) !== 1) {
        throw new InvalidArgumentException('Nepalaikoma duomenų bazės failo versija');
    }

    $songs = validate_songs_json($parsed['songs'] ?? null);
    $rawTypes = $parsed['trackTypes'] ?? null;
    if (!is_array($rawTypes) || array_is_list($rawTypes) === false) {
        throw new InvalidArgumentException('trackTypes turi būti masyvas');
    }

    $trackEntries = [];
    foreach ($rawTypes as $index => $entry) {
        if (!is_array($entry)) {
            throw new InvalidArgumentException('Rastas netinkamas įrašų tipo įrašas');
        }
        $entry['sort_order'] = $entry['sortOrder'] ?? ($entry['sort_order'] ?? $index + 1);
        $trackEntries[] = $entry;
    }

    return [
        'songs' => $songs,
        'trackTypes' => validate_tracks_json($trackEntries),
    ];
}

// Giesmės: atnaujinamos pagal song_id, naujos pridedamos, failo nebeturimos
// pašalinamos. Įrašų tipų priskyrimai išliekančioms giesmėms nekeičiami.
function import_songs(PDO $db, array $rows): int
{
    $db->beginTransaction();
    try {
        $upsert = $db->prepare(
            'INSERT INTO songs (song_id, title, verse, body, slides_json, copyright)
             VALUES (:song_id, :title, :verse, :body, :slides_json, :copyright)
             ON DUPLICATE KEY UPDATE
                 title = :u_title, verse = :u_verse, body = :u_body,
                 slides_json = :u_slides_json, copyright = :u_copyright',
        );
        $ids = [];
        foreach ($rows as $row) {
            $upsert->execute([
                ':song_id' => $row['song_id'],
                ':title' => $row['title'],
                ':verse' => $row['verse'],
                ':body' => $row['body'],
                ':slides_json' => $row['slides_json'],
                ':copyright' => $row['copyright'],
                ':u_title' => $row['title'],
                ':u_verse' => $row['verse'],
                ':u_body' => $row['body'],
                ':u_slides_json' => $row['slides_json'],
                ':u_copyright' => $row['copyright'],
            ]);
            $ids[] = $row['song_id'];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $db->prepare("DELETE FROM songs WHERE song_id NOT IN ($placeholders)")->execute($ids);

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }
    return count($rows);
}

// Pilnas turinio atkūrimas: giesmės, įrašų tipai ir jų priskyrimai.
// Prisijungimai, sesijos ir fiziniai MP3 / natų failai į JSON neįtraukiami.
function import_database(PDO $db, array $songs, array $types): array
{
    $db->beginTransaction();
    try {
        $upsertSong = $db->prepare(
            'INSERT INTO songs (song_id, title, verse, body, slides_json, copyright)
             VALUES (:song_id, :title, :verse, :body, :slides_json, :copyright)
             ON DUPLICATE KEY UPDATE
                 title = :u_title, verse = :u_verse, body = :u_body,
                 slides_json = :u_slides_json, copyright = :u_copyright',
        );
        $songIds = [];
        foreach ($songs as $song) {
            $upsertSong->execute([
                ':song_id' => $song['song_id'],
                ':title' => $song['title'],
                ':verse' => $song['verse'],
                ':body' => $song['body'],
                ':slides_json' => $song['slides_json'],
                ':copyright' => $song['copyright'],
                ':u_title' => $song['title'],
                ':u_verse' => $song['verse'],
                ':u_body' => $song['body'],
                ':u_slides_json' => $song['slides_json'],
                ':u_copyright' => $song['copyright'],
            ]);
            $songIds[] = $song['song_id'];
        }

        $songPlaceholders = implode(',', array_fill(0, count($songIds), '?'));
        $db->prepare("DELETE FROM songs WHERE song_id NOT IN ($songPlaceholders)")
            ->execute($songIds);

        // Track assignments are part of the export, so replace them together
        // with the recording-category metadata.
        $db->exec('DELETE FROM song_tracks');
        if ($types) {
            $typeNames = array_column($types, 'name');
            $typePlaceholders = implode(',', array_fill(0, count($typeNames), '?'));
            $db->prepare("DELETE FROM track_types WHERE name NOT IN ($typePlaceholders)")
                ->execute($typeNames);
        } else {
            $db->exec('DELETE FROM track_types');
        }

        $upsertType = $db->prepare(
            'INSERT INTO track_types (name, label, icon, sort_order)
             VALUES (:name, :label, :icon, :sort_order)
             ON DUPLICATE KEY UPDATE
                 label = :u_label, icon = :u_icon, sort_order = :u_sort_order',
        );
        foreach ($types as $type) {
            $upsertType->execute([
                ':name' => $type['name'],
                ':label' => $type['label'],
                ':icon' => $type['icon'],
                ':sort_order' => $type['sort_order'],
                ':u_label' => $type['label'],
                ':u_icon' => $type['icon'],
                ':u_sort_order' => $type['sort_order'],
            ]);
        }

        $insertAssignment = $db->prepare(
            'INSERT IGNORE INTO song_tracks (song_id, type_name) VALUES (?, ?)',
        );
        $knownSongs = array_fill_keys($songIds, true);
        $knownTypes = array_fill_keys(array_column($types, 'name'), true);
        foreach ($types as $type) {
            foreach ($type['tracks'] as $songId) {
                if (isset($knownSongs[$songId]) && isset($knownTypes[$type['name']])) {
                    $insertAssignment->execute([$songId, $type['name']]);
                }
            }
        }

        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }

    return [
        'songs' => count($songs),
        'trackTypes' => count($types),
    ];
}

// Prieš pakeitimą – dabartinės būsenos JSON kopija į storage/backups/
function backup_database(PDO $db, string $name): string
{
    $dir = storage_dir() . '/backups';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    $stamp = str_replace([':', '.'], '-', date('Y-m-d\TH-i-s'));
    $data = $name === 'db' ? build_database_export($db) : build_public_tracks($db);
    $target = "$dir/$name-$stamp.json";
    file_put_contents($target, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    return $target;
}

function list_backups(): array
{
    $dir = storage_dir() . '/backups';
    if (!is_dir($dir)) {
        return [];
    }
    $backups = [];
    foreach (scandir($dir) ?: [] as $entry) {
        if (!str_ends_with($entry, '.json')) {
            continue;
        }
        $path = "$dir/$entry";
        $backups[] = [
            'file' => $entry,
            'size' => filesize($path) ?: 0,
            'mtime' => date('c', filemtime($path) ?: 0),
        ];
    }
    usort($backups, fn ($a, $b) => strcmp($b['mtime'], $a['mtime']));
    return $backups;
}
