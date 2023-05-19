import React, { useState, useRef, useEffect } from "react";
import { emit, listen, once } from '@tauri-apps/api/event'
import { invoke } from "@tauri-apps/api/tauri";
import ReactDOM from "react-dom/client";
import { useImmer } from "use-immer";
import { DeleteOutlined, DownOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Input, Button, Tag, Space, Tooltip, Dropdown, Popconfirm, InputNumber, Card, Layout, Divider, Menu, Row, Col, Tabs, Select, TreeSelect } from 'antd';

import { useStringListHandler } from "./util/useStringHandler";
import { tagsSFW, tagsNSFW } from "./common/Tags"
import PositionField from "./stage/PositionField";
import "./stage.css";

const { Header, Content, Footer, Sider } = Layout;
const { TextArea } = Input;


document.addEventListener('DOMContentLoaded', async () => {
  const load = (payload) => {
    const { stage, control } = payload;
    console.log("Loading stage", payload);
    ReactDOM.createRoot(document.getElementById("root_s")).render(
      <React.StrictMode>
        <Editor
          _id={stage.id}
          _name={stage.name}
          _positions={stage.positions}
          _tags={stage.tags}
          _extra={stage.extra}
          _control={control}
        />
      </React.StrictMode>
    );
  }
  const stagestr = window.sessionStorage.getItem('origin_data');
  if (stagestr) {
    const payload = await JSON.parse(stagestr);
    load(payload);
    return;
  }
  // Send Event to backend that the dom is loaded and wait for it to send the window data
  once('on_data_received', ({ payload }) => {
    window.sessionStorage.setItem('origin_data', JSON.stringify(payload));
    load(payload);
  }).then(f => f());
  await emit('on_request_data');
});

function makePositionTab(p, i) {
  return { key: `PTab${i}`, position: p }
}

