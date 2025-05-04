import {
  Stack,
  Autocomplete,
  FormControl,
  TextField,
  Checkbox,
  Button,
} from "@mui/material";
import { useState, useEffect } from "react";
import SelectionTable from "./SelectionTable";
import AddIcon from "@mui/icons-material/Add";

function Filter({ birds, setBirds }) {

  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [availableSpecies, setAvailableSpecies] = useState([]);
  const [error, setError] = useState(null);

  const handleAddBirds = () => {
    const newBirds = selectedSpecies.filter((s) => !birds.some((b) => b.speciesid === s.speciesid));
    const updatedBirds = [...birds, ...newBirds];
    setBirds(updatedBirds);
    setSelectedSpecies([]);
  };

  useEffect(() => {
    fetch("http://localhost:8000/getSpecies/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setAvailableSpecies(data);
      })
      .catch((error) => setError(error.message));
  }, []);

  return (
    <Stack spacing={2} sx={{ padding: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl sx={{ flex: 1 }}>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={availableSpecies}
            getOptionLabel={(option) => `${option.germanname}`}
            value={selectedSpecies}
            onChange={(event, newValue) => setSelectedSpecies(newValue)}
            renderOption={(props, option, { selected }) => {
              const { key, ...restProps } = props;
              return (
                <li key={option.speciesid} {...restProps}>
                  <Checkbox sx={{ mr: 1 }} checked={selected} />
                  {option.germanname} ({option.latinname})
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Vogelarten auswählen"
                placeholder="z. B. Stern|taucher"
                error={Boolean(error)}
                helperText={error}
              />
            )}
          />
        </FormControl>

        <Button
          onClick={handleAddBirds}
          disabled={selectedSpecies.length === 0}
          color="primary"
          variant="contained" // kein Hintergrund, nur Icon
          sx={{ minWidth: 0, padding: 1 }} // kompakt wie IconButton
        >
          <AddIcon />
        </Button>
      </Stack>

      <SelectionTable birds={birds} setBirds={setBirds} />
    </Stack>
  );
}

export default Filter;
