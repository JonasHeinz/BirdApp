import React, { useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Navigation from "./Navigation";
import Birdmap from "./pages/BirdMap";
import BirdTimeline from "./pages/BirdTimeline";
import Stack from "@mui/material/Stack";
import { GeoJSON } from "ol/format";

function App() {
  const startDate = new Date("2024-04-05T00:00:00Z");
  const endDate = new Date("2025-04-05T00:00:00Z");
  const [features, setFeatures] = useState([]);
  const [birds, setBirds] = useState([]);
  const birdIds = useMemo(() => birds.map((bird) => bird.speciesid), [birds]);
  const [range, setRange] = useState([startDate, endDate]);

  useEffect(() => {
    setBirds([{ speciesid: "386", germanname: "Rotkehlchen" }]);
  }, []);

  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/getGeojson/?speciesids=${birdIds.join(
            ","
          )}&date_from=${range[0].toISOString()}
&date_to=${range[1].toISOString()}`
        );

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
  }, [birds, range]);

  return (
    <Stack direction="row" spacing={2} sx={{ height: "100vh" }}>
      <Navigation birds={birds} setBirds={setBirds} />
      <Stack direction="column" flex={1} spacing={2} minHeight={0}>
        <Stack flex={7} minHeight={0}>
          <Birdmap features={features} />
        </Stack>
        <Stack flex={3} minHeight={0}>
          <BirdTimeline birdIds={birdIds} range={range} setRange={setRange} />
        </Stack>
      </Stack>
    </Stack>
  );
}

createRoot(document.getElementById("root")).render(<App />);
