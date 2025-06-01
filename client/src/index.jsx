// React-Imports für State-Management, Side-Effects und Memoisierung
import { useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Eigene Komponenten
import Navigation from "./Navigation";
import Birdmap from "./pages/BirdMap";
import BirdTimeline from "./pages/BirdTimeline";

// MUI-Komponente für Layout
import Stack from "@mui/material/Stack";

// Konstante Start- und Enddaten für den Zeitbereich
const startDate = new Date("2024-06-01:00:00Z");
const endDate = new Date("2024-08-05T00:00:00Z");

function App() {
  const [birds, setBirds] = useState([]);
  const [families, setFamilies] = useState([]);
  const familiesIds = useMemo(() => families.map((family) => family.id), [families]);
  const birdIds = useMemo(() => birds.map((bird) => bird.speciesid), [birds]);
  const [range, setRange] = useState([startDate, endDate]);

  //Initialer eintrag eines Vogels in den Zustand
  useEffect(() => {
    setBirds([
      {
        speciesid: "386",
        germanname: "Rotkehlchen",
        latinname: "Erithacus rubecula",
        rarity: "verycommon",
      },
    ]);
  }, []);

  return (
    // Horizontales Layout: links Navigation, rechts Karte + Zeitachse
    <Stack direction="row">
      <Navigation birds={birds} setBirds={setBirds} families={families} setFamilies={setFamilies} />
      <Stack direction="column" maxHeight={"100vh"} width="100%">
        <Birdmap birdIds={birdIds} range={range} familiesIds={familiesIds} />
        <BirdTimeline
          birdIds={birdIds}
          range={range}
          setRange={setRange}
          startDate={startDate}
          endDate={endDate}
        />
      </Stack>
    </Stack>
  );
}

createRoot(document.getElementById("root")).render(<App />);
