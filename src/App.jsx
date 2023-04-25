import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Graph, Shape } from '@antv/x6'
import { register } from "@antv/x6-react-shape";
import { Menu, Layout } from 'antd'
// import {  DesktopOutlined,  FileOutlined,  PieChartOutlined,  TeamOutlined,  UserOutlined,} from '@ant-design/icons';
import { ExperimentOutlined, FolderOutlined, PlusOutlined, PlusSquareOutlined, PlaySquareOutlined } from '@ant-design/icons';

import { useStartAnim } from "./util/useStartAnim";
import "./App.css";

const { Header, Content, Footer, Sider } = Layout;

const COLORS = {
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
  const [collapsed, setCollapsed] = useState(false);
  const [activeAnim, setActiveAnim] = useState(null);

  const graphholder_ref = useRef(null);
  const [graph, setGraph] = useState(null);
  const [nodeContext, setNodeContext] = useState({ show: false, x: 0, y: 0, node: null, view: null });
  const [startAnim, setStartAnim] = useStartAnim(null, COLORS);

  const [sceneName, setSceneName] = useState("");
  const [animations, setAnimations] = useState([]);
  const [stages, setStages] = useState([]);

  useEffect(() => {
    if (graph) return;
    let g = new Graph({
      container: graphholder_ref.current,
      panning: true,
      autoResize: true,
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

  const makeSidebar = () => {
    const makeItem = (label, key, icon, children, disabled) => {
      return { key, icon, children, label, disabled };
    }
    return [
      makeItem('Add Animation', 'add', <PlusOutlined />),
      makeItem('Animations', 'animations', <FolderOutlined />,
        animations.map((v, i) =>
          makeItem(v.name, i, <ExperimentOutlined />, [
            makeItem("Edit", "editanim"),
            makeItem("Delete", "delanim"),
          ])
        )
      ),
      makeItem('Stages', 'stages', <FolderOutlined />,
        stages.map((v, i) =>
          makeItem(v.name, i, <PlaySquareOutlined />, [
            makeItem("Add to animation", "addanim", null, null, activeAnim),
            { type: 'divider' },
            makeItem("Edit", "editstage", null, null, activeAnim),
            makeItem("Clone", "copystage", null, null, activeAnim),
            makeItem("Delete", "delstage", null, null, activeAnim),
          ])
        )
      ),
    ];
  }

  return (
    <Layout hasSider>
      {nodeContext.show && <StageNodeContextMenu
        x={nodeContext.x}
        y={nodeContext.y}
        node={nodeContext.node}
        view={nodeContext.view}
        hide={nodeContext.hide}
      />}

      <Sider className="main-sider" collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={makeSidebar()} />
      </Sider>
      <Layout className="site-layout">
        {/* IDEA: horizontal menu to choose between multiple active graphs */}
        <Header style={{ padding: 0 }} />
        <button id="make_stage" onClick={() => { invoke('stage_creator', {}); }}>Add Stage</button>
        <div id="graph_container">
          <div ref={graphholder_ref} id="graph" />
        </div>
        <button id="save_graph" onClick={() => { console.log("TODO: implement"); }}>Save Scene</button>
        {/* <Footer style={{ textAlign: 'center' }}>Ant Design ©2023 Created by Ant UED</Footer>  */}
      </Layout>
    </Layout>
  );
}

export default App;
