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
    <h3 name="header">Position ${i + 1}</h3>
    <label>Animation Event: <input type="text" name="animation" placeholder="Animation Event"></label>

    <h4>Gender:</h4>
    <label><input type="checkbox" class="gender">Male</label>
    <label><input type="checkbox" class="gender">Female</label>
    <label><input type="checkbox" class="gender race_dep" name="Futa">Hermaphrodite</label>

    <h4>Race and Extra:</h4>
    <label>Race Key: <select name="race_select">`
  racekeys.forEach(key => { html += `<option>${key}</option>` });
  html += `
    </select></label><br><br>
    <label><input type="checkbox" class="pos_extra">Victim</label>
    <label><input type="checkbox" class="pos_extra race_dep">Vampire</label>
    <label><input type="checkbox" class="pos_extra">Dead</label>
    <br>
    <label><input type="checkbox" class="pos_extra race_dep" name="AmputeeAR"}>Amputee (arm, right)</label>
    <label><input type="checkbox" class="pos_extra race_dep" name="AmputeeAL"}>Amputee (arm, left)</label>
    <label><input type="checkbox" class="pos_extra race_dep" name="AmputeeLR"}>Amputee (leg, right)</label>
    <label><input type="checkbox" class="pos_extra race_dep" name="AmputeeLL"}>Amputee (leg, left)</label>
    <br>
    <label><input type="checkbox" class="pos_extra">Optional</label>
    <br><br>
    <button name="remove_button">Remove Position</button>`
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
  // offset
  const offsets = document.querySelectorAll('.offset')
  for (let i = 0; i < stage.offset.length; i++) {
    offsets[i].value = stage.offset[i];
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
  evt.target.disabled = true;
  let stage = new Object();
  // name
  const header = document.getElementById('stage_name');
  if (!header.value) {
    alert('Stage is missing "name" attribute');
    return;
  }
  stage.name = header.value;
  // positions
  const positions = document.querySelectorAll('.position')
  stage.positions = new Array();
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    let next = new Object();
    // event
    const event = p.querySelector("[name=animation]");
    if (!event.value) {
      alert(`Missing animation event for position ${i + 1}`);
      return;
    }
    next.event = event.value;
    // gender
    next.genders = new Array()
    const genders = p.querySelectorAll(".gender");
    for (const gender of genders) {
      if (gender.checked && !gender.disabled) {
        next.genders.push(getName(gender));
      }
    }
    if (next.genders.length === 0) {
      alert(`Missing gender for position ${i + 1}`);
      return;
    }
    // race
    const race = p.querySelector("[name=race_select]");
    next.race = race.value;
    // extra
    next.extra = new Array();
    const extras = p.querySelectorAll(".pos_extra");
    for (const extra of extras) {
      if (extra.checked && !extra.disabled) {
        next.extra.push(getName(extra));
      }
    }
    stage.positions.push(next);
  }
  if (stage.positions.length === 0) {
    alert("A stage requires at least 1 position");
    return;
  }
  // offset
  const offsets = document.querySelectorAll('.offset')
  stage.offset = new Array();
  for (const iterator of offsets) {
    const val = iterator.value;
    const v = val ? parseFloat(val) : 0.0;
    stage.offset.push(v);
  }
  // extra
  const extras = document.getElementsByClassName('stage_extra');
  stage.extra = new Array();
  for (const extra of extras) {
    const name = getName(extra);
    const value = { tag: name, v: extra.value };
    stage.extra.push(value);
  }
  // tags
  stage.tags = new Array();
  const divs = tag_list.getElementsByTagName('div');
  if (!divs.length) {
    window.confirm("Sage has no tags defined. Are you sure you want to continue?").then(result => {
      if (!result)
        return;

      console.log(stage);
      // TODO: save stage invoke
      // window.close();
    });
    return;
  }
  for (const element of divs) {
    stage.tags.push(element.innerHTML);
  }
  console.log(stage);
  // TODO: save stage invoke
  // window.close();
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
