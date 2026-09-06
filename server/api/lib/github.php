<?php

declare(strict_types=1);

function github_settings(): array
{
    $config = config();
    return [
        'owner' => (string) ($config['github_owner'] ?? 'kiritoshiro'),
        'repo' => (string) ($config['github_repo'] ?? 'edenoaidai'),
        'branch' => (string) ($config['github_branch'] ?? 'v2'),
        'token' => trim((string) ($config['github_token'] ?? '')),
    ];
}

function github_request(string $path, bool $binary = false): string
{
    $settings = github_settings();
    $url = 'https://api.github.com/repos/' . rawurlencode($settings['owner']) . '/'
        . rawurlencode($settings['repo']) . $path;
    $headers = [
        'Accept: ' . ($binary ? 'application/zip' : 'application/vnd.github+json'),
        'User-Agent: Edeno-Aidai-Updater',
    ];
    if ($settings['token'] !== '') {
        $headers[] = 'Authorization: Bearer ' . $settings['token'];
    }

    $curl = curl_init($url);
    if ($curl === false) {
        throw new RuntimeException('Nepavyko paleisti GitHub užklausos');
    }
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT => $binary ? 180 : 30,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($response === false || $error !== '') {
        throw new RuntimeException('Nepavyko prisijungti prie GitHub: ' . ($error ?: 'nežinoma klaida'));
    }
    if ($status < 200 || $status >= 300) {
        $message = $binary ? 'Nepavyko atsisiųsti GitHub versijos' : 'GitHub API klaida';
        $decoded = json_decode($response, true);
        if (is_array($decoded) && isset($decoded['message'])) {
            $message .= ': ' . $decoded['message'];
        }
        throw new RuntimeException($message . " ($status)");
    }
    return $response;
}

function github_commits(): array
{
    $settings = github_settings();
    $query = '?sha=' . rawurlencode($settings['branch']) . '&per_page=50';
    $rows = json_decode(github_request('/commits' . $query), true);
    if (!is_array($rows)) {
        throw new RuntimeException('GitHub grąžino netinkamą commit’ų sąrašą');
    }
    return array_values(array_map(static function (array $row): array {
        $commit = is_array($row['commit'] ?? null) ? $row['commit'] : [];
        $author = is_array($commit['author'] ?? null) ? $commit['author'] : [];
        return [
            'type' => 'commit',
            'sha' => (string) ($row['sha'] ?? ''),
            'shortSha' => substr((string) ($row['sha'] ?? ''), 0, 8),
            'message' => trim((string) ($commit['message'] ?? '')),
            'author' => (string) ($author['name'] ?? ($row['author']['login'] ?? '')),
            'date' => (string) ($author['date'] ?? ''),
            'url' => (string) ($row['html_url'] ?? ''),
        ];
    }, array_filter($rows, 'is_array')));
}

function github_releases(): array
{
    $rows = json_decode(github_request('/releases?per_page=50'), true);
    if (!is_array($rows)) {
        throw new RuntimeException('GitHub grąžino netinkamą release’ų sąrašą');
    }
    return array_values(array_map(static function (array $row): array {
        return [
            'type' => 'release',
            'tag' => (string) ($row['tag_name'] ?? ''),
            'name' => (string) ($row['name'] ?? ''),
            'message' => trim((string) ($row['body'] ?? '')),
            'date' => (string) ($row['published_at'] ?? $row['created_at'] ?? ''),
            'prerelease' => (bool) ($row['prerelease'] ?? false),
            'draft' => (bool) ($row['draft'] ?? false),
            'url' => (string) ($row['html_url'] ?? ''),
        ];
    }, array_filter($rows, 'is_array')));
}

function github_ref_is_safe(string $ref, string $source): bool
{
    if ($source === 'commit') {
        return (bool) preg_match('/^[0-9a-f]{7,40}$/i', $ref);
    }
    return (bool) preg_match('/^[A-Za-z0-9][A-Za-z0-9._\/-]{0,99}$/', $ref)
        && !str_contains($ref, '..');
}

