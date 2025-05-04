import {
  Stack,
  Autocomplete,
  FormControl,
  TextField,
  IconButton,
  Checkbox,
} from "@mui/material";
import { useState, useEffect } from "react";
import DataTable from "./DataTable";
import { getRarity, rarityData } from "../../../public/rarityData";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import SelectionTable from "./SelectionTable";
import AddIcon from "@mui/icons-material/Add"; 

const allBirdSpecies = [
  "Amsel",
  "Buchfink",
  "Eisvogel",
  "Mauersegler",
  "Zaunkönig",
  "Rotkehlchen"
];
function Filter() {
  const [species, setSpecies] = useState();
  const [speciesData, setSpeciesData] = useState([]);
  const [observationsData, setObservationsData] = useState([]);
  const [rarity, setRarity] = useState([]);
  const [dateRange, setDateRange] = useState("7");
  const [birds, setBirds] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [error, setError] = useState(null);

  const handleAddBirds = () => {
    const newBirds = selectedSpecies.filter((s) => !birds.includes(s));
    setBirds((prev) => [...prev, ...newBirds]);
    setSelectedSpecies([]); // Reset selection
  };

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
    <Stack spacing={2} sx={{ padding: 1}}>
      {/* <FormControl variant="standard" sx={{ minWidth: 120 }}>
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
      <Stack direction="row" spacing={2} >
        <FormControl sx={{ flex: 1 }} >
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
        <FormControl >
          <ButtonGroup variant="outlined" aria-label="Zeitraum" >
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
        </FormControl> */}
      {/* </Stack> */}
      <Stack direction="row" spacing={1} alignItems="center">
      <FormControl sx={{ flex: 1 }} >
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={allBirdSpecies}
          value={selectedSpecies}
          onChange={(event, newValue) => setSelectedSpecies(newValue)}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Vogelarten auswählen"
              placeholder="z. B. Amsel"
            />
          )}
        />
      </FormControl>

     
      <IconButton
          onClick={handleAddBirds}
          disabled={selectedSpecies.length === 0}
          color="primary"
          size="medium"
          sx={{ mt: '2px' }} // optischer Ausgleich
        >
          <AddIcon />
        </IconButton>


      </Stack>
      <SelectionTable birds={birds} />
    </Stack>
  );
}

export default Filter;
