import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import ReactDOM from "react-dom/client";
import { useImmer } from "use-immer";
import { invoke } from "@tauri-apps/api/tauri";
import { DeleteOutlined, PlusOutlined, DownOutlined, SaveOutlined } from '@ant-design/icons';
import { Input, Button, Tag, Space, Tooltip, Dropdown, Popconfirm, InputNumber, Card, Switch, Layout, Divider, Menu, Row, Col, Tabs, Collapse, Select } from 'antd';

import { useStringListHandler } from "./util/useStringHandler";
import { tagsExclusive, tagsNSFW, tagsSFW } from "./common/Tags"
import { raceKeys } from "./common/RaceKeys";
import PositionField from "./stage/PositionField";
import "./defaultstyle.css";
import "./App.css"
import "./stage.css";

const { Header, Content, Footer, Sider } = Layout;
const { Panel } = Collapse;
const { TextArea } = Input;

document.addEventListener('DOMContentLoaded', async (event) => {
  let stage = await invoke('get_stage');
  console.log("Loading stage", stage);
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
      {/* <br />
      <br />
      <blockquote>---</blockquote>
      <br />
      <br />
      <Stage
        stage={stage}
      /> */}
    </React.StrictMode>
  );
});

function makePositionTab(p, i) {
  return { key: `PTab${i}`, position: p }
}

