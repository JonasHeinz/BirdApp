import {
  Stack,
  Select,
  MenuItem,
  Autocomplete,
  FormControl,
  TextField,
  InputLabel,
  Chip,
  Box,
} from "@mui/material";
import { useState, useEffect } from "react";
import DataTable from "./DataTable";
import rarityData from "../../../public/rarityData";

function Filter() {
  const [species, setSpecies] = useState();
  const [speciesData, setSpeciesData] = useState([]);
  const [observationsData, setObservationsData] = useState([]);
  const [rarity, setRarity] = useState([]);

  //Observations
  useEffect(() => {
    fetch("http://localhost:8000/getObservationsSpecies/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setObservationsData(data);
      })
      .catch((error) => setError(error.message));
  }, []);


  //Species
  useEffect(() => {
    fetch("http://localhost:8000/getSpecies/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setSpeciesData(data);
      })
      .catch((error) => setError(error.message));
  }, []);

  return (
    <Stack>
      <h1>BirdApp</h1>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id="rarity-label">Seltenheit</InputLabel>
        <Select
          size="small" 
          labelId="rarity-label"
          id="rarity-select"
          multiple
          value={rarity}
          onChange={(event) => setRarity(event.target.value)}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
        
                  <Chip
                    sx={{ backgroundColor: rarityData.find((r) => r.key === value).color }}
                    key={value}
                    label={rarityData.find((r) => r.key === value).name}
                  />
                
              ))}
            </Box>
          )}
        >
          {rarityData.map((r) =>
            <MenuItem
              sx={{color: r.color}}
              key={r.key}
              value={r.key}
            >
              {r.name}
            </MenuItem>
          )}
        </Select>
      </FormControl>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
        <Autocomplete
          size="small" 
          id="species-autocomplete"
          options={speciesData || []}
          getOptionLabel={(option) => option.germanname}
          value={speciesData.find((f) => f.id === species) || null}
          onChange={(event, newValue) => {
            setSpecies(newValue ? newValue.id : "");
          }}
          renderInput={(params) => <TextField {...params} label="Spezie" variant="outlined" />}
        />
      </FormControl>
      <DataTable observations={observationsData} />
    </Stack>
  );
}

export default Filter;