function Editor({ _id, _name, _positions, _tags, _extra, _control }) {
  // Name
  const [name, setName] = useState(_name);
  // Positions
  const [positions, updatePositions] = useImmer(() => {
    let p = _control ? _control.positions : _positions;
    return p.map((p, i) => { return makePositionTab(p, i) });
  });
  const [activePosition, setActivePosition] = useState(positions[0].key);
  const positionRefs = useRef([]);
  const positionIdx = useRef(_positions.length);
  // Tags
  const [tagTree, updateTagTree] = useImmer([
    {
      value: "tagsSFW",
      title: "SFW",
      selectable: false,
      children: tagsSFW.map(tag => {
        return {
          value: tag,
          title: tag,
        }
      }),
    },
    {
      value: "tagsNSFW",
      title: "NSFW",
      selectable: false,
      children: tagsNSFW.map(tag => {
        return {
          value: tag,
          title: tag,
        }
      }),
    },
  ]);
  const [tags, updateTags] = useImmer(_tags || []);
  const [customTag, setCustomTag] = useState('');
  // Extra
  const [fixedLen, setFixedLen] = useState(_extra.fixed_len || undefined);
  const [navText, setNavText] = useState(_extra.nav_text || undefined);
  // const [furniture, updateFurniture] = useState(_extra.furniture || {
  //   shapes: [],
  //   x: undefined,
  //   y: undefined,
  //   z: undefined,
  //   rot: undefined
  // });

  function saveAndReturn() {
    let errors = false;
    // TODO: do some checks to make sure the stage is valid
    let is_orgasm = false;
    const positions = [];
    for (const position of positionRefs.current) {
      if (!position)
        continue;

      const data = position.getData();
      if (data.extra.climax)
        is_orgasm = true;

      positions.push(data);
    }

    if (errors)
      return;

    const stage = {
      id: _id,
      name,
      positions,
      tags,
      extra: {
        fixed_len: fixedLen || 0.0,
        nav_text: navText || '',
        is_orgasm,
      },
    };
    // console.log(stage);
    invoke('stage_save_and_close', { stage });
  }

  const onPositionTabEdit = (targetKey, action) => {
    if (action === 'add') {
      invoke('make_position').then((res) => {
        const next = makePositionTab(res, positionIdx.current++);
        updatePositions(p => { p.push(next) });
        setActivePosition(next.key);
      });
    } else {
      const id = positions.findIndex(v => v.key === targetKey);
      if (activePosition === targetKey) {
        const newidx = id > 0 ? id - 1 : 1;
        setActivePosition(positions[newidx].key);
      }
      updatePositions(p => { p.splice(id, 1) });
    }
  };

  const addCustomTags = () => {
    const add = customTag.split(',');
    updateTags(prev => {
      add.forEach(tag => {
        tag = tag.trim();
        const s = tag.toLowerCase().replace(/\s+/g, '');
        if (!s || tags.find(t => t.toLowerCase().replace(/\s+/g, '') === s))
          return;
        prev.push(tag);
      });
      return prev;
    });
    // updateTagTree(prev => {
    //   const newchilds = add.map(tag => {
    //     return {
    //       label: tag,
    //       value: tag,
    //     }
    //   });
    //   let cst = prev.find(cat => cat.value === 'tagsCustom');
    //   if (!cst) {
    //     cst = {
    //       value: "tagsCustom",
    //       title: "Custom",
    //       selectable: false,
    //       children: newchilds,
    //     }
    //     prev.push(cst);
    //   } else {
    //     cst.children = cst.children.concat(newchilds);
    //   }
    // })
    setCustomTag('');
  }

  return (
    <Layout>
      <Header className="stage-header">
        <Row>
          <Col>
            <Input id="stage-namefield-input" className="stage-namefield" size="large" maxLength={30} bordered={false}
              value={name} onChange={(e) => setName(e.target.value)}
              defaultValue={_name} placeholder={"Stage Name"}
              onFocus={(e) => e.target.select()}
            />
          </Col>
          <Col flex={"auto"}>
            <Menu className="stage-header-menu" theme="dark" mode="horizontal" selectable={false} defaultSelectedKeys={['save']}
              onClick={({ key }) => {
                switch (key) {
                  case 'save':
                    saveAndReturn();
                    break;
                }
              }}
              items={[
                { type: 'divider' },
                {
                  label: 'Save', key: 'save', icon: <SaveOutlined />, className: 'stage-header-menu-entry'
                }
              ]}
            />
          </Col>
        </Row>
      </Header>

      <Divider orientation="left">Positions</Divider>
      <Tabs
        type="editable-card"
        activeKey={activePosition}
        hideAdd={positions.length > 4 || !!_control}
        onEdit={onPositionTabEdit}
        onChange={(e) => { setActivePosition(e) }}
        items={
          positions.map((p, i) => {
            return {
              label: `Position ${i + 1}`,
              closable: (positions.length > 1 && !_control),
              key: p.key,
              children: (
                <div className="position">
                  <PositionField _position={p.position} _control={_control && _control.positions[i] || null} ref={(element) => { positionRefs.current[i] = element }} />
                </div>
              )
            }
          })}
      />
      <Divider orientation="left">Tags</Divider>
      <TreeSelect
        className="tag-display-field"
        size="large"
        multiple
        allowClear
        value={tags}
        onSelect={(e) => { updateTags(prev => { prev.push(e) }); }}
        onClear={() => { updateTags([]) }}
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Space.Compact style={{ width: '100%' }}>
              <Input value={customTag} onChange={(e) => setCustomTag(e.target.value)} placeholder="Custom Tag A, Custom Tag B" onPressEnter={addCustomTags} />
              <Button
                type="primary"
                onClick={addCustomTags}
              >
                Add
              </Button>
            </Space.Compact>
          </>
        )}
        maxTagTextLength={20}
        tagRender={({ label, value, closable, onClose }) => {
          let color = tagsSFW.includes(value) ? 'cyan' :
            tagsNSFW.includes(value) ? 'volcano' :
              undefined;

          const onPreventMouseDown = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
          };
          const onCloseEx = () => {
            updateTags(prev => prev.filter(tag => tag !== value));
            onClose();
          };
          return (
            <Tag
              color={color}
              onMouseDown={onPreventMouseDown}
              closable={closable}
              onClose={onCloseEx}
              style={{ margin: 2 }}
            >
              {label}
            </Tag>
          );
        }}
        treeData={tagTree}
        treeExpandAction={'click'}
      />

      <Divider orientation="left">Extra</Divider>
      <Space wrap align='start'>
        <Card title={"Navigation"}
          extra={<Tooltip title={'A short text for the player to read when given the option to branch into this stage.'}><Button type="link">Info</Button></Tooltip>}
        >
          <TextArea className="extra-navinfo-textarea" maxLength={100} showCount rows={3} style={{ resize: 'none' }}
            defaultValue={_extra.navText}
            value={navText} onChange={(e) => setNavText(e.target.value)}
          ></TextArea>
        </Card>
        <Card title={"Fixed Duration"}
          extra={<Tooltip title={'Duration of an animation that should only play once (does not loop).'}><Button type="link">Info</Button></Tooltip>}
        >
          <Space direction="vertical">
            <InputNumber className="extra-duration-input" controls precision={0} step={10}
              defaultValue={_extra.fixedLen} min={0}
              value={fixedLen} onChange={(e) => setFixedLen(e)}
              placeholder="0"
              addonAfter={'ms'}
            />
          </Space>
        </Card>
        <Card title={'TODO: Furniture'}>
          <TreeSelect placeholder={'Furniture Type'} treeData={[]} />
          <Row gutter={[12, 12]}>
            <Col span={12}>
              <InputNumber addonBefore={'X'} controls decimalSeparator="," precision={1} step={0.1}
                placeholder="0.0"
              />
            </Col>
            <Col span={12}>
              <InputNumber addonBefore={'Y'} controls decimalSeparator="," precision={1} step={0.1}
                placeholder="0.0"
              />
            </Col>
            <Col span={12}>
              <InputNumber addonBefore={'Z'} controls decimalSeparator="," precision={1} step={0.1}
                placeholder="0.0"
              />
            </Col>
            <Col span={12}>
              <InputNumber addonBefore={'°'} controls decimalSeparator="," precision={1} step={0.1} min={0.0} max={359.9}
                placeholder="0.0"
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </Layout>
  )
}

export default Editor;
