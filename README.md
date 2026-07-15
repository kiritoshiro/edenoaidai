# Edeno Aidai – giesmynas (viskas viename serveryje)

Vue 3 programėlė + PHP API + MySQL duomenų bazė. Viskas veikia viename
Virtualmin domene – Node.js serveryje **nereikalingas**.

## Struktūra

- `server/` – **paruošta įkelti į public_html** (frontend jau sukompiliuotas,
  PHP API aplanke `api/`, failai aplanke `files/`)
- `frontend/` – Vue kodas (reikalingas tik norint keisti programėlę)
- `db/schema.sql` – duomenų bazės struktūra

## Serverio reikalavimai

- Apache su `mod_rewrite` (Virtualmin standartas)
- PHP 8.1+ (tinka 8.4) su plėtiniais: `pdo_mysql`, `mbstring`, `fileinfo`
  – Ubuntu: `apt install php8.4-mysql php8.4-mbstring`
- MySQL arba MariaDB (Virtualmin turi)
- HTTPS (Virtualmin → Let's Encrypt – vienas mygtukas). **Būtina** – kitaip
  administratoriaus slaptažodis keliautų nešifruotas.
- PHP įkėlimo limitai ≥ 64M (pridėtas `.user.ini` juos nustato; patikrinkite
  Virtualmin → Web Configuration → PHP-FPM Configuration, jei neveiktų)

## Diegimas (Virtualmin)

1. **Domenas.** Sukurkite / pasirinkite virtualų serverį (pvz.
   giesmynas.adventistai.lt) ir įjunkite SSL sertifikatą (Let's Encrypt).

2. **Duomenų bazė.** Virtualmin → Edit Databases → sukurkite MySQL duomenų
   bazę ir naudotoją (užsirašykite pavadinimą, naudotoją, slaptažodį).

3. **Struktūros importas.** Importuokite `db/schema.sql`:
   - per Webmin → Servers → MySQL Database Server → pasirinkite bazę →
     Execute SQL → Run SQL from file, arba
   - per SSH: `mysql --default-character-set=utf8mb4 -u NAUDOTOJAS -p BAZĖ < db/schema.sql`

4. **Failų įkėlimas.** Įkelkite **viso `server/` aplanko turinį** į
   `public_html` (Virtualmin File Manager arba SFTP). Failas `.htaccess`
   ir `.user.ini` turi atsidurti pačiame `public_html`.

5. **Konfigūracija.** `public_html/api/` aplanke nukopijuokite
   `config.example.php` į `config.php` ir įrašykite duomenų bazės duomenis.

6. **Administratoriaus slaptažodis.** Per SSH (arba Webmin → Others →
   Command Shell):

       cd ~/public_html/api
       php hash-password.php 'JūsųIlgasSlaptažodis'

   Gautą eilutę įklijuokite į `config.php` (`admin_password_hash`).
   Slaptažodis saugomas tik kaip maiša – ne tekstu.

7. **Patikrinimas.** Atidarykite svetainę – turi rodyti dvi PAVYZDYS
   giesmes. `https://jūsų-domenas/admin` – prisijunkite.

## Tikrų duomenų perkėlimas

Administravime → **Duomenų bazė**:

1. Įkelkite **db.json** (giesmės),
2. tada **tracks.json** (įrašų tipai ir priskyrimai).

Eiliškumas svarbus: priskyrimai galioja tik jau esančioms giesmėms.
Prieš kiekvieną importą sena versija automatiškai išsaugoma
`storage/backups/`.

Alternatyva per SSH: `php api/import-cli.php db.json tracks.json`

**Audio ir natų failai.** Nukopijuokite esamus failus į:
- `public_html/files/audio/<tipas>/<nr>.mp3`
- `public_html/files/notes/svg/<nr>_<psl>.svg` ir `notes/jpg/...`

Arba, jei failai lieka sename adrese (adventistai.lt/giesmes), programėlę
sukompiliuokite su `VITE_AUDIO_BASE` ir `VITE_NOTES_BASE` (žr. `.env.example`)
ir įkelkite iš naujo.

## Programėlės atnaujinimas (kai pakeičiate kodą)

Kompiuteryje (reikia Node.js 20+):

    cd frontend
    npm install        # tik pirmą kartą
    npm run release    # sukompiliuoja ir sudeda į server/

Tada įkelkite pasikeitusius failus iš `server/` į `public_html`
(`index.html`, `sw.js` ir `assets/` aplanką). `api/`, `files/` ir
`storage/` liesti nereikia.

Vietinis kūrimas: `npm run dev` (užklausas `/api` ir `/files` nukreipia pagal
`VITE_PROXY_TARGET` – į vietinį `php -S localhost:8000 router.php` arba
tiesiai į jūsų svetainę).

## Saugumas

- Slaptažodis saugomas bcrypt maiša, prisijungimai riboti
  (20 bandymų / 15 min iš vieno IP), sesija – httpOnly slapukas, 12 val.
- Slaptažodžio keitimas: iš naujo paleiskite `hash-password.php` ir
  atnaujinkite `config.php`.
- Papildoma (nebūtina): Virtualmin → Protected Directories galima uždėti
  antrą slaptažodį ant `/admin` ar `/api`; serverį atnaujinkite
  (`apt upgrade`) reguliariai.

## Atsarginės kopijos

- Duomenų bazė: Virtualmin → Backup Virtual Servers (arba `mysqldump`).
- Failai: `public_html/files/` aplankas.
- Prieš kiekvieną importą automatinė JSON kopija: `storage/backups/`.
