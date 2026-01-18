// src/App.jsx

import React, { useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";

import MainGraph from "./components/MainGraph";
import { SubtopicLanding } from "./components/SubtopicLanding";
import { QnaDetailPanel } from "./components/QnaDetailPanel";

function MainRoute() {
  const navigate = useNavigate();

  return (
    <MainGraph
      onSubtopicClick={(subtopicId) => {
        // keep id stable in url
        navigate(`/subtopic/${encodeURIComponent(subtopicId)}`);
      }}
    />
  );
}

function SubtopicRoute() {
  const navigate = useNavigate();
  const { subtopicId } = useParams();
  const decodedId = useMemo(
    () => (subtopicId ? decodeURIComponent(subtopicId) : ""),
    [subtopicId]
  );

  const [selectedQna, setSelectedQna] = useState(null);

  if (!decodedId) return null;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", }}>
      {/* <button
        onClick={() => navigate("/")}
        className="fixed left-4 top-4 z-50 rounded bg-white px-4 py-2 text-sm font-semibold shadow"
      >
        ← Back
      </button> */}

      <SubtopicLanding
        subtopicId={decodedId}
        onQnaClick={(qna) => setSelectedQna(qna)}
      />

      <QnaDetailPanel qna={selectedQna} onClose={() => setSelectedQna(null)} />
    </div>
  );
}

export default function App() {
  console.log("App rendered");
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<MainRoute />} />
        <Route path="/subtopic/:subtopicId" element={<SubtopicRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
