import React from "react";
import { createRoot } from "react-dom/client";
import { AccessRequests } from "./AccessRequests";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");

createRoot(root).render(
	<React.StrictMode>
		<AccessRequests />
	</React.StrictMode>,
);
