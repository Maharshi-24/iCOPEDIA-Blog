import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import "./index.css";

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>
);

// Public pages arrive prerendered (scripts/prerender.mjs), so React takes over
// the existing HTML. The admin shell and the dev server start empty.
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
