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
  const [legendItems, setLegendItems] = useState([]);
  const [colourScale, setColourScale] = useState(() => chroma.scale("blues"));

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
    const worldPolygon = new Polygon([[
      [-180, -90],
      [-180, 90],
      [180, 90],
      [180, -90],
      [-180, -90],
    ]]);
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
    if (!olMapRef.current || !features || features.length === 0) {
      setLegendItems([]);
      return;
    }

    const counts = features.map((feature) => feature.get("count"));
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    const vectorSource = new VectorSource({ features });

    let legend = [];
    let scale;

    if (minCount === maxCount) {
      scale = chroma.scale(["#deebf7", "#3182bd"]).domain([0, 1]);
      legend = [
        {
          label: `${minCount}`,
          color: scale(0.5).hex(),
        },
      ];
    } else {
      const steps = 3;
      const stepSize = Math.ceil((maxCount - minCount + 1) / steps);
      scale = chroma.scale(["#a6bddb", "#3690c0", "#023858"]).domain([0, steps]);

      legend = Array.from({ length: steps }, (_, i) => {
        const start = minCount + i * stepSize;
        const end = Math.min(start + stepSize - 1, maxCount);
        return {
          label: `${start} - ${end}`,
          color: scale(i).hex(),
          range: [start, end],
        };
      });
    }

    setColourScale(() => {
      if (legend.length === 1) return () => scale(0.5);
      return (count) => {
        const index = legend.findIndex(
          (item) => count >= item.range?.[0] && count <= item.range?.[1]
        );
        return scale(index);
      };
    });

    setLegendItems(legend);

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const count = feature.get("count") || 0;
        const color = colourScale(count);
        return new Style({
          fill: new Fill({ color: chroma(color).alpha(0.6).css() }),
          // stroke: new Stroke({ color: chroma(color).alpha(1).css(), width: 1 }),
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

  return (
    <div style={{ position: "relative", width: "100%", height: "80vh" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {legendItems.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 8,
            background: "#fff",
            padding: 10,
            borderRadius: 4,
            boxShadow: "0 0 6px rgba(0,0,0,0.3)",
            fontSize: 12,
          }}
        >
          <div style={{ marginBottom: 4 }}>Anzahl Sichtungen</div>
          {legendItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <div
              style={{
                width: 20,
                height: 12,
                backgroundColor: chroma(item.color).alpha(0.6).css(),
                // border: `1px solid ${chroma(item.color).alpha(1).css()}`,
                marginRight: 6,
              }}
              />
              <div>{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BirdMap;
