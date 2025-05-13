import React, { useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Navigation from "./Navigation";
import Birdmap from "./pages/BirdMap";
import BirdTimeline from "./pages/BirdTimeline";
import Stack from "@mui/material/Stack";


function App() {
  const startDate = new Date("2024-05-04T00:00:00Z");
  const endDate = new Date("2025-04-05T00:00:00Z");

  const [birds, setBirds] = useState([]);
  const [families, setFamilies] = useState([]);
  const familiesIds = useMemo(() => families.map((families) => families.id), [families]);
  const birdIds = useMemo(() => birds.map((bird) => bird.speciesid), [birds]);
  const [range, setRange] = useState([startDate, endDate]);

  useEffect(() => {
    setBirds([{ speciesid: "386", germanname: "Rotkehlchen", latinname: "Erithacus rubecula", rarity: "verycommon" }]);
  }, []);

  return (
    <Stack direction="row" >
      <Navigation birds={birds} setBirds={setBirds} families={families} setFamilies={setFamilies} />
      <Stack direction="column"  maxHeight={"100vh"} width="100%">
          <Birdmap birdIds={birdIds} range={range} familiesIds={familiesIds} /> 
          <BirdTimeline birdIds={birdIds} range={range} setRange={setRange} startDate={startDate} endDate={endDate}/>
      </Stack>
    </Stack>
  );
}

createRoot(document.getElementById("root")).render(<App />);
