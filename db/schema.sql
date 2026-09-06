-- Edeno Aidai – MySQL / MariaDB schema
-- Importuoti: mysql -u NAUDOTOJAS -p DUOMENU_BAZE < db/schema.sql
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS songs (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    song_id VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL DEFAULT '',
    verse TEXT NULL,
    body MEDIUMTEXT NULL,
    slides_json MEDIUMTEXT NULL,
    copyright TEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_song_id (song_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS track_types (
    name VARCHAR(40) NOT NULL,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(100) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS song_tracks (
    song_id VARCHAR(20) NOT NULL,
    type_name VARCHAR(40) NOT NULL,
    PRIMARY KEY (song_id, type_name),
    CONSTRAINT fk_st_song FOREIGN KEY (song_id) REFERENCES songs (song_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_st_type FOREIGN KEY (type_name) REFERENCES track_types (name)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    ip VARCHAR(45) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    window_start DATETIME NOT NULL,
    PRIMARY KEY (ip)
) ENGINE=InnoDB;

-- Įrašų tipai ir song_tracks priskyrimai automatiškai indeksuojami iš:
-- server/files/audio/<kategorija>/<song_id>.mp3
-- Kategorijos ikona: server/files/audio/<kategorija>/icon.svg (arba png/webp/jpg).

-- Pavyzdinės giesmės (pakeiskite administravimo puslapyje įkeldami tikrą JSON)
INSERT IGNORE INTO songs (song_id, title, verse, body, copyright) VALUES
    ('1', 'PAVYZDYS – įkelkite tikrą duomenų bazę', '', 'Tai pavyzdinis įrašas.<br>Administravime (Duomenų bazė) įkelkite tikrą JSON failą.', ''),
    ('2', 'PAVYZDYS – antra giesmė', '', 'Antras pavyzdinis įrašas.', '');
