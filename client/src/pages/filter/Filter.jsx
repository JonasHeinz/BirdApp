
import { Stack,Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useState, useEffect } from "react";
function Filter() {
const [family, setfamily] = useState()
const [familiesData, setfamiliesData] = useState([])

useEffect(() => {
    fetch("http://localhost:8000/getFamilies/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        return response.json(); // JSON-Promise zurückgeben
      })
      .then((data) => {
        console.log(data); // Hier erst die aufgelösten Daten loggen
        setfamiliesData(data);
      })
      .catch((error) => setError(error.message));
  }, []);
return(

<Stack>
    <h1>BirdApp</h1>
    <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
    <InputLabel id="families-label">Spezie</InputLabel>
    <Select
    labelId="families-label"
    id="families-select"
    value={family}
    label="Familie"

  >
    { familiesData ? familiesData.map((i)=>{
        <MenuItem value={i.id}>{i.german_name}</MenuItem>
    }):[]}
  </Select>
  </FormControl>
</Stack>)
}

export default Filter;
