
# Datenbank Verbindung
from psycopg2 import pool
#from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from authlib.integrations.requests_client  import OAuth1Session
import psycopg2
from datetime import datetime


# CORS Einstellungen
# siehe: https://fastapi.tiangolo.com/tutorial/cors/#use-corsmiddleware
origins = [
    "*",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173"
]


#.env Variablen laden
load_dotenv()
USER_EMAIL = os.getenv("USER_EMAIL")
USER_PW = os.getenv("USER_PW")
OAUTH_CONSUMER_KEY = os.getenv("OAUTH_CONSUMER_KEY")
OAUTH_CONSUMER_SECRET = os.getenv("OAUTH_CONSUMER_SECRET")
DB_PASSWD = os.getenv("DB_PASSWD")

oauth_session  = OAuth1Session(OAUTH_CONSUMER_KEY, OAUTH_CONSUMER_SECRET)

conn = psycopg2.connect(
    dbname="BirdApp",     # Name deiner Datenbank
    user="postgres",        # Dein DB-Benutzername
    password=DB_PASSWD,# Dein Passwort
    host="localhost",        # Oder z. B. "127.0.0.1"
    port="5433"              # Standardport für PostgreSQL
)
cur = conn.cursor()


def get_species():
  #API Request
  url = f"https://www.ornitho.ch/api/species?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1&is_used=1"

  response = oauth_session.get(url)
  if response.status_code == 200:
    len(response.json().get("data", []))
    for i in response.json().get("data", []):
        insert_species(
            rarity=i.get("rarity"),
            latinname=i.get("latin_name"),
            germanname=i.get("german_name"),
            id=i.get("id")
        )


def getObservations():
  #Request Parameter mm.dd.yyyy
  date_from = "01.01.2020"
  date_to= "01.01.2025"

  #API Request
  url = f"https://www.ornitho.ch/api/observations?user_email={USER_EMAIL}&user_pw={USER_PW}&date_from={date_from}&date_to={date_to}"

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
        INSERT INTO public.observations (date, speciesid, x, y, z)
        VALUES (%s, %s, %s, %s, %s)
        """
        cur.execute(sql, (isozeit, speciesid, x, y, z))
        conn.commit()
        print("Neue Beobachtung wurde erfolgreich eingefügt.")

    except Exception as e:
        print("Fehler beim Einfügen:", e)

        
def insert_species(rarity, latinname, germanname, id):
    try:
      
        sql = """
        INSERT INTO public.species (rarity, latinname, germanname, speciesid)
        VALUES (%s, %s, %s, %s)
        RETURNING speciesid
        """
        cur.execute(sql, (rarity, latinname, germanname, id))
        conn.commit()

    except Exception as e:
        print("Fehler beim Einfügen:", e)

getObservations()


cur.close()
conn.close()

