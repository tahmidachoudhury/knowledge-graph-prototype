import React from "react";
import ReactDOM from "react-dom/client";
import TreeKnowledgeGraph from "./TreeKnowledgeGraph";
import SigmaBoy from "./sigmajs";

export default function Home() {
  return <SigmaBoy />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Home />);
