import React, { useState, useEffect } from "react";
import { TextField, Box, Link, Typography, Autocomplete } from "@mui/material";
import { useParams } from "react-router";

function Image({birds, setBirds}) {
  const { latinName: routeLatinName } = useParams();
  const [latinName, setLatinName] = useState(routeLatinName || "");
  const [imageUrl, setImageUrl] = useState(null);
  const [summary, setSummary] = useState(null);
  const [wikiUrl, setWikiUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deName, setDeName] = useState(null);
  const [speciesData, setSpeciesData] = useState([]);

  // Daten abrufen
  useEffect(() => {
    fetch("http://localhost:8000/getSpecies/")
      .then((res) => res.json())
      .then((data) => setSpeciesData(data));
  }, []);

  const fetchImageAndText = (selectedLatinName) => {
    if (!selectedLatinName.trim()) return;
    setLoading(true);

    // Bild
    fetch(`http://localhost:8000/getImage/?species=${encodeURIComponent(selectedLatinName)}`)
      .then((res) => res.json())
      .then((data) => setImageUrl(data.image_url))
      .catch((err) => {
        console.error("Fehler beim Laden des Bildes:", err);
        setImageUrl(null);
      });

    // Text
    fetch(`http://localhost:8000/getText/?species=${encodeURIComponent(selectedLatinName)}`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary);
        setWikiUrl(data.url);
        setLoading(false);
        setDeName(data.de_name);
      })
      .catch((err) => {
        console.error("Fehler beim Laden des Textes:", err);
        setSummary(null);
        setWikiUrl(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (routeLatinName) {
      fetchImageAndText(routeLatinName);
    }
  }, [routeLatinName]);

  // Funktion, um den Text auf eine bestimmte Anzahl von Sätzen zu kürzen
  const truncateTextBySentence = (text, maxSentences) => {
    if (!text) return "";
    const sentences = text.match(/[^.!?]+[.!?]/g)?.slice(0, maxSentences) || [];
    return sentences.join(" ").trim();
  };
  

  return (
    <Box sx={{ p: 1, textAlign: "center" }}>
      <Box sx={{ display: "flex", justifyContent: "left", alignItems: "center", gap: 2 }}>
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
          sx={{ width: 308, justifyContent: "center", alignItems: "center" }}
        />
      </Box>

      {(deName || latinName) && (
        <Typography variant="subtitle1" sx={{ color: "black", mt: 2, fontWeight: "bold" }}>
         {deName} {`(${latinName})`}
       </Typography>
      )}

      <Box
        sx={{ mt: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}
      >
        {loading ? (
          <p>Lade...</p>
        ) : (
          <>
            {imageUrl && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%" }}>

                <img
                  src={imageUrl}
                  alt={latinName}
                  style={{
                    maxWidth: "400px", 
                    maxHeight: "150px",
                    objectFit: "cover",
                  }}
                />
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="body3"
                    sx={{ wordBreak: "break-word", whiteSpace: "normal" }}
                  >
                    <Link
                      href={imageUrl}
                      sx={{ color: "black", fontSize: "12px" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Bild-URL
                    </Link>
                  </Typography>
                </Box>
              </Box>
            )}
            {summary && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "justify",
                  maxWidth: "500px",
                }}
              >
                <Typography
                  variant="body3"
                  sx={{ mb: 1, hyphens: "auto", wordBreak: "break-word" }}
                >
                  {truncateTextBySentence(summary, 3)}
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
            {!imageUrl && !summary && <Typography
  variant="body2"
  sx={{
    mt: 1,
    textAlign: "left",  
    typography: "body2"
  }}
>
  Suche einen Vogel, um Informationen zu erhalten.
</Typography >}
          </>
        )}
      </Box>
    </Box>
  );
}

export default Image;
