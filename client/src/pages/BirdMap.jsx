'use client'; // falls du Next.js 13+ benutzt

import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { Stroke, Style } from 'ol/style';

const BirdMap = () => {
  const mapRef = useRef();

  useEffect(() => {
    if (!mapRef.current) return;

    // BBOX der Schweiz (grob) in EPSG:3857
    const switzerlandExtent = [465000, 5000000, 900000, 5500000];
    const gridSize = 10000; // 500 Meter Raster

    const gridSource = new VectorSource();

    for (let x = switzerlandExtent[0]; x < switzerlandExtent[2]; x += gridSize) {
      for (let y = switzerlandExtent[1]; y < switzerlandExtent[3]; y += gridSize) {
        const coords = [
          [
            [x, y],
            [x + gridSize, y],
            [x + gridSize, y + gridSize],
            [x, y + gridSize],
            [x, y]
          ]
        ];
        const polygon = new Polygon(coords);
        const feature = new Feature(polygon);
        gridSource.addFeature(feature);
      }
    }

    const gridLayer = new VectorLayer({
      source: gridSource,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.2)',
          width: 1,
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        gridLayer,
      ],
      view: new View({
        center: [740000, 5200000], // ungefähr Schweiz-Mitte
        zoom: 8,
      }),
    });

    return () => map.setTarget(null); // Cleanup on unmount
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100vh',
      }}
    />
  );
};

export default BirdMap;
