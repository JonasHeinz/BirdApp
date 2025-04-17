from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse
# CORS aktivieren für FastAPI Backend
from fastapi.middleware.cors import CORSMiddleware
# Datenbank Verbindung
from psycopg2 import pool
import os
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor


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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error: "+str(e))
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
    """)




@app.get("/getObservationsSpecies/")
async def get_species():
    return [
        {"name": "Waldkauz", "anzahl": 2, "species": "rare"},
        {"name": "Wasseramsel", "anzahl": 1, "species": "very_rare"},
        {"name": "Zaunkönig", "anzahl": 1, "species": "very_rare"},
        {"name": "Graugans", "anzahl": 1, "species": "rare"},
        {"name": "Kohlmeise", "anzahl": 2, "species": "common"},
        {"name": "Blaumeise", "anzahl": 3, "species": "common"},
        {"name": "Rotkehlchen", "anzahl": 3, "species": "common"},
        {"name": "Amsel", "anzahl": 2, "species": "uncommon"}
    ]
