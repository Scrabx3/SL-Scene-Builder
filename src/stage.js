const invoke = window.__TAURI__.invoke

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
let add_position_button;
let tag_list;

const hasTag = (tag) => {
  const divs = tag_list.getElementsByTagName('div');
  for (const element of divs) {
    if (element.innerHTML.localeCompare(tag, 'en', { sensitivity: 'base' }) === 0)
      return true;
  }
  return false;
}

const makeTag = (tag) => {
  let next = document.createElement("div");
  next.innerHTML = tag;
  next.addEventListener('click', (evt) => {
    evt.target.remove();
  });
  return next;
}

const clearTags = () => {
  if (tag_list.innerHTML === '')
    return;
  
  window.confirm("Clear all tags?").then(result => {
    if (result) tag_list.innerHTML = '';
  })
}

const addTag = (tag) => {
  if (hasTag(tag)) {
    return;
  }

  const next = makeTag(tag);
  if (tag_list.innerHTML !== '') {
    if (tag.localeCompare("NonSex", 'en', { sensitivity: 'base' }) === 0) {
      window.confirm("Are you sure?\n\nAdding this tag will remove all other tags.").then(result => {
        if (!result)
          return;

        tag_list.replaceChildren(next);
      })
      return;
    } else if (hasTag("NonSex")) {
      tag_list.replaceChildren(next);
      return;
    }
  }
  tag_list.appendChild(next);
}

const addTagDefault = (evt) => {
  const v = evt.target.value;
  addTag(v);
}

const addTagCustom = (evt) => {
  if (evt.key !== 'Enter') {
    return;
  }
  addTag(evt.target.value);
  evt.target.value = '';
}

const getName = (htmlinput) => {
  const name = htmlinput.hasAttribute('name') ?
    htmlinput.getAttribute('name') : htmlinput.parentElement.textContent;
  return name;
}

const appendPosition = (position) => {
  let next = document.createElement("div");
  next.classList.add('position')

  const i = document.querySelectorAll('.position').length;
  let html = `
    <h2 name="header">Position ${i + 1}</h2>
    <label>Animation Event: <input type="text" name="animation" placeholder="Animation Event"></label>
    <div class="row">
        <h4>Gender and Race Key:</h4>
        <fieldset>
          <label><input type="checkbox" class="gender">Male</label>
          <label><input type="checkbox" class="gender">Female</label>
          <label><input type="checkbox" class="gender race_dep" name="Futa">Hermaphrodite</label>
        </fieldset>
        <fieldset>
          <label>Race Key:
            <select name="race_select">`;
  racekeys.forEach(key => { html += `<option>${key}</option>` });  
  html += `
            </select>
          </label>
        </fieldset>
        
        <h4>Extras:</h4><br><br>

        <fieldset>
          <label><input type="checkbox" class="pos_extra">Victim</label>
          <label><input type="checkbox" class="pos_extra race_dep">Vampire</label>
         <label><input type="checkbox" class="pos_extra">Dead</label>
      </fieldset>
      <fieldSet>
        <label><input type="checkbox" class="pos_extra race_dep" name="AmputeeAR"}>Amputee (arm, right)</label>
        <label><input type="checkbox" class="pos_extra race_dep" name="AmputeeAL"}>Amputee (arm, left)</label>
       <label><input type="checkbox" class="pos_extra race_dep" name="AmputeeLR"}>Amputee (leg, right)</label>
        <label><input type="checkbox" class="pos_extra race_dep" name="AmputeeLL"}>Amputee (leg, left)</label>
      </fieldset>
      <fieldset>
        <label><input type="checkbox" class="pos_extra">Optional</label>
      </fieldset>
    </div>
    <br><br>
    <button name="remove_button">Remove Position</button>`;
  next.innerHTML = html;

  const update_racedep = (race) => {
    const racedep = next.getElementsByClassName('race_dep');
    for (const obj of racedep) {
      obj.disabled = race !== "Human";
    }
  }

  const raceselect = next.querySelector('[name=race_select]');
  raceselect.addEventListener('change', (evt) => {
    const race = evt.target.value;
    update_racedep(race);
  });
  const removebutton = next.querySelector('[name=remove_button]');
  removebutton.addEventListener('click', removePosition);

  // fill in data from position
  if (position) {
    // event
    const animation = next.querySelector('[name=animation]');
    animation.value = position.event;
    // gender
    const genders = next.getElementsByClassName('gender');
    for (const gender of genders) {
      if (gender.disabled)
        continue;

      const name = getName(gender);
      gender.checked = position.genders.includes(name);
    }
    // race
    raceselect.value = position.race;
    update_racedep(position.race);
    // extra
    const extras = next.getElementsByClassName('pos_extra');
    for (const extra of extras) {
      if (extra.disabled)
        continue;

      const name = getName(extra);
      extra.checked = position.extra.includes(name);
    }
  }
  const position_holder = document.getElementById("position_holder");
  return position_holder.appendChild(next);  
}

