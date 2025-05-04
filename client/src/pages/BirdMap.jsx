import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import chroma from "chroma-js";
import { GeoJSON } from "ol/format";
import { Feature } from "ol";
import { Polygon } from "ol/geom";

const BirdMap = ({ features }) => {
  const mapRef = useRef(null);
  const olMapRef = useRef(null);
  const [swissPolygon, setSwissPolygon] = useState(null); // Zustand für die Schweiz-Umrandung

  useEffect(() => {
    // Karte nur einmal initialisieren
    const baseLayer = new TileLayer({
      source: new XYZ({
        url: "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
        attributions: "&copy; CartoDB",
        maxZoom: 19,
      }),
    });

    const view = new View({
      projection: "EPSG:3857",
      center: [924000, 6000000], // ungefähr Zürich
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

  useEffect(() => {
    // Fetch GeoJSON für die Schweiz-Umrandung
    fetch("Umrisse_CH.geojson")
      .then((res) => res.json())
      .then((geojsonData) => {
        const format = new GeoJSON();
        const swissFeatures = format.readFeatures(geojsonData, {
          dataProjection: "EPSG:2056", // LV95
          featureProjection: "EPSG:3857", // Web Mercator
        });

        const swissGeometry = swissFeatures[0].getGeometry();
        setSwissPolygon(swissGeometry); // Schweiz-Polygon setzen
      })
      .catch((error) => console.error("Fehler beim Laden der GeoJSON-Datei:", error));
  }, []);

  useEffect(() => {
    if (!swissPolygon || !olMapRef.current) return;

    // Welt-Polygon erstellen (dunkel abdecken)
    const worldPolygon = new Polygon([
      [
        [-180, -90],
        [-180, 90],
        [180, 90],
        [180, -90],
        [-180, -90],
      ],
    ]);
    worldPolygon.transform("EPSG:4326", "EPSG:3857");

    const maskPolygon = new Polygon([worldPolygon.getCoordinates()[0], ...swissPolygon.getCoordinates()]);
    const maskFeature = new Feature(maskPolygon);

    const maskLayer = new VectorLayer({
      source: new VectorSource({
        features: [maskFeature],
      }),
      style: new Style({
        fill: new Fill({
          color: "rgba(0, 0, 0, 0.5)", // Abdunkelung außerhalb der Schweiz
        }),
      }),
    });

    olMapRef.current.addLayer(maskLayer);

    return () => {
      // Entferne den Masken-Layer bei der Bereinigung
      olMapRef.current.removeLayer(maskLayer);
    };
  }, [swissPolygon]);

  useEffect(() => {
    if (!olMapRef.current || !features || features.length === 0) return;

    const counts = features.map((feature) => feature.get("count"));
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    const colourScale = chroma.scale("blues").domain([Math.log10(minCount), Math.log10(maxCount)]);

    const vectorSource = new VectorSource({ features });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const count = feature.get("count") || 0;

        return new Style({
          fill: new Fill({ color: colourScale(count).alpha(0.3).css() }),
          stroke: new Stroke({ color: colourScale(count).alpha(1).css(), width: 1 }),
          zIndex: 100,
        });
      },
    });

    olMapRef.current.addLayer(vectorLayer);

    olMapRef.current.getView().fit(vectorSource.getExtent(), {
      padding: [20, 20, 20, 20],
      duration: 500,
    });

    return () => {
      olMapRef.current.removeLayer(vectorLayer);
    };
  }, [features]);

  return <div ref={mapRef} style={{ width: "100%", height: "80vh" }} />;
};

export default BirdMap;
