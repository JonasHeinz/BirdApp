import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { XYZ, Vector as VectorSource } from "ol/source";
import { Fill, Style, Stroke } from "ol/style";
import { GeoJSON } from "ol/format";
import chroma from "chroma-js";
import { CircularProgress, Typography } from "@mui/material";
import { ScaleLine } from "ol/control";

// BirdMap-Komponente zeigt eine interaktive Karte mit Rasterdaten für Vogelsichtungen
const BirdMap = ({ birdIds, familiesIds, range }) => {
  const mapRef = useRef(null); // Referenz auf das div-Element für die Karte
  const olMapRef = useRef(null); // Referenz auf die OpenLayers-Map-Instanz
  const grid1LayerRef = useRef(null); // Layer für das feinere 1-km-Raster
  const grid5LayerRef = useRef(null); // Layer für das gröbere 5-km-Raster
  const [loading, setLoading] = useState(false); // Ladeanzeige
  const [legendData, setLegendData] = useState(null); // Daten für die Legende
  const [hoverCount, setHoverCount] = useState(null); // Wert für Hover-Anzeige
  const [activeBasemap, setActiveBasemap] = useState("lightgray"); // Aktive Basemap
  const baseLayersRef = useRef({}); // Referenz auf Basemap-Layer

  // Sichtbarkeit der Hintergrundkarte wechseln
  useEffect(() => {
    const layers = baseLayersRef.current;
    if (!layers) return;

    Object.entries(layers).forEach(([key, layer]) => {
      layer.setVisible(key === activeBasemap);
    });
  }, [activeBasemap]);

  // Initialisierung der OpenLayers-Karte beim ersten Rendern
  useEffect(() => {
    const view = new View({
      projection: "EPSG:3857",
      center: [914000, 5900000], // Zentrum der Schweiz
      zoom: 7,
      maxZoom: 12,
      minZoom: 6,
      extent: [600000, 5700000, 1300000, 6350000], // Begrenzung der Karte
    });

    const map = new Map({
      target: mapRef.current,
      layers: [],
      view,
      controls: [new ScaleLine({ units: "metric" })],
    });

    // Hintergrundkarten definieren
    const baseLayers = {
      lightgray: new TileLayer({
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          attributions: "&copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
          maxZoom: 19,
        }),
        visible: true,
      }),
      osm: new TileLayer({
        source: new XYZ({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          attributions: "&copy; OpenStreetMap contributors",
        }),
        visible: false,
      }),
      satellite: new TileLayer({
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attributions: "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS",
          maxZoom: 19,
        }),
        visible: false,
      }),
    };
    // Basemaps zur Karte hinzufügen
    Object.values(baseLayers).forEach((layer) => map.addLayer(layer));
    baseLayersRef.current = baseLayers;

    // Hover-Ereignis: Count anzeigen
    map.on("pointermove", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      if (feature) {
        // Beim Hover über ein Feature wird der Count angezeigt
        setHoverCount(feature.get("count"));
      } else {
        // Wenn der Mauszeiger nichts berührt, setze den Count zurück
        setHoverCount(null);
      }
    });

    // Zoom-Stufenabhängigkeit: 1km- oder 5km-Raster anzeigen
    map.on("moveend", () => {
      const zoom = map.getView().getZoom();
      if (grid1LayerRef.current && grid5LayerRef.current) {
        grid1LayerRef.current.setVisible(zoom >= 9);
        grid5LayerRef.current.setVisible(zoom < 9);
      }
    });

    olMapRef.current = map;

    return () => {
      map.setTarget(null); // Karte bei Unmount entfernen
    };
  }, []);

  // Datenabruf bei Änderung der Filterparameter
  useEffect(() => {
    if (!olMapRef.current) return;
    const map = olMapRef.current;

    // Alte Layer entfernen
    if (grid1LayerRef.current) {
      map.removeLayer(grid1LayerRef.current);
      grid1LayerRef.current = null;
    }
    if (grid5LayerRef.current) {
      map.removeLayer(grid5LayerRef.current);
      grid5LayerRef.current = null;
    }

    setLoading(true);

    // API-Request mit Filterparametern
    fetch("http://localhost:8000/getGeojson/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        speciesids: birdIds,
        familiesIds: familiesIds,
        date_from: range[0].toISOString(),
        date_to: range[1].toISOString(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.grid1.length > 0 && data.grid5.length > 0) {
          const format = new GeoJSON();

          // Features extrahieren und Zählwerte sammeln
          const processFeatures = (geojsonData) => {
            const features = format.readFeatures(geojsonData, {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            });
            const counts = features.map((f) => f.get("count") || 0);
            return { features, counts };
          };

          const grid1 = processFeatures(data.grid1);
          const grid5 = processFeatures(data.grid5);

          // Wertebereich berechnen
          const allCounts = [...grid1.counts, ...grid5.counts];
          const min = Math.min(...allCounts);
          const max = Math.max(...allCounts);

          // Farbskala mit Log-Skalierung definieren
          const scale = chroma.scale("greens").domain([Math.log10(min || 0), Math.log10(max || 0)]);

          // Funktion zur Layer-Erzeugung
          const createLayer = (features, visible) => {
            return new VectorLayer({
              source: new VectorSource({ features }),
              visible,
              style: (feature) => {
                const count = feature.get("count") || 0;
                return new Style({
                  fill: new Fill({
                    color: scale(Math.log10(count || 0))
                      .alpha(0.5)
                      .css(),
                  }),
                  stroke: new Stroke({
                    color: "rgba(80, 80, 80, 0.5)", // Dunkelgrauer Rand mit 50 % Deckkraft
                    width: 1, // 1px dicker Rand
                  }),
                });
              },
            });
          };

          // Zoom prüfen und Layer sichtbar setzen
          const zoom = map.getView().getZoom();
          const layer1 = createLayer(grid1.features, zoom >= 9);
          const layer5 = createLayer(grid5.features, zoom < 9);

          map.addLayer(layer1);
          map.addLayer(layer5);
          grid1LayerRef.current = layer1;
          grid5LayerRef.current = layer5;

          setLegendData({
            scale,
            min: min,
            max: max,
          });
        } else {
          setLegendData({
            scale: 0,
            min: 0,
            max: 0,
          });
        }
      })
      .catch((err) => {
        console.error("Fehler beim Laden des Grids:", err);
      })
      .finally(() => {
        setLoading(false);
      }); 
  }, [birdIds, familiesIds, range]);

  // Legende zur Darstellung der Farbskala
  const createLegend = () => {
    if (!legendData || !legendData.scale) return null;

    const gradientColors = legendData.scale.colors(6); // Mehr Farben = glatter Verlauf

    return (
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "10px",
          zIndex: 1000,
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 0 5px rgba(0,0,0,0.2)",
        }}
      >
        <Typography variant="h6">Anzahl Sichtungen</Typography>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "175px",
          }}
        >
          <div
            style={{
              background: `linear-gradient(to right, ${gradientColors.join(",")})`,
              height: "20px",
              width: "100%",
            }}
          ></div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
            }}
          >
            <span>{legendData.min}</span>
            <span>{legendData.max}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "70vh" }} />
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <CircularProgress />
        </div>
      )}
      {birdIds.length > 0 && legendData && createLegend()}
      {hoverCount !== null && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 0 5px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          <Typography variant="h6">Anzahl Sichtungen {hoverCount}</Typography>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 0 5px rgba(0,0,0,0.2)",
          zIndex: 1000,
        }}
      >
        <Typography variant="body1" style={{ marginBottom: "8px" }}>
          Hintergrundkarte:
        </Typography>
        <select value={activeBasemap} onChange={(e) => setActiveBasemap(e.target.value)}>
          <option value="lightgray">Light Gray</option>
          <option value="osm">OpenStreetMap</option>
          <option value="satellite">Satellite</option>
        </select>
      </div>
    </div>
  );
};

export default BirdMap;
