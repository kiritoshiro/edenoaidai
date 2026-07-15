<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/import.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

/**
 * Convert legacy lyric HTML to the same plain-text form used by the editor.
 */
function legacy_lyrics_to_plain_text(string $value): string
{
    $text = preg_replace('/\r\n?/', "\n", $value) ?? $value;
    $text = preg_replace('/<br\s*\/?>/i', "\n", $text) ?? $text;
    $text = preg_replace(
        '/<\/(?:article|div|h[1-6]|li|p|section)>/i',
        "\n",
        $text,
    ) ?? $text;
    $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = str_replace("\u{00A0}", ' ', $text);
    $text = preg_replace('/[ \t]+\n/', "\n", $text) ?? $text;
    $text = preg_replace('/\n[ \t]+/', "\n", $text) ?? $text;
    $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;
    return trim($text);
}

/**
 * Remove a legacy "Priegiesmis" label at the beginning of a lyric line.
 * A colon may be followed immediately by the first lyric line.
 *
 * @return array{text: string, found: bool}
 */
function remove_chorus_marker(string $value): array
{
    $text = legacy_lyrics_to_plain_text($value);
    $count = 0;
    $text = preg_replace(
        '/(^|\R)\h*priegiesmis(?:\h*:\h*|\h*(?=\R|$))/iu',
        '$1',
        $text,
        -1,
        $count,
    ) ?? $text;
    $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;

    return [
        'text' => trim($text),
        'found' => $count > 0,
    ];
}

/** @return list<string> */
function legacy_lyrics_blocks(string $body): array
{
    $plain = legacy_lyrics_to_plain_text($body);
    if ($plain === '') {
        return [];
    }

    return array_values(array_filter(
        array_map('trim', preg_split('/\n\s*\n+/', $plain) ?: []),
        static fn (string $block): bool => $block !== '',
    ));
}

