// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import App from "./App.jsx";
import {ThemeProvider} from "@/lib/ThemeContext"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider >
        <App />
    </ThemeProvider>
  </React.StrictMode>
);
