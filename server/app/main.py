from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse
# CORS aktivieren für FastAPI Backend
from fastapi.middleware.cors import CORSMiddleware
# Datenbank Verbindung
from psycopg2 import pool
import os
from dotenv import load_dotenv
from pictures import get_image_for_species
from pictures import get_wikipedia_summary
from fastapi.responses import JSONResponse
from psycopg2.extras import RealDictCursor
import geopandas as gpd
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal server error: "+str(e))
    finally:
        if conn:

            db_pool.putconn(conn)


@app.get("/")
async def root():
    return {"message": "Hello GDI Project"}

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




@app.get("/getSpecies/")
async def get_species():
    return execute_query("""
    SELECT * FROM species
    """)

@app.get("/getFamilies/")
async def get_families():
    return execute_query("""
    SELECT * FROM family
    """)

@app.get("/getObservationsTimeline/")
async def get_Observations_Timeline(date_from, date_to, speciesids):
    speciesid_list = speciesids.split(",")  # ➜ ['386', '42', '1148']
    placeholders = ",".join(["%s"] * len(speciesid_list))  # ➜ "%s,%s,%s"
    params = [date_from, date_to] + speciesid_list

    sql = f"""
    SELECT 
        COUNT(o.*) AS count,
        o.date
    FROM 
        observations o
    JOIN 
        species s ON o.speciesid = s.speciesid
    WHERE 
        o.date BETWEEN %s AND %s
        AND s.speciesid IN ({placeholders})
    GROUP BY 
         o.date
    ORDER BY 
        count DESC
    """

    return execute_query(sql, params)


@app.get("/getImage/")
def get_image(species: str):
    image_url = get_image_for_species(species)
    return JSONResponse(content={"image_url": image_url})


@app.get("/getText/")
def get_text(species: str):
    text_data = get_wikipedia_summary(species)
    return JSONResponse(content=text_data)


@app.get("/getGeojson/")
def getGeojson(speciesids, date_from, date_to):
    timestart_time = time.time()
    # grid1 = gpd.read_file("data/km_Grid_1.gpkg")
    grid5 = gpd.read_file("data/km_Grid_5_wgs84.gpkg")

    end_time = time.time()
    print(
        f"Die Ladezeit der GeoJSON-Dateien beträgt: {end_time - timestart_time} Sekunden.")
    timestart_time = time.time()
    # Berechnete Zeit ausgeben
    speciesid_list = speciesids.split(",")  # ['12', '123', '12']
    placeholders = ','.join(['%s'] * len(speciesid_list))

    sql = f"""
        SELECT * FROM observations
        WHERE speciesid IN ({placeholders})
        AND date BETWEEN %s AND %s
    """

   

    params = speciesid_list + [date_from, date_to]

    conn = db_pool.getconn()
    try:
        sightings = gpd.GeoDataFrame.from_postgis(sql, conn, params=params)
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



@app.get("/getHoehenDiagramm")
def getHoehenDiagramm(species: str):
    conn = db_pool.getconn()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT speciesid FROM species WHERE latinname = %s", (species,))
            result = cursor.fetchone()
            if not result:
                return JSONResponse(content={"error": "Art nicht gefunden"}, status_code=404)
            speciesid = result[0]

        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    CONCAT(
                    FLOOR(ST_Z(geom) / 500) * 500, 
                    '-', 
                    FLOOR(ST_Z(geom) / 500) * 500 + 499
                    ) AS elevation,FLOOR(ST_Z(geom) / 500) * 500 AS elevation,
                    COUNT(*) AS count
                FROM observations
                WHERE ST_Z(geom) IS NOT NULL
                AND speciesid = %s
                GROUP BY FLOOR(ST_Z(geom) / 500)
                ORDER BY FLOOR(ST_Z(geom) / 500)
            """, (speciesid,))
            rows = cursor.fetchall()

        data = [{"elevation": row[0], "count": row[1]} for row in rows]

    finally:
        db_pool.putconn(conn)

    return JSONResponse(content=data)