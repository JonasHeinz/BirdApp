import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Navigation from "./Navigation";
import Birdmap from "./pages/BirdMap";
import Stack from "@mui/material/Stack";
import BirdTimeline from "./pages/BirdTimeline";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <Stack direction="col" spacing={2} sx={{ height: "100vh" }}>
      <Navigation/>
      <Stack direction="column" flex={1} spacing={2} minHeight={0}>
      <Stack flex={7} minHeight={0}>
        <Birdmap />
      </Stack>
      <Stack flex={3} minHeight={0}>
        <BirdTimeline />
      </Stack>
      </Stack>
    </Stack>
  // </StrictMode>
);

