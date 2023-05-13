import React, { useState, useRef, useEffect } from "react";
import { emit, listen, once } from '@tauri-apps/api/event'
import { invoke } from "@tauri-apps/api/tauri";
import ReactDOM from "react-dom/client";
import { useImmer } from "use-immer";
import { DeleteOutlined, DownOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Input, Button, Tag, Space, Tooltip, Dropdown, Popconfirm, InputNumber, Card, Layout, Divider, Menu, Row, Col, Tabs, Select, TreeSelect } from 'antd';

import { useStringListHandler } from "./util/useStringHandler";
import { tagsExclusive, tagsNSFW, tagsSFW } from "./common/Tags"
import PositionField from "./stage/PositionField";
import "./stage.css";

const { Header, Content, Footer, Sider } = Layout;
const { TextArea } = Input;


document.addEventListener('DOMContentLoaded', async () => {
  const load = (stage) => {
    ReactDOM.createRoot(document.getElementById("root_s")).render(
      <React.StrictMode>
        <Editor
          _id={stage.id}
          _name={stage.name}
          _positions={stage.positions}
          _tags={stage.tags}
          _extra={stage.extra}
          _constraints={null} // TODO: constraints to ensure a new stage submits to scene parameters its made for
        />
      </React.StrictMode>
    );
  }
  const stagestr = window.sessionStorage.getItem('stage_origin');
  if (stagestr) {
    const stage = await JSON.parse(stagestr);
    console.log("Loading stage", stage);
    load(stage);
    return;
  }
  // Send Event to backend that the dom is loaded and wait for it to send the window data
  once('on_data_received', (event) => {
    const stage = event.payload;
    console.log("Storing stage", stage);
    window.sessionStorage.setItem('stage_origin', JSON.stringify(stage));
    load(stage);
  }).then(f => f());
  await emit('on_request_data');
});

function makePositionTab(p, i) {
  return { key: `PTab${i}`, position: p }
}

function Editor({ _id, _name, _positions, _tags, _extra, _constraints }) {
  // Name
  const [name, setName] = useState(_name);
  // Positions
  const [positions, updatePositions] = useImmer(_positions.map((p, i) => { return makePositionTab(p, i) }));
  const [activePosition, setActivePosition] = useState(positions[0].key);
  const positionRefs = useRef([]);
  const positionIdx = useRef(_positions.length);
  // Tags
  const [tags, updateTags] = useStringListHandler(_tags, tagsExclusive);
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

  function TagMenu({ tags, label }) {
    return (
      <Dropdown menu={{ items: tags.map((tag) => { return { label: tag, key: tag } }), onClick: ({ key }) => { updateTags(key) } }}>
        <a onClick={(e) => e.preventDefault()}>
          <Button>
            {label}
            <DownOutlined />
          </Button>
        </a>
      </Dropdown>
    )
  }

  function TagField() {
    const tagInputRef = useRef(null);
    // Edit an existing tags
    const [editIndex, setEditIndex] = useState(-1);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
      tagInputRef.current?.focus();
    }, [editValue]);

    // Impl
    const getColor = (colorTag) => {
      if (tagsExclusive.indexOf(colorTag) > -1) {
        return 'purple';
      }
      if (tagsSFW.indexOf(colorTag) > -1) {
        return 'cyan';
      }
      if (tagsNSFW.indexOf(colorTag) > -1) {
        return 'volcano';
      }
      return '';
    }

    const handleDelete = (removedTag) => {
      const newTags = tags.filter((tag) => tag !== removedTag);
      updateTags(newTags);
    }

    return (
      <div className="tag-display-field">
        <Space size={[0, 8]} wrap>
          {tags.map((tag, i) => {
            if (i === editIndex) {
              const handleEditConfirm = (e) => {
                let newtags = [...tags];
                if (editValue === "") {
                  newtags.splice(editIndex, 1);
                } else {
                  newtags[editIndex] = editValue;
                }
                updateTags(newtags);
                setEditValue('');
                setEditIndex(-1);
              }
              return (
                <Input className="stage-tag-input" ref={tagInputRef} key={tag} size="small"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleEditConfirm}
                  onPressEnter={handleEditConfirm}
                />
              );
            }
            const isLongTag = tag.length > 20;
            const c = getColor(tag);
            const tagElem = (
              <Tag className="stage-tag" key={tag} closable onClose={() => handleDelete(tag)} color={c}>
                <span onDoubleClick={(e) => {
                  if (c) return;
                  e.preventDefault();
                  setEditValue(tag);
                  setEditIndex(i);
                }}>
                  {isLongTag ? `${tag.slice(0, 20)}...` : tag}
                </span>
              </Tag>
            );
            return isLongTag ? (<Tooltip title={tag} key={tag}>{tagElem}</Tooltip>) : (tagElem)
          })}
        </Space>
      </div>
    );
  }

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
      }
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
        hideAdd={positions.length > 4}
        onEdit={onPositionTabEdit}
        onChange={(e) => { setActivePosition(e) }}
        items={
          positions.map((p, i) => {
            return {
              label: `Position ${i + 1}`,
              closable: positions.length > 1,
              key: p.key,
              children: (
                <div className="position">
                  <PositionField position={p.position} ref={(element) => { positionRefs.current[i] = element }} />
                </div>
              )
            }
          })}
      />

      <Divider orientation="left">Tags</Divider>
      <Row className="tag-header-row">
        <Col>
          <Space size={'middle'}>
            <TagMenu tags={tagsNSFW} label={"NSFW"} />
            <TagMenu tags={tagsSFW} label={"SFW"} />
            {/* <TagMenu tags={tagsExclusive} label={"Exclusive"} /> */}
            <Space.Compact style={{ width: '100%' }}>
              <Input id="tagCustomInput" placeholder="Tag A, Tag B" />
              <Button
                type="primary"
                onClick={(e) => { updateTags(document.getElementById('tagCustomInput').value) }}
              >
                Add
              </Button>
            </Space.Compact>
          </Space>
        </Col>
        <Col flex={"auto"}>
          <Popconfirm
            title="Clear tags"
            description="Are you sure you want to delete ALL tags?"
            placement="bottomLeft"
            onConfirm={() => { updateTags([]) }}
          >
            <Button type="dashed" icon={<DeleteOutlined />}
              disabled={tags.length === 0}
              style={{ float: 'right' }}>
              Clear
            </Button>
          </Popconfirm>
        </Col>
      </Row>
      <TagField />

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
        {/* <Card title={'Furniture'}>
          <TreeSelect placeholder={'Furniture'} treeData={[]} />
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
        </Card> */}
      </Space>
    </Layout>
  )
}

export default Editor;
