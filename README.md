# Edeno Aidai hymnbook

Edeno Aidai is a Vue 3 web application with a PHP API and a MySQL/MariaDB
database. The production application runs from one Nginx virtual host. Node.js
is needed only to build the frontend; it is not required on the server.

## Project structure

- `server/` contains the deployable application. Upload its contents to the
  website document root.
- `frontend/` contains the Vue source code.
- `db/schema.sql` contains the database schema.
- `deploy/nginx-site.conf.example` contains the Nginx virtual-host template.

## Server requirements

- Nginx
- PHP 8.1 or newer with PHP-FPM and the `pdo_mysql`, `mbstring`, `fileinfo`,
  `curl`, and `zip`
  extensions
- MySQL or MariaDB
- HTTPS
- A 64 MB or larger request/upload limit for audio files

On Ubuntu with PHP 8.4, the required extensions can be installed with:

```bash
sudo apt install php8.4-fpm php8.4-mysql php8.4-mbstring php8.4-curl php8.4-zip
```

## Nginx deployment

1. Create the domain and database in Virtualmin. Enable a Let's Encrypt
   certificate before accepting administrator logins.

2. Import the schema into the new database:

   ```bash
   mysql --default-character-set=utf8mb4 -u DATABASE_USER -p DATABASE_NAME < db/schema.sql
   ```

3. Upload the contents of `server/` to the domain's document root, usually:

   ```text
   /home/DOMAIN_USER/public_html
   ```

4. Copy `server/api/config.example.php` to `server/api/config.php` locally, or
   create `public_html/api/config.php` on the server. Set the database name,
   user, password, and directories. Never commit `config.php`.

5. Generate the administrator password hash:

   ```bash
   cd /home/DOMAIN_USER/public_html/api
   php hash-password.php 'Use-A-Long-Unique-Password'
   ```

   Copy the generated hash into `config.php` as `admin_password_hash`. The
   application stores the hash, not the plain password.

6. Copy `deploy/nginx-site.conf.example` to the server's Nginx configuration.
   Replace the domain, document root, and PHP-FPM socket placeholders. If
   Virtualmin already created a `server {}` block, merge the `location` and
   upload-limit directives into that block instead of creating a duplicate.

7. Validate and reload Nginx:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. Ensure Nginx/PHP-FPM can write to these directories:

   ```text
   public_html/files/audio/
   public_html/files/notes/
   public_html/files/icons/
   public_html/storage/
   ```

9. Test the home page, `/admin`, `/api`, the generated offline-data endpoints
   `/api/public/db.json` and `/api/public/tracks.json`, and `/manifest.json`
   over HTTPS.

The Nginx configuration is required. Nginx does not read `.htaccess` files.
The supplied template provides the PHP API front controller, Vue Router SPA
fallback, private storage protection, PHP source protection, upload limits,
and cache headers.

## Importing and exporting the database

Open `Admin -> Database` and choose `Atsisiųsti visą duomenų bazę` to download a
JSON backup containing the hymn texts, structured lyric slides, recording
categories, and song-to-category assignments. It does not contain passwords,
login sessions, MP3 files, or sheet-music files.

The same full JSON file can be uploaded on the page to restore the content
database. A legacy flat `db.json` song array is still accepted for migration,
but it only imports hymn records. Recording categories and their assignments
are normally indexed from the folders under `server/files/audio/`.

The public `/api/public/db.json` and `/api/public/tracks.json` addresses are
generated from MySQL at request time so the offline PWA can download a compact
snapshot. The old static JSON source files are no longer part of the project.

Database backups created automatically before imports or migrations are stored
under `server/storage/backups/` in the same full-backup format.

## Lyrics columns and fullscreen slides

The song editor stores lyrics as separate columns/slides. Mark a column as a
chorus with the `Priegiesmis` checkbox. When a song has a chorus, it is inserted
after every ordinary column by default. Clear `Rodyti priegiesmį po šio
stulpelio` on an individual column when the chorus must not follow it.

Existing songs remain compatible. The editor converts legacy lyrics into
columns by treating each blank-line-separated block as one column. Saving the
song stores both the structured slide data and the legacy `body` representation.

The public song page has a `Skaidrės` button that opens the lyrics in fullscreen
mode. Use the left/right half of the screen, the on-screen arrow buttons, or the
keyboard:

