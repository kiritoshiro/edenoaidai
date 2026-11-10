<?php

// Helper for render-notes-avif.mjs: encodes one rendered PNG page as AVIF
// with PHP GD, the same encoder the server uses for uploaded pages.
//   php encode-avif.php <in.png> <out.avif> <quality 0-100> <speed 0-10>

declare(strict_types=1);

if (PHP_SAPI !== 'cli' || $argc !== 5) {
    fwrite(STDERR, "Usage: php encode-avif.php <in.png> <out.avif> <quality> <speed>\n");
    exit(2);
}
[, $source, $target, $quality, $speed] = $argv;

if (!function_exists('imageavif')) {
    fwrite(STDERR, "This PHP's GD has no AVIF support (imageavif() is missing)\n");
    exit(1);
}
$image = @imagecreatefrompng($source);
if ($image === false) {
    fwrite(STDERR, "Cannot read $source\n");
    exit(1);
}
// The page is opaque (rendered on white); AVIF needs a true-colour image.
imagepalettetotruecolor($image);
imagesavealpha($image, false);

$temporary = $target . '.part';
if (!imageavif($image, $temporary, (int) $quality, (int) $speed) || filesize($temporary) === 0) {
    @unlink($temporary);
    fwrite(STDERR, "Encoding $source failed\n");
    exit(1);
}
if (!rename($temporary, $target)) {
    @unlink($temporary);
    fwrite(STDERR, "Cannot write $target\n");
    exit(1);
}
