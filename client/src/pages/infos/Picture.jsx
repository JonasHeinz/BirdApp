import { useState, useEffect } from "react";
import {
  CircularProgress,
  TextField,
  Box,
  Link,
  Typography,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useParams } from "react-router";
import ElevationChart from "../diagramm/Hoehen";
import LandCoverage from "../diagramm/LandCoverage";

function Image() {
  const { latinName: routeLatinName } = useParams();
  const [latinName, setLatinName] = useState(routeLatinName || "");
  const [imageUrl, setImageUrl] = useState(null);
  const [summary, setSummary] = useState(null);
  const [wikiUrl, setWikiUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speciesData, setSpeciesData] = useState([]);
  const [view, setView] = useState("info");

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  // Lade alle verfügbaren Arten
  useEffect(() => {
    fetch("http://localhost:8000/getSpecies/")
      .then((res) => res.json())
      .then(setSpeciesData)
      .catch((err) => console.error("Fehler beim Laden der Arten:", err));
  }, []);

  // Lade Bild und Text parallel
  const fetchImageAndText = async (selectedLatinName) => {
    if (!selectedLatinName.trim()) return;

    setLoading(true);
    setImageUrl(null);
    setSummary(null);
    setWikiUrl(null);

    try {
      const [imageRes, textRes] = await Promise.all([
        fetch(`http://localhost:8000/getImage/?species=${encodeURIComponent(selectedLatinName)}`),
        fetch(`http://localhost:8000/getText/?species=${encodeURIComponent(selectedLatinName)}`),
      ]);

      const imageData = await imageRes.json();
      const textData = await textRes.json();

      setImageUrl(imageData.image_url);
      setSummary(textData.summary);
      setWikiUrl(textData.url);
    } catch (err) {
      console.error("Fehler beim Laden der Inhalte:", err);
    } finally {
      setLoading(false);
    }
  };

  // Falls URL-Param vorhanden ist
  useEffect(() => {
    if (routeLatinName) {
      fetchImageAndText(routeLatinName);
    }
  }, [routeLatinName]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Autocomplete Auswahlfeld */}
      <Autocomplete
        options={speciesData}
        getOptionLabel={(option) => `${option.germanname} (${option.latinname})`}
        value={speciesData.find((s) => s.latinname === latinName) || null}
        onChange={(e, newValue) => {
          const selectedLatin = newValue?.latinname || "";
          setLatinName(selectedLatin);
          fetchImageAndText(selectedLatin);
        }}
        filterOptions={(options, state) => {
          const query = state.inputValue.toLowerCase();
          return options.filter(
            (option) =>
              option.germanname.toLowerCase().includes(query) ||
              option.latinname.toLowerCase().includes(query)
          );
        }}
        renderInput={(params) => (
          <TextField {...params} label="Vogelart auswählen" variant="outlined" size="small" />
        )}
        sx={{ width: "100%" }}
      />

      {/* Ladeanimation oder Inhalt */}
      {loading ? (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          
              {summary && (
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            aria-label="Diagrammwahl"
            sx={{ mb: 2 }}
            color="primary"
          >
            <ToggleButton value="info" aria-label="Info">
              Info
            </ToggleButton>
            <ToggleButton value="elevation" aria-label="Höhen">
              Höhe
            </ToggleButton>
            <ToggleButton value="landcover" aria-label="Landbedeckung">
              Bedeckung
            </ToggleButton>
          </ToggleButtonGroup>
              )}
          {view === "info" && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "center",
                gap: 4,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {imageUrl && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "left" }}>
                  <img
                    src={imageUrl}
                    alt={latinName}
                    style={{ maxHeight: "40vh", objectFit: "cover" }}
                  />
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    <Link
                      href={imageUrl}
                      sx={{ color: "black", fontSize: "9px" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {imageUrl}
                    </Link>
                  </Typography>
                </Box>
              )}

              {summary && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "justify",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, hyphens: "auto", wordBreak: "break-word" }}
                  >
                    {summary}
                  </Typography>
                  {wikiUrl && (
                    <Link
                      href={wikiUrl}
                      sx={{ color: "black", fontSize: "12px" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Zur Wikipedia-Seite
                    </Link>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Höhen-Diagramm */}
          {view === "elevation" && (
            <>
              <Typography variant="h6">Vogelsichtungen nach Höhe</Typography>
              <ElevationChart latinName={latinName} />
            </>
          )}

          {/* Landbedeckungs-Diagramm */}
          {view === "landcover" && (
            <>
              <Typography variant="h6">Vogelsichtungen nach Bodenbedeckung</Typography>
              <LandCoverage latinName={latinName} />
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

export default Image;
