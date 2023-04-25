import React from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@tauri-apps/api/tauri";
import { DeleteOutlined, PlusOutlined, DownOutlined, SaveOutlined } from '@ant-design/icons';
import { Input, Button, Tag, Space, Tooltip, Dropdown, Popconfirm, InputNumber, Card, Switch, Layout, Divider, Menu, Row, Col } from 'antd';
import { useState, useRef, useEffect } from "react";
import { useImmer } from "use-immer";

import { useStringListHandler } from "./util/useStringHandler";
import "./defaultstyle.css";
import "./App.css"
import "./stage.css";

const { TextArea } = Input;
const { Header, Content, Footer, Sider } = Layout;

const racekeys = [
  "Human",
  "AshHoppers",
  "Bears",
  "Boars",
  "BoarsAny",
  "BoarsMounted",
  "Canines",
  "Chaurus",
  "Chaurushunters",
  "Chaurusreapers",
  "Chickens",
  "Cows",
  "Deers",
  "Dogs",
  "DragonPriests",
  "Dragons",
  "Draugrs",
  "DwarvenBallistas",
  "DwarvenCenturions",
  "DwarvenSpheres",
  "DwarvenSpiders",
  "Falmers",
  "FlameAtronach",
  "Foxes",
  "FrostAtronach",
  "Gargoyles",
  "Giants",
  "Goats",
  "Hagravens",
  "Horkers",
  "Horses",
  "IceWraiths",
  "Lurkers",
  "Mammoths",
  "Mudcrabs",
  "Netches",
  "Rabbits",
  "Rieklings",
  "Sabrecats",
  "Seekers",
  "Skeevers",
  "SlaughterFishes",
  "StormAtronach",
  "Spiders",
  "LargeSpiders",
  "GiantSpiders",
  "Spriggans",
  "Trolls",
  "VampireLords",
  "Werewolves",
  "Wispmothers",
  "Wisps",
  "Wolves"
];

const tags_exclusive = [
  "DisallowBed",
  "BedOnly",
  "Furniture"
]

const tags_sfw = [
  "Hugging",
  "Kissing",
  "Kneeling",
  "Standing",
  "Lying"
]

const tags_nsfw = [
  "69",
  "Aggressive",
  "Anal",
  "Asphyxiation",
  "Blowjob",
  "Boobjob",
  "Cowgirl",
  "Deepthroat",
  "Doggy",
  "Double Penetration",
  "Feet",
  "Femdom",
  "Footjob",
  "Forced",
  "Gay",
  "Handjob",
  "Lesbian",
  "Loving",
  "Masturbation",
  "Missionary",
  "Oral",
  "Penetration",
  "Reverse Cowgirl",
  "Spitroast",
  "Threesome",
  "Triple Penetration",
  "Vaginal"
]

const getTagMenu = (tags) => {
  return tags.map(tag => {
    return {
      label: tag,
      key: tag
    }
  });

  // const addArray = (array) => {
  //   let ret = [];
  //   array.forEach(tag => {
  //     ret.push({ label: tag, key: tag });
  //   });
  //   return ret;
  // };
  // let ret = [];
  // ret.push({
  //   label: "Exclusive Tags:",
  //   key: "exclusive",
  //   children: addArray(tags_exclusive)
  // });
  // ret.push({ type: 'divider' });
  // ret.push({
  //   label: "SFW Tags:",
  //   key: "sfw",
  //   children: addArray(tags_sfw)
  // });
  // ret.push({ type: 'divider' });
  // ret.push({
  //   label: "NSFW Tags:",
  //   key: "nsfw",
  //   children: addArray(tags_nsfw)
  // });

  // ret = ret.concat(addArray(tags_exclusive))
  // ret.push({ type: 'divider' });
  // ret = ret.concat(addArray(tags_sfw))
  // ret.push({ type: 'divider' });
  // ret = ret.concat(addArray(tags_nsfw))
  // return ret;
}

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

function Editor({ _id, _name, _positions, _tags, _extra, _constraints }) {
  const [name, setName] = useState(_name);
  const [positions, updatePositions] = useImmer(_positions);
  const [tags, updateTags] = useStringListHandler(_tags, tags_exclusive);
  const [fixedLen, setFixedLen] = useState(_extra.fixedLen);
  const [isOrgasm, setIsOrgasm] = useState(_extra.isOrgasm);
  const [navText, setNavText] = useState(_extra.navText);

  function TagMenu({ my_tags, my_label }) {
    return (
      <Dropdown menu={{ items: getTagMenu(my_tags), onClick: ({ key }) => { updateTags(key) } }}        >
        <a onClick={(e) => e.preventDefault()}>
          <Button>
            {my_label}
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

    // Create a new tag
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
      if (inputVisible) {
        tagInputRef.current?.focus();
      }
    }, [inputVisible]);

    // Impl
    const getColor = (colorTag) => {
      if (tags_exclusive.indexOf(colorTag) > -1) {
        return 'purple';
      }
      if (tags_sfw.indexOf(colorTag) > -1) {
        return 'cyan';
      }
      if (tags_nsfw.indexOf(colorTag) > -1) {
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

    const handleAdd = (newTag) => {
      updateTags(newTag);
      setInputVisible(false);
      setInputValue('');
    }

    return (
      <div id="stage_tags">
        <Space size={[0, 8]} wrap>
          {/* Display existing tags */}
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
          {/* Add tag field */}
          {inputVisible ? (
            <Input className="tagInputField" ref={tagInputRef} type="text" size="small"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={(e) => handleAdd(inputValue)}
              onPressEnter={(e) => handleAdd(inputValue)}
            />
          ) : (
            <Tag className="tagNewField" onClick={() => setInputVisible(true)}>
              <PlusOutlined /> Add Tag
            </Tag>
          )}
        </Space>
      </div>
    );
  }

  function saveAndReturn() {
    const makeExtra = (tag, v) => {
      return { tag, v };
    }

    const stage = {
      id: _id,
      name,
      positions,
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
      {positions.map((p, i) => (
        <div key={i} index={i} className="position">
          {/* TODO: <PositionData i={i} /> */}
          <Button type="dashed" icon={<DeleteOutlined />}
            onClick={() => { updatePositions(p => { p.splice(i, 1) }) }}
            disabled={positions.length === 1}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        onClick={() => { invoke('make_position').then((s) => { updatePositions(p => { p.push(s) }) }) }}
        disabled={positions.length > 4}
      >
        Add Position
      </Button>

      <Divider orientation="left">Tags</Divider>
      <Row>
        <Col>
          <Space size={'large'}>
            <TagMenu my_tags={tags_nsfw} my_label={"NSFW"} />
            <TagMenu my_tags={tags_sfw} my_label={"SFW"} />
            <TagMenu my_tags={tags_exclusive} my_label={"Exclusive"} />
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

function Stage({stage}) {
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
                  {racekeys.map((race) => (
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

      if (tags_exclusive.includes(tag)) {
        newtags = newtags.filter(t => !tags_exclusive.includes(t));
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
            {tags_exclusive.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
            <option disabled>--- SFW ---</option>
            {tags_sfw.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
            <option disabled>--- NSFW ---</option>
            {tags_nsfw.map((tag) => (
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
