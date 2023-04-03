import React from "react";
import ReactDOM from "react-dom/client";
import "./defaultstyle.css";
import "./App.css"
import "./stage.css";

import { invoke } from "@tauri-apps/api/tauri";
import { useState, useEffect } from "react";
import { useImmer } from "use-immer";

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
  "Kissing"
]

const tags_nsfw = [
  "69",
  "Aggressive",
  "Anal",
  "Blowjob",
  "Boobjob",
  "Cowgirl",
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

document.addEventListener('DOMContentLoaded', async (event) => {
  let stage = await invoke('get_stage');
  ReactDOM.createRoot(document.getElementById("root_s")).render(
    <React.StrictMode>
      <Stage stage={stage}/>
    </React.StrictMode>
  );
});

// COMEBACK: update cycle here likely not ideal. Should prbly switch up update & render timings
function PositionData({ position, doUpdate }) {
  const [data, updateData] = useImmer(position);
  useEffect(() => { doUpdate(data); })

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

  function Sex({ label, name, disable }) {
    if (!name) name = label;    
    return (
      <label>
        <input type="checkbox"
          onChange={() => { updateData(d => { d.genders = updateList(data.genders, name) }); }}
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
          onChange={() => { updateData(d => { d.extra = updateList(data.extra, name) }); }}
          checked={position.extra.indexOf(name) > -1} 
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
            updateData(d => { d.offset[name] = offset }); 
          }}
          onFocus={(evt) => { evt.target.select(); }}
        />
      </label>
    )
  }

  const isHuman = () => {
    return position.race === "Human";
  }

  // Toggle show and hide areas
  const [isHidden, setIsHidden] = useState(true);
  const toggleVisibility = () => {
    setIsHidden(!isHidden);
  };

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
                  updateData((d) => {
                    d.event = value;
                  });
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
                  updateData((d) => {
                    d.race = evt.target.value;
                  });
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
              <Extra
                label={'Amputee (arm, right)'}
                name={'AmputeeAR'}
                disable={!isHuman()}
              />
              <Extra
                label={'Amputee (arm, left)'}
                name={'AmputeeAL'}
                disable={!isHuman()}
              />
              <Extra
                label={'Amputee (leg, right)'}
                name={'AmputeeLR'}
                disable={!isHuman()}
              />
              <Extra
                label={'Amputee (leg, left)'}
                name={'AmputeeLL'}
                disable={!isHuman()}
              />
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

function Stage({ stage }) {
  const [name, setName] = useState(stage.name);
  const [positions, updatePositions] = useImmer(stage.positions);
  const [tags, setTags] = useState(stage.tags);
  const [extra, updateExtra] = useImmer(stage.extra);

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

  function updatePositionData(data, i) {
    updatePositions(p => { p[i] = data })
  }

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
    if (!name) {
      alert("A stage requires a name");
      return;
    }
    if (!positions.length) {
      alert("A stage requires at least one position");
      return;
    }
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      if (!p.event) {
        alert(`Position ${i} is missing a behavior file`);
        return;
      }
    }
    if (!tags.length) {
      let result = await confirm("It is highly recommended that a stage has at least one tag.\nAre you sure you want to continue?");
      if (!result) {
        return;
      }
    }

    const ret = {
      id: stage.id,
      name: name,
      positions: positions,
      tags: tags,
      extra: extra.filter(e => e.v != 0)
    }
    // console.log(ret);
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
            <PositionData
              position={pos}
              doUpdate={(data) => updatePositionData(data, i)}
            />
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
