import React, { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";
import chroma from "chroma-js";

const BirdMap = () => {
  const mapRef = useRef(null);
  const olMapRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/getGeojson/?speciesid=1")
      .then((res) => res.json())
      .then((data) => {
        const features = new GeoJSON().readFeatures(data.grid5km, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857", // Web Mercator für OL-Standard
        });

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
              fill: new Fill({
                color: colourScale(count).alpha(0.3).css(), // 50% transparent
              
              }),
    
              zIndex: 100,
            });
          },
        });

        const baseLayer = new TileLayer({
          source: new XYZ({
            url: "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
            attributions: '&copy; CartoDB',
            maxZoom: 19,
          }),
        });
        
 
        const view = new View({
          projection: "EPSG:3857",
          center: [924000, 6000000], // ungefähr Zürich in EPSG:3857
          zoom: 7,
          maxZoom: 12,
          minZoom: 6,
          extent: [600000, 5700000, 1300000, 6350000], // Bounding Box Schweiz + etwas Umland in Meter
          constrainOnlyCenter: false,
          enableRotation: false,
        });

        const map = new Map({
          target: mapRef.current,
          layers: [baseLayer, vectorLayer  ],
          view,
        });

        view.fit(vectorSource.getExtent(), {
          padding: [20, 20, 20, 20],
          duration: 600,
        });

        olMapRef.current = map;
      });

    return () => {
      if (olMapRef.current) {
        olMapRef.current.setTarget(null);
        olMapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "80vh" }} />;
};

export default BirdMap;
