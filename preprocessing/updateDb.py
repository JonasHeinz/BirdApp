import os
from dotenv import load_dotenv
from authlib.integrations.requests_client import OAuth1Session
import psycopg2
from datetime import datetime, timedelta
import logging
import geopandas as gpd
from shapely.geometry import Point
import time
import json

# Laden der Raritätsstufen aus JSON-Datei
with open("data/rarity.json") as f:
    rarity_levels = json.load(f)


# Laden der Landbedeckungsdaten (Shapefile im ZIP-Archiv)
landcover_gdf = gpd.read_file("zip://data/LandCoverage.zip")
# Koordinatensystem in WGS84 (EPSG:4326) umwandeln für geografische Berechnungen
landcover_gdf = landcover_gdf.to_crs(epsg=4326)


# .env Variablen laden (Sensible Daten wie Passwörter, API Keys)
load_dotenv()
USER_EMAIL = os.getenv("USER_EMAIL")
USER_PW = os.getenv("USER_PW")
OAUTH_CONSUMER_KEY = os.getenv("OAUTH_CONSUMER_KEY")
OAUTH_CONSUMER_SECRET = os.getenv("OAUTH_CONSUMER_SECRET")
DB_PASSWD = os.getenv("DB_PASSWD")

# OAuth1 Session zur Authentifizierung bei ornitho.ch API
oauth_session = OAuth1Session(OAUTH_CONSUMER_KEY, OAUTH_CONSUMER_SECRET)

# Verbindung zur PostgreSQL-Datenbank aufbauen
conn = psycopg2.connect(
    dbname="postgres",
    user="postgres",
    password="postgres",
    host="10.175.13.26",
    port="5432"
)
cur = conn.cursor()

# --- Funktionen ---


def get_species():
    """
    Lädt Arten aus der ornitho.ch API nach Seltenheitsstufen und fügt sie in die DB ein.
    """
    for i in rarity_levels:
        # URL für den API-Request mit Filter auf Taxonomie-Gruppe 1 und Seltenheit i
        url = f"https://www.ornitho.ch/api/species?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1&rarity={i}"

        response = oauth_session.get(url)
        if response.status_code == 200:
            len(response.json().get("data", []))
            # Für jede Art in den API-Daten: Einfügen in die Datenbank
            for i in response.json().get("data", []):
                insert_species(
                    rarity=i.get("rarity"),
                    latinname=i.get("latin_name"),
                    germanname=i.get("german_name").replace(
                        "|", "").replace("_", " "),
                    id=i.get("id"),
                    family_id=i.get("sempach_id_family")
                )


def insert_species(rarity, latinname, germanname, id, family_id):
    """
    Fügt eine einzelne Art in die Tabelle 'species' ein.
    """
    try:

        sql = """
        INSERT INTO public.species (rarity, latinname, germanname, speciesid, family_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING speciesid
        """
        cur.execute(sql, (rarity, latinname, germanname, id, family_id))
        conn.commit()

    except Exception as e:
        print("Fehler beim Einfügen:", e)


def get_families():
    """
    Lädt Vogelfamilien von ornitho.ch API und fügt sie in die DB ein.
    """
    # API Request
    url = f"https://www.ornitho.ch/api/families?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1"

    response = oauth_session.get(url)
    if response.status_code == 200:
        len(response.json().get("data", []))
        for i in response.json().get("data", []):

            insert_families(
                familyid=i.get("id"),
                latin_name=i.get("latin_name").replace(
                    "(", "").replace(")", ""),
            )


def insert_families(familyid, latin_name):
    """
    Fügt eine einzelne Familie in die Tabelle 'family' ein.
    """
    try:

        sql = """
        INSERT INTO public.family (id, latin_name)
        VALUES (%s, %s)
        """
        cur.execute(sql, (familyid, latin_name))
        conn.commit()

    except Exception as e:
        print("Fehler beim Einfügen:", e)


def daterange_weeks(start_date, end_date):
    """
    Generator, der Wochenabschnitte zwischen Start- und Enddatum liefert.
    """
    current = start_date
    while current < end_date:
        next_week = current + timedelta(days=1)
        # Rückgabe: Start- und Enddatum für den Chunk
        yield current, min(next_week - timedelta(days=1), end_date)
        current = next_week


