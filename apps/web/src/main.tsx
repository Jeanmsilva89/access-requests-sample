import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");

createRoot(root).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
