<?php

declare(strict_types=1);

const MEDIA_ARCHIVE_MAX_ENTRIES = 100000;

/**
 * Return the media choices shown in the administrator's backup screen.
 * Audio categories are read from the folder-based library; sheet formats are
 * the formats supported by the existing upload and display code.
 */
function media_options(PDO $db): array
{
    sync_audio_library($db);

    $audio = [];
    $rows = fetch_track_types($db);
    $directories = audio_category_directories();
    foreach ($rows as $row) {
        $name = (string) $row['name'];
        $count = 0;
        $folder = $directories[$name] ?? null;
        if ($folder !== null) {
            foreach (scandir($folder) ?: [] as $entry) {
                if (is_file($folder . '/' . $entry)
                    && strtolower(pathinfo($entry, PATHINFO_EXTENSION)) === 'mp3') {
                    $count++;
                }
            }
        }
        $audio[] = [
            'name' => $name,
            'label' => (string) ($row['label'] ?: track_label_from_name($name)),
            'count' => $count,
        ];
    }

    $notes = [];
    foreach (FORMATS as $format) {
        $folder = files_dir() . '/notes/' . $format;
        $count = 0;
        foreach (scandir($folder) ?: [] as $entry) {
            if (is_file($folder . '/' . $entry)
                && strtolower(pathinfo($entry, PATHINFO_EXTENSION)) === $format) {
                $count++;
            }
        }
        $notes[] = [
            'name' => $format,
            'label' => media_format_label($format),
            'count' => $count,
        ];
    }

    return ['audio' => $audio, 'notes' => $notes];
}

function media_format_label(string $format): string
{
    return match ($format) {
        'svg' => 'SVG (vektorinės natos)',
        'jpg' => 'JPG (paveikslėlių natos)',
        default => strtoupper($format),
    };
}

function media_kind(mixed $value): string
{
    $kind = strtolower(trim((string) $value));
    if (!in_array($kind, ['audio', 'notes'], true)) {
        throw new InvalidArgumentException('Media tipas turi būti audio arba notes');
    }
    return $kind;
}

/** @return list<string> */
function media_selection(mixed $value, array $allowed, string $kind): array
{
    if (is_array($value)) {
        $values = $value;
    } else {
        $values = preg_split('/\s*,\s*/u', trim((string) $value), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }
    $values = array_values(array_unique(array_map('strval', $values)));
    if ($values === []) {
        throw new InvalidArgumentException(
            $kind === 'audio'
                ? 'Pasirinkite bent vieną audio tipą'
                : 'Pasirinkite bent vieną natų formatą',
        );
    }
    foreach ($values as $value) {
        if (!in_array($value, $allowed, true)) {
            throw new InvalidArgumentException('Pasirinktas nežinomas media tipas: ' . $value);
        }
    }
    return $values;
}

/** @return list<string> */
function media_allowed_values(PDO $db, string $kind): array
{
    if ($kind === 'audio') {
        sync_audio_library($db);
        return array_keys(audio_category_directories());
    }
    return FORMATS;
}

function media_archive_path(): string
{
    $storage = storage_dir();
    if (!is_dir($storage) && !mkdir($storage, 0775, true) && !is_dir($storage)) {
        throw new RuntimeException('Nepavyko sukurti storage aplanko');
    }
    $path = tempnam($storage, 'media-archive-');
    if ($path === false) {
        throw new RuntimeException('Nepavyko sukurti laikino archyvo');
    }
    unlink($path);
    return $path;
}

function media_add_manifest(ZipArchive $zip, string $kind, array $selected, int $count): void
{
    $manifest = [
        'format' => 'edeno-aidai-media',
        'version' => 1,
        'kind' => $kind,
        'selected' => $selected,
        'fileCount' => $count,
        'createdAt' => gmdate(DATE_ATOM),
    ];
    $json = json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false || !$zip->addFromString('manifest.json', $json)) {
        throw new RuntimeException('Nepavyko įrašyti archyvo aprašo');
    }
}