/** @param list<array{text: string, isChorus: bool, chorusAfter: bool}> $slides */
function slides_to_legacy_body(array $slides): string
{
    return implode('<br><br>', array_map(
        static function (array $slide): string {
            $lyrics = str_replace(
                "\n",
                '<br>',
                htmlspecialchars($slide['text'], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8'),
            );
            return $slide['isChorus']
                ? '<span class="priegiesmis">Priegiesmis:</span><br>' . $lyrics
                : $lyrics;
        },
        $slides,
    ));
}

function print_usage(): void
{
    echo "One-time chorus marker migration\n\n";
    echo "Preview: php api/migrate-chorus-markers.php\n";
    echo "Apply:   php api/migrate-chorus-markers.php --apply\n";
}

$arguments = array_slice($argv, 1);
$allowed = ['--apply', '--help', '-h', '--self-test'];
foreach ($arguments as $argument) {
    if (!in_array($argument, $allowed, true)) {
        fwrite(STDERR, "Unknown option: $argument\n\n");
        print_usage();
        exit(2);
    }
}

if (in_array('--help', $arguments, true) || in_array('-h', $arguments, true)) {
    print_usage();
    exit;
}

if (in_array('--self-test', $arguments, true)) {
    $cases = [
        ["Priegiesmis:\nGelbejo mane", "Gelbejo mane", true],
        ["PRIEGIESMIS: Gelbejo tave", "Gelbejo tave", true],
        ["1. Posmas\nPriegiesmis\nKita eilute", "1. Posmas\n\nKita eilute", true],
        ["Zodis priegiesmis yra sakinyje", "Zodis priegiesmis yra sakinyje", false],
    ];
    foreach ($cases as [$input, $expectedText, $expectedFound]) {
        $actual = remove_chorus_marker($input);
        if ($actual['text'] !== $expectedText || $actual['found'] !== $expectedFound) {
            fwrite(STDERR, "Self-test failed for: $input\n");
            exit(1);
        }
    }
    $body = slides_to_legacy_body([[
        'text' => "Gelbejo mane\nGelbejo tave",
        'isChorus' => true,
        'chorusAfter' => false,
    ]]);
    if ($body !== '<span class="priegiesmis">Priegiesmis:</span><br>Gelbejo mane<br>Gelbejo tave') {
        fwrite(STDERR, "Self-test failed for normal-view chorus label\n");
        exit(1);
    }
    echo "Self-test OK\n";
    exit;
}

$apply = in_array('--apply', $arguments, true);
$db = pdo();
$rows = $db->query(
    'SELECT song_id, body, slides_json FROM songs ORDER BY CAST(song_id AS UNSIGNED), song_id',
)->fetchAll();

$updates = [];
$markedSlides = 0;

foreach ($rows as $row) {
    $slides = decode_song_slides($row['slides_json'] ?? null);
    $bodyBlocks = legacy_lyrics_blocks((string) ($row['body'] ?? ''));

    if ($slides === []) {
        $slides = array_map(
            static fn (string $text): array => [
                'text' => $text,
                'isChorus' => false,
                'chorusAfter' => true,
            ],
            $bodyBlocks,
        );
    }

    $bodyMarkers = [];
    foreach ($bodyBlocks as $index => $block) {
        $bodyMarkers[$index] = remove_chorus_marker($block)['found'];
    }
    $canMapBodyMarkers = count($bodyBlocks) === count($slides);

    $slidesChanged = false;
    $updatedSlides = [];
    foreach ($slides as $index => $slide) {
        $cleaned = remove_chorus_marker((string) $slide['text']);
        $found = $cleaned['found'] || ($canMapBodyMarkers && ($bodyMarkers[$index] ?? false));
        $wasChorus = ($slide['isChorus'] ?? false) === true;

        if ($found) {
            $markedSlides++;
        }
        if ($cleaned['found'] || ($found && !$wasChorus)) {
            $slidesChanged = true;
        }

        if ($cleaned['text'] === '') {
            continue;
        }

        $isChorus = $wasChorus || $found;
        $updatedSlides[] = [
            'text' => $cleaned['text'],
            'isChorus' => $isChorus,
            'chorusAfter' => !$isChorus && ($slide['chorusAfter'] ?? true) !== false,
        ];
    }

    if ($updatedSlides === []) {
        continue;
    }

    $expectedBody = slides_to_legacy_body($updatedSlides);
    $hasChorus = in_array(true, array_column($updatedSlides, 'isChorus'), true);
    $bodyChanged = $hasChorus && (string) ($row['body'] ?? '') !== $expectedBody;

    if (!$slidesChanged && !$bodyChanged) {
        continue;
    }

    $updates[] = [
        'song_id' => (string) $row['song_id'],
        'slides_json' => json_encode(
            $updatedSlides,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
        ),
        'body' => $expectedBody,
    ];
}

echo $apply ? "Mode: APPLY\n" : "Mode: PREVIEW (database is unchanged)\n";
echo 'Songs to update: ' . count($updates) . "\n";
echo "Chorus markers found: $markedSlides\n";

if ($updates === []) {
    echo "Nothing to change.\n";
    exit;
}

foreach (array_slice(array_column($updates, 'song_id'), 0, 30) as $songId) {
    echo " - $songId\n";
}
if (count($updates) > 30) {
    echo ' - ... and ' . (count($updates) - 30) . " more\n";
}

if (!$apply) {
    echo "\nRun again with --apply to save these changes.\n";
    exit;
}

$backup = backup_database($db, 'db');
$db->beginTransaction();
try {
    $statement = $db->prepare(
        'UPDATE songs SET body = :body, slides_json = :slides_json WHERE song_id = :song_id',
    );
    foreach ($updates as $update) {
        $statement->execute($update);
    }
    $db->commit();
} catch (Throwable $error) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    throw $error;
}

echo "\nMigration completed.\n";
echo "Backup: $backup\n";