function Editor({ _id, _name, _positions, _tags, _extra, _constraints }) {
  const [name, setName] = useState(_name);
  // COMEBACK: Split the positions data from this state
  const [positions, updatePositions] = useImmer(_positions.map((p, i) => { return makePositionTab(p, i) }));
  const positionRefs = useRef([]);
  const [activePosition, setActivePosition] = useState(positions[0].key);
  const positionIdx = useRef(_positions.length);
  const [tags, updateTags] = useStringListHandler(_tags, tagsExclusive);
  const [fixedLen, setFixedLen] = useState(_extra.fixedLen);
  const [isOrgasm, setIsOrgasm] = useState(_extra.isOrgasm);
  const [navText, setNavText] = useState(_extra.navText);

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
      console.log("Removing tag", removedTag);
      const newTags = tags.filter((tag) => tag !== removedTag);
      console.log(newTags);
      updateTags(newTags);
    }

    return (
      <div id="stage_tags">
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
                <Input className="tagInputField" ref={tagInputRef} key={tag} size="small"
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
              <Tag className="tagField" key={tag} closable onClose={() => handleDelete(tag)} color={c}>
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

  // TODO: implement
  function saveAndReturn() {
    const makeExtra = (tag, v) => {
      return { tag, v };
    }

    const stage = {
      id: _id,
      name,
      positions,  // !IMPORTANT TODO: retrieve data from ref hooks here. Position state no longer updates its data
      tags,
      extra: [
        makeExtra('fixedLen', String(fixedLen || 0)),
        makeExtra('isOrgasm', String(isOrgasm || false)),
        makeExtra('navText', navText || ''),
      ]
    };
    console.log(stage);
    // invoke('save_stage', { stage });
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
              items={[
                {
                  type: 'divider'
                },
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
                label: String(i + 1),
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
        <Row>
          <Col>
            <Space size={'large'}>
              <TagMenu tags={tagsNSFW} label={"NSFW"} />
              <TagMenu tags={tagsSFW} label={"SFW"} />
              <TagMenu tags={tagsExclusive} label={"Exclusive"} />
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder="Tag A, Tag B" />
                <Button type="primary">Add</Button>
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
        <Space>
          <Card className="extra-duration extra-card" title={"Duration"}
            extra={<Tooltip title={<><p>Fixed duration of the stage</p><p>Useful for animations that should only play once.</p></>}><Button type="link">Info</Button></Tooltip>}
          >
            <InputNumber className="extra-duration-input" controls decimalSeparator="," precision={1} step={0.1}
              defaultValue={_extra.fixedLen} min={0.0}
              value={fixedLen} onChange={(e) => setFixedLen(e ? e.value : undefined)}
              placeholder="0.0">
            </InputNumber>
            <Space align="center" size={"middle"}>
              <p>Orgasm Stage? </p>
              <Switch checked={isOrgasm} onChange={(checked, e) => setIsOrgasm(!isOrgasm)} />
            </Space>
          </Card>
          <Card className="extra-navinfo extra-card" title={"Navigation"}
            extra={<Tooltip title={'A short text for the player to read when given the option to branch into this stage.'}><Button type="link">Info</Button></Tooltip>}
          >
            <TextArea maxLength={100} showCount rows={3} style={{ resize: 'none' }}
              defaultValue={_extra.navText}
              value={navText} onChange={(e) => setNavText(e.target.value)}
            ></TextArea>
          </Card>
        </Space>
    </Layout>
  )
}

function Stage({ stage }) {
  const [name, setName] = useState(stage.name);
  const [positions, updatePositions] = useImmer(stage.positions);
  const [tags, setTags] = useState(stage.tags);
  const [extra, updateExtra] = useImmer(stage.extra);

  function PositionData({ i }) {
    const [isHidden, setIsHidden] = useState(true);
    const data = positions[i];

    const toggleVisibility = () => {
      setIsHidden(!isHidden);
    };

    const updateList = (list, name) => {
      let ret = [...list];
      const w = ret.indexOf(name);
      if (w === -1) {
        ret.push(name);
      } else {
        ret.splice(w, 1);
      }
      return ret;
    }

    const isHuman = () => {
      return positions[i].race === "Human";
    }

    function Sex({ label, name, disable }) {
      if (!name) name = label;
      return (
        <label>
          <input type="checkbox"
            onChange={() => { updatePositions(prev => { prev[i].genders = updateList(data.genders, name) }); }}
            checked={data.genders.indexOf(name) > -1}
            disabled={disable} />{label}
        </label>
      )
    }
    function Extra({ label, name, disable }) {
      if (!name) name = label;
      return (
        <label>
          <input type="checkbox"
            onChange={() => { updatePositions(prev => { prev[i].extra = updateList(data.extra, name) }); }}
            checked={positions[i].extra.indexOf(name) > -1}
            disabled={disable} />{label}
        </label>
      )
    }
    function Offset({ label, name, min, max }) {
      return (
        <label>{label}
          <input type="number" step="0.1" min={min} max={max}
            placeholder={"0.0"}
            defaultValue={data.offset[name] ? data.offset[name] : undefined}
            onBlur={(evt) => {
              let value = evt.target.value
              if (!value)
                return;
              let offset = parseFloat(value).toFixed(1);
              if (min != undefined) offset = Math.max(min, offset);
              if (max != undefined) offset = Math.min(offset, max);
              updatePositions(prev => { prev[i].offset[name] = offset });
            }}
            onFocus={(evt) => { evt.target.select(); }}
          />
        </label>
      )
    }

    return (
      <>
        <div className="row">
          <h2>Base</h2>
          <div className="base">
            <fieldset>
              <label>
                Animation:{' '}
                <input
                  type="text"
                  name="animation"
                  placeholder="behavior.hkx"
                  onBlur={(evt) => {
                    let value = evt.target.value;
                    if (value) {
                      if (value === '.hkx') value = '';
                      else if (!value.endsWith('.hkx')) value += '.hkx';
                    }
                    updatePositions(prev => { prev[i].event = value; });
                    evt.target.value = value;
                  }}
                  onFocus={(evt) => {
                    if (!evt.target.value.length <= 4) return;
                    evt.target.setSelectionRange(0, evt.target.value.length - 4);
                  }}
                  defaultValue={data.event}
                />
              </label>
            </fieldset>
            <fieldset>
              <label>
                Race:
                <select
                  onChange={(evt) => {
                    updatePositions(prev => { prev[i].race = evt.target.value; });
                  }}
                  value={data.race}
                >
                  {raceKeys.map((race) => (
                    <option key={race}>{race}</option>
                  ))}
                </select>
              </label>
            </fieldset>
            <fieldset>
              <Sex label={'Male'} disable={false} />
              <Sex label={'Female'} disable={false} />
              <Sex label={'Hermaphrodite'} name={'Futa'} disable={!isHuman()} />
            </fieldset>
          </div>
        </div>

        <div className="row">
          {/* added the onClick to toggle vis is hidden to swap the text */}
          <h3 onClick={toggleVisibility}>{isHidden ? '+ Extra' : '- Extra'}</h3>
          <div className="extra">
            <div hidden={isHidden}>
              <fieldset>
                <Extra label={'Victim'} disable={false} />
                <Extra label={'Vampire'} disable={!isHuman()} />
                <Extra label={'Dead'} disable={false} />
              </fieldset>
              <fieldset>
                <Extra label={'Optional'} disable={false} />
              </fieldset>
              <fieldset>
                <h3>Offset</h3>
                <Offset label={'X: '} name={'x'} />
                <Offset label={'Y: '} name={'y'} />
                <Offset label={'Z: '} name={'z'} />
                <Offset label={'Angle: '} name={'angle'} min={0.0} max={360.0} />
              </fieldset>
            </div>
          </div>
        </div>
      </>
    );
  }

  function ExtraNumber({ label, tag, args }) {
    const instanceIdx = extra.findIndex(value => value.tag === tag);
    let instance = instanceIdx === -1 ? { tag: tag, v: 0.0 } : { ...extra[instanceIdx] }
    return (
      <label>{label}
        <input type="number" step={args.step} min={args.min} max={args.max}
          placeholder={args.placeholder}
          defaultValue={instance.v ? instance.v : undefined}
          onFocus={(evt) => { evt.target.select(); }}
          onBlur={(evt) => {
            instance.v = parseFloat(evt.target.value).toFixed(1);
            updateExtra(extra => {
              const idx = extra.findIndex(value => value.tag === tag);
              idx === -1 ? extra.push(instance) : extra[idx] = instance
            });
          }}
        />
      </label>
    )
  }

  function addPosition() {
    invoke('make_position').then((s) => {
      updatePositions(p => { p.push(s) });
    });
  };

  function removePosition(evt) {
    const parent = evt.target.parentElement;
    const id = parseInt(parent.getAttribute('index'));
    updatePositions(p => { p.splice(id, 1) });
  };

  function addTags(str) {
    const hasTag = (search) => {
      const s = search.toLowerCase();
      return tags.find(t => t.toLowerCase() === s);
    }
    let newtags = [...tags];
    let list = str.split(',');
    list.forEach(tag => {
      tag.replace(/\s+/g, '');
      if (!tag || hasTag(tag))
        return;

      if (tagsExclusive.includes(tag)) {
        newtags = newtags.filter(t => !tagsExclusive.includes(t));
      }
      newtags.push(tag);
    });
    newtags.sort();
    setTags(newtags);
  }

  async function saveAndReturn() {
    if (!positions.length) {
      alert("A stage requires at least one position");
      return;
    }
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      if (!p.event) {
        // alert(`Position ${i} is missing a behavior file`);
        // return;
      }
    }
    if (!tags.length) {
      // let result = await confirm("It is highly recommended that a stage has at least one tag.\nAre you sure you want to continue?");
      // if (!result) {
      //   return;
      // }
    }

    // const extra = extra.filter(e => e.v != 0).map(e => parseFloat(e.v) );
    // console.log(extra);

    const ret = {
      id: stage.id,
      name: name,
      positions: positions,
      tags: tags,
      extra: extra.filter(e => e.v != 0)
    };
    console.log(ret);
    invoke('save_stage', { stage: ret });
  }

  return (
    <div>
      <div id="stage_holder">
        <span>
          Stage
        </span>
        <input
          type="text"
          placeholder="Stage Name"
          onFocus={(evt) => {
            evt.target.select();
          }}
          onChange={(evt) => {
            setName(evt.target.value);
          }}
          defaultValue={name ? name : undefined}
        />
      </div>

      <div id="positions">
        {positions.map((pos, i) => (
          <div key={i} index={i} className="position">
            <PositionData i={i} />
            <button onClick={removePosition}>Remove</button>
          </div>
        ))}
        <button
          id="add_position"
          onClick={addPosition}
          disabled={positions.length >= 4}
        >
          Add Position
        </button>
      </div>

      <div id="tags">
        <h3>Tags</h3>
        <label>
          Default Tags:
          <select
            id="default_tags"
            onChange={(evt) => {
              addTags(evt.target.value);
            }}
          >
            <option disabled>--- Exclusive ---</option>
            {tagsExclusive.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
            <option disabled>--- SFW ---</option>
            {tagsSFW.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
            <option disabled>--- NSFW ---</option>
            {tagsNSFW.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
          </select>
        </label>
        <label>
          Add custom tag:
          <input
            type="text"
            placeholder="Tag A, Tag B"
            onKeyDown={(evt) => {
              if (evt.key === 'Enter') {
                addTags(evt.target.value);
                evt.target.value = '';
              }
            }}
          />
        </label>
        <label>
          Current tags:
          <div id="stage_tags">
            {tags.map((t, i) => (
              <div
                key={t}
                onClick={() => {
                  let list = [...tags];
                  list.splice(i, 1);
                  setTags(list);
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </label>
        <button
          id="clear_tags"
          onClick={() => {
            if (tags.length)
              window.confirm('Clearing all tags, all you sure?').then((r) => {
                if (r) setTags([]);
              });
          }}
        >
          Clear Tags
        </button>
      </div>

      <div id="extra">
        <h3>Extra</h3>
        <ExtraNumber
          label={'Fixed Duration: '}
          tag={'FixedDur'}
          args={{ min: 0.0, step: 0.1, placeholder: '0.0' }}
        />
      </div>

      <button id="save_stage" onClick={saveAndReturn}>
        Save Stage
      </button>
    </div>
  );
}

export default Stage;
