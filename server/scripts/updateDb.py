
# Datenbank Verbindung
from psycopg2 import pool
# from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from authlib.integrations.requests_client import OAuth1Session
import psycopg2
from datetime import datetime, timedelta
import logging
# import {getRarity} from "....client/public/rarityData.js"
import json

with open("rarity.json") as f:
    rarity_levels = json.load(f)


# CORS Einstellungen
# siehe: https://fastapi.tiangolo.com/tutorial/cors/#use-corsmiddleware
origins = [
    "*",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173"
]


# .env Variablen laden
load_dotenv()
USER_EMAIL = os.getenv("USER_EMAIL")
USER_PW = os.getenv("USER_PW")
OAUTH_CONSUMER_KEY = os.getenv("OAUTH_CONSUMER_KEY")
OAUTH_CONSUMER_SECRET = os.getenv("OAUTH_CONSUMER_SECRET")
DB_PASSWD = os.getenv("DB_PASSWD")

oauth_session = OAuth1Session(OAUTH_CONSUMER_KEY, OAUTH_CONSUMER_SECRET)

conn = psycopg2.connect(
    dbname="BirdApp2",     # Name deiner Datenbank
    user="postgres",        # Dein DB-Benutzername
    password=DB_PASSWD,  # Dein Passwort
    host="localhost",        # Oder z. B. "127.0.0.1"
    port="5433"              # Standardport für PostgreSQL
)
cur = conn.cursor()


def get_species():
    for i in rarity_levels:
        # API Request
        url = f"https://www.ornitho.ch/api/species?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1&rarity={i}"
    
        response = oauth_session.get(url)
        if response.status_code == 200:
            len(response.json().get("data", []))
            for i in response.json().get("data", []):
                insert_species(
                    rarity=i.get("rarity"),
                    latinname=i.get("latin_name"),
                    germanname=i.get("german_name").replace("|", "").replace("_", " "),
                    id=i.get("id"),
                    family_id=i.get("sempach_id_family")
                )

            
def insert_species(rarity, latinname, germanname, id, family_id):
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
    # API Request
    url = f"https://www.ornitho.ch/api/families?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1"

    response = oauth_session.get(url)
    if response.status_code == 200:
        len(response.json().get("data", []))
        for i in response.json().get("data", []):
        
            insert_families(
                familyid=i.get("id"),
                latin_name=i.get("latin_name").replace("(", "").replace(")", ""),
            )
            
def insert_families(familyid, latin_name):
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
    current = start_date
    while current < end_date:
        next_week = current + timedelta(days=1)
        yield current, min(next_week - timedelta(days=1), end_date)
        current = next_week

logging.basicConfig(
    filename='observation_import.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

def getObservations():
    end_date = datetime.now()
    start_date = end_date - timedelta(days=3650)

    for chunk_start, chunk_end in daterange_weeks(start_date, end_date):
        date_from_str = chunk_start.strftime("%d.%m.%Y")
        date_to_str = chunk_end.strftime("%d.%m.%Y")
        logging.info(f"Requesting data from {date_from_str} to {date_to_str}")

        url = f"https://www.ornitho.ch/api/observations?user_email={USER_EMAIL}&user_pw={USER_PW}&date_from={date_from_str}&date_to={date_to_str}"

        # Try the request up to 3 times
        for attempt in range(3):
            try:
                response = oauth_session.get(url, timeout=15)
                if response.status_code == 200:
                    break
                logging.warning(f"Attempt {attempt+1}: API returned {response.status_code}")
            except Exception as e:
                logging.error(f"Attempt {attempt+1}: Request failed: {e}")
            time.sleep(2)
        else:
            logging.error(f"Failed to retrieve data from {date_from_str} to {date_to_str} after 3 attempts.")
            continue

        # Handle data
        try:
            data = response.json().get("data", {})
            sightings = data.get("sightings", [])
            if not isinstance(sightings, list):
                logging.warning(f"No valid 'sightings' list in response for {date_from_str} to {date_to_str}")
                continue

            for i in sightings:
                try:
                    species = i.get("species", {}).get("@id")
                    date_iso = i.get("date", {}).get("@ISO8601")
                    place = i.get("place", {})
                    lon = place.get("coord_lon")
                    lat = place.get("coord_lat")
                    alt = place.get("altitude")

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
                    logging.error(f"Error processing observation: {e} | Entry: {i}")
                    # Continue to the next observation even if this one fails

        except Exception as e:
            logging.error(f"Error parsing JSON for range {date_from_str} to {date_to_str}: {e}")


def insert_observation(isozeit, speciesid, x, y, z):
    try:
        # Check if the species ID exists in the database before trying to insert the observation
        cur.execute("SELECT 1 FROM public.species WHERE speciesid = %s", (speciesid,))
        if not cur.fetchone():  # If species does not exist in DB, log it and return
            logging.warning(f"Species ID {speciesid} not found in the database. Skipping observation.")
            return  # Skip this observation, do not insert it

        sql = """
        INSERT INTO public.observations (date, speciesid, geom)
        VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s, %s), 4326))
        ON CONFLICT DO NOTHING
        """
        cur.execute(sql, (isozeit, speciesid, x, y, z))
        conn.commit()
        logging.info(f"Inserted observation {isozeit} | SID {speciesid}")
    except Exception as e:
        logging.error(f"Database insert failed for {isozeit}, {speciesid}: {e}")



# get_families()
# get_species()
# getObservations()