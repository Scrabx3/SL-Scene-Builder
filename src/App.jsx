import { useState, useEffect, useRef } from "react";
import { useImmer } from "use-immer";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Graph, Shape } from '@antv/x6'
import { History } from "@antv/x6-plugin-history";
import { Selection } from "@antv/x6-plugin-selection";
import { Menu, Layout, Card, Input, Space, Button, Empty, Modal, Tooltip, notification, Divider, Switch } from 'antd'
import {
  ExperimentOutlined, FolderOutlined, PlusOutlined, ExclamationCircleOutlined, QuestionCircleOutlined, DiffOutlined, ZoomInOutlined, ZoomOutOutlined,
  DeleteOutlined, DoubleLeftOutlined, DoubleRightOutlined, PicCenterOutlined, CompressOutlined, PushpinOutlined, DragOutlined
} from '@ant-design/icons';
const { Header, Content, Footer, Sider } = Layout;
const { confirm } = Modal;

import { STAGE_EDGE, STAGE_EDGE_SHAPEID } from "./scene/SceneEdge"
import "./scene/SceneNode"
import "./App.css";

function idIsNil(id) {
  // not ideal but ids here are always formatted as hex strings so this should suffice
  return id === '00000000-0000-0000-0000-000000000000';
}

function makeMenuItem(label, key, icon, children, disabled, danger) {
  return { key, icon, children, label, disabled, danger };
}

const ZOOM_OPTIONS = { minScale: 0.25, maxScale: 5 };

