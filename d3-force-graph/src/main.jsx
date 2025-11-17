import React from "react";
import ReactDOM from "react-dom/client";
import D3KnowledgeGraph from "./TreeKnowledgeGraph";
import SigmaBoy from "./sigmajs";

export default function Home() {
  return <D3KnowledgeGraph />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Home />);
