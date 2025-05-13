# Vogelradar

Server Client Projekt für eine Geodateninfrastruktur Webportal im Rahmen des Moduls 4230

ACHTUNG: Das Projekt läuft nur mit der nicht öffentlichen REST API von [Ornitho.ch](https://www.ornitho.ch)!

- **Frontend:** React.js, OpenLayers und MUI
- **Backend:** FastAPI, GeoServer

GitHub Pages: https://jonasheinz.github.io/BirdApp/

Getestet mit Node version 22.14.0, openlayers 9.1.0, react 18.3.1

## Requirements

- [Git](https://git-scm.com/)
- IDE wie [Visual Studio Code](https://code.visualstudio.com/)
- [Anaconda Distribution](https://www.anaconda.com/products/distribution) oder [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
- Node.js und npm ([https://docs.npmjs.com/downloading-and-installing-node-js-and-npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm))

## Repository lokal klonen

Mit Git in einem Terminal das GitHub Repository in ein lokales Verzeichnis klonen.

```shell
cd /path/to/workspace
# Clone Repository
git clone https://github.com/JonasHeinz/BirdApp
```

### Git Projekt mit Visual Studio Code lokal klonen

Öffne ein neues Visual Studio Code Fenster und wähle unter Start *Clone Git Repository*. Alternativ öffne die Command Palette in VS Code `CTRL+Shift+P` (_View / Command Palette_) und wähle `Git: clone`.
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

## Ordnerstruktur

📁 BIRDAPP  
├── client/              # React Frontend  
├── docs/                # Github Pages  
├── server/              # FastAPI Backend  
│   ├── app/             # Python Code  
│   └── scripts/         # updateDB.py etc.  
├── .env                 # Lokale Konfiguration (nicht im Git)  
└── README.md

## API-Zugang

Als erstes brauchst du einen persönlichen API Zugang, welchen du bei [Ornitho.ch](https://www.ornitho.ch) anfragen kannst. Sobald du diesen hast, kannst du ihn im nächsten Schritt im Projekt ergänzen.

## .env File

Um mit der API zu arbeiten brauchst du noch ein zusätzliches File das du einfach .env nennen kannst. Im .env File musst du deine E-Mail, Passwort, API Key, API Secret ergänzen z.B. so  
USER_EMAIL=deine@email.ch
USER_PW=deinPasswort
OAUTH_CONSUMER_KEY=abc123
OAUTH_CONSUMER_SECRET=xyz456
DB_PASSWD=deinDbPasswort (Dies erstellen wir gleich im nächsten Schritt)

## Datenbank erstellen

Für das Speichern der durch die API abgefragten Daten wird eine Datenbank benötigt. Diese kann ganz einfach in einem Datenbank Programm (z.B. pgAdmin) aufgesetzt werden.

TIPP: Setze eine Datenbank auf mit folgenden Parametern:  
DBName = BirdApp
User = postgres
Password = deinDbPasswort (dies noch im .env File ergänzen)
Host = localhost
Port = 5433
Wenn du diese Parameter verwendest, musst du anschliessend keine weiteren Anpassungen vornehmen.

## Erstellen der Tabellen in pgAdmin mit SQL Code

Um die Tabellen zu erstellen, kannst du den nachfolgenden SQL Code in pgAdmin ausführen. Dies kannst du unter dem Tab Query Tool machen. Wenn du die Datenbank mit den oben genannten Parametern erstellt hast, musst du nur noch den SQL Code ausführen.

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table: public.family
CREATE TABLE IF NOT EXISTS public.family (
    id integer NOT NULL,
    latin_name text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT family_pkey PRIMARY KEY (id)
);
ALTER TABLE IF EXISTS public.family OWNER to postgres;

-- Table: public.species
CREATE TABLE IF NOT EXISTS public.species (
    speciesid SERIAL PRIMARY KEY,
    rarity text COLLATE pg_catalog."default",
    latinname text COLLATE pg_catalog."default",
    germanname text COLLATE pg_catalog."default",
    family_id integer,
    CONSTRAINT fk_species_family FOREIGN KEY (family_id)
        REFERENCES public.family (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);
ALTER TABLE IF EXISTS public.species OWNER TO postgres;

-- Table: public.observations
CREATE TABLE IF NOT EXISTS public.observations (
	observationid SERIAL PRIMARY KEY,
    date timestamp without time zone,
    speciesid integer,
    geom geometry(PointZ,4326),
	landcover TEXT,
    CONSTRAINT observation_speciesid_fkey FOREIGN KEY (speciesid)
        REFERENCES public.species (speciesid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);
ALTER TABLE IF EXISTS public.observations OWNER to postgres;

-- Unique index on observations
CREATE UNIQUE INDEX IF NOT EXISTS observations_unique
    ON public.observations (date ASC NULLS LAST, speciesid ASC NULLS LAST, geom ASC NULLS LAST);

```

## Datenbank abfüllen

``` shell
# Unter server -> scripts hat es eine Datei mit dem Namen updateDb.py.
cd scripts
# Datenbank aufsetzen oder aktualisieren
# Dies lädt dir alle Daten (Family, Species und Observations) der letzen 365 Tage in die Datenbank (dies wird lange dauern).
python updateDb.py
```

Solltest du, gegen unsere Empfehlung, oben andere Parameter gewählt haben kannst du diese hier auf den Zeilen 35-39 anpassen.


## Jetzt sollte alles startklar sein und du kannst die App starten und nutzen.

## Bei Fragen oder Problemen melde dich beim Team oder poste ein Issue auf GitHub
