import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { XYZ, Vector as VectorSource } from "ol/source";
import { Fill, Stroke, Style } from "ol/style";
import { GeoJSON } from "ol/format";
import chroma from "chroma-js";
import { transformExtent } from "ol/proj";
import debounce from "lodash.debounce";  // Importiere debounce
import { CircularProgress, Typography } from "@mui/material"; // Importiere CircularProgress
import { ScaleLine } from "ol/control"; // Maßstab hinzufügen

const BirdMap = ({ birdIds, familiesIds, range }) => {
  const mapRef = useRef(null);           // HTML-Element für die Karte
  const olMapRef = useRef(null);         // OpenLayers-Map Referenz
  const currentLayerRef = useRef(null);  // Aktueller Grid-Layer
  const [loading, setLoading] = useState(false); // Ladezustand
  const [legendData, setLegendData] = useState([]); // Speichern der Zählwerte für die Legende

  // Initialisiere Karte nur beim ersten Laden
  useEffect(() => {
    const baseLayer = new TileLayer({
      source: new XYZ({
        url: "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
        attributions: "&copy; CartoDB",
        maxZoom: 19,
      }),
    });

    const view = new View({
      projection: "EPSG:3857",
      center: [924000, 6000000],
      zoom: 7,
      maxZoom: 12,
      minZoom: 6,
      extent: [600000, 5700000, 1300000, 6350000],
    });

    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer],
      view,
      controls: [
        new ScaleLine({ units: "metric" }) // Maßstab hinzufügen
      ]
    });

    olMapRef.current = map;

    return () => {
      map.setTarget(null);
    };
  }, []);

  // Lade Grid-Daten bei Änderungen
  useEffect(() => {
    if (!olMapRef.current) return;
    const map = olMapRef.current;

    // Funktion zum Abrufen von Grid-Daten
    const fetchGrid = async () => {
      const view = map.getView();
      const zoom = view.getZoom();
      const extent3857 = view.calculateExtent();
      const extent4326 = transformExtent(extent3857, "EPSG:3857", "EPSG:4326");
      const bbox = extent4326;
      const gridType = zoom < 9 ? "grid5" : "grid1";
      setLoading(true);

      try {
        const res = await fetch("http://localhost:8000/getGeojson/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grid: gridType,
            bbox: bbox,
            speciesids: birdIds,
            familiesIds: familiesIds,
            date_from: range[0].toISOString(),
            date_to: range[1].toISOString(),
          }),
        });

        const data = await res.json();

        const format = new GeoJSON();
        const features = format.readFeatures(data.grid, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });

        const counts = features.map(f => f.get("count") || 0);
        const min = Math.min(...counts);
        const max = Math.max(...counts);

        // Farbverlauf (Gradient) erstellen
        const scale = chroma.scale("blues").domain([Math.log10(min || 1), Math.log10(max || 1)]);

        const vectorSource = new VectorSource({ features });
        const newLayer = new VectorLayer({
          source: vectorSource,
          style: (feature) => {
            const count = feature.get("count") || 0;
            const logCount = Math.log10(count || 1);
            let color = scale(logCount).css();

            return new Style({
              fill: new Fill({ color: color }),
              stroke: new Stroke({ color: color, width: 1 }),
              zIndex: 100,
            });
          },
        });

        if (currentLayerRef.current) {
          map.removeLayer(currentLayerRef.current);
        }
        console.log("Grid data:", newLayer);
        map.addLayer(newLayer);
        currentLayerRef.current = newLayer;

        // Speichern der Farbverlauf-Daten für die Legende
        setLegendData({ min, max, scale });
      } catch (err) {
        console.error("Fehler beim Laden des Grids:", err);
      } finally {
        setLoading(false);
      }
    };

    // Verwende debounce, um die `fetchGrid`-Funktion nur einmal alle 300ms auszuführen
    const debouncedFetchGrid = debounce(fetchGrid, 300);

    // Lässt die Funktion ausführen, wenn der Kartenbereich sich ändert
    map.on("moveend", debouncedFetchGrid);

    // Initiale Anfrage
    debouncedFetchGrid();

    return () => {
      map.un("moveend", debouncedFetchGrid);
      if (currentLayerRef.current) {
        map.removeLayer(currentLayerRef.current);
        currentLayerRef.current = null;
      }
    };
  }, [birdIds, familiesIds, range]);

  // Funktion zum Erstellen der Legende mit Farbverlauf
  const createLegend = () => {
    if (!legendData.scale) return null;

    // Erstelle ein Gradienten-Element (linearer Farbverlauf)
    const gradientStyle = {
      background: `linear-gradient(to right, ${legendData.scale.colors()})`,
      height: '20px',
      width: '150px',
      margin: '10px 0',
    };

    return (
      <div style={{
        position: "absolute", top: "10px", right: "10px", padding: "10px", zIndex: 1000
      }}>
        <Typography variant="h6">Legende</Typography>
        <div style={gradientStyle}></div>
        <Typography variant="body2" style={{ fontSize: "14px" }}>
          {legendData.min} - {legendData.max}
        </Typography>
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "65vh" }} />
      {loading && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <CircularProgress />
        </div>
      )}
      {createLegend()} {/* Legende mit Farbverlauf anzeigen */}
    </div>
  );
};

export default BirdMap;
