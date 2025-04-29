import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';
import { fromLonLat } from 'ol/proj';

const BirdMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/getGeojson/?speciesid=1") // Pfad ggf. anpassen
      .then(res => res.json())
      .then(data => {
        const features = new GeoJSON().readFeatures(data.grid1km, {
          featureProjection: 'EPSG:3857',
        });

        const vectorSource = new VectorSource({
          features: features,
        });

        const getColor = (count) => {
          if (count === 0) return 'rgba(255,255,255,0.4)';
          if (count < 5) return '#ffffb2';
          if (count < 10) return '#fecc5c';
          if (count < 20) return '#fd8d3c';
          if (count < 50) return '#f03b20';
          return '#bd0026';
        };

        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: (feature) => {
            const count = feature.get('count') || 0;
            return new Style({
              fill: new Fill({
                color: getColor(count),
              }),
              stroke: new Stroke({
                color: '#333',
                width: 0.5,
              }),
            });
          },
        });

        const map = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({ source: new OSM() }),
            vectorLayer,
          ],
          view: new View({
            center: fromLonLat([8.3, 46.8]), // Schweiz
            zoom: 7,
          }),
        });

        return () => map.setTarget(null);
      });
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '600px' }} />;
};

export default BirdMap;
