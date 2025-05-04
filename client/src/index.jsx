import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Navigation from "./Navigation";
import Birdmap from "./pages/BirdMap";
import BirdTimeline from "./pages/BirdTimeline";
import Stack from "@mui/material/Stack";
import { GeoJSON } from "ol/format";

function App() {
  const [features, setFeatures] = useState([]);
  const [birds, setBirds] = useState([]);

  useEffect(() => {
    setBirds([{ speciesid: "386", germanname: "Rotkehlchen" }]);
  }, []);

  useEffect(() => {
    const fetchGeoJSON = async () => {
      const birdIds = birds.map((bird) => bird.speciesid);
  
      try {
        const response = await fetch(`http://localhost:8000/getGeojson/?speciesids=${birdIds.join(",")}`);
        const data = await response.json();
  
        const olFeatures = new GeoJSON().readFeatures(data.grid5km, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });
  
        setFeatures(olFeatures);
      } catch (error) {
        console.error("Fehler beim Laden der GeoJSON-Daten:", error);
      }
    };
  
    if (birds.length > 0) {
      fetchGeoJSON();
    } else {
      setFeatures([]); // Falls keine Vögel ausgewählt sind, Features leeren
    }
  }, [birds]);
  

  return (
    <Stack direction="row" spacing={2} sx={{ height: "100vh" }}>
      <Navigation birds={birds} setBirds={setBirds}/>
      <Stack direction="column" flex={1} spacing={2} minHeight={0}>
        <Stack flex={7} minHeight={0}>
          <Birdmap features={features} />
        </Stack>
        <Stack flex={3} minHeight={0}>
          <BirdTimeline />
        </Stack>
      </Stack>
    </Stack>
  );
}

createRoot(document.getElementById("root")).render(<App />);
