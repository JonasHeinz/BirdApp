import React from "react";
import {
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TableContainer,
  Paper,
  Chip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router";
import { getRarity } from "../../../public/rarityData";

/**
 * BirdTable-Komponente
 * Zeigt eine Tabelle aller beobachteten Vögel mit Name, Seltenheit und Aktionen
 * @param {Array} birds - Liste der beobachteten Vögel
 * @param {Function} setBirds - Setter zum Aktualisieren/Löschen von Einträgen
 */
export default function BirdTable({ birds, setBirds }) {
  const navigate = useNavigate();
  // Löscht einen einzelnen Vogel anhand seiner speciesid
  const handleDelete = (id) => {
    setBirds(birds.filter((b) => b.speciesid !== id));
  };
  // Löscht alle Vogelbeobachtungen
  const handleDeleteAll = () => {
    setBirds([]);
  };

  return (
    <Paper sx={{ height: "100%", overflow: "hidden", backgroundColor: "#eaeaea" }}>
      <TableContainer sx={{ maxHeight: "70vh" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: "#629165" }}>
                <b>Vogelart</b>
              </TableCell>
              <TableCell sx={{ backgroundColor: "#629165" }}>
                <b>Seltenheit</b>
              </TableCell>
              <TableCell align="right" sx={{ backgroundColor: "#629165" }}>
                <b>Alle Löschen:</b>
                <IconButton
                  onClick={() => handleDeleteAll()}
                  sx={{ padding: 0, color: "error.main" }}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {birds.map((bird) => (
              <TableRow key={bird.speciesid}>
                <TableCell>
                  {" "}
                  <IconButton
                    sx={{ padding: 0, paddingRight: 2, color: "black" }}
                    aria-label="Mehr Infos"
                    onClick={() => navigate(`/image/${encodeURIComponent(bird.latinname)}`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  {bird.germanname}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    sx={{ backgroundColor: getRarity(bird.rarity).color }}
                    label={getRarity(bird.rarity).name}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleDelete(bird.speciesid)}
                    sx={{ padding: 0, color: "error.main" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
