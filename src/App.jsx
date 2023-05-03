import { useState, useEffect, useRef } from "react";
import { useImmer } from "use-immer";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Graph, Shape } from '@antv/x6'
import { register } from "@antv/x6-react-shape";
import { Menu, Layout, Card, Input, Space, Button, Empty, Row, Col } from 'antd'
import { ExperimentOutlined, FolderOutlined, PlusOutlined, EditOutlined, CopyOutlined, CloseOutlined } from '@ant-design/icons';
import "./App.css";

const { Header, Content, Footer, Sider } = Layout;
const NODE_HEIGHT = 130;
const NODE_WIDTH = 230;
const STAGE_EDGE = {
  router: {
    name: "metro",
    args: {
      padding: 20,
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
}

function idIsNil(id) {
  // not ideal but ids here are always formatted as hex strings so this should suffice
  return id === '00000000-0000-0000-0000-000000000000';
}

Graph.registerEdge(
  'stage_edge',
  STAGE_EDGE,
  true
);

function StageNode({ node }) {
  const makeColor = (r, g, b, a = 1) => {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const label = node.prop('name');
  const color =
    node.prop('isOrgasm') ? makeColor(212, 95, 165) :
      node.prop('fixedLen') ? makeColor(82, 168, 85) :
        makeColor(159, 159, 159);
  const start = node.prop('isStart');

  return (
    <div 
      className="stage-node-content"
      style={{
        backgroundColor: color,
        borderColor: start ? makeColor(255, 0, 0) : undefined,
      }}>
      <Row>
        <Col flex={'auto'}>
          <Space.Compact size="small" className="stage-node-content-control-buttons">
            <Button onClick={() => { invoke('stage_creator', { id: node.id }) }}><EditOutlined /></Button>
            <Button onClick={() => { invoke('stage_creator_from', { id: node.id }) }}><CopyOutlined /></Button>
            <Button onClick={() => { node.remove() }} danger><CloseOutlined /></Button>
          </Space.Compact>
        </Col>
      </Row>
      <Row>
        <h2>{label ? label : 'Untitled'}</h2>
      </Row>
    </div>
  )
}

register({
  shape: "stage_node",
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  ports: {
    groups: {
      default: {
        markup: [
          {
            tagName: 'rect',
            selector: 'portBodySide'
          },
        ],
        attrs: {
          portBodySide: {
            width: 10,
            height: NODE_HEIGHT - 50,
            strokeWidth: 2,
            stroke: '#222431',
            fill: '#EFF4FF',
            magnet: true,
          },
        },
        position: {
          name: 'right',
          args: {
            dy: - NODE_HEIGHT / 2 + 30,
            dx: - 5
          }
        }
      },
    },
    items: [
      {
        group: 'default',
      },
    ]
  },
  effect: [
    'name',
    'isOrgasm',
    'fixedLen',
    'isStart',
  ],
  component: StageNode,
});

function App() {
  const [collapsed, setCollapsed] = useState(false);  // Sider collapsed?
  const [nodeContext, setNodeContext] = useState({ show: false, x: 0, y: 0, node: null });
  const graphcontainer_ref = useRef(null);
  const [graph, setGraph] = useState(null);

  const [scenes, updateScenes] = useImmer([]);
  const [activeScene, updateActiveScene] = useImmer(null)

  function StageNodeContextMenu({ x, y, node, hide }) {
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
      switch (key) {
        case 'edit':
          invoke('stage_creator', { id: node.id });
          break;
        case 'clone':
          invoke('stage_creator_from', { id: node.id });
          break;
        case 'makeroot':
          updateStartAnimation(node);
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
          console.log("Unrecognized input %s", key);
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
          top: `${y}px`,
          left: `${x}px`,
        }}
        theme="light"
        mode="vertical"
        items={items}
      />
    );
  }

  useEffect(() => {
    if (graph) return;
    let g = new Graph({
      container: graphcontainer_ref.current,
      grid: true,
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
        createEdge() {
          return new Shape.Edge(STAGE_EDGE);
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
    g.zoom(-0.2)
    setGraph(g);
  }, [graph]);

  const setActiveScene = async (newscene) => {
    if (activeScene && newscene.id === activeScene.id) {
      updateActiveScene(newscene);
      return;
    }

    const nodebyid = (id) => {
      const nodes = graph.getNodes();
      for (const node of nodes) {
        if (node.id === id)
          return node;
      }
      return undefined;
    }
    graph.clearCells();
    updateActiveScene(newscene);
    for (const [key, {x, y}] of Object.entries(newscene.graph)) {
      try {
        const root = await invoke('get_stage_by_id', { id: key })
        addStageToGraph(root, x, y);
      } catch (error) {
        console.log(error);
      }
    }
    for (const [key, { edges }] of Object.entries(newscene.graph)) {
      const sourceNode = nodebyid(key);
      if (!sourceNode) continue;
      const sourcePort = sourceNode.ports.items[0];
      edges.forEach(id => {
        const target = nodebyid(id);
        if (!target) return;
        graph.addEdge({
          shape: 'stage_edge',
          source: {
            cell: sourceNode,
            port: sourcePort.id
          },
          target,
        })
      })
    }
    graph.centerContent();
  }

  const updateStartAnimation = (newStartNode) => {
    updateActiveScene(prev => {
      if (!idIsNil(prev.start_animation)) {
        const nodes = graph.getNodes();
        for (const node of nodes) {
          if (node.id === prev.start_animation) {
            node.prop('isStart', false);
            break;
          }
        }
      }
      newStartNode.prop('isStart', true);
      prev.start_animation = newStartNode.id;
    });
  }

  const addStageToGraph = (stage, x = 40, y = 40) => {
    const node = graph.addNode({
      shape: 'stage_node',
      id: stage.id,
      x,
      y,
      data: {
        isOrgasm: stage.extra.is_orgasm,
        fixedLen: stage.extra.fixed_len,
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

  listen('save_stage', (event) => {
    const stage = event.payload;
    const nodes = graph.getNodes();
    const hasNode = nodes.find(node => node.id === stage.id);
    if (hasNode) {
      hasNode.prop('name', stage.name);
      hasNode.prop('isOrgasm', stage.extra.is_orgasm);
      hasNode.prop('fixedLen', stage.extra.fixed_len);
    } else {
      const node = addStageToGraph(stage)
      if (activeScene && idIsNil(activeScene.start_animation)) {
        updateStartAnimation(node)
      }
    }
  });

  const saveScene = () => {
    const scene = {...activeScene,
      graph: function () {
        const nodes = graph.getNodes();
        let ret = {};
        nodes.forEach(node => {
          const position = node.getPosition();
          const edges = graph.getOutgoingEdges(node);
          const value = edges ? edges.map(e => e.getTargetCellId()) : [];
          ret[node.id] = {
            edges: value,
            x: position.x,
            y: position.y,
          };
        });
        return ret;
      }()
    };
    invoke('save_animation', { animation: scene }).then((scene) => {
      updateActiveScene(scene);
      updateScenes(prev => { 
        const w = prev.findIndex(it => it.id === scene.id);
        if (w === -1) {
          prev.push(scene);
        } else {
          prev[w] = scene;
        }
      });
    });
  }

  const makeSidebarMenu = () => {
    const makeItem = (label, key, icon, children, disabled, danger) => {
      return { key, icon, children, label, disabled, danger };
    }
    return [
      makeItem('New Scene', 'add', <PlusOutlined />),
      { type: 'divider' },
      makeItem('Scenes', 'animations', <FolderOutlined />,
        scenes.map((scene) =>
          makeItem(scene.name, scene.id, <ExperimentOutlined />, [
            makeItem("Edit", "editanim_" + scene.id),
            makeItem("Delete", "delanim_" + scene.id, null, null, false, true),
          ])
        )
      )
    ];
  }

  const onSiderSelect = async ({ key }) => {
    const idx = key.lastIndexOf("_");
    const k = idx == -1 ? key : key.substring(0, idx);
    switch (k) {
      case 'add':
        const new_anim = await invoke('blank_animation');
        setActiveScene(new_anim);
        break;
      case 'editanim':
        {
          const id = key.substring(idx + 1);
          const scene = scenes.find(scene => scene.id === id);
          setActiveScene(scene);
          break;
        }
      case 'delanim':
        {
          const id = key.substring(idx + 1);
          try {
            invoke('delete_animation', { id });
            updateScenes(prev => prev.filter(scene => scene.id !== id));
            if (activeScene && activeScene.id === id) {
              updateActiveScene(null);
            }
          } catch (error) {
            console.log(error);
          }
        }
      default:
        break;
    }
  }

  return (
    <Layout hasSider>
      {nodeContext.show && <StageNodeContextMenu
        x={nodeContext.x} µ
        y={nodeContext.y}
        node={nodeContext.node}
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
        <Header style={{ padding: 0 }} />
        <Content>
          {/* Hyper hacky workaround because graph doesnt render nodes if I put the graph interface into a child component zzz */}
          {/* if (activeScene) ... */}
          <div style={!activeScene ? { display: 'none' } : {}}>
            <Card
              title={activeScene ?
                <Input size="large" maxLength={30} bordered={false}
                  value={activeScene.name} onChange={(e) => updateActiveScene(prev => { prev.name = e.target.value })}
                  onFocus={(e) => e.target.select()}
                  placeholder="Scene Name"
                /> : <></>}
              extra={activeScene ?
                <Space.Compact block>
                  <Button onClick={() => { invoke('stage_creator', {}); }}>New Stage</Button>
                  <Button onClick={saveScene} type="primary">Save</Button>
                </Space.Compact> : <></>}
            >
              <div className="graph-container">
                <div id="graph" ref={graphcontainer_ref} />
              </div>
            </Card>
          </div>
          {/* else ... */}
          <Empty
            style={activeScene ? { display: 'none' } : {}}
            className="graph-no-scene-placeholder"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={"No scene loaded :("}
          >
            <Button type="primary" onClick={() => onSiderSelect({ key: 'add' })}>New Scene</Button>
          </Empty>
          {/* endif */}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
