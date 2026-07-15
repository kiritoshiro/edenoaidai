# Folder audio index pakeitimas

## Kas pasikeitė

- `details.json` nebenaudojamas kaip audio kategorijų šaltinis.
- Kiekvienas `server/files/audio/<kategorija>/` aplankas automatiškai įrašomas į MySQL.
- Kiekvienas `<songId>.mp3` automatiškai sukuria `song_tracks` priskyrimą.
- Ikona automatiškai randama kategorijos aplanke (`icon.svg/png/webp/jpg/jpeg`).
- Giesmių numeriai su tarpais, pvz. `27 A`, dabar palaikomi PHP validacijoje.
- Pridėta CLI komanda `php server/api/sync-audio.php`.

## Ko nebereikia

- Importuoti `details.json`.
- Rankiniu būdu pažymėti audio kategorijas prie giesmės.
- Laikyti kategorijų ikonų atskirame `files/icons` aplanke (senas formatas dar palaikomas frontend pusėje).
