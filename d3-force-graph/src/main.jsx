import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { ThemeProvider } from "./ThemeContext";
import D3KnowledgeGraph from "./TreeKnowledgeGraph";
// import SigmaDrilldown from "./SigmaDrilldown";
import SigmaBoy from "./sigmajs";

export default function Home() {
  // return <SigmaDrilldown />;
  // return <SigmaBoy />;
  return (
    <ThemeProvider>
      <D3KnowledgeGraph />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Home />);
