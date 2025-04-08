from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.responses import ORJSONResponse
# CORS aktivieren für FastAPI Backend
from fastapi.middleware.cors import CORSMiddleware
# Datenbank Verbindung
from psycopg2 import pool
#from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from authlib.integrations.requests_client  import OAuth1Session
from app.convertToGeojson import convert_to_geojson
import requests
import json


app = FastAPI() 

# CORS Einstellungen
# siehe: https://fastapi.tiangolo.com/tutorial/cors/#use-corsmiddleware
origins = [
    "*",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#.env Variablen laden
load_dotenv()
USER_EMAIL = os.getenv("USER_EMAIL")
USER_PW = os.getenv("USER_PW")
OAUTH_CONSUMER_KEY = os.getenv("OAUTH_CONSUMER_KEY")
OAUTH_CONSUMER_SECRET = os.getenv("OAUTH_CONSUMER_SECRET")

oauth_session  = OAuth1Session(OAUTH_CONSUMER_KEY, OAUTH_CONSUMER_SECRET)

# Simple Hello World example
@app.get("/") 
async def root(): 
	return {"message": "Hello GDI Project"}
	
    
# Erstellt eine About Seite mit HTML Output 
# import HTMLResponse benötigt
@app.get("/about/")
def about():
    return HTMLResponse(
    """
    <html>
      <head>
        <title>FAST API Service</title>
      </head>
      <body>
        <div align="center">
          <h1>Simple FastAPI Server About Page</h1>
          <p>Dieser FastAPI Rest Server bietet eine einfache REST Schnittstelle. Die Dokumentation ist über <a href="http://localhost:8000/docs">http://localhost:8000/docs</a> verfügbar.</p> 
        </div>
      </body>
    </html>
    """
    )

# Simple static JSON Response 
# (requires package "orjson" https://github.com/ijl/orjson https://anaconda.org/conda-forge/orjson conda install -c conda-forge orjson)
# source: https://fastapi.tiangolo.com/advanced/custom-response/
@app.get("/points/", response_class=ORJSONResponse)
async def read_points():
    return ORJSONResponse({
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "FHNW"
      },
      "geometry": {
        "coordinates": [
          7.642053725874888,
          47.53482543914882
        ],
        "type": "Point"
      },
      "id": 0
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Bern"
      },
      "geometry": {
        "coordinates": [
          7.4469686824532175,
          46.95873550880529
        ],
        "type": "Point"
      },
      "id": 1
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Zurich"
      },
      "geometry": {
        "coordinates": [
          8.54175132796243,
          47.37668053625666
        ],
        "type": "Point"
      },
      "id": 2
    }
  ]
})

   
# # Post Query - test on the OPENAPI Docs Page
# @app.post("/square")
# def square(some_number: int) -> dict:
# 	square = some_number**2
# 	return {f"{some_number} squared is: ": square}


# # Simple Database query
# DB_HOST = "localhost"
# DB_PORT = 5432
# DB_NAME = "geoserver"
# DB_USER = "postgres"
# DB_PASSWORD = "postgres"
# DB_POOL_MIN_CONN = 1
# DB_POOL_MAX_CONN = 10

# db_pool = pool.SimpleConnectionPool(
#   DB_POOL_MIN_CONN, DB_POOL_MAX_CONN, host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASSWORD
# )

# # Definition für das Antwortschema (response schema) für den Endpunkt getPoints
# class PunkteResponse(BaseModel):
#     id: int
#     name: str
#     x: float
#     y: float
#     geom: str
    
# # Funktion für den getPoints-Endpunkt
# # Test: curl http://localhost:8000/getPoints   
# @app.get("/getPoints" , response_model=list[PunkteResponse])
# async def get_punkte():
#     conn = None
#     try:
#         # Verbindung zur Datenbank über den Verbindungspool herstellen
#         conn = db_pool.getconn()
#         cur = conn.cursor()
#         query = "SELECT id, name, ST_X(geom) as x, ST_Y(geom) as y, ST_AsText(geom) as geom FROM punkte"
#         cur.execute(query)
#         results = cur.fetchall()
#         # Ergebnisse in Pydantic-Modelle umwandeln und zurückgeben
#         punkte = []
#         for row in results:
#         # Prüfen, ob die Ergebnisse ausreichend Spalten enthalten
#              if len(row) > 4:
#                   punkte.append(PunkteResponse(id=row[0], name=row[1], x=row[2], y=row[3], geom=row[4]))   
#         #print(punkte)
#         return punkte
#     except Exception as e:
#         print(e)
#         # Eine HTTPException mit Statuscode 500 (Interner Serverfehler) auslösen und den ausgelösten Fehler als Detail übergeben
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error: "+str(e))
#     finally:
#         if conn:
#             # Die Verbindung zur Datenbank beenden
#             db_pool.putconn(conn)

# Observations: curl http://localhost:8000/getPoints   
@app.get("/getObservations/")
async def get_observations():


  #Request Parameter mm.dd.yyyy
  date_from = "01.01.2025"
  date_to= "01.01.2025"

  #API Request
  url = f"https://www.ornitho.ch/api/observations?user_email={USER_EMAIL}&user_pw={USER_PW}&date_from={date_from}&date_to={date_to}"

  response = oauth_session.get(url)
   

  if response.status_code == 200:
    #Convertieren und speichern von Geojson
    geojson_output = convert_to_geojson(response.json())
    with open("output/output.geojson", "w", encoding="utf-8") as f:
      json.dump(geojson_output, f, ensure_ascii=False, indent=4)
      
    with open("output/output.json", "w", encoding="utf-8") as f:
      json.dump(response.json(), f, ensure_ascii=False, indent=4)

    

    return response.json() 
  else:
    raise HTTPException(     
          status_code=response.status_code, 
          detail=f"Error from Ornitho API: {response.text}"
    )


@app.get("/getFamilies/")
async def get_families():

  #API Request
  url = f"https://www.ornitho.ch/api/families?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1"

  response = oauth_session.get(url)
  if response.status_code == 200:
    return response.json().get("data", [])
  else:
    raise HTTPException(     
          status_code=response.status_code, 
          detail=f"Error from Ornitho API: {response.text}"
    )

  
@app.get("/getSpecies/")
async def get_species():
  #API Request
  url = f"https://www.ornitho.ch/api/species?user_email={USER_EMAIL}&user_pw={USER_PW}&id_taxo_group=1&is_used=true"

  response = oauth_session.get(url)
  if response.status_code == 200:
    return response.json().get("data", [])
  else:
    raise HTTPException(     
          status_code=response.status_code, 
          detail=f"Error from Ornitho API: {response.text}"
    )

@app.get("/getObservationsSpecies/")
async def get_species():
    return[
      { "name": "Waldkauz", "anzahl": 2, "species": "rare" },
        { "name": "Wasseramsel", "anzahl": 1, "species": "very_rare" },
        { "name": "Zaunkönig", "anzahl": 1, "species": "very_rare" },
        { "name": "Graugans", "anzahl": 1, "species": "rare" },
        { "name": "Kohlmeise", "anzahl": 2, "species": "common" },
        { "name": "Blaumeise", "anzahl": 3, "species": "common" },
        { "name": "Rotkehlchen", "anzahl": 3, "species": "common" },
        { "name": "Amsel", "anzahl": 2, "species": "uncommon" }
]
