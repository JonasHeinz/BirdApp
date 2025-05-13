# 🐦 Vogelradar – Analyse und Visualisierung von Vogelbeobachtungen

Willkommen bei **Vogelradar**, einer interaktiven Webanwendung zur Darstellung und Analyse von Vogelbeobachtungsdaten aus der Schweiz – direkt von der [Ornitho API](https://www.ornitho.ch).  
➡️ Ideal für Vogelfreunde, Forschende und Datenanalyst:innen.

[📺 Demovideo ansehen](https://www.youtube.com/watch?v=dQw4w9WgXcQ)  
[📘 Zur API-Dokumentation ](https://www.ornitho.ch/index.php?m_id=43)

---

## 🎯 Motivation

Vogelbeobachtungsdaten sind entscheidend für den Naturschutz und die Biodiversitätsforschung. Unser Ziel war es, diese Daten visuell, intuitiv und explorativ zugänglich zu machen – mit Fokus auf Benutzerfreundlichkeit und räumlich-zeitliche Analyse.

---

## 🚀 Features

- 🗺️ **Interaktive Karte** mit aktuellen Vogelbeobachtungen
- 🐦 **Detaillierte Artinformationen** (Name, Seltenheitsgrad, Familie)
- 📅 **Zeitfilter** zur Eingrenzung von Beobachtungszeitpunkten
- 🧭 **Räumliche Analyse** (z. B. seltene Arten pro Region)
- 🔐 **Authentifizierte API-Anbindung** via OAuth
- 📤 **Automatisierte Datenbank-Synchronisation** über Cronjobs/Scripts

---

## 📖 Benutzerhandbuch

1. 📅 Zeitraum wählen (z. B. letzte 3 Tage)
2. 🗺️ Beobachtungsregionen auf der Karte betrachten
3. 🐦 Auf Eintrag klicken → Details zur Art
4. 🔍 Gezielte Art- oder Familienauswahl nutzen

![Beispiel Screenshot](assets/screenshot_App.jpg)

---

## 🧪 Verwendete Technologien & Methoden

| Komponente | Technologie / Methode                     |
| ---------- | ----------------------------------------- |
| Frontend   | React + OpenLayers                        |
| Backend    | FastAPI                                   |
| API        | Ornitho API (OAuth1)                      |
| Datenbank  | PostgreSQL + PostGIS                      |
| Analyse    | Raum-Zeit-Filter, Raritätsbewertung       |
| Deployment | Vercel (Frontend), lokale FastAPI-Instanz |

Weitere technische Details und Setup-Anleitung findest du im [📘 README](https://github.com/jonasheinz/BirdApp/blob/main/README.md).

---

## 🔧 Installation & Setup

Voraussetzungen:

- Python 3.10+
- Node.js 18+
- PostgreSQL mit PostGIS
- GeoServer (optional)
- .env mit API-Zugangsdaten

```bash
# Backend starten
cd server
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend starten
cd client
npm install
npm run dev
```
