import React from "react";
import ReactDOM from "react-dom/client";
import D3KnowledgeGraph from "./TreeKnowledgeGraph";
import SigmaDrilldown from "./SigmaDrilldown";
import SigmaBoy from "./sigmajs";

export default function Home() {
  // return <SigmaDrilldown />;
  return <SigmaBoy />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Home />);
