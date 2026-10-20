# Folder-based audio index upgrade

## What changed

- `details.json` is no longer the source of recording categories.
- The old static database and recording-index JSON files were removed from the
  repository.
- Every direct `server/files/audio/<category>/` folder is indexed in MySQL.
- Every `<songId>.mp3` file creates the matching `song_tracks` assignment.
- The category icon is detected from `icon.svg`, `icon.png`, `icon.webp`,
  `icon.jpg`, or `icon.jpeg` in the category folder.
- Song IDs containing spaces, such as `27 A`, are supported.
- The index can be refreshed manually with `php server/api/sync-audio.php`.
- Sheet-music page lists are detected from the SVG/AVIF files. The manual page
  count field has been removed from the song editor.

## What is no longer required

- Importing `details.json` or `tracks.json`.
- Keeping a static `server/api/db.json` or `server/api/tracks.json` copy.
- Manually assigning recording categories to each song.
- Keeping category icons in `files/icons/`. The frontend still supports the
  legacy icon location for backward compatibility.

## Nginx migration

The project now targets Nginx with PHP-FPM. Apache `.htaccess` files were
removed because Nginx ignores them. Install `deploy/nginx-site.conf.example`
or merge its directives into the Virtualmin-generated Nginx virtual host before
deploying the application.

# Sheet-music raster format: JPG → AVIF

- The raster sheet-music format is AVIF (`files/notes/avif/`). JPG is no longer
  read or listed, and there is no JPG fallback; SVG stays as the other format.
- Visitors see the formats as #1 (SVG) and #2 (AVIF).
- The AVIF pages are rendered from the SVG pages on a desktop with
  `scripts/notes-avif/render-notes-avif.mjs` and restored through the admin
  media import (see README, "Making the AVIF pages from the SVGs"). Until they
  are imported, songs show only #1.
- Installed apps keep working with their saved data: a saved `jpg` page list is
  read as the matching AVIF pages, and a remembered JPG choice becomes #2.
- Keep `files/notes/jpg/` until old installed app versions stop asking for it,
  or redirect those requests to AVIF first (README, "Removing the old JPG
  pages").
