import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LucProvider } from "@luc/ui";
import { App } from "./app";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LucProvider defaultTheme="dark">
      <App />
    </LucProvider>
  </StrictMode>,
);
