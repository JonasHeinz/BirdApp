import { useState } from "react";
import { HashRouter, Navigate, NavLink, Route, Routes } from "react-router";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ImageIcon from "@mui/icons-material/Image";

import { Box, Drawer, List, ListItem, IconButton, Stack } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Filter from "./pages/filter/Filter";
import Image from "./pages/infos/Picture";

const drawerWidth = 60;

function Navigation({ birds, setBirds, families, setFamilies }) {
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <HashRouter>
      <Box>
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              backgroundColor: "#2e7d32",
              boxSizing: "border-box",
              transition: "width 0.3s",
            },
          }}
        >
          <Box>
            <List>
              <ListItem
                disablePadding
                component={NavLink}
                to="/filter"
                sx={{
                  "&.active": { backgroundColor: "#5c805e" },
                  justifyContent: "center",
                }}
              >
                <IconButton>
                  <FilterAltIcon />
                </IconButton>
              </ListItem>
              <ListItem
                disablePadding
                component={NavLink}
                to="/image"
                sx={{
                  "&.active": { backgroundColor: "#5c805e" },
                  justifyContent: "center",
                }}
              >
                <IconButton>
                  <ImageIcon />
                </IconButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>
        {/* Hauptinhalt */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginLeft: open ? `${drawerWidth}px` : 0,
            transition: "margin-left 0.3s",
            width: "35vw",
            height: "100%",
            padding: 1,
          }}
        >
          <Stack direction="row">
            <IconButton color="black" onClick={toggleDrawer}>
              <MenuIcon color="black" />
            </IconButton>
            <img src="LOGO.png" alt="Birdapp Logo" style={{ height: 80 }} />
          </Stack>
          <Routes>
            <Route path="/" element={<Navigate to="/filter" replace />} />
            <Route
              path="/filter"
              element={
                <Filter
                  birds={birds}
                  setBirds={setBirds}
                  families={families}
                  setFamilies={setFamilies}
                />
              }
            />
            <Route path="/image" element={<Image />} />
            <Route path="/image/:latinName" element={<Image />} />
          </Routes>
        </Box>
      </Box>
    </HashRouter>
  );
}

export default Navigation;
