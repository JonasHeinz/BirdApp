import React, { useState, useEffect } from "react";
import { TextField, Button, Box, Link } from "@mui/material";

function Image() {
  const [latinName, setLatinName] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchImage = () => {
    if (!latinName.trim()) return;
    setLoading(true);

    fetch(`http://localhost:8000/getImage/?species=${encodeURIComponent(latinName)}`)
      .then((res) => res.json())
      .then((data) => {
        setImageUrl(data.image_url);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden:", err);
        setImageUrl(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchImage();
  }, []);

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <TextField
        label="Lateinischer Name"
        value={latinName}
        onChange={(e) => setLatinName(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ mr: 2 }}
      />
      <Button variant="contained" onClick={fetchImage}>Bild laden</Button>

      <Box sx={{ mt: 4 }}>
        {loading ? (
          <p>Lade Bild...</p>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={latinName}
              style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover" }}
            />
            <Box sx={{ mt: 0 }}>
              <Link href={imageUrl} sx={{ fontSize: '10px' }} target="_blank" rel="noopener noreferrer">
                {imageUrl}
              </Link>
            </Box>
          </>
        ) : (
          <p>Kein Bild gefunden</p>
        )}
      </Box>
    </Box>
  );
}

export default Image;
