// import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
// import * as jsPlumb from '@jsplumb/browser-ui';
import "./App.css";

function App() {
  const makeNewStage = () => {
    invoke('stage_creator', { id: 0 });
  }

  return (
    <div className="container">
      <button id="make_stage" onClick={makeNewStage}>Add Stage</button>
      <div id="graph"></div>
    </div>
  );
}

export default App;
