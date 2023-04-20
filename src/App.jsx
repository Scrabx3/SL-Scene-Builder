import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';
import { Graph, Shape } from '@antv/x6'
// import { register } from '@antv/x6-react-shape'

import "./App.css";

const stage_node_data = {

};

Graph.registerNode(
  'stage_node',
  {
    inherit: 'rect',
    width: 160,
    height: 90,
    markup: [
      {
        tagName: "rect",
        selector: "body"
      },
      {
        tagName: "text",
        selector: "label"
      }
    ],
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
        fill: '#fff',
        rx: 6,
        ry: 6,
      }
    },
    ports: {
      groups: {
        in: {
          position: 'left',
          attrs: {
            circle: {
              magnet: false,
              stroke: '#8f8f8f',
              r: 5,
            },
            visible: false,
          },
        },
        out: {
          position: 'right',
          attrs: {
            circle: {
              magnet: true,
              stroke: '#8f8f8f',
              r: 5,
            },
          },
        },
      },
    }, 
  },
  true
);

function App() {
  const graph_ref = useRef(null);
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    if (graph) return;
    let g = new Graph({
      container: graph_ref.current,
      panning: true,
      mousewheel: true,
      connecting: {
        allowBlank: false,
        allowEdge: false,
        allowPort: false,
        allowNode: true,
        allowLoop: true,
        allowMulti: true,
        createEdge: ({ sourceCell, sourceView, sourceMagnet }) => {
          return new Shape.Edge({
            router: {
              name: "metro",
              args: {
                startDirections: ["right"],
                endDirections: ["left"],
              },
            },
            connector: "rounded",
          });
        }
      },
    });
    setGraph(g);
  }, [graph]);

  const unlisten = listen('save_stage', (event) => {
    const stage = event.payload;
    const n = graph.addNode({
      shape: 'stage_node',
      id: stage.id,
      x: 40,
      y: 40,
      label: stage.name.length > 8 ? stage.name.substr(0, 7) + "..." : stage.name,
      ports: {
        items: [
          {
            group: 'in',
          },
          {
            group: 'out',
          },
        ],
      }, 
    });
  });

  return (
    <div className="container">
      <button id="make_stage" onClick={() => { invoke('stage_creator', { id: 0 }); }}>Add Stage</button>
      <div ref={graph_ref} id="graph"></div>
      <button id="save_graph" onClick={() => { console.log("TODO: implement"); }}>Save Scene</button>
    </div>
  );
}

export default App;
