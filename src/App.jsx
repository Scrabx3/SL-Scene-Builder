import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Graph, Shape } from '@antv/x6'
import { Menu } from 'antd'

import useStartAnim from "./util/StartAnimation";
import "./App.css";

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
        rx: 3,
        ry: 3,
      }
    },
    ports: {
      groups: {
        default: {
          position: 'right',
          markup: {
            tagName: 'circle',
            selector: 's_circle',
          },
          attrs: {
            s_circle: {
              r: 10,
              fill: '#000fff',
              stroke: '#000',
              magnet: true,
            }
          }
        },
      },
    }, 
    effect: ['color'],
  },
  true
);

function App() {
  const graphholder_ref = useRef(null);
  const [graph, setGraph] = useState(null);
  const [nodeContext, setNodeContext] = useState({ show: false, x: 0, y: 0, node: null, view: null });

  const [sceneName, setSceneName] = useState("");
  const [animations, setAnimations] = useState([]);
  const [stages, setStages] = useState([]);
  const [startAnim, setStartAnim] = useStartAnim(null);

  useEffect(() => {
    if (graph) return;
    let g = new Graph({
      container: graphholder_ref.current,
      panning: true,
      mousewheel: true,
      connecting: {
        allowBlank: false,
        allowMulti: false,
        allowLoop: false,
        allowEdge: false,
        allowPort: false,
        allowNode: true,
        createEdge: ({ sourceCell, sourceView, sourceMagnet }) => {
          // IDEA: different style depending on the kind of node to connect?
          return new Shape.Edge({
            router: {
              name: "metro",
              args: {
                startDirections: ["right"],
                endDirections: ["left", "top", "bottom"],
              },
            },
            connector: "rounded",
            attrs: {
              line: {
                stroke: "#fff"
              }
            }
          });
        }
      }
    });
    g.on("edge:contextmenu", ({ e, x, y, edge, view }) => {
      e.stopPropagation();
      edge.remove();
    });
    g.on("node:contextmenu", ({ e, x, y, node, view }) => {
      e.stopPropagation();
      setNodeContext({
        show: true,
        x: e.pageX,
        y: e.pageY,
        node: node,
        view: view,
        hide: () => { setNodeContext({ show: false }) }
      });
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
        items: [{ group: 'default' },],
      },
    });
    n.on("change:position" , (args) => {
      graph.getEdges().forEach(edge => {
        const edgeView = graph.findViewByCell(edge)
        edgeView.update()
      });
    });
    // if (!startAnim) updateStartAnim(n.id);
  });

  function StageNodeContextMenu({ x, y, node, view, hide }) {
    const menuRef = useRef(null);
    const items = [
      {
        label: "Edit stage",
        key: "edit"
      },
      {
        type: "divider"
      },
      {
        label: "Mark as root",
        key: "makeroot"
      },
      {
        label: "Remove connections",
        key: "removeconnections"
      },
      {
        type: "divider"
      },
      {
        label: "Remove stage",
        key: "remove",
        danger: true
      }
    ];

    document.addEventListener('click', (e) => {
      if (!menuRef.current || menuRef.current.menu.list.contains(e.target)) {
        return;
      }
      window.setTimeout(hide, 200);
    });

    const onSelected = ({ item, key, keyPath, selectedKeys, domEvent }) => {
      console.log(view);
      switch (key) {
        case 'edit':
          invoke('stage_creator', { id: node.id })
          break;
        case 'makeroot':
          setStartAnim(node);
          break;
        case 'removeconnections':
          {
            const edges = graph.getConnectedEdges(node);
            edges.forEach(edge => {
              edge.remove();
            });
          }
          break;
        case 'remove':
          node.remove();
          // IDEA: invoke some functions to kill the stage entirely (in backend) if its not referenced anywhere else
          break;
        default:
          break;
      }
      window.setTimeout(hide, 50);
    }

    return (
      <Menu
        ref={menuRef}
        onSelect={onSelected}
        id="node_context_menu"
        style={{
          top: `${y}px`,
          left: `${x}px`,
        }}
        theme="light"
        mode="vertical"
        items={items}
      />
    );
  }

  return (
    <div className="container">
      {nodeContext.show && <StageNodeContextMenu
        x={nodeContext.x}
        y={nodeContext.y}
        node={nodeContext.node}
        view={nodeContext.view}
        hide={nodeContext.hide}
      />}

      <button id="make_stage" onClick={() => { invoke('stage_creator', {}); }}>Add Stage</button> 
      <div ref={graphholder_ref} id="graph">
      </div>
      <button id="save_graph" onClick={() => { console.log("TODO: implement"); }}>Save Scene</button>
    </div>
  );
}

export default App;
