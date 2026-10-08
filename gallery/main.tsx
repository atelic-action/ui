import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/styles/base.css";
import "../src/styles/chrome.css";
import "../src/styles/components.css";
import "../src/styles/primitives.css";
import "../src/styles/gate.css";
import "./gallery.css";
import { Gallery } from "./Gallery";

const root = document.getElementById("root");
if (!root) throw new Error("The gallery needs a #root element to mount into.");

createRoot(root).render(
	<StrictMode>
		<Gallery />
	</StrictMode>,
);
