import { Space, Button, Row, Col } from 'antd'
import { EditOutlined, CopyOutlined, CloseOutlined } from '@ant-design/icons';
import { register } from "@antv/x6-react-shape";
import { invoke } from '@tauri-apps/api';

const NODE_HEIGHT = 130;
const NODE_WIDTH = 230;

function StageNode({ node, graph }) {
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
