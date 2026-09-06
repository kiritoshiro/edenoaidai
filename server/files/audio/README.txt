EVERY DIRECT AUDIO FOLDER IS A RECORDING CATEGORY

Example:

files/audio/
  piano/
    icon.svg
    1.mp3
    27 A.mp3
  piano&violin/
    icon.png
    1.mp3
    3.mp3

Rules:
- The folder name is the category's technical name.
- The MP3 filename without its extension must exactly match the songId stored
  in the database.
- Use icon.svg, icon.png, icon.webp, icon.jpg, or icon.jpeg for the category icon.
- If icon.* is absent, the first supported image in the category root is used.
- details.json and tracks.json are no longer required or included.
- The generated /api/public/tracks.json response refreshes the MySQL index when
  requested, and the index also refreshes when an administrator opens the song
  or recording-category pages.
- Manual refresh from the server/ directory:
    php api/sync-audio.php
