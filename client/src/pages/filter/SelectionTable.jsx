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
  Paper
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router";

export default function BirdTable({ birds, setBirds }) {
  const navigate = useNavigate();

  const handleDelete = (id) => {
    setBirds(birds.filter((b) => b.speciesid !== id));
  };

  return (
    <Paper sx={{ height: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: "70vh" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vogelart</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {birds.map((bird) => (
              <TableRow key={bird.speciesid} >
                <TableCell>{bird.germanname}</TableCell>
                <TableCell align="right">
                  <IconButton
                    sx={{ padding: 0 }}
                    aria-label="Mehr Infos"
                    onClick={() =>
                      navigate(`/image/${encodeURIComponent(bird.latinname)}`)
                    }
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(bird.speciesid)}sx={{ padding: 0 }}>
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