function github_copy_tree(string $source, string $target, array $protected): void
{
    foreach (scandir($source) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        if (in_array($entry, $protected, true)) {
            continue;
        }
        $from = $source . '/' . $entry;
        $to = $target . '/' . $entry;
        if (is_dir($from)) {
            if (is_dir($to)) {
                if ($entry === 'assets') {
                    foreach (scandir($to) ?: [] as $old) {
                        if ($old !== '.' && $old !== '..') {
                            github_remove_tree($to . '/' . $old);
                        }
                    }
                }
            } elseif (!mkdir($to, 0775, true) && !is_dir($to)) {
                throw new RuntimeException('Nepavyko sukurti atnaujinimo aplanko');
            }
            github_copy_tree($from, $to, []);
            continue;
        }
        if (!copy($from, $to)) {
            throw new RuntimeException('Nepavyko įrašyti atnaujinimo failo: ' . $entry);
        }
    }
}

function github_remove_tree(string $path): void
{
    if (is_dir($path) && !is_link($path)) {
        foreach (scandir($path) ?: [] as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                github_remove_tree($path . '/' . $entry);
            }
        }
        rmdir($path);
        return;
    }
    if (is_file($path) || is_link($path)) {
        unlink($path);
    }
}

function github_update(string $source, string $ref): array
{
    if (!in_array($source, ['commit', 'release'], true) || !github_ref_is_safe($ref, $source)) {
        throw new InvalidArgumentException('Netinkamas GitHub commit arba release pasirinkimas');
    }
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('Atnaujinimui serveryje reikalingas PHP zip plėtinys');
    }

    set_time_limit(300);
    $storage = storage_dir();
    if (!is_dir($storage) && !mkdir($storage, 0775, true) && !is_dir($storage)) {
        throw new RuntimeException('Nepavyko sukurti storage aplanko');
    }
    $lock = fopen($storage . '/github-update.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
        throw new RuntimeException('Kitas GitHub atnaujinimas jau vykdomas');
    }

    $work = $storage . '/github-update-' . bin2hex(random_bytes(8));
    mkdir($work, 0775, true);
    try {
        $archive = $work . '/source.zip';
        file_put_contents($archive, github_request('/zipball/' . rawurlencode($ref), true));
        $zip = new ZipArchive();
        if ($zip->open($archive) !== true) {
            throw new RuntimeException('Nepavyko atidaryti GitHub archyvo');
        }
        $root = '';
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if ($name === false || str_contains($name, '../') || str_starts_with($name, '/')) {
                $zip->close();
                throw new RuntimeException('GitHub archyve rastas nesaugus kelias');
            }
            if ($root === '' && str_contains($name, '/')) {
                $root = substr($name, 0, strpos($name, '/') + 1);
            }
        }
        if ($root === '' || $zip->extractTo($work) === false) {
            $zip->close();
            throw new RuntimeException('Nepavyko išskleisti GitHub archyvo');
        }
        $zip->close();
        $sourceRoot = $work . '/' . rtrim($root, '/') . '/server';
        if (!is_dir($sourceRoot) || !is_file($sourceRoot . '/api/index.php')) {
            throw new RuntimeException('Pasirinktoje GitHub versijoje nerastas server/ katalogas');
        }

        $appRoot = dirname(__DIR__);
        github_copy_tree($sourceRoot, $appRoot, ['files', 'storage']);
        // rsync without --delete would leave these removed legacy files behind.
        foreach ([
            $appRoot . '/api/db.json',
            $appRoot . '/api/tracks.json',
            $appRoot . '/files/audio/giesmes/details.json',
            $appRoot . '/files/audio/giesmes/recordings.json',
        ] as $obsolete) {
            if (is_file($obsolete)) {
                unlink($obsolete);
            }
        }
        return ['source' => $source, 'ref' => $ref];
    } finally {
        github_remove_tree($work);
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