const makePosition = () => {
  const next = appendPosition();
  if (document.querySelectorAll('.position').length >= 5) {
    add_position_button.disabled = true;
  }
}

const removePosition = (evt) => {
  const parent = evt.target.parentElement;
  parent.remove();

  const positions = document.querySelectorAll('.position')
  for (let i = 0; i < positions.length; i++) {
    const element = positions[i];
    const header = element.querySelector('[name=header]');
    header.textContent = `Position ${i + 1}`;
  }

  if (add_position_button.disabled === true) {
    add_position_button.disabled = false;
  }
}

const buildStage = async () => {
  const stage = await invoke('get_stage');
  // name
  let header = document.getElementById("stage_name");
  header.value = stage.name;
  // positions
  for (let i = 0; i < stage.positions.length; i++) {
    const pos = stage.positions[i];
    appendPosition(pos);
  }
  // extra
  const extras = document.getElementsByClassName('stage_extra');
  for (const extra of extras) {
    const name = getName(extra);
    const value = stage.extra.find(elm => { return elm.tag === name });
    if (value) {
      extra.value = value.v;
    }
  }
  // tags
  for (const tag of stage.tags) {
    console.log(`reading tag ${tag}`);
    addTag(tag);
  }
}

const saveStage = (evt) => {
  const getStageName = () => {
    const header = document.getElementById('stage_name');
    if (!header.value) {
      throw "Missing 'name' attribute";
    }
    return header.value;
  }
  const getPositions = () => {
    const positions = document.querySelectorAll('.position')
    if (positions.length == 0) {
      throw "Missing 'positions' attribute";
    }
    let ret = new Array();
    for (let i = 0; i < positions.length; i++) {
      const element = positions[i];

      const getEvent = () => {
        const event = element.querySelector("[name=animation]");
        if (!event.value) {
          throw `Position ${i} has no event.`;
        }
        return event.value;
      };
      const getGenders = () => {
        const genders = element.querySelectorAll(".gender");
        if (genders.length == 0) {
          throw `Position ${i} has no gender.`;
        }
        let ret = new Array();
        for (const gender of genders) {
          if (gender.checked && !gender.disabled) {
            ret.push(getName(gender));
          }
        }
        return ret;
      };
      const getRace = () => {
        const race = element.querySelector("[name=race_select]");
        return race.value;
      };
      const getExtras = () => {
        const extras = element.querySelectorAll(".pos_extra");
        let ret = new Array();
        for (const extra of extras) {
          if (extra.checked && !extra.disabled) {
            ret.push(getName(extra));
          }
        }
        return ret;
      };
      const getOffsets = () => {
        // TODO: implement
        let ret = {
          x: 0.0,
          y: 0.0,
          z: 0.0,
          angle: 0.0
        }
        return ret;
      };

      let position = {
        genders: getGenders(),
        race: getRace(),
        event: getEvent(),

        extra: getExtras(),
        offset: getOffsets()
      }
      console.log(position);
      ret.push(position);
    }
    return ret;
  }
  const getTags = () => {
    const divs = tag_list.getElementsByTagName('div');
    if (!divs.length) {
      throw "Missing 'tags' attribute";
    }
    let ret = new Array();
    for (const element of divs) {
      ret.push(element.innerHTML);
    }
    return ret
  }
  const getExtras = () => {
    const extras = document.getElementsByClassName('stage_extra');
    let ret = new Array();
    for (const extra of extras) {
      const value = {
        tag: getName(extra),
        v: extra.value ? parseFloat(extra.value) : parseFloat(extra.placeholder)
      };
      ret.push(value);
    }
    return ret;
  }

  evt.target.disabled = true;
  try {
    let stage = { 
      id: 0,
      name: getStageName(),

      positions: [],  //getPositions(),
      tags: getTags(),
      extra: getExtras()
    }
    console.log(stage);
    invoke("save_stage", { stage: stage, })
      .then((message) => console.log(message))
      .catch((error) => console.error(error));
  } catch (error) {
    evt.target.disabled = false;
    alert(error);
  }  
}

window.addEventListener("DOMContentLoaded", () => {
  buildStage();

  add_position_button = document.getElementById('add_position');
  add_position_button.addEventListener('click', makePosition);

  tag_list = document.getElementById('stage_tags')
  const custom_tags = document.getElementById('custom_tags');
  custom_tags.addEventListener('keydown', addTagCustom);
  const default_tags = document.getElementById('default_tags');
  default_tags.addEventListener('change', addTagDefault)
  const clear_tags = document.getElementById('clear_tags');
  clear_tags.addEventListener('click', clearTags);

  const save_stage = document.getElementById('save_stage')
  save_stage.addEventListener('click', saveStage)
});
