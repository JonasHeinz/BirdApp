import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { HashRouter, Navigate, Route, Routes } from "react-router";
import Filter from "./pages/filter/Filter";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div id="container_right">
    <HashRouter>
      <Routes>
      <Route path="/" element={<Navigate to="/filter" replace />} />
      <Route path="/filter" element={<Filter />} />
{/*      <Route path="/" element={<Navigate to="/openlayers" replace />} />
        <Route path="openlayers" element={<OpenlayersPage />} />
        <Route path="maplibre" element={<MaplibrePage />} />
        <Route path="spatialanalysis" element={<SpatialAnalysisPage />} />
        <Route path="geotiff" element={<GeoTIFFPage />} /> */}
      </Routes>
    </HashRouter>
    </div>
  </StrictMode>
);
