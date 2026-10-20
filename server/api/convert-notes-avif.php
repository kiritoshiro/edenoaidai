<?php

// Paverčia visus JPG natų puslapius (files/notes/jpg) į AVIF (files/notes/avif):
//   php api/convert-notes-avif.php [--dry-run] [--files-dir=/kelias/iki/files]
//
// Esami AVIF failai niekada neperrašomi, JPG failai paliekami. notes/jpg
// aplanką ištrinti galima atskirai, patikrinus AVIF natas.

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/lib/common.php';

$options = getopt('', ['dry-run', 'files-dir:', 'help']);
if (isset($options['help'])) {
    echo "Naudojimas: php api/convert-notes-avif.php [--dry-run] [--files-dir=KELIAS]\n";
    exit(0);
}
$dryRun = isset($options['dry-run']);

try {
    $filesDir = isset($options['files-dir'])
        ? rtrim((string) $options['files-dir'], '/\\')
        : files_dir();
    $sourceDir = $filesDir . '/notes/jpg';
    $targetDir = $filesDir . '/notes/avif';

    if (!is_dir($sourceDir)) {
        echo "Aplanko $sourceDir nėra – nėra ką konvertuoti.\n";
        exit(0);
    }
    if (!$dryRun && !function_exists('imageavif')) {
        throw new RuntimeException('PHP GD plėtinys nepalaiko AVIF (nėra imageavif())');
    }

    $names = [];
    foreach (scandir($sourceDir) ?: [] as $entry) {
        $extension = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        if (is_file("$sourceDir/$entry") && in_array($extension, ['jpg', 'jpeg'], true)) {
            $names[] = $entry;
        }
    }
    usort($names, 'strnatcasecmp');

    $total = count($names);
    $converted = $existing = $invalid = $failed = 0;
    $jpgBytes = $avifBytes = 0;
    echo ($dryRun ? 'Bandomasis paleidimas (nieko nerašoma). ' : '')
        . "Rasta JPG failų: $total\n";

    foreach ($names as $number => $name) {
        $prefix = sprintf('[%d/%d] %s', $number + 1, $total, $name);
        $stem = pathinfo($name, PATHINFO_FILENAME);
        if (!preg_match('/^(.+?)(?:_([1-8]))?$/u', $stem, $matches)
            || !preg_match(SONG_ID_RE, $matches[1])) {
            $invalid++;
            echo "$prefix: praleista, netinkamas natų failo vardas\n";
            continue;
        }

        $target = "$targetDir/$stem.avif";
        if (file_exists($target)) {
            $existing++;
            continue;
        }
        if ($dryRun) {
            $converted++;
            echo "$prefix: būtų paversta į $stem.avif\n";
            continue;
        }

        try {
            if (!convert_image_to_avif("$sourceDir/$name", $target, false)) {
                $existing++;
                continue;
            }
        } catch (Throwable $error) {
            $failed++;
            echo "$prefix: KLAIDA – {$error->getMessage()}\n";
            continue;
        }

        $before = (int) filesize("$sourceDir/$name");
        $after = (int) filesize($target);
        $converted++;
        $jpgBytes += $before;
        $avifBytes += $after;
        printf("%s: %.1f KB → %.1f KB\n", $prefix, $before / 1024, $after / 1024);
    }

    echo "\n";
    echo ($dryRun ? 'Būtų paversta' : 'Paversta') . ": $converted\n";
    echo "Jau buvo AVIF (nekeista): $existing\n";
    echo "Netinkami vardai (praleista): $invalid\n";
    echo "Klaidos: $failed\n";
    if ($converted > 0 && !$dryRun) {
        printf(
            "Dydis: %.1f MB JPG → %.1f MB AVIF (%.0f %% mažiau)\n",
            $jpgBytes / 1048576,
            $avifBytes / 1048576,
            100 * (1 - $avifBytes / max(1, $jpgBytes)),
        );
    }
    echo "JPG failai palikti aplanke $sourceDir.\n";
    exit($failed > 0 ? 1 : 0);
} catch (Throwable $error) {
    fwrite(STDERR, 'Klaida: ' . $error->getMessage() . "\n");
    exit(1);
}
