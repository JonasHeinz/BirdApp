import {
  Stack,
  Autocomplete,
  FormControl,
  TextField,
  Checkbox,
  Button,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import SelectionTable from "./SelectionTable";
import AddIcon from "@mui/icons-material/Add";
//Verwenden von  virtualisierten Listen für bessere Performance
import ListboxComponent from "./ListComponent";

// Filter-Komponente: ermöglicht die Auswahl und das Hinzufügen von Vogelarten und -familien
function Filter({ birds, setBirds, setFamilies, families }) {
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [availableSpecies, setAvailableSpecies] = useState([]);
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [availableFamilies, setAvailableFamilies] = useState([]);

  // Fügt ausgewählte Arten der Vogel-Liste hinzu (ohne Duplikate)
  const handleAddBirds = () => {
    const newBirds = selectedSpecies.filter((s) => !birds.some((b) => b.speciesid === s.speciesid));
    const updatedBirds = [...birds, ...newBirds];
    setBirds(updatedBirds);
    setSelectedSpecies([]);
  };
  // Fügt Familien der Liste hinzu und ermittelt passende Arten zu diesen Familien
  const handleAddFamilies = () => {
    // Neue Familien, die noch nicht in der Liste sind
    const newFamilies = selectedFamilies.filter((s) => !families.some((b) => b.fam === s.id));
    const updatedFamilies = [...families, ...newFamilies];
    setFamilies(updatedFamilies);
    setSelectedFamilies([]);

    // Neue Arten anhand der ausgewählten Familien finden:
    const selectedFamilyIds = selectedFamilies.map((fam) => fam.id);
    const birdsFromFamilies = availableSpecies.filter((species) =>
      selectedFamilyIds.includes(species.family_id)
    );

    // Nur neue Arten hinzufügen, die noch nicht in der Liste sind:
    const newBirds = birdsFromFamilies.filter(
      (s) => !birds.some((b) => b.speciesid === s.speciesid)
    );
    const updatedBirds = [...birds, ...newBirds];
    setBirds(updatedBirds);
  };

  // Vogelarten vom Server laden
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
      });
  }, []);

  // Vogelfamilien vom Server laden
  useEffect(() => {
    fetch("http://localhost:8000/getFamilies/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setAvailableFamilies(data);
      });
  }, []);

  return (
    <Stack spacing={2} sx={{ padding: 1 }}>
      <Typography variant="h6">Vögel der Karte hinzufügen:</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl sx={{ flex: 1 }}>
          <Autocomplete
            ListboxComponent={ListboxComponent}
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
              <TextField {...params} variant="outlined" label="Vogelarten auswählen" />
            )}
          />
        </FormControl>
        <Button
          onClick={handleAddBirds}
          disabled={selectedSpecies.length === 0}
          color="primary"
          variant="contained" // kein Hintergrund, nur Icon
          sx={{ minWidth: 0, padding: 1, backgroundColor: "#2e7d32" }} // kompakt wie IconButton
        >
          <AddIcon />
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl sx={{ flex: 1 }}>
          <Autocomplete
            ListboxComponent={ListboxComponent}
            multiple
            disableCloseOnSelect
            options={availableFamilies}
            getOptionLabel={(option) => `${option.latin_name}`}
            value={selectedFamilies}
            onChange={(event, newValue) => setSelectedFamilies(newValue)}
            renderOption={(props, option, { selected }) => {
              const { key, ...restProps } = props;
              return (
                <li key={option.id} {...restProps}>
                  <Checkbox sx={{ mr: 1 }} checked={selected} />
                  {option.latin_name}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Vogelfamilie auswählen"
                placeholder="z. B. Gaviidae"
              />
            )}
          />
        </FormControl>

        <Button
          onClick={handleAddFamilies}
          disabled={selectedFamilies.length === 0}
          color="primary"
          variant="contained" // kein Hintergrund, nur Icon
          sx={{ minWidth: 0, padding: 1, backgroundColor: "#2e7d32" }} // kompakt wie IconButton
        >
          <AddIcon />
        </Button>
      </Stack>

      <SelectionTable birds={birds} setBirds={setBirds} />
    </Stack>
  );
}

export default Filter;
