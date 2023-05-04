import { Space, Button, Row, Col, Dropdown } from 'antd'
import { EditOutlined, CopyOutlined, CloseOutlined } from '@ant-design/icons';
import { register } from "@antv/x6-react-shape";
import { invoke } from '@tauri-apps/api';

const NODE_HEIGHT = 130;
const NODE_WIDTH = 230;

function makeMenuItem(label, key, disabled, danger) {
  return { key, label, disabled, danger };
}

function makeColor(r, g, b, a = 1) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function StageNode({ node, graph }) {
  const label = node.prop('name');
  const color =
    node.prop('isOrgasm') ? makeColor(212, 95, 165) :
      node.prop('fixedLen') ? makeColor(82, 168, 85) :
        makeColor(159, 159, 159);
  const start = node.prop('isStart');

  const contextItems = [
    makeMenuItem('Edit', 'edit'),
    makeMenuItem('Clone', 'clone'),
    { type: "divider" },
    makeMenuItem('Mark as root', 'makeroot'),
    makeMenuItem('Remove connections', 'removeconnections'),
    { type: "divider" },
    makeMenuItem('Delete', 'remove', false, true),
  ];

  const onContextSelect = ({ key, keyPath, domEvent }) => {
    switch (key) {
      case 'edit':
        invoke('stage_creator', { id: node.id });
        break;
      case 'clone':
        invoke('stage_creator_from', { id: node.id });
        break;
      case 'makeroot':
        graph.emit("node:doMarkRoot");
        break;
      case 'removeconnections':
        const edges = graph.getConnectedEdges(node);
        edges.forEach(edge => edge.remove());
        break;
      case 'remove':
        node.remove();
        break;
      default:
        console.log("Invalid key selected: ", key);
        break;
    }
  }

  return (
    <Dropdown menu={{ items: contextItems, onClick: onContextSelect }} trigger={['contextMenu']}>
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
              <Button onClick={() => {
                graph.emit("node:doRemove", { node });
                // node.remove() 
              }} danger><CloseOutlined /></Button>
            </Space.Compact>
          </Col>
        </Row>
        <Row>
          <h2>{label ? label : 'Untitled'}</h2>
        </Row>
      </div>
    </Dropdown>
  );
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
