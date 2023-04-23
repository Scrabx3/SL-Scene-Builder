import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Graph, Shape } from '@antv/x6'
import { register } from "@antv/x6-react-shape";
import { Menu } from 'antd'

import { useStartAnim } from "./util/useStartAnim";
import "./App.css";

export const COLORS = {
  default: "#FFFFFF", // default node color
  start: "#ff9d00",   // start animation
  orgasm: "#d45fa5",  // orgasm stages
  fixed: "#52a855",   // fixed length stages
};

function StageNode({ node }) {
  const label = node.prop('name');
  const color = node.prop('color');
  console.log(color);
  return (
    <div
      style={{
        color: '#000',
        width: '100%',
        height: '100%',
        textAlign: 'center',
        lineHeight: '50px',
        borderRadius: 4,
        background: color ? color : COLORS.default
      }}
    >
      {label}
    </div>
  )
}

register({
  shape: "stage_node",
  width: 160,
  height: 90,
  ports: {
    groups: {
      default: {
        position: 'right',
        markup: {
          tagName: 'circle',
          selector: 's_circle',
          attrs: {
            r: 10,
            fill: '#000fff',
            stroke: '#000',
            magnet: true,
          }
        }
      }
    }
  },
  effect: ['name', 'color'],
  component: StageNode,
});

function App() {
  const graphholder_ref = useRef(null);
  const [graph, setGraph] = useState(null);
  const [nodeContext, setNodeContext] = useState({ show: false, x: 0, y: 0, node: null, view: null });

  const [sceneName, setSceneName] = useState("");
  const [animations, setAnimations] = useState([]);
  const [stages, setStages] = useState([]);
  const [startAnim, setStartAnim] = useStartAnim(null, COLORS);

  useEffect(() => {
    if (graph) return;
    let g = new Graph({
      container: graphholder_ref.current,
      panning: true,
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
      },
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
    let nodes = graph.getNodes();
    let res = nodes.find(node => node.id === stage.id);
    if (res) {  // edited
      const node = res;
      const txt = stage.name.length > 8 ? stage.name.substr(0, 7) + "..." : stage.name;
      node.prop('name', txt);
    } else {
      const node = graph.addNode({
        shape: 'stage_node',
        id: stage.id,
        x: 40,
        y: 40,
        ports: {
          items: [{ group: 'default' },],
        },
      });
      node.on("change:position", (args) => {
        graph.getEdges().forEach(edge => {
          const edgeView = graph.findViewByCell(edge)
          edgeView.update()
        });
      });
      if (nodes.length === 0) {
        setStartAnim(node);
      }
    }
  });

  function StageNodeContextMenu({ x, y, node, view, hide }) {
    const menuRef = useRef(null);
    const items = [
      {
        label: "Edit stage",
        key: "edit"
      },
      {
        label: "clone stage",
        key: "clone"
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
      hide();
    });

    const onSelected = ({ item, key, keyPath, selectedKeys, domEvent }) => {
      console.log(view);
      switch (key) {
        case 'edit':
          invoke('stage_creator', { id: node.id });
          break;
        case 'clone':
          invoke('stage_creator_from', { id: node.id });
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
      hide();
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
    <div>
      {nodeContext.show && <StageNodeContextMenu
        x={nodeContext.x}
        y={nodeContext.y}
        node={nodeContext.node}
        view={nodeContext.view}
        hide={nodeContext.hide}
      />}

      {/* TODO: vertical menu to add stages & animations as well as display existing ones */}
      <button id="make_stage" onClick={() => { invoke('stage_creator', {}); }}>Add Stage</button>

      {/* IDEA: horizontal menu to choose between multiple active graphs */}
      <div id="graph_container">
        <div ref={graphholder_ref} id="graph"/>
      </div>

      <button id="save_graph" onClick={() => { console.log("TODO: implement"); }}>Save Scene</button>
    </div>
  );
}

export default App;
