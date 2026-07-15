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
- PHP 8.1 or newer with PHP-FPM and the `pdo_mysql`, `mbstring`, and `fileinfo`
  extensions
- MySQL or MariaDB
- HTTPS
- A 64 MB or larger request/upload limit for audio files

On Ubuntu with PHP 8.4, the required extensions can be installed with:

```bash
sudo apt install php8.4-fpm php8.4-mysql php8.4-mbstring
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

9. Test the home page, `/admin`, `/api`, `/api/public/db.json`,
   `/api/public/tracks.json`, and `/manifest.json` over HTTPS.

The Nginx configuration is required. Nginx does not read `.htaccess` files.
The supplied template provides the PHP API front controller, Vue Router SPA
fallback, private storage protection, PHP source protection, upload limits,
and cache headers.

## Importing songs

Open `Admin -> Database` and import the old `db.json` song database. The old
`details.json`/`tracks.json` import is no longer needed: recording categories
and song assignments are indexed from the audio folder structure.

Database backups created before imports are stored under `server/storage/backups/`.

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
adjustable lyric text size, and a checkbox for every lyric column. Each chorus
also has its own repetition count (1-10), which controls how many times that
chorus appears after each selected verse. Theme and font size are remembered by
the browser; per-song column selections reset when another song is opened. The
requested text size is capped separately for every slide so the complete stanza
always stays inside the fullscreen area without scrolling or clipping.

The application automatically adds the `slides_json` column to an existing
`songs` table. If the production database user is not allowed to alter tables,
run this once with a privileged database account before deploying the new code:

```sql
ALTER TABLE songs ADD COLUMN slides_json MEDIUMTEXT NULL AFTER body;
```

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
server/files/notes/jpg/<songId>.jpg
server/files/notes/jpg/<songId>_1.jpg
server/files/notes/svg/<songId>.svg
server/files/notes/svg/<songId>_1.svg
```

The first page has no suffix. Additional pages use `_1`, `_2`, and so on.

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

## Security and backups

- Keep `server/api/config.php` outside Git and restrict its filesystem access.
- Use HTTPS for all administrator access.
- The administrator session uses an HTTP-only cookie and login attempts are
  rate-limited.
- Back up the MySQL database with Virtualmin or `mysqldump`.
- Back up `public_html/files/` separately; media is intentionally excluded from
  this Git repository.
- Keep the operating system, Nginx, PHP-FPM, and database server updated.
