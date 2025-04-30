import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Navigation from "./Navigation";
import Birdmap from "./pages/BirdMap";
import Stack from "@mui/material/Stack";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <Stack direction="col" spacing={2} sx={{ height: "100vh" }}>
      <Navigation></Navigation>
      <Birdmap></Birdmap>
    </Stack>
  // </StrictMode>
);

