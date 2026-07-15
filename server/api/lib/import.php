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
        $row += ['title' => '', 'verse' => '', 'body' => '', 'copyright' => ''];
        $rows[] = $row;
    }
    return $rows;
}

function validate_tracks_json(mixed $parsed): array
{
    if (!is_array($parsed) || array_is_list($parsed) === false) {
        throw new InvalidArgumentException('tracks.json turi būti masyvas');
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
        $types[] = [
            'name' => $name,
            'label' => $label,
            'icon' => isset($entry['icon']) && is_string($entry['icon']) ? $entry['icon'] : null,
            'sort_order' => $index + 1,
            'tracks' => array_values(array_filter(
                is_array($entry['tracks'] ?? null) ? array_map('strval', $entry['tracks']) : [],
                fn ($id) => preg_match(SONG_ID_RE, $id) === 1,
            )),
        ];
    }
    return $types;
}

// Giesmės: atnaujinamos pagal song_id, naujos pridedamos, failo nebeturimos
// pašalinamos. Įrašų tipų priskyrimai išliekančioms giesmėms nekeičiami.
function import_songs(PDO $db, array $rows): int
{
    $db->beginTransaction();
    try {
        $upsert = $db->prepare(
            'INSERT INTO songs (song_id, title, verse, body, copyright)
             VALUES (:song_id, :title, :verse, :body, :copyright)
             ON DUPLICATE KEY UPDATE
                 title = :u_title, verse = :u_verse, body = :u_body,
                 copyright = :u_copyright',
        );
        $ids = [];
        foreach ($rows as $row) {
            $upsert->execute([
                ':song_id' => $row['song_id'],
                ':title' => $row['title'],
                ':verse' => $row['verse'],
                ':body' => $row['body'],
                ':copyright' => $row['copyright'],
                ':u_title' => $row['title'],
                ':u_verse' => $row['verse'],
                ':u_body' => $row['body'],
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

// Įrašų tipai: pakeičiami pagal failą, priskyrimai perstatomi iš 'tracks'
// masyvų (praleidžiant duomenų bazėje neegzistuojančias giesmes).
function import_tracks(PDO $db, array $types): int
{
    $db->beginTransaction();
    try {
        $upsert = $db->prepare(
            'INSERT INTO track_types (name, label, icon, sort_order)
             VALUES (:name, :label, :icon, :sort_order)
             ON DUPLICATE KEY UPDATE
                 label = :u_label, icon = :u_icon, sort_order = :u_sort_order',
        );
        $names = [];
        foreach ($types as $type) {
            $upsert->execute([
                ':name' => $type['name'],
                ':label' => $type['label'],
                ':icon' => $type['icon'],
                ':sort_order' => $type['sort_order'],
                ':u_label' => $type['label'],
                ':u_icon' => $type['icon'],
                ':u_sort_order' => $type['sort_order'],
            ]);
            $names[] = $type['name'];
        }

        if ($names) {
            $placeholders = implode(',', array_fill(0, count($names), '?'));
            $db->prepare("DELETE FROM track_types WHERE name NOT IN ($placeholders)")->execute($names);
        } else {
            $db->exec('DELETE FROM track_types');
        }

        $existing = array_flip(array_column($db->query('SELECT song_id FROM songs')->fetchAll(), 'song_id'));
        $db->exec('DELETE FROM song_tracks');
        $insert = $db->prepare('INSERT IGNORE INTO song_tracks (song_id, type_name) VALUES (?, ?)');
        foreach ($types as $type) {
            foreach ($type['tracks'] as $songId) {
                if (isset($existing[$songId])) {
                    $insert->execute([$songId, $type['name']]);
                }
            }
        }

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }
    return count($types);
}

// Prieš pakeitimą – dabartinės būsenos JSON kopija į storage/backups/
function backup_database(PDO $db, string $name): string
{
    $dir = storage_dir() . '/backups';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    $stamp = str_replace([':', '.'], '-', date('Y-m-d\TH-i-s'));
    $data = $name === 'db' ? build_public_db($db) : build_public_tracks($db);
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
