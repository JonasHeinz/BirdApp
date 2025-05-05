from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse
# CORS aktivieren für FastAPI Backend
from fastapi.middleware.cors import CORSMiddleware
# Datenbank Verbindung
from psycopg2 import pool
import os
from dotenv import load_dotenv
from authlib.integrations.requests_client import OAuth1Session
from app.convertToGeojson import convert_to_geojson
import requests
import json
from pictures import get_image_for_species
from pictures import get_wikipedia_summary
from fastapi.responses import JSONResponse
from psycopg2.extras import RealDictCursor
import geopandas as gpd
from shapely import wkb
import time


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

# .env Variablen laden
load_dotenv()
DB_PASSWD = os.getenv("DB_PASSWD")


db_pool = pool.SimpleConnectionPool(
    minconn=1,              # Mindestanzahl an offenen Verbindungen
    maxconn=10,             # Maximalanzahl
    dbname="BirdApp",
    user="postgres",
    password=DB_PASSWD,
    host="localhost",
    port="5433"
)


def execute_query(query, params=None):
    try:
        conn = db_pool.getconn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(query, params or ())
        conn.commit()
        return cur.fetchall()
    except Exception as e:
        print(e)
        # Eine HTTPException mit Statuscode 500 (Interner Serverfehler) auslösen und den ausgelösten Fehler als Detail übergeben
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal server error: "+str(e))
    finally:
        if conn:
            # Die Verbindung zur Datenbank beenden
            db_pool.putconn(conn)


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


@app.get("/getObservations/")
async def get_observations():

    # Request Parameter mm.dd.yyyy
    date_from = "01.01.2025"
    date_to = "01.01.2025"

    return execute_query("""
    SELECT * FROM observations WHERE date BETWEEN %s AND %s
    """, (date_from, date_to))


@app.get("/getSpecies/")
async def get_species():
    return execute_query("""
    SELECT * FROM species
    """, 141)


@app.get("/getObservationsTimeline/")
async def get_species(date_from, date_to, speciesids):
    return execute_query("""
    SELECT 
        COUNT(o.*) AS count,
        o.date
    FROM 
        observations o
    JOIN 
        species s ON o.speciesid = s.speciesid
    WHERE 
        o.date BETWEEN %s AND %s
        AND s.speciesid IN (%s)
    GROUP BY 
         o.date
    ORDER BY 
        count DESC
    """, (date_from, date_to, speciesids))
    # return [
    #     {"name": "Waldkauz", "anzahl": 2, "species": "rare"},
    #     {"name": "Wasseramsel", "anzahl": 1, "species": "very_rare"},
    #     {"name": "Zaunkönig", "anzahl": 1, "species": "very_rare"},
    #     {"name": "Graugans", "anzahl": 1, "species": "rare"},
    #     {"name": "Kohlmeise", "anzahl": 2, "species": "common"},
    #     {"name": "Blaumeise", "anzahl": 3, "species": "common"},
    #     {"name": "Rotkehlchen", "anzahl": 3, "species": "common"},
    #     {"name": "Amsel", "anzahl": 2, "species": "uncommon"}
    # ]


@app.get("/getImage/")
def get_image(species: str):
    image_url = get_image_for_species(species)
    return JSONResponse(content={"image_url": image_url})


@app.get("/getText/")
def get_text(species: str):
    text_data = get_wikipedia_summary(species)
    return JSONResponse(content=text_data)


@app.get("/getGeojson/")
def getGeojson(speciesids):
    timestart_time = time.time()
    # grid1 = gpd.read_file("data/km_Grid_1.gpkg")
    grid5 = gpd.read_file("data/km_Grid_5_wgs84.gpkg")

    end_time = time.time()
    print(
        f"Die Ladezeit der GeoJSON-Dateien beträgt: {end_time - timestart_time} Sekunden.")
    timestart_time = time.time()
    # Berechnete Zeit ausgeben

    sql = f"""
    SELECT * FROM observations WHERE speciesid IN ({speciesids})
    """
    conn = db_pool.getconn()
    try:
        sightings = gpd.GeoDataFrame.from_postgis(sql, conn)
        print(sightings.head(10))

    finally:
        db_pool.putconn(conn)

    # join1 = gpd.sjoin(grid1, sightings, how="left", predicate="contains")
    # grid1["count"] = join1.groupby("index_right").size()
    # grid1["count"] = grid1["count"].fillna(0).astype(int)

    join5 = gpd.sjoin(grid5, sightings, how="left", predicate="contains")
    join5["count"] = join5.groupby("id")["speciesid"].transform("count")
    join5["count"] = join5["count"].fillna(0).astype(int)
    end_time = time.time()
    print(
        f"Die Ladezeit des Join beträgt: {end_time - timestart_time} Sekunden.")

    # 7. Filtere die Zeilen mit count > 0
    filtered_grid5 = join5[join5["count"] > 0]

    # Extrahiere nur die Spalten 'count' und 'geometry' für die Ausgabe
    filtered_grid5 = filtered_grid5[["count", "geometry"]]

    # Gebe das GeoDataFrame mit count und Geometrie als GeoJSON zurück
    return JSONResponse(content={
        "grid5km": filtered_grid5.to_json()
    })
