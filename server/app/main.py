from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from shapely.geometry import box
import geopandas as gpd
import os
import time
from dotenv import load_dotenv
from pictures import get_image_for_species, get_wikipedia_summary

app = FastAPI()

# CORS-Einstellungen
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

# .env laden
load_dotenv()
DB_PASSWD = os.getenv("DB_PASSWD")

db_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    dbname="BirdApp",
    user="postgres",
    password=DB_PASSWD,
    host="localhost",
    port="5433"
)


grid5 = gpd.read_file("data/km_Grid_5_wgs84.gpkg")
grid1 = gpd.read_file("data/km_Grid_1_wgs84.geojson")

def execute_query(query, params=None):
    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(query, params or ())
        conn.commit()
        return cur.fetchall()
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error: {e}")
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
          <head><title>FAST API Service</title></head>
          <body>
            <div align="center">
              <h1>Simple FastAPI Server About Page</h1>
              <p>Dokumentation unter <a href="/docs">/docs</a></p>
            </div>
          </body>
        </html>
        """
    )

@app.get("/getSpecies/")
async def get_species():
    return execute_query("SELECT * FROM species")

@app.get("/getFamilies/")
async def get_families():
    return execute_query("SELECT * FROM family")

@app.get("/getObservationsTimeline/")
async def get_observations_timeline(date_from: str, date_to: str, speciesids: str):
    speciesid_list = speciesids.split(",")
    placeholders = ",".join(["%s"] * len(speciesid_list))
    sql = f"""
        SELECT COUNT(o.*) AS count, o.date
        FROM observations o
        JOIN species s ON o.speciesid = s.speciesid
        WHERE o.date BETWEEN %s AND %s
          AND s.speciesid IN ({placeholders})
        GROUP BY o.date
        ORDER BY count DESC
    """
    params = [date_from, date_to] + speciesid_list
    return execute_query(sql, params)

@app.get("/getImage/")
def get_image(species: str):
    image_url = get_image_for_species(species)
    return JSONResponse(content={"image_url": image_url})

@app.get("/getText/")
def get_text(species: str):
    text_data = get_wikipedia_summary(species)
    return JSONResponse(content=text_data)


from typing import List, Optional
from pydantic import BaseModel

class GeoJsonRequest(BaseModel):
    speciesids: Optional[List[int]] = []
    familiesIds: Optional[List[int]] = []
    date_from: str
    date_to: str


@app.post("/getGeojson/")
def get_geojson(request: GeoJsonRequest):
    response = {}

    # Wenn keine Filter gesetzt sind → leere Grids zurückgeben
    if not request.speciesids and not request.familiesIds:
        response["grid1"] = grid1[["geometry"]].copy()
        response["grid1"]["count"] = 0
        response["grid1"] = response["grid1"][0:0].to_json()  # komplett leer

        response["grid5"] = grid5[["geometry"]].copy()
        response["grid5"]["count"] = 0
        response["grid5"] = response["grid5"][0:0].to_json()

        return JSONResponse(content=response)

    # Andernfalls SQL zusammenbauen
    where_clause = []
    params = []

    if request.speciesids:
        placeholders = ",".join(["%s"] * len(request.speciesids))
        where_clause.append(f"s.speciesid IN ({placeholders})")
        params.extend(request.speciesids)

    if request.familiesIds:
        placeholders = ",".join(["%s"] * len(request.familiesIds))
        where_clause.append(f"s.family_id IN ({placeholders})")
        params.extend(request.familiesIds)

    where_sql = " OR ".join(where_clause)
    sql = f"""
        SELECT o.*
        FROM observations o
        JOIN species s ON o.speciesid = s.speciesid
        WHERE ({where_sql})
          AND o.date BETWEEN %s AND %s
    """
    params += [request.date_from, request.date_to]

    conn = db_pool.getconn()
    try:
        sightings = gpd.GeoDataFrame.from_postgis(sql, conn, params=params)
    finally:
        db_pool.putconn(conn)

    # Wenn keine Sichtungen → Geometrien ohne Zählung zurückgeben
    if sightings.empty:
        response["grid1"] = grid1[["geometry"]].to_json()
        response["grid5"] = grid5[["geometry"]].to_json()
        return JSONResponse(content=response)

    def count_points_per_cell(grid, sightings):
        if "id" not in grid.columns:
            grid["id"] = grid.index
        joined = gpd.sjoin(grid, sightings, how="inner", predicate="contains")
        counts = joined.groupby("id").size().rename("count").reset_index()
        grid = grid.merge(counts, on="id", how="left")
        grid["count"] = grid["count"].fillna(0).astype(int)
        return grid[grid["count"] > 0][["geometry", "count"]]

    response["grid1"] = count_points_per_cell(grid1, sightings).to_json()
    response["grid5"] = count_points_per_cell(grid5, sightings).to_json()

    return JSONResponse(content=response)



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
                    ) AS elevation_label,
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