# Logging konfigurieren
logging.basicConfig(
    filename='observation_import.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)


def getObservations():
    """
    Lädt Beobachtungen der letzten 365 Tage in Wochenabschnitten
    von der ornitho.ch API und speichert sie in der DB.
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)

    for chunk_start, chunk_end in daterange_weeks(start_date, end_date):
        date_from_str = chunk_start.strftime("%d.%m.%Y")
        date_to_str = chunk_end.strftime("%d.%m.%Y")
        logging.info(f"Requesting data from {date_from_str} to {date_to_str}")

        url = f"https://www.ornitho.ch/api/observations?user_email={USER_EMAIL}&user_pw={USER_PW}&date_from={date_from_str}&date_to={date_to_str}"

        # Bis zu 3 Versuche, um API-Daten abzurufen
        for attempt in range(3):
            try:
                response = oauth_session.get(url, timeout=15)
                if response.status_code == 200:
                    break
                logging.warning(
                    f"Attempt {attempt+1}: API returned {response.status_code}")
            except Exception as e:
                logging.error(f"Attempt {attempt+1}: Request failed: {e}")
            time.sleep(2)
        else:
            logging.error(
                f"Failed to retrieve data from {date_from_str} to {date_to_str} after 3 attempts.")
            continue

         # Verarbeitung der erhaltenen Daten
        try:
            data = response.json().get("data", {})
            sightings = data.get("sightings", [])
            if not isinstance(sightings, list):
                logging.warning(
                    f"No valid 'sightings' list in response for {date_from_str} to {date_to_str}")
                continue

            for i in sightings:
                try:
                    # Daten aus Observation extrahieren
                    species = i.get("species", {}).get("@id")
                    date_iso = i.get("date", {}).get("@ISO8601")
                    place = i.get("place", {})
                    lon = place.get("coord_lon")
                    lat = place.get("coord_lat")
                    alt = place.get("altitude")

                    # Prüfen, ob alle wichtigen Daten vorhanden sind
                    if None in (species, date_iso, lon, lat, alt):
                        logging.warning(f"Incomplete data skipped: {i}")
                        continue

                    insert_observation(
                        speciesid=species,
                        isozeit=date_iso,
                        x=lon,
                        y=lat,
                        z=alt
                    )
                except Exception as e:
                    logging.error(
                        f"Error processing observation: {e} | Entry: {i}")
                    # Continue to the next observation even if this one fails

        except Exception as e:
            logging.error(
                f"Error parsing JSON for range {date_from_str} to {date_to_str}: {e}")


def get_landcover_value(lon, lat):
    """
    Ermittelt den Landbedeckungswert an den angegebenen Koordinaten.

    Args:
        lon (float): Längengrad
        lat (float): Breitengrad

    Returns:
        Wert des Landbedeckungstyps oder None, falls kein Treffer
    """
    pt = Point(lon, lat)
    matches = landcover_gdf[landcover_gdf.geometry.contains(pt)]
    if not matches.empty:
        return matches.iloc[0]["OBJVAL"]
    return None


def insert_observation(isozeit, speciesid, x, y, z):
    """
    Fügt eine Beobachtung in die Tabelle 'observations' ein.
    Prüft, ob die Art in der DB existiert, berechnet Landbedeckung und schreibt Geo-Daten.
    """
    try:
        # Prüfen, ob Art in DB vorhanden
        cur.execute(
            "SELECT 1 FROM public.species WHERE speciesid = %s", (speciesid,))
        if not cur.fetchone():
            logging.warning(
                f"Species ID {speciesid} not found in the database. Skipping observation.")
            return

       # Landbedeckung am Beobachtungsort abfragen
        landcover_value = get_landcover_value(float(x), float(y))

        sql = """
        INSERT INTO public.observations (date, speciesid, geom, landcover)
        VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s, %s), 4326), %s)
        ON CONFLICT DO NOTHING
        """
        cur.execute(sql, (isozeit, speciesid, x, y, z, landcover_value))
        conn.commit()
        logging.info(
            f"Inserted observation {isozeit} | SID {speciesid} | LC {landcover_value}")
    except Exception as e:
        logging.error(
            f"Database insert failed for {isozeit}, {speciesid}: {e}")


get_families()

