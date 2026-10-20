<?php

// Dependency-free tests for the sheet-music image and media archive code:
//   php tests/php/run.php
// Needs GD (with AVIF for the AVIF cases, which are skipped otherwise) and
// the zip extension. The API library is copied to a temporary folder with its
// own config.php, so no real configuration or media folder is touched.

declare(strict_types=1);

$work = sys_get_temp_dir() . '/edeno-php-tests-' . bin2hex(random_bytes(4));
$files = "$work/files";
mkdir("$work/api/lib", 0777, true);
mkdir($files, 0777, true);
foreach (glob(dirname(__DIR__, 2) . '/server/api/lib/*.php') as $source) {
    copy($source, "$work/api/lib/" . basename($source));
}
file_put_contents(
    "$work/api/config.php",
    '<?php return ' . var_export(['files_dir' => $files, 'storage_dir' => "$work/storage"], true) . ';',
);
require "$work/api/lib/common.php";
require "$work/api/lib/media.php";

$passed = 0;
$failed = 0;
$skipped = 0;

function check(bool $condition, string $name): void
{
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "ok    $name\n";
    } else {
        $failed++;
        echo "FAIL  $name\n";
    }
}

function skip(string $name, string $why): void
{
    global $skipped;
    $skipped++;
    echo "skip  $name ($why)\n";
}

/** The exception class thrown by $action, or '' when nothing was thrown. */
function thrown(callable $action): string
{
    try {
        $action();
    } catch (Throwable $e) {
        return get_class($e);
    }
    return '';
}

function remove_tree(string $path): void
{
    if (is_dir($path)) {
        foreach (scandir($path) as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                remove_tree("$path/$entry");
            }
        }
        rmdir($path);
    } elseif (file_exists($path)) {
        unlink($path);
    }
}

function white_image(int $width, int $height)
{
    $image = imagecreatetruecolor($width, $height);
    imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
    imagefilledrectangle($image, 2, 2, (int) ($width / 2), (int) ($height / 2), 0);
    return $image;
}

function make_zip(string $path, array $entries): string
{
    $zip = new ZipArchive();
    $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    foreach ($entries as $name => $data) {
        $zip->addFromString($name, $data);
    }
    $zip->close();
    return $path;
}

/** Files left in a notes folder, temporary files included. */
function notes_folder(string $format): array
{
    global $files;
    $folder = "$files/notes/$format";
    return is_dir($folder) ? array_values(array_diff(scandir($folder), ['.', '..'])) : [];
}

$hasAvif = function_exists('imageavif') && function_exists('imagecreatefromavif');
$hasZip = class_exists('ZipArchive');