- `Left Arrow` / `Page Up` - previous slide
- `Right Arrow` / `Page Down` / `Space` - next slide
- `Home` / `End` - first or last slide
- `Esc` - close the slideshow

The settings button inside fullscreen mode provides dark and light themes,
adjustable lyric text size, and a checkbox for every item in the final playback
sequence (`verse, chorus, verse, chorus, ...`). Every individual occurrence can
be hidden without affecting the other occurrences of the same chorus. Theme and
font size are remembered by the browser; per-song column selections reset when
another song is opened. The requested text size is capped separately for every
slide so the complete stanza always stays inside the fullscreen area without
scrolling or clipping. The normal song view displays the `Priegiesmis` label,
while fullscreen slides show only the lyrics.

The application automatically adds the `slides_json` column to an existing
`songs` table. If the production database user is not allowed to alter tables,
run this once with a privileged database account before deploying the new code:

```sql
ALTER TABLE songs ADD COLUMN slides_json MEDIUMTEXT NULL AFTER body;
```

### One-time legacy chorus migration

After upgrading an existing song database, preview the migration that finds a
standalone `Priegiesmis` label in each lyrics column and marks that column as a
chorus. The label remains in the normal song view but is kept out of fullscreen
slide text:

```bash
cd /home/giesmynas2/public_html
sudo -u giesmynas2 php8.4 api/migrate-chorus-markers.php
```

If the previewed song count looks correct, apply it once:

```bash
sudo -u giesmynas2 php8.4 api/migrate-chorus-markers.php --apply
```

The apply command creates a database JSON backup in `storage/backups/` before
changing any songs. It is safe to run the command again: migrated lyrics no
longer contain the marker, so they are skipped.

## Audio categories and files

Each direct folder under `server/files/audio/` is a recording category:

```text
server/files/audio/
  piano/
    icon.svg
    1.mp3
    27 A.mp3
  piano&violin/
    icon.png
    1.mp3
```

The MP3 filename without its extension must exactly match the song's `songId`.
The preferred category icon is `icon.svg`, `icon.png`, `icon.webp`, `icon.jpg`,
or `icon.jpeg`. If `icon.*` is absent, the indexer uses the first supported
image in the category folder.

Run a manual index refresh from the deployed `server/` directory with:

```bash
php api/sync-audio.php
```

The index also refreshes when the application requests recording types or when
an administrator opens the song/recording-type pages.

## Sheet-music files

Store sheet music under:

```text
server/files/notes/svg/<songId>.svg
server/files/notes/svg/<songId>_1.svg
server/files/notes/avif/<songId>.avif
server/files/notes/avif/<songId>_1.avif
```

The first page has no suffix. Additional pages use `_1`, `_2`, and so on.
Visitors see the two formats only as **#1** (SVG) and **#2** (AVIF); admin
screens show both the number and the technical name. Browsers without AVIF
support (Safari before iOS 16) are offered #1 only; a song with #2 pages only
shows a short notice there.

The AVIF upload slot stores an AVIF after GD has decoded it (no data after the
image, at most 6000 px a side and 8 megapixels). It also accepts JPG, PNG and
WebP pages, which the server converts with PHP GD (`imageavif()`, quality 60),
so PHP needs GD with AVIF support. Media ZIP imports apply the same AVIF and
SVG checks, unpack at most 5000 entries and 20× the archive size (4 GB at
most), and replace files only after the whole archive has passed. nginx must serve `.avif` as `image/avif`: check with
`curl -sI https://<site>/files/notes/avif/<page>.avif`, and add
`image/avif avif;` to nginx's `mime.types` if it is missing.

### Making the AVIF pages from the SVGs

The AVIF pages are rendered from the site's own SVG pages on a desktop
computer, because the server cannot render SVG. Needs Node 22+, Edge or Chrome,
and PHP with GD AVIF support (`php -r "var_dump(function_exists('imageavif'));"`):

```bash
node scripts/notes-avif/render-notes-avif.mjs --only=1,51
node scripts/notes-avif/render-notes-avif.mjs
```

