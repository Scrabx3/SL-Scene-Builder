import { useState } from "react";
import * as jsPlumb from '@jsplumb/browser-ui';
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';

import "./App.css";

function App() {
  const [jsInstance, setInstance] = useState(jsPlumb.newInstance({
    container: document.getElementById('graph')
  }));
  const [nodes, setNodes] = useState([]);

  const unlisten = listen('save_stage', (event) => {
    console.log(event);
    const stage = event.payload;
    setNodes(prev => [
      ...prev,
      {

      }
    ])
  });

  return (
    <div className="container">
      <button id="make_stage" onClick={() => { invoke('stage_creator', { id: 0 }); }}>Add Stage</button>
      <div id="graph"></div>
    </div>
  );
}

export default App;
