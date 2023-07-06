import { useState, useEffect, useRef } from "react";
import { useImmer } from "use-immer";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Graph, Shape } from '@antv/x6'
import { History } from "@antv/x6-plugin-history";
import { Menu, Layout, Card, Input, Space, Button, Empty, Modal, Tooltip, notification, Divider, Switch, Checkbox, Row, Col, InputNumber, Select } from 'antd'
import {
  ExperimentOutlined, FolderOutlined, PlusOutlined, ExclamationCircleOutlined, QuestionCircleOutlined, DiffOutlined, ZoomInOutlined, ZoomOutOutlined,
  DeleteOutlined, DoubleLeftOutlined, DoubleRightOutlined, PicCenterOutlined, CompressOutlined, PushpinOutlined, DragOutlined
} from '@ant-design/icons';
const { Header, Content, Footer, Sider } = Layout;
const { confirm } = Modal;

import { STAGE_EDGE, STAGE_EDGE_SHAPEID } from "./scene/SceneEdge"
import { Furnitures } from "./common/Furniture";
import "./scene/SceneNode"
import "./App.css";

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
      grid: {
        visible: true,
        size: 10,
        type: 'doubleMesh',
        args: [
          {
            thickness: 1,
            color: '#eee'
          },
          {
            color: 'rgba(33, 35, 48, 0.1)',
            thickness: 3,
            factor: 5
          }
        ]
      },
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
        validateEdge({ edge, type, previous }) {
          const source = this.getCellById(edge.source.cell);
          if (source.prop('fixedLen')) {
            const edges = this.getOutgoingEdges(source);
            edges.forEach(it => {
              if (it.id !== edge.id)
                it.remove();
            });
          }
          return true;
        }
      }
    })
      .zoomTo(1.0)
      .use(new History({
        enabled: true,
      }));

    newGraph
      // Node Events
      .on("node:removed", ({ node }) => {
        if (inEdit.current) return;
        updateActiveScene(prev => {
          if (prev.root === node.id) {
            prev.root = null;
          }
          prev.stages = prev.stages.filter(it => it.id !== node.id);
        })
        setEdited(true);
      })
      .on("node:added", (evt) => {
        if (inEdit.current) return;
        setEdited(true);
      })
      .on("node:moved", ({ e, x, y, node, view }) => {
        const box = node.getBBox();
        const views = newGraph.findViewsInArea(box);
        views.forEach(it => {
          if (!it.isEdgeView()) {
            return;
          }
          it.update();
        });
        setEdited(true);
      })
      // Edge Events
      .on("edge:contextmenu", ({ e, x, y, edge, view }) => {
        e.stopPropagation();
        edge.remove();
        setEdited(true);
      })
      .on("edge:connected", (e) => {
        setEdited(true);
      })
      // Custom Events
      .on("node:doMarkRoot", ({ node }) => {
        updateActiveScene(prev => {
          const cell = newGraph.getCellById(prev.root);
          if (cell) { cell.prop('isStart', false); }
          node.prop('isStart', true);
          prev.root = node.id;
        });
        setEdited(true);
      })
      .on("node:clone", ({ node }) => {
        invoke('open_stage_editor_from', { control: node.prop('stage') });
      })

    setGraph(newGraph);
    return () => {
      newGraph.clearCells();
      newGraph.clearGrid();
      newGraph.clearBackground();
      newGraph.disposePlugins();
    }
  }, []);

  useEffect(() => {
    if (!graph) return;

    const editStage = (node) => {
      let stage = node.prop('stage');
      console.assert(activeScene.stages.findIndex(it => it.id === stage.id) > -1, "Editing stage that does not belong to active scene: ", stage, activeScene);
      let control = activeScene.stages.length === 1 ? null : stage;
      invoke('open_stage_editor', { stage, control });
    }

    graph
      .on('node:dblclick', ({ node }) => {
        editStage(node);
      })
      .on("node:edit", ({ node }) => {
        editStage(node);
      })
    return () => {
      graph.off('node:dblclick');
      graph.off('node:edit');
    }
  }, [graph, activeScene])

  useEffect(() => {
    // Callback after stage has been saved in other window
    const unlisten = listen('on_stage_saved', (event) => {
      const stage = event.payload;
      console.log("Saving new stage", stage);
      const nodes = graph.getNodes();
      let node = nodes.find(node => node.id === stage.id);
      if (!node) node = addStageToGraph(stage);
      updateNodeProps(stage, node, activeScene);
      if (node.prop('fixedLen')) {
        const edges = graph.getOutgoingEdges(node);
        for (let i = 1; i < edges.length; i++) {
          const element = edges[i];
          element.remove();
        }
      }
      updateActiveScene(prev => {
        let idx = prev.stages ? prev.stages.findIndex(it => it.id === stage.id) : -1;
        if (idx === -1) {
          prev.stages.push(stage)
          if (prev.stages.length === 1) {
            node.prop('isStart', true);
            prev.root = stage.id;
          }
        } else {
          prev.stages[idx] = stage;
        }
      });
      setEdited(true);
    });
    return () => {
      unlisten.then(res => { res() });
    }
  }, [graph, activeScene])

  useEffect(() => {
    if (!graph) return;
    const unlisten = listen('on_project_update', (event) => {
      const stage_map = event.payload;
      const scns = [];
      for (const key in stage_map) {
        if (Object.hasOwnProperty.call(stage_map, key)) {
          const element = stage_map[key];
          scns.push(element);
        }
      }
      console.log("Opening new Project with Scenes: ", scns);
      updateScenes(scns);
      setEdited(false);
      if (scns.length) {
        setActiveScene(scns[0]);
      } else {
        updateActiveScene(null);
      }
    });
    invoke('request_project_update');
    return () => {
      unlisten.then(res => { res() });
    }
  }, [graph])

  const clearGraph = () => {
    if (graph.getCellCount() == 0)
      return;

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
      const stage = newscene.stages.find(stage => stage.id === key);
      const node = addStageToGraph(stage, x, y);
      updateNodeProps(stage, node, newscene);
    }
    const nodes = graph.getNodes();
    for (const [sourceid, { dest }] of Object.entries(newscene.graph)) {
      if (!dest.length) continue;
      const sourceNode = nodes.find(node => node.id === sourceid);
      if (!sourceNode) continue;
      const sourcePort = sourceNode.ports.items[0];
      dest.forEach(targetid => {
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
    node.prop('stage', stage);
    node.prop('fixedLen', stage.extra.fixed_len);
    node.prop('isStart', belongingScene && belongingScene.root === stage.id);
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
    const startNode = nodes.find(node => node.id === activeScene.root);
    if (!startNode) {
      api['error']({
        message: 'Missing Start Animation',
        description: 'Choose the stage which the scene is supposed to start at.',
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

    if (!doSave || !edited) {
      return;
    }
    // api['success']({
    //   message: 'Saved Scene',
    //   description: `Scene ${activeScene.name} has successfully been saved.`,
    //   placement: 'bottomLeft'
    // });
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
            dest: value,
            x: position.x,
            y: position.y,
          };
        });
        return ret;
      }()
    };
    invoke('save_scene', { scene }).then(() => {
      console.log("Saved scene", scene);
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
      console.log("Saved Scene", scene);
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
        const new_anim = await invoke('create_blank_scene');
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
                invoke('delete_scene', { id });
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
          {/* hacky workaround because graph doesnt render nodes if I put the graph interface into a child component zzz */}
          {/* if (activeScene) ... */}
          <div style={{ display: !activeScene ? 'none' : undefined, height: '100%', width: '100%' }}>
            <Card
              className="graph-editor-field"
              title={activeScene ?
                <Space.Compact style={{ width: '100%' }}>
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
                  <Button onClick={() => { invoke('open_stage_editor', { control: activeScene.stages[0] }); }}>Add Stage</Button>
                  <Button onClick={saveScene} type="primary">Store</Button>
                </Space.Compact>}
              bodyStyle={{ height: 'calc(100% - 55px)' }}
            >
              <div className="graph-toolbox">
                <Space className="graph-toolbox-content" size={'small'} align='center'>
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
                    <Button type='text' size='small' danger icon={<DeleteOutlined />} onClick={clearGraph} />
                  </Tooltip>
                </Space>
              </div>
              <div className="graph-container">
                <div id="graph" ref={graphcontainer_ref} />
              </div>
              <div className="graph-data-field">
                <Space size={"large"}>
                  <Space direction="vertical" size={"large"}>
                    <Select
                      className="graph-furniture-selection"
                      value={activeScene ? activeScene.furniture.furni_types : []}
                      options={Furnitures}
                      mode="multiple"
                      onSelect={(value) => {
                        if (value === "None") {
                          updateActiveScene(prev => { prev.furniture.furni_types = [value]; return prev });
                        } else {
                          updateActiveScene(prev => {
                            let where = prev.furniture.furni_types.indexOf("None")
                            console.log(prev.furniture.furni_types)
                            if (where === -1)
                              prev.furniture.furni_types.push(value)
                            else
                              prev.furniture.furni_types[where] = value
                            
                            return prev;
                          });
                        }
                        setEdited(true);
                      }}
                      onDeselect={(value) => {
                        updateActiveScene(prev => {
                          prev.furniture.furni_types = prev.furniture.furni_types.filter(it => it !== value);
                          if (prev.furniture.furni_types.length === 0) {
                            prev.furniture.furni_types = ["None"]
                          }
                          return prev;
                        });
                        setEdited(true);
                      }}
                    />
                    <Checkbox
                      onChange={(e) => { updateActiveScene(prev => { prev.furniture.allow_bed = e.target.checked }); setEdited(true); }}
                      checked={activeScene ? activeScene.furniture.allow_bed : false}
                    >
                      Allow Bed
                    </Checkbox>
                  </Space>
                  <Space>
                    <Row gutter={[12, 12]} justify={"space-evenly"}>
                      <Col>
                        <InputNumber addonBefore={'X'} controls decimalSeparator="," precision={1} step={0.1}
                          value={activeScene ? activeScene.furniture.offset.x ? activeScene.furniture.offset.x : undefined : undefined}
                          onChange={(e) => { updateActiveScene(prev => { prev.furniture.offset.x = e }); setEdited(true); }}
                          placeholder="0.0"
                        />
                      </Col>
                      <Col>
                        <InputNumber addonBefore={'Y'} controls decimalSeparator="," precision={1} step={0.1}
                          value={activeScene ? activeScene.furniture.offset.y ? activeScene.furniture.offset.y : undefined : undefined}
                          onChange={(e) => { updateActiveScene(prev => { prev.furniture.offset.y = e }); setEdited(true); }}
                          placeholder="0.0"
                        />
                      </Col>
                      <Col>
                        <InputNumber addonBefore={'Z'} controls decimalSeparator="," precision={1} step={0.1}
                          value={activeScene ? activeScene.furniture.offset.z ? activeScene.furniture.offset.z : undefined : undefined}
                          onChange={(e) => { updateActiveScene(prev => { prev.furniture.offset.z = e }); setEdited(true); }}
                          placeholder="0.0"
                        />
                      </Col>
                      <Col>
                        <InputNumber addonBefore={'°'} controls decimalSeparator="," precision={1} step={0.1} min={0.0} max={359.9}
                          value={activeScene ? activeScene.furniture.offset.rot ? activeScene.furniture.offset.rot : undefined : undefined}
                          onChange={(e) => { updateActiveScene(prev => { prev.furniture.offset.rot = e }); setEdited(true); }}
                          placeholder="0.0"
                        />
                      </Col>
                    </Row>
                  </Space>
                </Space>
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
