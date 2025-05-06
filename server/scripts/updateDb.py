
# Datenbank Verbindung
from psycopg2 import pool
# from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from authlib.integrations.requests_client import OAuth1Session
import psycopg2
from datetime import datetime, timedelta


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
    dbname="BirdApp",     # Name deiner Datenbank
    user="postgres",        # Dein DB-Benutzername
    password=DB_PASSWD,  # Dein Passwort
    host="localhost",        # Oder z. B. "127.0.0.1"
    port="5433"              # Standardport für PostgreSQL
)
cur = conn.cursor()


def get_species():
    # API Request
    url = f"https://www.ornitho.ch/api/species?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1&is_used=1"

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



def get_families():
    # API Request
    url = f"https://www.ornitho.ch/api/families?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1"

    response = oauth_session.get(url)
    if response.status_code == 200:
        len(response.json().get("data", []))
        for i in response.json().get("data", []):
        
            insert_families(
                familyid=i.get("id"),
                latin_name=i.get("latin_name"),
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
        next_week = current + timedelta(days=7)
        yield current, min(next_week - timedelta(days=1), end_date)
        current = next_week


def getObservations():
    # Request Parameter mm.dd.yyyy
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)

    for chunk_start, chunk_end in daterange_weeks(start_date, end_date):
        
        date_from_str = chunk_start.strftime("%d.%m.%Y")
        date_to_str = chunk_end.strftime("%d.%m.%Y")
        print(f"Hole Daten von {date_from_str} bis {date_to_str}")

        # API Request
        url = f"https://www.ornitho.ch/api/observations?user_email={USER_EMAIL}&user_pw={USER_PW}&date_from={date_from_str}&date_to={date_to_str}"

        response = oauth_session.get(url)

        if response.status_code == 200:
            for i in response.json().get("data", []).get("sightings", []):

                insert_observation(
                    speciesid=i.get("species").get("@id"),
                    isozeit=i.get("date").get("@ISO8601"),
                    x=i.get("place").get("coord_lon"),
                    y=i.get("place").get("coord_lat"),
                    z=i.get("place").get("altitude")
                )


def insert_observation(isozeit, speciesid, x, y, z):
    try:
        sql = """
        INSERT INTO public.observations (date, speciesid, geom)
        VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s, %s), 4326)) ON CONFLICT DO NOTHING
        """
        cur.execute(sql, (isozeit, speciesid, x, y, z))
        conn.commit()
        print("Neue Beobachtung wurde erfolgreich eingefügt.")

    except Exception as e:
        print("Fehler beim Einfügen:", e)


def insert_species(rarity, latinname, germanname, id, family_id):
    try:

        sql = """
        INSERT INTO public.species (rarity, latinname, germanname, speciesid, familyid)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING speciesid
        """
        cur.execute(sql, (rarity, latinname, germanname, id, family_id))
        conn.commit()

    except Exception as e:
        print("Fehler beim Einfügen:", e)

get_species()


cur.close()
conn.close()
