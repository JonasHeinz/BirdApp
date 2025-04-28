import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Navigation from "./Navigation";

createRoot(document.getElementById("root")).render(
  <StrictMode>

    <div id="container_right">
      <Navigation></Navigation>
    </div>

  </StrictMode>
);