function media_create_archive(string $kind, array $selected): string
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('Archyvams serveryje reikalingas PHP zip plėtinys');
    }
    set_time_limit(300);

    $archivePath = media_archive_path();
    $zip = new ZipArchive();
    if ($zip->open($archivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new RuntimeException('Nepavyko atidaryti laikino archyvo');
    }

    try {
        $count = 0;
        if ($kind === 'audio') {
            $directories = audio_category_directories();
            foreach ($selected as $type) {
                $folder = $directories[$type] ?? null;
                $archiveFolder = 'audio/' . $type . '/';
                $hasFiles = false;
                foreach (scandir($folder ?: '') ?: [] as $entry) {
                    $path = ($folder ?: '') . '/' . $entry;
                    if (!is_file($path) || strtolower(pathinfo($entry, PATHINFO_EXTENSION)) !== 'mp3') {
                        continue;
                    }
                    if (!$zip->addFile($path, $archiveFolder . $entry)) {
                        throw new RuntimeException('Nepavyko įtraukti audio failo į archyvą');
                    }
                    $hasFiles = true;
                    $count++;
                }
                if (!$hasFiles && !$zip->addEmptyDir($archiveFolder)) {
                    throw new RuntimeException('Nepavyko įrašyti audio aplanko į archyvą');
                }
            }
        } else {
            foreach ($selected as $format) {
                $folder = files_dir() . '/notes/' . $format;
                $archiveFolder = 'notes/' . $format . '/';
                $hasFiles = false;
                foreach (scandir($folder) ?: [] as $entry) {
                    $path = $folder . '/' . $entry;
                    if (!is_file($path) || strtolower(pathinfo($entry, PATHINFO_EXTENSION)) !== $format) {
                        continue;
                    }
                    if (!$zip->addFile($path, $archiveFolder . $entry)) {
                        throw new RuntimeException('Nepavyko įtraukti natų failo į archyvą');
                    }
                    $hasFiles = true;
                    $count++;
                }
                if (!$hasFiles && !$zip->addEmptyDir($archiveFolder)) {
                    throw new RuntimeException('Nepavyko įrašyti natų aplanko į archyvą');
                }
            }
        }
        media_add_manifest($zip, $kind, $selected, $count);
        if (!$zip->close()) {
            throw new RuntimeException('Nepavyko užbaigti archyvo');
        }
    } catch (Throwable $e) {
        $zip->close();
        @unlink($archivePath);
        throw $e;
    }

    return $archivePath;
}

function media_download_archive(string $kind, array $selected): never
{
    $archivePath = media_create_archive($kind, $selected);
    try {
        $filename = 'edeno-aidai-' . ($kind === 'audio' ? 'audio' : 'notes')
            . '-' . gmdate('Y-m-d-His') . '.zip';
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . (string) filesize($archivePath));
        header('Cache-Control: no-store');
        readfile($archivePath);
    } finally {
        @unlink($archivePath);
    }
    exit;
}

function media_safe_archive_parts(string $name): array
{
    $name = str_replace('\\', '/', $name);
    if ($name === '' || str_contains($name, "\0") || str_starts_with($name, '/')) {
        throw new InvalidArgumentException('Archyve rastas nesaugus kelias');
    }
    $parts = explode('/', $name);
    foreach ($parts as $part) {
        if ($part === '' || $part === '.' || $part === '..') {
            throw new InvalidArgumentException('Archyve rastas nesaugus kelias');
        }
    }
    return $parts;
}

function media_archive_song_id(string $filename, string $format): array
{
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if ($extension !== $format || basename($filename) !== $filename) {
        throw new InvalidArgumentException('Archyve rastas netinkamo formato natų failas');
    }
    $stem = pathinfo($filename, PATHINFO_FILENAME);
    if (!preg_match('/^(.+?)(?:_([1-8]))?$/u', $stem, $matches)) {
        throw new InvalidArgumentException('Archyve rastas netinkamas natų failo vardas');
    }
    $songId = $matches[1];
    $page = isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : 0;
    if (!preg_match(SONG_ID_RE, $songId)) {
        throw new InvalidArgumentException('Archyve rastas netinkamas giesmės numeris');
    }
    return [$songId, $page];
}

