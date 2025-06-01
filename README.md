# Vogelradar
Dieses Repository wurde im Rahmen einer Semesterarbeit erstellt.  
Unsere Web-App ermöglicht es Vogelinteressierten, sich über das Vorkommen und Verhalten verschiedener Vogelarten in der Schweiz zu informieren. Herzstück der Anwendung ist eine interaktive Karte, auf der Sichtungen in einem Raster aggregiert und durch Farbintensität visualisiert werden – je dunkler das Feld, desto häufiger die Beobachtungen. Nutzer:innen können gezielt nach Vogelarten oder ganzen Familien filtern und den Betrachtungszeitraum mithilfe eines Sliders eingrenzen. Zusätzlich bietet ein Liniendiagramm einen Überblick über zeitliche Häufungen der Sichtungen.  
Man erhält auch weiterführende Informationen zu einer Vogelart. Ergänzt wird diese durch statistische Auswertungen zur Höhenverteilung der Sichtungen sowie zur Bodenbedeckung.

Auf der [GitHub Pages](https://jonasheinz.github.io/BirdApp/) sieht man weiterführende Informationen

Wie die Web-App entwickelt wurde und wie sie lokal gestartet werden kann, lässt sich in dieser Anleitung nachvollziehen:

⚠️ **ACHTUNG:** Das Projekt läuft nur mit der **nicht öffentlichen REST API** von [ornitho.ch](https://www.ornitho.ch)!

- **Frontend:** React.js, OpenLayers und MUI
- **Backend:** FastAPI 

Getestet mit Node version 22.14.0, openlayers 9.1.0, react 18.3.1

## Requirements

- [Git](https://git-scm.com/)
- IDE wie [Visual Studio Code](https://code.visualstudio.com/)
- [Anaconda Distribution](https://www.anaconda.com/products/distribution) oder [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
- Node.js und npm ([https://docs.npmjs.com/downloading-and-installing-node-js-and-npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm))
- [PostGIS](https://postgis.net)
- [PostgreSQL](https://www.postgresql.org)

## Repository lokal klonen

Mit Git in einem Terminal das GitHub Repository in ein lokales Verzeichnis klonen.

```shell
cd /path/to/workspace
# Clone Repository
git clone https://github.com/JonasHeinz/BirdApp
```

### Git Projekt mit Visual Studio Code lokal klonen

Öffne ein neues Visual Studio Code Fenster und wähle unter Start *Clone Git Repository*. Alternativ öffne die Command Palette in VS Code `CTRL+Shift+P` (*View / Command Palette*) und wähle `Git: clone`.
Füge die Git web URL `https://github.com/JonasHeinz/BirdApp` ein und bestätige die Eingabe mit Enter. Wähle einen Ordner in welchen das Repository *geklont* werden soll.

## Frontend installieren

Öffne ein Terminal (Command Prompt in VS Code) und wechsle in den *client* Ordner in diesem Projekt

```shell
cd client
# aktiviere node.js (falls nvm genutzt wird)
# nvm use 22.14.0
# install all the node.js dependencies
npm install
# node Projekt ausführen
# npm run dev ist in package.json definiert
npm run dev
```

## Backend installieren

Öffne ein Terminal und wechsle in den *server* Ordner.

1. Virtuelle Umgebung für Python mit allen Requirements in der `requirements.txt` Datei aufsetzen.

```shell
# Requirements
cd server
# Füge conda-forge den als Channel in conda hinzu, da sonst nicht alle Pakete installiert werden können.
conda config --add channels conda-forge
# Erstelle ein neues Conda Environment und füge die Python Packges requirements.txt hinzu, requirements.txt befindet sich im Ordner server/app
conda create --name gdiproject python=3.10.9 --file app/requirements.txt
```

2. Backend ausführen, virtuelle Umgebung starten und server *uvicorn* starten. Öffne http://localhost:8000/docs im Browser und verifiziere, ob das Backend läuft.

```shell
cd server
# aktiviere die conda umgebung gdiproject
conda activate gdiproject
# start server auf localhost aus dem Ordner "server"
uvicorn app.main:app --reload
# Öffne die angegebene URL im Browser und verifiziere, ob das Backend läuft.
```

## API Dokumentation

Fast API kommt mit vorinstallierter Swagger UI. Wenn der Fast API Backen Server läuft, kann auf die Dokumentation der API über Swagger UI auf http://localhost:8000/docs verfügbar.

Endpoints:
```
/getSpecies/                # Gibt die Daten von der Datenbanktabelle der Vogelarten zurück.                   
/getFamilies/               # Gibt die Daten von der Datenbanktabelle der Familien zurück.
/getObservationsTimeline/   # Gibt für einen angegebenen Zeitraum und eine Liste von Vogelarten (über ihre IDs) die Anzahl der Beobachtungen pro Tag zurück.       
/getImage/                  # Gibt das Foto von der Wikimedia Commons API zurück.
/getText/                   # Gibt den ersten Absatz eines Wikipedia-Artikels zurück.  
/getGeojson/                # Gibt Vektor Grid 5km und 1km als GeoJson zurück
/getHoehenDiagramm/         # Gibt die Anzahl der Beobachtungen einer angegebenen Vogelart in 500-Meter-Höhenintervallen zurück.
/getLandcover/              # Gibt die Verteilung der Beobachtung nach Bodensbedeckungsart zurück. 
```


## Ordnerstruktur

```
📁 BIRDAPP
├── client/                 # React Frontend
├── docs/                   # GitHub Pages
├── server/                 # FastAPI Backend
│   ├── app/                # Python Code
│   └── scripts/            # updateDB.py etc.
├── .env                    # Lokale Konfiguration (nicht im Git)
└── README.md
```

## API-Zugang

Als erstes brauchst du einen persönlichen API Zugang, welchen du bei [ornitho.ch](https://www.ornitho.ch) anfragen kannst. Sobald du diesen hast, kannst du ihn im nächsten Schritt im Projekt ergänzen.

## .env File

Um mit der API zu arbeiten brauchst du noch ein zusätzliches File das du einfach .env nennen kannst. Im .env File musst du deine E-Mail, Passwort, API Key, API Secret ergänzen z.B. so  

```
USER_EMAIL=deine@email.ch  
USER_PW=deinPasswort  
OAUTH_CONSUMER_KEY=abc123  
OAUTH_CONSUMER_SECRET=xyz456  
DB_PASSWD=deinDbPasswort (Dies erstellen wir gleich im nächsten Schritt)
```

## Datenbank erstellen

Für das Speichern der durch die API abgefragten Daten wird eine Datenbank benötigt. Diese kann ganz einfach in einem Datenbank Programm (z.B. pgAdmin) aufgesetzt werden.

TIPP: Setze eine Datenbank auf mit folgenden Parametern:  
Database = BirdApp  
Owner = postgres  
Password = deinDbPasswort (dies noch im .env File ergänzen)  
Host = localhost  
Port = 5433  
Wenn du diese Parameter verwendest, musst du anschliessend keine weiteren Anpassungen vornehmen.

## Erstellen der Tabellen in pgAdmin mit SQL Code

Um die Tabellen zu erstellen, kannst du den nachfolgenden SQL Code (auch abgelegt im Filr *create_database.sql* ) in pgAdmin ausführen. Dies kannst du unter dem Tab Query Tool machen. Wenn du die Datenbank mit den oben genannten Parametern erstellt hast, musst du nur noch den SQL Code ausführen.

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table: public.family
-- Erstellt die Tabelle family im public-Schema, wenn sie noch nicht existiert.
CREATE TABLE IF NOT EXISTS public.family (
    -- Erstellt Ganzzahlige id Spalte, die nicht Null sein darf
    id integer NOT NULL,
    -- Die Spalte latin_name (lateinischer Name der Vögel) ist ein nicht-leeres Textfeld (beliebig lange Zeichenkette), mit Standard-Sortierung (COLLATE) für Textvergleiche. 
    latin_name text COLLATE pg_catalog."default" NOT NULL,
    -- Diese Einschränkung macht die Spalte id zum Primärschlüssel der Tabelle.
    CONSTRAINT family_pkey PRIMARY KEY (id)
);
ALTER TABLE IF EXISTS public.family OWNER to postgres;

-- Table: public.species
-- Erstellt die Tabelle species im public-Schema, wenn sie noch nicht existiert.
CREATE TABLE IF NOT EXISTS public.species (
    -- SERIAL erstellt eine automatisch steigende, eindeutige Ganzzahl in der Spalte seciesid.
    speciesid SERIAL PRIMARY KEY,
    -- Die Spalte rarity (Seltenheit), latinname (lateinischer Name der Vögel) und germanname (deutscher Name der Vögel) ist ein Textfeld (beliebig lange Zeichenkette), das die Standardsortierung (COLLATE) für Textvergleiche verwendet.
    rarity text COLLATE pg_catalog."default",
    latinname text COLLATE pg_catalog."default",
    germanname text COLLATE pg_catalog."default",
    -- family_id ist ein Fremdschlüssel (Ganzzahllig), der auf id in der Tabelle family zeigt.
    family_id integer,
    CONSTRAINT fk_species_family FOREIGN KEY (family_id)
        REFERENCES public.family (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);
ALTER TABLE IF EXISTS public.species OWNER TO postgres;

-- Table: public.observations
-- Erstellt die Tabelle observations im public-Schema, wenn sie noch nicht existiert.
CREATE TABLE IF NOT EXISTS public.observations (
    -- Eindeutige, automatisch hochzählende ID für jede Beobachtung
	observationid SERIAL PRIMARY KEY,
    -- Zeitstempel der Beobachtung (Datum & Uhrzeit ohne Zeitzone)
    date timestamp without time zone,
    -- Referenz auf eine Art in der Tabelle species
    speciesid integer,
    -- 	3D-Punkt-Geometrie (mit Höhe) im WGS 84-Koordinatensystem (EPSG:4326)
    geom geometry(PointZ,4326),
    -- Beschreibung der Landbedeckung (z. B. „Wald“, „Wiese“ etc.)
	landcover TEXT,
    -- Die Spalte speciesid verweist auf species.speciesid.
    CONSTRAINT observation_speciesid_fkey FOREIGN KEY (speciesid)
        REFERENCES public.species (speciesid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);
ALTER TABLE IF EXISTS public.observations OWNER to postgres;

-- Unique index on observations
-- Erstellt einen Index, der dafür sorgt, dass keine zwei Zeilen die gleichen Werte in allen angegebenen Spalten haben dürfen 
CREATE UNIQUE INDEX IF NOT EXISTS observations_unique
    ON public.observations (date ASC NULLS LAST, speciesid ASC NULLS LAST, geom ASC NULLS LAST);

```

## Datenbank abfüllen

``` shell
# Unter preprocessing hat es eine Datei mit dem Namen updateDb.py.
cd preprocessing
#  Es ist ein Skript welches die Datenbank mit Daten (Family, Species und Observations) abfüllt oder aktualisiert. 
# Es werden Daten von den letzten 365 Tage in die Datenbank geschrieben. (Dies wird lange dauern).
# Zur Nachverfolgung des Datenimports wird automatisch die Datei observation_import im Ordner server/scripts erstellt, welche alle übernommenen Einträge auflistet.
python updateDb.py

```

Solltest du, gegen unsere Empfehlung, oben andere Datenbankparameter gewählt haben kannst du diese im Skript updateDb.py auf den Zeilen 35-39 anpassen.


## Jetzt sollte alles startklar sein und du kannst die App starten und nutzen.

### Bei Fragen oder Problemen melde dich beim Team oder poste ein Issue auf GitHub
