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
- Sheet-music page lists are detected from the SVG/JPG files. The manual page
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
