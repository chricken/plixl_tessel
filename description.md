# Overview
Ein Tool, das aus vielen Bildern ein Bild-Mosaik erzeugt.
Es soll Einstellungen wie die Ziel-Auflösung, die Anzahl der Bilder und die Art der Mosaik-Erzeugung (z.B. Zufall, Sortierung nach Helligkeit) anbieten.

Es soll mehrere Ordner zur Auswahl mit Bildern als Input und ein Bild als Output geben.
Es soll einen Drop-Bereich geben, in den ein Benutzer beliebig viele Bilder (auch hunderte) droppen kann.
Diese Bilder sollen dann als Quelldaten verwendet werden.

Das Tool muss damit umgehen können, dass die Bilder unterschiedliche Formate und Auflösungen haben.
Es soll die Bilder direkt nach dem droppen in die Zielgröße skalieren, um die Performance zu verbessern.
Außerdem soll das Bild in die Größe 1*1px skaliert werden, um die Durschnittsfarbe und -Helligkeit schnell zu ermitteln.
Das Verarbeiten der Quell-Bilddaten ist soll asynchron (Webworker?) stattfinden und ein einer Übersicht als Progress angezeigt werden.


Wir brauchen Einstellmöglichkeiten für:
- ob Bilder in der ursprünglichen Aspect Ratio eingebunden werden oder ob ein Aspect Ratio vorgegeben wird.
- ob die Bilder als Raster oder stochastisch angeordnet werden.
- ein Winkelbereich, wie weit die Bilder zufällig gedreht werden können
- eine Angabe, wie weit die Bilder überlappen sollen

# Umsetzung
## Technisch
Es handelt sich um eine Web-Anwendung, die aus HTML, CSS und Vanilla JS besteht.
Die Bilder werden mit dem Canvas API bearbeitet.
Es wird modernes JS nach ES2023 bevorzugt mit ESM, Destructuring, Spread, Promises mit then-chaining, Lookup-Tables, Components, Named Arguments etc.

Die App soll mehrere Themes bieten, die sich über CSS anpassen lassen.

## Dateistruktur
```
├── index.html
├── assets
│   ├── css
│   │   ├── style.css
│   │   ├── themedark.css
│   │   ├── themelight.css
│   │   ├── themegreen.css
│   │   └── themered.css
│   └── js
│       ├── main.js
│       ├── components
│       │   ├── Mosaic.js
│       │   ├── InputRange.js
│       │   ├── InputFile.js
│       │   ├── InputText.js
│       │   └── etc ...
│       └── utils
│           ├── helpers.js
│           └── colorUtils.js
└── images
    ├── source
    │   ├── space
    │   │   ├── image1.jpg
    │   │   ├── image2.jpg
    │   │   └── etc ...
    │   ├── animals
    │   │   ├── image1.jpg
    │   └── etc ...
    
```

# Erweiterung
Lege das Projekt von vornherein so an, dass das Mosaik nicht zwangsläufig mit Quell-Bildern aufgebaut werden kann sondern vielleicht auch mit Zeichen ("ASCII-Art") oder Emoticons?
Ich denke daran, dass die Bilder/Zeichen, etc in einen Canvas gezeichnet werden, der dann nach der durchschnittlichen Farbe/Helligkeit analysiert wird.  

