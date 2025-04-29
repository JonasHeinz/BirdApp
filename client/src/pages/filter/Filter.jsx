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
import { getRarity, rarityData } from "../../../public/rarityData";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";

function Filter() {
  const [species, setSpecies] = useState();
  const [speciesData, setSpeciesData] = useState([]);
  const [observationsData, setObservationsData] = useState([]);
  const [rarity, setRarity] = useState([]);
  const [dateRange, setDateRange] = useState("7");

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
      <Stack direction="row" spacing={2} sx={{ m: 1 }}>
        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel id="rarity-label">Seltenheit</InputLabel>
          <Select
            size="small"
            labelId="rarity-label"
            id="rarity-select"
            multiple
            value={rarity}
            onChange={(event) => setRarity(event.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    sx={{ backgroundColor: getRarity(value).color }}
                    label={getRarity(value).name}
                  />
                ))}
              </Box>
            )}
          >
            {rarityData.map((r) => (
              <MenuItem key={r.key} value={r.key} sx={{ color: r.color }}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <ButtonGroup variant="outlined" aria-label="Zeitraum">
            {["7", "14", "30"].map((days) => (
              <Button
                key={days}
                variant={dateRange === days ? "contained" : "outlined"}
                onClick={() => setDateRange(days)}
              >
                {days} Tage
              </Button>
            ))}
          </ButtonGroup>
        </FormControl>
      </Stack>
      <DataTable observations={observationsData} />
    </Stack>
  );
}

export default Filter;
