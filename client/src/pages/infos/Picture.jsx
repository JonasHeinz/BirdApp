import React, { useState, useEffect } from "react";
import { TextField, Button, Box, Link, Typography } from "@mui/material";
import { useParams } from "react-router";

function Image() {
  const { latinName: routeLatinName } = useParams();
  const [latinName, setLatinName] = useState(routeLatinName || "");
  const [imageUrl, setImageUrl] = useState(null);
  const [summary, setSummary] = useState(null);
  const [wikiUrl, setWikiUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deName, setDeName] = useState(null);

  const fetchImageAndText = () => {
    if (!latinName.trim()) return;
    setLoading(true);

    // Bild
    fetch(`http://localhost:8000/getImage/?species=${encodeURIComponent(latinName)}`)
      .then((res) => res.json())
      .then((data) => setImageUrl(data.image_url))
      .catch((err) => {
        console.error("Fehler beim Laden des Bildes:", err);
        setImageUrl(null);
      });

    // Text
    fetch(`http://localhost:8000/getText/?species=${encodeURIComponent(latinName)}`)
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
    setLatinName(routeLatinName || "");
    fetchImageAndText();
  }, [routeLatinName]);

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      {/* <TextField
        label="Lateinischer Name"
        value={latinName}
        onChange={(e) => setLatinName(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ mr: 2 }}
      />
      <Button variant="contained" onClick={fetchImageAndText}>
        Laden
      </Button> */}

      {(deName || latinName) && (
        <Typography variant="h6" sx={{ color: "black" }}>
          {deName} {`(${latinName})`}
        </Typography>
      )}

      <Box
        sx={{ mt: 4, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 4 }}
      >
        {loading ? (
          <p>Lade...</p>
        ) : (
          <>
            {imageUrl && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img
                  src={imageUrl}
                  alt={latinName}
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
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
                      {imageUrl}
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
            {!imageUrl && !summary && <p>Keine Daten gefunden</p>}
          </>
        )}
      </Box>
    </Box>
  );
}

export default Image;