function App() {
  const [collapsed, setCollapsed] = useState(false);  // Sider collapsed?
  const [api, contextHolder] = notification.useNotification();
  const graphcontainer_ref = useRef(null);
  const [graph, setGraph] = useState(null);

  const [scenes, updateScenes] = useImmer([]);
  const [activeScene, updateActiveScene] = useImmer(null);
  const [edited, setEdited] = useState(0);
  const inEdit = useRef(0);

  useEffect(() => {
    const newGraph = new Graph({
      container: graphcontainer_ref.current,
      // grid: true,
      panning: true,
      autoResize: true,
      mousewheel: {
        enabled: true,
        minScale: ZOOM_OPTIONS.minScale,
        maxScale: ZOOM_OPTIONS.maxScale,
        // modifiers: ['ctrl']
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
        },
        // validateConnection(args) {
        //   console.log("validateConnection", args);
        // },
        validateEdge(args, arg2) {
          console.log("validateEdge", args);
          console.log("validateEdge", arg2);
        }
      }
    })
      .zoomTo(1.0)
      .use(new History({
        enabled: true,
      }))
      .use(new Selection({
        enabled: true,
        showNodeSelectionBox: true,
        multiple: true,
        movable: true,
        rubberband: true,
        modifiers: ['ctrl']
      }));
    setGraph(newGraph);
  }, []);

  useEffect(() => {
    if (!graph) {
      return;
    }
    // NOTE: gotta reload window every time this prints after the 1st one
    console.log("use Graph effect");
    // Removed & added events will fire multiple times when the active scene is switched
    graph.on("node:removed", ({ node }) => {
      if (inEdit.current) {
        return;
      }
      updateActiveScene(prev => {
        if (prev.start_animation === node.id) {
          prev.start_animation = null;
        }
      })
      setEdited(true);
    });
    graph.on("node:added", (evt) => {
      if (inEdit.current) {
        return;
      }
      setEdited(true);
    });
    graph.on("node:moved", ({e, x, y, node, view}) => {
      const box = node.getBBox();
      const views = graph.findViewsInArea(box);
      views.forEach(it => {
        if (!it.isEdgeView()) {
          return;
        }
        it.update();
      });
      // setEdited(true);
    });
    // Edge remove event also fires for invalid edges
    graph.on("edge:contextmenu", ({ e, x, y, edge, view }) => {
      e.stopPropagation();
      edge.remove();
      setEdited(true);
    });
    graph.on("edge:connected", (e) => {
      setEdited(true);
    });
    graph.on("node:doMarkRoot", ({ newRoot }) => {
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
        newRoot.prop('isStart', true);
        prev.start_animation = newRoot.id;
      });
      setEdited(true);
    });
  }, [graph]);

  const clearGraph = () => {
    confirm({
      title: 'Clear Graph',
      icon: <QuestionCircleOutlined />,
      content: 'This will remove all nodes and edges from the current scene. Do you want to continue?',
      onOk() {
        graph.clearCells();
        setEdited(true);
      }
    })
  }

  const setActiveScene = async (newscene) => {
    if (!inEdit.current && edited > 0) {
      confirm({
        title: 'Unsaved changes',
        icon: <ExclamationCircleOutlined />,
        content: `Are you sure you want to continue? Unsaved changes will be lost.`,
        okText: 'Continue without saving',
        onOk() {
          inEdit.current = true;
          setActiveScene(newscene);
        },
        onCancel() { },
      });
      return;
    }
    inEdit.current = true;
    graph.clearCells();
    updateActiveScene(newscene);
    for (const [key, { x, y }] of Object.entries(newscene.graph)) {
      try {
        const stage = await invoke('get_stage_by_id', { id: key })
        const node = addStageToGraph(stage, x, y);
        updateNodeProps(stage, node, newscene);
      } catch (error) {
        console.log(error);
      }
    }
    const nodes = graph.getNodes();
    for (const [sourceid, { edges }] of Object.entries(newscene.graph)) {
      const sourceNode = nodes.find(node => node.id === sourceid);
      if (!sourceNode) continue;
      const sourcePort = sourceNode.ports.items[0];
      edges.forEach(targetid => {
        const target = nodes.find(node => node.id === targetid);
        if (!target) return;
        graph.addEdge({
          shape: STAGE_EDGE_SHAPEID,
          source: {
            cell: sourceNode,
            port: sourcePort.id
          },
          target,
        });
      });
    }
    inEdit.current = false;
    graph.centerContent();
    setEdited(false);
  }

  // Callback after stage has been saved in other window
  listen('save_stage', (event) => {
    const stage = event.payload;
    const nodes = graph.getNodes();
    let node = nodes.find(node => node.id === stage.id);
    if (!node)
      node = addStageToGraph(stage);
    updateNodeProps(stage, node, activeScene);
  });

  const addStageToGraph = (stage, x = 40, y = 40) => {
    const node = graph.addNode({
      shape: 'stage_node',
      id: stage.id,
      x,
      y,
    });
    return node;
  }

  const updateNodeProps = (stage, node, belongingScene) => {
    node.prop('name', stage.name);
    node.prop('isOrgasm', stage.extra.is_orgasm);
    node.prop('fixedLen', stage.extra.fixed_len);
    node.prop('navText', stage.extra.nav_text);
    node.prop('isStart', belongingScene && belongingScene.start_animation === stage.id);
  }

  const saveScene = () => {
    let doSave = true;
    if (!activeScene.name) {
      api['error']({
        message: 'Missing Name',
        description: 'Add a short, descriptive name to your scene.',
        placement: 'bottomLeft',
        onClick(evt) {
          const elm = document.getElementById('stageNameInputField');
          elm.focus();
        }
      });
      doSave = false;
    }
    const nodes = graph.getNodes();
    const startNode = nodes.find(node => node.id === activeScene.start_animation);
    if (!startNode) {
      api['error']({
        message: 'Missing Start Animation',
        description: 'Choose the stage which is starting the animation.',
        placement: 'bottomLeft'
      });
      doSave = false;
    } else {
      const dfsGraph = graph.getSuccessors(startNode);
      if (dfsGraph.length + 1 < nodes.length) {
        api['warning']({
          message: 'Unreachable Stages',
          description: 'Scene contains stages which cannot be reached from the start animation',
          placement: 'bottomLeft'
        });
      }
    }

    if (!doSave) {
      return;
    }
    const scene = {
      ...activeScene,
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
      setEdited(false);
    });
  }

  const sideBarMenu = [
    makeMenuItem('New Scene', 'add', <PlusOutlined />),
    { type: 'divider' },
    makeMenuItem('Scenes', 'animations', <FolderOutlined />,
      scenes.map((scene) => {
        return makeMenuItem(
          <Tooltip title={scene.name} mouseEnterDelay={0.5}>
            {scene.name}
          </Tooltip>, scene.id, <ExperimentOutlined />, [
          makeMenuItem("Edit", "editanim_" + scene.id),
          makeMenuItem("Delete", "delanim_" + scene.id, null, null, false, true),
        ]);
      })
    )
  ];

  const onSiderSelect = async ({ key }) => {
    const idx = key.lastIndexOf("_");
    const option = idx == -1 ? key : key.substring(0, idx);
    const id = key.substring(idx + 1);
    const scene = scenes.find(scene => scene.id === id);
    switch (option) {
      case 'add':
        const new_anim = await invoke('blank_animation');
        setActiveScene(new_anim);
        break;
      case 'editanim':
        setActiveScene(scene);
        break;
      case 'delanim':
        {
          confirm({
            title: 'Deleting Scene',
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to delete the scene '${scene.name}'?\n\nThis action cannot be undone.`,
            onOk() {
              try {
                invoke('delete_animation', { id });
                updateScenes(prev => prev.filter(scene => scene.id !== id));
                if (activeScene && activeScene.id === id) {
                  updateActiveScene(null);
                  setEdited(false);
                }
              } catch (error) {
                console.log(error);
              }
            },
            onCancel() { },
          });
          break;
        }
      default:
        console.log("Unrecognized option %s", option);
        break;
    }
  }

  return (
    <Layout hasSider>
      {contextHolder}
      <Sider className="main-sider" collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu theme="dark" mode="inline" selectable={false} items={sideBarMenu} onClick={onSiderSelect} />
      </Sider>
      <Layout className="site-layout">
        <Content>
          {/* Hyper hacky workaround because graph doesnt render nodes if I put the graph interface into a child component zzz */}
          {/* if (activeScene) ... */}
          <div style={{ display: !activeScene ? 'none' : undefined, height: '100%', width: '100%' }}>
            <Card
              className="graph-editor-field"
              title={activeScene ?
                <Space.Compact style={{width: '100%'}}>
                  <div style={edited < 1 ? { display: 'none' } : {}}>
                    <Tooltip title={'Unsaved changes'}>
                      <DiffOutlined />
                    </Tooltip>
                  </div>
                  <Input size="large" maxLength={30} bordered={false} id="stageNameInputField"
                    value={activeScene.name} onChange={(e) => { updateActiveScene(prev => { prev.name = e.target.value }); setEdited(true); }}
                    onFocus={(e) => e.target.select()}
                    placeholder="Scene Name"
                  />
                </Space.Compact> : <></>}
              extra={
                <Space.Compact block>
                  <Button onClick={() => { invoke('stage_creator', {}); }}>Add Stage</Button>
                  <Button onClick={saveScene} type="primary">Save</Button>
                </Space.Compact>}
              bodyStyle={{ height: 'calc(100% - 55px)' }}
            >
              <div className="graph-toolbox">
                <Space size={'small'} align='center' style={{ float: 'right' }}>
                  <Tooltip title='Undo' mouseEnterDelay={0.5}>
                    <Button type='text' size='small' icon={<DoubleLeftOutlined />} onClick={() => { if (graph.canUndo()) graph.undo() }} />
                  </Tooltip>
                  <Tooltip title='Redo' mouseEnterDelay={0.5}>
                    <Button type='text' size='small' icon={<DoubleRightOutlined />} onClick={() => { if (graph.canRedo()) graph.redo() }} />
                  </Tooltip>
                  <Divider type="vertical" />
                  <Tooltip title='Center content' mouseEnterDelay={0.5}>
                    <Button type='text' size='small' icon={<CompressOutlined />} onClick={() => graph.centerContent()} />
                  </Tooltip>
                  <Tooltip title='Fit to screen' mouseEnterDelay={0.5}>
                    <Button type='text' size='small' icon={<PicCenterOutlined />} onClick={() => graph.zoomToFit()} />
                  </Tooltip>
                  <Tooltip title='Lock canvas' mouseEnterDelay={0.5}>
                    <Switch size="small" checkedChildren={<PushpinOutlined />} unCheckedChildren={<DragOutlined />} onChange={(checked) => { graph.togglePanning(!checked) }} />
                  </Tooltip>
                  <Divider type="vertical" />
                  <Tooltip title='Zoom out' mouseEnterDelay={0.5}>
                    <Button type='text' size='small' icon={<ZoomOutOutlined />} onClick={() => { graph.zoomTo(graph.zoom() * 0.8, ZOOM_OPTIONS) }} />
                  </Tooltip>
                  <Tooltip title='Zoom in' mouseEnterDelay={0.5}>
                    <Button type='text' size='small' icon={<ZoomInOutlined />} onClick={() => { graph.zoomTo(graph.zoom() * 1.2, ZOOM_OPTIONS) }} />
                  </Tooltip>
                  <Divider type="vertical" />
                  <Tooltip title='Clear canvas' mouseEnterDelay={0.5}>
                    <Button type='text' size='small' danger icon={<DeleteOutlined />} disabled={!graph || !graph.getNodes().length} onClick={clearGraph} />
                  </Tooltip>
                </Space>
              </div>
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
