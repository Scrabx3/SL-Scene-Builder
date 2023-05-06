import { useEffect, useState } from 'react';
import { Space, Button, Row, Dropdown, Tooltip } from 'antd'
import Icon, { EditOutlined, CopyOutlined, CloseOutlined, WarningOutlined, ArrowRightOutlined, HeartFilled } from '@ant-design/icons';
import { register } from "@antv/x6-react-shape";
import { invoke } from '@tauri-apps/api';
import './SceneNode.css'

const NODE_HEIGHT = 100;
const NODE_WIDTH = 180;

function makeMenuItem(label, key, disabled, danger) {
  return { key, label, disabled, danger };
}

function makeColor(r, g, b, a = 1) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function FixedLength(props) {
  const fixedLen_svg = () => (
    <svg viewBox="112 176 800 672" width="1em" height="1em" fill="currentColor">
      <path d="M 180 176 h -60 c -4.4 0 -8 3.6 -8 8 v 656 c 0 4.4 3.6 8 8 8 h 60 c 4.4 0 8 -3.6 8 -8 V 184 c 0 -4.4 -3.6 -8 -8 -8 z m 724 0 h -60 c -4.4 0 -8 3.6 -8 8 v 656 c 0 4.4 3.6 8 8 8 h 60 c 4.4 0 8 -3.6 8 -8 V 184 c 0 -4.4 -3.6 -8 -8 -8 z M 785.3 504.3 L 657.7 403.6 a 7.23 7.23 0 0 0 -11.7 5.7 V 476 H 238 V 548 h 407.3 v 62.8 c 0 6 7 9.4 11.7 5.7 l 127.5 -100.8 c 3.8 -2.9 3.8 -8.5 0.2 -11.4 z"/>
    </svg>
  );
  return (
    < Icon component={fixedLen_svg} {...props} />
  )
}

function StageNode({ node, graph }) {
  const [hovered, setHover] = useState(false);
  const label = node.prop('name');
  const start = node.prop('isStart');
  const navText = node.prop('navText');
  const orgasm = node.prop('isOrgasm');
  const fixedLen = node.prop('fixedLen');

  const color =
    orgasm ? makeColor(233, 192, 233, 0.9) :
      fixedLen ? makeColor(175, 235, 255, 0.9) :
        undefined;

  const contextItems = [
    makeMenuItem('Edit', 'edit'),
    makeMenuItem('Clone', 'clone'),
    { type: "divider" },
    makeMenuItem('Mark as root', 'makeroot', ),
    makeMenuItem('Remove connections', 'removeconnections'),
    { type: "divider" },
    makeMenuItem('Delete', 'remove', false, true),
  ];

  const editStage = () => {
    invoke('stage_creator', { id: node.id });
  }

  const cloneStage = () => {
    invoke('stage_creator_from', { id: node.id });
  }

  const onContextSelect = ({ key, keyPath, domEvent }) => {
    switch (key) {
      case 'edit':
        editStage();
        break;
      case 'clone':
        cloneStage();
        break;
      case 'makeroot':
        graph.emit("node:doMarkRoot", { newRoot: node });
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
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="stage-content"
        style={{
          backgroundColor: color,
          borderColor: start ? makeColor(0, 255, 0, 0.8) : undefined,
        }}>
        <Row>
          <Space className='node-attribute-icons' size={10} wrap={false}>
            {!navText ?
              <Tooltip title={'Missing navigation text'}>
                <WarningOutlined style={{ fontSize: 20, color: makeColor(255, 155, 0) }} />
              </Tooltip> : <></>}
            {start ?
              <Tooltip title={'Start Animation'}>
                <ArrowRightOutlined style={{ fontSize: 20, color: makeColor(0, 255, 0) }} />
              </Tooltip> : <></>}
            {fixedLen && !orgasm ?
              <Tooltip title={'Fixed Length'}>
                <FixedLength style={{ fontSize: 20, color: makeColor(0, 191, 255) }} />
              </Tooltip> : <></>}
            {orgasm ?
              <Tooltip title={'Orgasm Stage'}>
                <HeartFilled style={{ fontSize: 20, color: makeColor(255, 20, 147) }} />
              </Tooltip> : <></>}
          </Space>
          <div style={hovered ? {} : { display: 'none' }}>
            <Space.Compact className="node-controll-button-holder">
              <Tooltip title={'Edit'} mouseEnterDelay={0.5}>
                <Button type='text' onClick={() => { editStage() }} icon={<EditOutlined />} />
              </Tooltip>
              <Tooltip title={'Clone'} mouseEnterDelay={0.5}>
                <Button type='text' onClick={() => { cloneStage() }} icon={<CopyOutlined />} />
              </Tooltip>
              <Tooltip title={'Delete'} mouseEnterDelay={0.5}>
                <Button type='text' onClick={() => { node.remove() }} icon={<CloseOutlined style={{ color: 'red' }} />} />
              </Tooltip>
            </Space.Compact>
          </div>
        </Row>
        <Row>
          <h3>{label ?
            label
            : 'Untitled'}
          </h3>
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