It reads the page list from the live `db.json` (or `--svg-dir=` / `--jpg-dir=`
for local folders), renders each SVG at 1181×1811 px (200 dpi) on white with
headless Edge/Chrome, encodes AVIF quality 60 with PHP GD, and compares each
page with its old JPG (mean grey difference; pages above `--threshold`, default
12/255, are listed as outliers). Output in `notes-avif-out/`: `notes/avif/`,
`report.csv`, `sources.json` and `notes-avif.zip` (this run's pages only). A
rerun keeps a page when its SVG and the encoder settings are unchanged and the
file still decodes (`--force` re-renders everything). Media ZIP archives made
before the switch contain `notes/jpg/` pages, which the archive import skips
and counts.

**Rollout order.** Put the AVIF pages on the server *before* deploying the
code that switches to them. The JPG version of the app ignores
`files/notes/avif/`, and installed apps that saved song data before the switch
ask for #2 pages as soon as the new code runs. For example, as the site user:

```bash
cd /home/giesmynas2/public_html/files
unzip -n /path/to/notes-avif.zip    # -n never overwrites
```

Later restores use Admin → Duomenų bazė → Natos with only the AVIF format
ticked. If a #2 page is still missing, the viewer shows that song's #1 pages
instead.
### Removing the old JPG pages

The current application no longer reads `files/notes/jpg/`, but older copies
of the app installed on phones still do:

- Builds from before July 2026 load sheet music from
  `https://adventistai.lt/giesmes/notes/<format>/<file>`. Since 2026-10-20 the
  shared server's nginx (`/etc/nginx/snippets/adventistai-giesmes.conf`)
  redirects those to `https://giesmynas.adventistai.lt/files/notes/<format>/<file>`.
  These builds never updated by themselves: their service worker
  (`/service-worker.js?<version>`) serves the cached app shell, and without
  the file the site answered that script URL with `index.html`, so the
  browser's update check failed and the old worker stayed. `server/service-worker.js`
  (source: `frontend/public/service-worker.js`) is now a kill switch: the old
  worker's next update check installs it, and it deletes the old caches,
  unregisters itself and reloads the app, which then registers `/sw.js`. On
  iOS 15 and older Safari cannot reload the open app from a service worker,
  so the old app keeps running until the next launch or reload, which then
  loads the current app from the network. It
  only works if the file is served as JavaScript and not cached for long
  (nginx no-cache location; purge Cloudflare after the first deploy). Keep it
  on the server until the old requests stop.
- Current builds that have not reloaded since the AVIF switch, and offline
  snapshots saved before it, may still ask for `files/notes/jpg/` until the
  page reloads (snapshots are then read as AVIF).

So delete `files/notes/jpg/` only when the nginx access logs show no more
`/giesmes/notes/jpg/` (adventistai.lt) and `/files/notes/jpg/` (giesmynas)
requests, or first redirect those paths to the AVIF pages. The giesmynas
redirect is commented out in `deploy/nginx-site.conf.example`; point the
adventistai.lt snippet's `/giesmes/notes/jpg/` rule straight at
`/files/notes/avif/<name>.avif` too, to avoid a double redirect. Old browsers
without AVIF support (Safari before iOS 16) then see no JPG pages, but they can
still choose SVG.

## Local development

Start the PHP development server from one terminal:

```powershell
cd server
php -S 127.0.0.1:8000 router.php
```

Set `VITE_PROXY_TARGET=http://127.0.0.1:8000` in `frontend/.env`, then start
Vite in another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Do not use the VS Code Live Server extension;
it does not run the PHP API or provide the required SPA/API routing.

## Building a release

Node.js 20.19 or newer is required on the development computer:

```powershell
cd frontend
npm ci
npm run release
```

The release command builds the frontend and synchronizes it into `server/`.
Upload the changed `server/` contents to the Nginx document root. Preserve the
server's `api/config.php`, `files/`, and `storage/` data.

## Updating from GitHub

The administrator can open `Admin -> Atnaujinimas`, check the configured
`v2` branch, and choose either a commit or a release. The server downloads that
version's `server/` directory and updates the application files while keeping
`api/config.php`, the database, `files/`, and `storage/` untouched.

For a private repository or higher GitHub API limits, set `github_token` in the
server-only `api/config.php`. The repository defaults are `kiritoshiro/edenoaidai`
and branch `v2`; they can also be overridden there.

## Security and backups

- Keep `server/api/config.php` outside Git and restrict its filesystem access.
- Use HTTPS for all administrator access.
- The administrator session uses an HTTP-only cookie and login attempts are
  rate-limited.
- Back up the MySQL database with Virtualmin or `mysqldump`.
- An administrator can also download a content backup from `Admin -> Database`.
- Back up `public_html/files/` separately; media is intentionally excluded from
  this Git repository.
- Keep the operating system, Nginx, PHP-FPM, and database server updated.

