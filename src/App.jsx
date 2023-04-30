import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Graph, Shape } from '@antv/x6'
import { register } from "@antv/x6-react-shape";
import { Menu, Layout, Card, Input, Space, Button } from 'antd'
import { useImmer } from "use-immer";
// import {  DesktopOutlined,  FileOutlined,  PieChartOutlined,  TeamOutlined,  UserOutlined,} from '@ant-design/icons';
import { ExperimentOutlined, FolderOutlined, PlusOutlined, SaveOutlined, PlaySquareOutlined } from '@ant-design/icons';

import { useStartAnim } from "./util/useStartAnim";
import "./App.css";

const { Header, Content, Footer, Sider } = Layout;

const COLORS = {
  default: "#ccc", // default node color
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
  const [collapsed, setCollapsed] = useState(false);  // Sider collapsed?
  const graph_container = useRef(null);
  const [activeAnim, setActiveAnim] = useState(null);
  const [scenes, updateScenes] = useImmer([]);
  const [stages, updateStages] = useImmer([]);
  const [graph, setGraph] = useState(null);
  const [nodeContext, setNodeContext] = useState({ show: false, x: 0, y: 0, node: null });
  const [name, setName] = useState('Untitled');
  const [startAnim, setStartAnim] = useStartAnim(null, COLORS);

  useEffect(() => {
    if (graph) return;
    let g = new Graph({
      container: graph_container.current,
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
                stroke: "#000"
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
        hide: () => { setNodeContext({ show: false }) }
      });
    });
    setGraph(g);
  }, [graph]);


  const addStageToGraph = (stage) => {
    const node = graph.addNode({
      shape: 'stage_node',
      id: stage.id,
      x: 40,
      y: 40,
      ports: {
        items: [{ group: 'default' },],
      },
      data: {

      }
    });
    node.on("change:position", (args) => {
      graph.getEdges().forEach(edge => {
        const edgeView = graph.findViewByCell(edge)
        edgeView.update()
      });
    });
    return node;
  }

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

    document.addEventListener('mousedown', (e) => {
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
        className="node-context-menu"
        style={{
          // position: 'absolute',
          top: `${y}px`,
          left: `${x}px`,
        }}
        theme="light"
        mode="vertical"
        items={items}
      />
    );
  }

  const nodebyid = (id) => {
    for (node in graph.getNodes()) {
      if (node.id === id)
        return node;
    }
    return undefined;
  }

  const addDefaultStages = async (animation) => {
    for (const [key, value] of Object.entries(animation.graph)) {
      console.log("Adding node", key);
      try {
        const root = await invoke('get_stage_by_id', { id: key })
        addStageToGraph(root);
      } catch (error) {
        console.log(error);
      }
    }
    for (const [key, value] of Object.entries(animation.graph)) {
      const root = nodebyid(key);
      if (!root) continue;
      for (id in value) {
        const it = nodebyid(id);
        if (!it) continue;
        graph.addEdge({
          source: root,
          target: it,
        })
      }
    }
  }

  listen('save_stage', (event) => {
    const stage = event.payload;
    console.log("Saving stage", stage);
    const nodes = graph.getNodes();
    const hasNode = nodes.find(node => node.id === stage.id);
    if (hasNode) {
      const txt = stage.name.length > 8 ? stage.name.substr(0, 7) + "..." : stage.name;
      hasNode.prop('name', txt);
    } else {
      const node = addStageToGraph(stage)
      console.log(node);
      if (nodes.length === 0) {
        setStartAnim(node);
      }
      if (stages.find(it => it.id === stage.id) === undefined) {
        updateStages(prev => { prev.push(stage); });
      }
    }
  });
  const removeStage = (stage) => {
    console.log("Removing stage", stage);
    updateStages(prev => prev.filter(it => it.id !== stage.id));
  }

  const makeSidebarMenu = () => {
    const makeItem = (label, key, icon, children, disabled) => {
      return { key, icon, children, label, disabled };
    }
    return [
      makeItem('New Scene', 'add', <PlusOutlined />),
      makeItem('Save Scene', 'save', <SaveOutlined />),
      { type: 'divider' },
      makeItem('Scenes', 'animations', <FolderOutlined />,
        scenes.map((scene) =>
          makeItem(scene.name, scene.id, <ExperimentOutlined />, [
            makeItem("Edit", "editanim"),
            makeItem("Delete", "delanim"),
          ])
        )
      ),
      makeItem('Stages', 'stages', <FolderOutlined />,
        stages.map((stage) =>
          makeItem(stage.name, stage.id, <PlaySquareOutlined />, [
            makeItem("Add to scene", "addanim", null, null, activeAnim),
            { type: 'divider' },
            makeItem("Edit", "editstage", null, null, activeAnim),
            makeItem("Clone", "copystage", null, null, activeAnim),
            makeItem("Delete", "delstage", null, null, activeAnim),
          ])
        )
      ),
    ];
  }

  const onSiderSelect = async (e) => {
    const { item, key, keyPath, selectedKeys, domEvent } = e
    console.log(e);
    switch (key) {
      case 'add':
        const new_anim = await invoke('blank_animation');
        setActiveAnim(new_anim);
        break;
      default:
        break;
    }
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
        <Menu theme="dark" mode="inline" selectable={false}
          items={makeSidebarMenu()}
          onClick={onSiderSelect}
        />
      </Sider>
      <Layout className="site-layout">
        {/* IDEA: tabs to choose between multiple active graphs */}
        <Header style={{ padding: 0 }} />
        <div>
          <Card
            title={<Input size="large" maxLength={30} bordered={false}
              value={name} onChange={(e) => setName(e.target.value)}
              onFocus={(e) => e.target.select()}
            />}
            extra={
              <Space.Compact block>
                <Button onClick={() => { invoke('stage_creator', {}); }}>New Stage</Button>
                <Button onClick={() => { console.log("TODO: implement"); }} type="primary">Save</Button>
            </Space.Compact>}
          >
            <div className="graph-container">
              <div ref={graph_container} id="graph" />
            </div>
          </Card>
        </div>
        {/* <Footer style={{ textAlign: 'center' }}>Ant Design ©2023 Created by Ant UED</Footer>  */}
      </Layout>
    </Layout>
  );
}

export default App;
