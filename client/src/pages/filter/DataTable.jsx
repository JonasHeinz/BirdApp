import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


export default function DataTable({observations}) {
  return (
    <TableContainer component={Paper}  sx={{ borderRadius: 0 }}>
      <Table  size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell><b>Anzahl</b></TableCell>
            <TableCell><b>Name</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {observations && observations.map((row) => (
            <TableRow
              key={row.name} 
            >
                 <TableCell>{row.anzahl}</TableCell>
              <TableCell >
                {row.name}
              </TableCell>
           
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