try {
    // ─── AVIF signature ──────────────────────────────────────────────
    $box = fn (string $major, string $minor, array $compatible) =>
        pack('N', 16 + 4 * count($compatible)) . 'ftyp' . $major . $minor . implode('', $compatible);
    check(is_avif_data($box('avif', "\0\0\0\0", ['mif1'])), 'ftyp: avif major brand');
    check(is_avif_data($box('mif1', "\0\0\0\0", ['avif', 'miaf'])), 'ftyp: avif compatible brand');
    check(!is_avif_data($box('heic', "\0\0\0\0", ['mif1', 'heic'])), 'ftyp: HEIC refused');
    check(!is_avif_data($box('mif1', 'avif', ['miaf'])), 'ftyp: "avif" as minor version refused');
    check(!is_avif_data($box('mif1', "\0\0\0\0", ['miaf']) . 'avif'), 'ftyp: brand after the box refused');
    check(!is_avif_data("\xFF\xD8\xFF\xE0" . str_repeat("\0", 20)), 'ftyp: JPEG refused');

    // ─── AVIF pages ──────────────────────────────────────────────────
    $page = "$work/page.avif";
    if ($hasAvif) {
        imageavif(white_image(120, 180), $page, 60, 10);
        check(avif_boxes_cover_file($page), 'boxes: a real AVIF is covered exactly');
        check(thrown(fn () => assert_avif_page($page)) === '', 'AVIF page: a real AVIF passes');

        $polyglot = "$work/polyglot.avif";
        file_put_contents($polyglot, file_get_contents($page) . '<html><script>alert(1)</script></html>');
        check(!avif_boxes_cover_file($polyglot), 'boxes: data after the image is found');
        check(thrown(fn () => assert_avif_page($polyglot)) === InvalidArgumentException::class,
            'AVIF page: polyglot (HTML appended) refused');

        $truncated = "$work/truncated.avif";
        file_put_contents($truncated, substr(file_get_contents($page), 0, -40));
        check(thrown(fn () => assert_avif_page($truncated)) === InvalidArgumentException::class,
            'AVIF page: truncated file refused');

        $fake = "$work/fake.avif";
        $junk = str_repeat('A', 200);
        file_put_contents($fake, $box('avif', "\0\0\0\0", ['mif1']) . pack('N', 8 + strlen($junk)) . 'mdat' . $junk);
        check(avif_boxes_cover_file($fake), 'boxes: well-formed boxes with junk content');
        check(thrown(fn () => assert_avif_page($fake)) === InvalidArgumentException::class,
            'AVIF page: valid boxes but undecodable content refused');

        $wide = "$work/wide.avif";
        imageavif(white_image(6100, 8), $wide, 0, 10);
        check(thrown(fn () => assert_avif_page($wide)) === InvalidArgumentException::class,
            'AVIF page: side over 6000 px refused');

        $large = "$work/large.avif";
        imageavif(white_image(3000, 3000), $large, 0, 10);
        check(thrown(fn () => assert_avif_page($large)) === InvalidArgumentException::class,
            'AVIF page: 9 megapixels refused');
    } else {
        skip('AVIF page checks', 'this PHP GD has no AVIF');
    }

    // ─── Conversion of uploaded raster pages ─────────────────────────
    $jpeg = "$work/page.jpg";
    imagejpeg(white_image(200, 300), $jpeg, 90);
    $palette = imagecreate(200, 100);
    $transparent = imagecolorallocatealpha($palette, 0, 0, 0, 127);
    imagecolortransparent($palette, $transparent);
    imagefilledrectangle($palette, 50, 25, 150, 75, imagecolorallocate($palette, 0, 0, 0));
    $png = "$work/palette.png";
    imagepng($palette, $png);
    $bomb = "$work/bomb.png";
    $bombImage = imagecreate(4000, 4000); // a tiny file that decodes to 16 megapixels
    imagecolorallocate($bombImage, 255, 255, 255);
    imagepng($bombImage, $bomb, 9);
    check(filesize($bomb) < 100 * 1024 && getimagesize($bomb)[0] === 4000, 'convert: decompression-bomb PNG fixture made');
    file_put_contents("$work/page.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>');

    if ($hasAvif) {
        $out = "$work/converted.avif";
        check(thrown(fn () => convert_image_to_avif($jpeg, $out)) === '' && thrown(fn () => assert_avif_page($out)) === '',
            'convert: JPEG becomes a valid AVIF');
        convert_image_to_avif($png, $out);
        $decoded = imagecreatefromavif($out);
        check((imagecolorat($decoded, 2, 2) & 0xFFFFFF) === 0xFFFFFF && (imagecolorat($decoded, 100, 50) & 0xFFFFFF) < 0x202020,
            'convert: transparent palette PNG flattened onto white');
        check(thrown(fn () => convert_image_to_avif($bomb, $out)) === InvalidArgumentException::class,
            'convert: 16-megapixel PNG refused before decoding');
        check(thrown(fn () => convert_image_to_avif("$work/page.svg", $out)) === InvalidArgumentException::class,
            'convert: SVG refused');
        check(thrown(fn () => convert_image_to_avif($page, $out)) === InvalidArgumentException::class,
            'convert: AVIF input is not converted again');
    } else {
        skip('conversion checks', 'this PHP GD has no AVIF');
    }

    $oldLimit = ini_get('memory_limit');
    ini_set('memory_limit', (string) (memory_get_usage(true) + 20 * 1024 * 1024));
    check(thrown(fn () => assert_note_image_size(1181, 1811, 3)) === RuntimeException::class,
        'memory: a page that would not fit in memory_limit is refused');
    ini_set('memory_limit', $oldLimit);
    check(thrown(fn () => assert_note_image_size(1181, 1811, 3)) === '', 'memory: a normal page fits');
    check(ini_size_bytes('128M') === 134217728 && ini_size_bytes('1G') === 1073741824 && ini_size_bytes('-1') === -1,
        'memory: ini sizes parsed');

    // ─── Media archive import ────────────────────────────────────────
    if (!$hasZip) {
        skip('archive import checks', 'no zip extension');
    } else {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="5" height="5"/></svg>';
        $upload = fn (string $path) => ['tmp_name' => $path];
        $formats = $hasAvif ? ['svg', 'avif'] : ['svg'];

        $entries = ['notes/svg/1.svg' => $svg, 'notes/jpg/1.jpg' => file_get_contents($jpeg), 'manifest.json' => '{}'];
        if ($hasAvif) {
            $entries['notes/avif/1_2.avif'] = file_get_contents($page);
        }
        $result = media_import_archive($upload(make_zip("$work/good.zip", $entries)), 'notes', $formats);
        check($result['imported'] === count($formats) && $result['legacyJpg'] === 1,
            'import: SVG/AVIF imported, legacy notes/jpg counted');
        check(in_array('1.svg', notes_folder('svg'), true) && (!$hasAvif || in_array('1_2.avif', notes_folder('avif'), true)),
            'import: files written under their page names');

        foreach (['notes/svg/../x.svg', '/notes/svg/x.svg', 'notes//svg/x.svg', 'notes/svg/./x.svg'] as $name) {
            $zip = make_zip("$work/slip.zip", [$name => $svg]);
            check(thrown(fn () => media_import_archive($upload($zip), 'notes', ['svg'])) === InvalidArgumentException::class,
                "import: unsafe path \"$name\" refused");
        }

        if ($hasAvif) {
            $before = notes_folder('svg');
            $zip = make_zip("$work/bad-avif.zip", [
                'notes/svg/2.svg' => $svg,
                'notes/avif/2.avif' => file_get_contents("$work/polyglot.avif"),
            ]);
            check(thrown(fn () => media_import_archive($upload($zip), 'notes', ['svg', 'avif'])) === InvalidArgumentException::class,
                'import: polyglot AVIF refuses the whole archive');
            check(notes_folder('svg') === $before && !in_array('2.avif', notes_folder('avif'), true),
                'import: nothing from the refused archive was written');
        }

        $zip = make_zip("$work/active.zip", ['notes/svg/3.svg' => '<svg xmlns="http://www.w3.org/2000/svg"><script>x()</script></svg>']);
        check(thrown(fn () => media_import_archive($upload($zip), 'notes', ['svg'])) === InvalidArgumentException::class,
            'import: SVG with a script refused');

        $zip = make_zip("$work/big-entry.zip", ['notes/svg/4.svg' => str_repeat(' ', 16 * 1024 * 1024)]);
        check(thrown(fn () => media_import_archive($upload($zip), 'notes', ['svg'])) === InvalidArgumentException::class,
            'import: entry over 15 MB (declared) refused');

        $many = [];
        for ($i = 1; $i <= 5; $i++) {
            $many["notes/svg/1$i.svg"] = str_repeat(' ', 14 * 1024 * 1024);
        }
        $zip = make_zip("$work/aggregate.zip", $many);
        check(filesize($zip) < 1024 * 1024, 'import: aggregate test archive is small (' . filesize($zip) . ' bytes)');
        check(thrown(fn () => media_import_archive($upload($zip), 'notes', ['svg'])) === InvalidArgumentException::class,
            'import: 70 MB unpacked from a tiny archive refused (budget)');
        check(media_import_budget(10 * 1024 * 1024) === 200 * 1024 * 1024
            && media_import_budget(1024) === 64 * 1024 * 1024
            && media_import_budget(1024 * 1024 * 1024) === MEDIA_ARCHIVE_MAX_TOTAL_BYTES,
            'import: budget is 20× the archive, between 64 MB and 4 GB');

        // A forged archive: the entry claims 100 bytes but unpacks to 20 MB.
        $forged = make_zip("$work/forged.zip", ['notes/svg/5.svg' => str_repeat(' ', 20 * 1024 * 1024)]);
        // The uncompressed size sits in the local header and the central
        // directory, each time right after the compressed size.
        $bytes = file_get_contents($forged);
        $real = pack('V', 20 * 1024 * 1024);
        $count = substr_count($bytes, $real);
        file_put_contents($forged, str_replace($real, pack('V', 100), $bytes));
        $zipCheck = new ZipArchive();
        $zipCheck->open($forged);
        $declared = $zipCheck->statIndex(0)['size'] ?? null;
        $zipCheck->close();
        check($count === 2 && $declared === 100, 'import: forged size patched into the test archive');
        try {
            media_import_archive($upload($forged), 'notes', ['svg']);
            $message = '';
        } catch (Throwable $e) {
            $message = get_class($e) . ': ' . $e->getMessage();
        }
        check($message !== '', "import: forged entry size refused ($message)");
        check(!in_array('5.svg', notes_folder('svg'), true), 'import: forged entry not written');

        $zip = new ZipArchive();
        $zip->open("$work/count.zip", ZipArchive::CREATE | ZipArchive::OVERWRITE);
        for ($i = 0; $i <= MEDIA_ARCHIVE_MAX_ENTRIES; $i++) {
            $zip->addFromString("x/$i", '');
        }
        $zip->close();
        check(thrown(fn () => media_import_archive($upload("$work/count.zip"), 'notes', ['svg'])) === InvalidArgumentException::class,
            'import: more than ' . MEDIA_ARCHIVE_MAX_ENTRIES . ' entries refused');

        // Installing is all-or-nothing: an injected rename() failure at any
        // step leaves every target as it was.
        $originals = ['61.svg' => '<svg xmlns="http://www.w3.org/2000/svg"><!-- old 61 --></svg>',
            '62.svg' => '<svg xmlns="http://www.w3.org/2000/svg"><!-- old 62 --></svg>'];
        $resetTargets = function () use ($files, $originals): void {
            @mkdir("$files/notes/svg", 0777, true);
            foreach ($originals as $name => $content) {
                file_put_contents("$files/notes/svg/$name", $content);
            }
            @unlink("$files/notes/svg/63.svg");
        };
        $installZip = make_zip("$work/install.zip", [
            'notes/svg/61.svg' => $svg . '<!-- new 61 -->',
            'notes/svg/62.svg' => $svg . '<!-- new 62 -->',
            'notes/svg/63.svg' => $svg . '<!-- new 63 -->',
        ]);
        // rename() calls in order: 61 aside, 61 in, 62 aside, 62 in, 63 in.
        $failingAt = function (array $failCalls) {
            $call = 0;
            return function (string $from, string $to) use (&$call, $failCalls): bool {
                return in_array(++$call, $failCalls, true) ? false : rename($from, $to);
            };
        };
        $unchanged = fn (): bool => file_get_contents("$files/notes/svg/61.svg") === $originals['61.svg']
            && file_get_contents("$files/notes/svg/62.svg") === $originals['62.svg']
            && !file_exists("$files/notes/svg/63.svg");
        foreach ([2 => 'installing the first file', 3 => 'moving a later file aside', 5 => 'installing the last (new) file'] as $at => $step) {
            $resetTargets();
            $error = thrown(fn () => media_import_archive($upload($installZip), 'notes', ['svg'], $failingAt([$at])));
            $dotFiles = array_filter(notes_folder('svg'), fn ($name) => str_starts_with($name, '.'));
            check($error === RuntimeException::class && $unchanged() && $dotFiles === [],
                "install: rename failure while $step leaves every file as it was, no temp/backup files");
        }

        $resetTargets();
        try {
            media_import_archive($upload($installZip), 'notes', ['svg'], $failingAt([5, 6]));
            $message = '';
        } catch (RuntimeException $e) {
            $message = $e->getMessage();
        }
        // Temporary files start with "." (tempnam() keeps only ".me" on Windows).
        $backups = array_values(array_filter(notes_folder('svg'), fn ($name) => str_starts_with($name, '.')));
        check(count($backups) === 1 && str_contains($message, $backups[0])
            && file_get_contents("$files/notes/svg/{$backups[0]}") === $originals['62.svg']
            && file_get_contents("$files/notes/svg/61.svg") === $originals['61.svg'],
            'install: a backup that cannot be restored is kept and named in the error');
        foreach ($backups as $backup) {
            unlink("$files/notes/svg/$backup");
        }

        $resetTargets();
        $result = media_import_archive($upload($installZip), 'notes', ['svg']);
        $dotFiles = array_filter(notes_folder('svg'), fn ($name) => str_starts_with($name, '.'));
        check($result['imported'] === 3 && str_contains(file_get_contents("$files/notes/svg/62.svg"), 'new 62')
            && file_exists("$files/notes/svg/63.svg") && $dotFiles === [],
            'install: a successful import replaces the files and leaves no backups');

        $leftovers = array_filter(array_merge(notes_folder('svg'), notes_folder('avif')), fn ($name) => str_starts_with($name, '.'));
        check($leftovers === [], 'import: no temporary files left behind');
    }
} finally {
    remove_tree($work);
}

echo "\n$passed passed, $failed failed, $skipped skipped\n";
exit($failed > 0 ? 1 : 0);
