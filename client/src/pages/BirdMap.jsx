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

const BirdMap = ({ birdIds, familiesIds, range }) => {
  const mapRef = useRef(null);           // HTML-Element für die Karte
  const olMapRef = useRef(null);         // OpenLayers-Map Referenz
  const currentLayerRef = useRef(null);  // Aktueller Grid-Layer

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
        const [min, max] = [Math.min(...counts), Math.max(...counts)];
        const scale = chroma.scale("blues").domain([Math.log10(min || 1), Math.log10(max || 1)]);

        const vectorSource = new VectorSource({ features });
        const newLayer = new VectorLayer({
          source: vectorSource,
          style: (feature) => {
            const count = feature.get("count") || 0;
            return new Style({
              fill: new Fill({ color: scale(Math.log10(count || 1)).alpha(0.3).css() }),
              stroke: new Stroke({ color: scale(Math.log10(count || 1)).alpha(1).css(), width: 1 }),
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
      } catch (err) {
        console.error("Fehler beim Laden des Grids:", err);
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

  return <div ref={mapRef} style={{ width: "100%", height: "65vh" }} />;
};

export default BirdMap;