function media_write_zip_entry(ZipArchive $zip, int $index, string $target, int $maxBytes): int
{
    $stat = $zip->statIndex($index);
    if (is_array($stat) && isset($stat['size']) && (int) $stat['size'] > $maxBytes) {
        throw new InvalidArgumentException('Archyve esantis failas per didelis');
    }
    $stream = $zip->getStream($zip->getNameIndex($index));
    if ($stream === false) {
        throw new RuntimeException('Nepavyko perskaityti archyvo failo');
    }
    $dir = dirname($target);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        fclose($stream);
        throw new RuntimeException('Nepavyko sukurti media aplanko');
    }
    $temporary = tempnam($dir, '.media-upload-');
    if ($temporary === false) {
        fclose($stream);
        throw new RuntimeException('Nepavyko sukurti laikino media failo');
    }
    $output = fopen($temporary, 'wb');
    if ($output === false) {
        fclose($stream);
        @unlink($temporary);
        throw new RuntimeException('Nepavyko įrašyti media failo');
    }
    $bytes = stream_copy_to_stream($stream, $output);
    fclose($stream);
    fclose($output);
    if ($bytes === false || $bytes > $maxBytes || !rename($temporary, $target)) {
        @unlink($temporary);
        throw new RuntimeException('Nepavyko išsaugoti media failo');
    }
    return (int) $bytes;
}

function media_import_archive(array $file, string $kind, array $selected): array
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('Archyvams serveryje reikalingas PHP zip plėtinys');
    }
    set_time_limit(300);
    $zip = new ZipArchive();
    if ($zip->open((string) $file['tmp_name']) !== true) {
        throw new InvalidArgumentException('Failas nėra tinkamas ZIP archyvas');
    }
    if ($zip->numFiles > MEDIA_ARCHIVE_MAX_ENTRIES) {
        $zip->close();
        throw new InvalidArgumentException('Archyve per daug failų');
    }

    $entries = [];
    $targets = [];
    $skipped = 0;
    try {
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);
            if ($name === false) {
                continue;
            }
            $normalizedName = str_replace('\\', '/', $name);
            if (str_ends_with($normalizedName, '/')) {
                continue;
            }
            $parts = media_safe_archive_parts($normalizedName);
            if ($parts === ['manifest.json']) {
                continue;
            }
            // Also accept a ZIP made by compressing the extracted backup
            // directory, e.g. backup/audio/type/song.mp3.
            if (count($parts) === 4 && $parts[1] === $kind) {
                array_shift($parts);
            }
            if (count($parts) !== 3) {
                $skipped++;
                continue;
            }

            [$root, $bucket, $filename] = $parts;
            if ($root !== $kind || !in_array($bucket, $selected, true)) {
                $skipped++;
                continue;
            }

            if ($kind === 'audio') {
                if (!preg_match(TYPE_RE, $bucket)
                    || strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'mp3'
                    || pathinfo($filename, PATHINFO_FILENAME) === ''
                    || !preg_match(SONG_ID_RE, pathinfo($filename, PATHINFO_FILENAME))) {
                    throw new InvalidArgumentException('Archyve rastas netinkamas MP3 failo vardas');
                }
                $target = files_dir() . '/audio/' . $bucket . '/'
                    . pathinfo($filename, PATHINFO_FILENAME) . '.mp3';
                $maxBytes = 40 * 1024 * 1024;
            } else {
                if (!in_array($bucket, FORMATS, true)) {
                    throw new InvalidArgumentException('Archyve rastas nežinomas natų formatas');
                }
                [$songId, $page] = media_archive_song_id($filename, $bucket);
                $target = files_dir() . '/notes/' . $bucket . '/'
                    . notes_file_name($songId, $page, $bucket);
                $maxBytes = 15 * 1024 * 1024;
            }
            if (isset($targets[$target])) {
                throw new InvalidArgumentException('Archyve kartojasi tas pats media failas');
            }
            $targets[$target] = true;
            $entries[] = [$index, $target, $maxBytes];
        }
        foreach ($entries as [$index, $target, $maxBytes]) {
            media_write_zip_entry($zip, $index, $target, $maxBytes);
        }
    } finally {
        $zip->close();
    }

    return [
        'ok' => true,
        'kind' => $kind,
        'selected' => $selected,
        'imported' => count($entries),
        'skipped' => $skipped,
    ];
}
