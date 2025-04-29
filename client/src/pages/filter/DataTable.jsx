import { useState, useMemo } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { TablePagination, TableSortLabel, Box, Chip, Checkbox } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { getRarity } from "../../../public/rarityData";
// new stuff from alex
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "@mui/material/IconButton";

export default function DataTable({ observations }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("count");
  const [selected, setSelected] = useState([]);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleRequestSort = (props) => {
    const isAsc = orderBy === props && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(props);
  };

  const sortedObservations = useMemo(() => {
    if (!observations) return [];

    return [...observations].sort((a, b) => {
      if (orderBy === "name") {
        return order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        return order === "asc" ? a.count - b.count : b.count - a.count;
      }
    });
  }, [observations, order, orderBy]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = sortedObservations.map((n) => n.name);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    // Returns the index of the first occurrence of a value in an array, or -1 if it is not present
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const headCells = [
    {
      id: "count",
      label: "Anzahl",
    },
    {
      id: "name",
      label: "Name",
    },
  ];

  return (
    <Paper>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "12px",
          backgroundColor: "#f5f7f3",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Table size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : "asc"}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                    {orderBy === headCell.id ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc" ? "sorted descending" : "sorted ascending"}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Seltenheit</TableCell>
              {/* new stuff from alex */}
              <TableCell padding="checkbox">Info</TableCell>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < sortedObservations.length}
                  checked={
                    sortedObservations.length > 0 && selected.length === sortedObservations.length
                  }
                  onChange={handleSelectAllClick}
                  inputProps={{
                    "aria-label": "select all desserts",
                  }}
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedObservations &&
              sortedObservations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  const isItemSelected = selected.includes(row.name);
                  return (
                    <TableRow key={row.name} sx={{}}>
                      <TableCell>{row.count}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          sx={{ backgroundColor: getRarity(row.rarity).color }}
                          label={getRarity(row.rarity).name}
                        />
                      </TableCell>
                      {/* new stuff from alex */}
                      <TableCell>
                        <IconButton
                          aria-label="Mehr Infos"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/search?q=${row.name}+Vogel`,
                              "_blank"
                            )
                          }
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onClick={(event) => handleClick(event, row.name)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={observations.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
