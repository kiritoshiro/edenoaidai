KIEKVIENAS AUDIO APLANKAS = KATEGORIJA

Pavyzdys:

files/audio/
  piano/
    icon.svg
    1.mp3
    27 A.mp3
  piano&violin/
    icon.png
    1.mp3
    3.mp3

Taisyklės:
- Aplanko vardas yra techninis kategorijos vardas.
- MP3 failo vardas turi tiksliai sutapti su giesmės songId duomenų bazėje.
- Kategorijos ikona: icon.svg, icon.png, icon.webp, icon.jpg arba icon.jpeg.
- Jei icon.* nėra, panaudojamas pirmas paveikslėlis kategorijos aplanko šaknyje.
- details.json nebereikalingas.
- Indeksas automatiškai atnaujinamas atidarant /api/public/tracks.json,
  administravimo giesmes ar įrašų tipus.
- Rankinis atnaujinimas: iš server/ aplanko paleiskite
    php api/sync-audio.php
