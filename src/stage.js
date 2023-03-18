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

// see define.rs for layout
let stage;

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

const appendPosition = (position, i) => {
  const attribute_extra = (extra, dorace) => {
    if (!dorace || position.race === "Human")
      return position.extra.includes(extra) ? "checked" : "";

    return "disabled";
  };

  const d = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  let next = document.createElement("div");
  next.id = position.id = d;

  let html = `
    <h3 id="header${d}">Position ${i + 1}</h3>
    <label>Animation Event: <input type="text" name="anim">${position.event}</label>

    <h4>Gender:</h4>
    <label><input type="checkbox" class="gender">Male</label>
    <label><input type="checkbox" class="gender">Female</label>
    <label><input type="checkbox" class="gender race_dep">Hermaphrodite</label>

    <h4>Race and Extra:</h4>
    <label>Race Key: <select name="race_select">`
  racekeys.forEach(key => { html += `<option>${key}</option>` });
  html += `
    </select></label><br><br>
    <label><input type="checkbox" class="extra">Victim</label>
    <label><input type="checkbox" class="extra race_dep">Vampire</label>
    <label><input type="checkbox" class="extra">Dead</label>
    <br>
    <label><input type="checkbox" class="extra race_dep" name="AmputeeAR"}>Amputee (arm, right)</label>
    <label><input type="checkbox" class="extra race_dep" name="AmputeeAL"}>Amputee (arm, left)</label>
    <label><input type="checkbox" class="extra race_dep" name="AmputeeLR"}>Amputee (leg, right)</label>
    <label><input type="checkbox" class="extra race_dep" name="AmputeeLL"}>Amputee (leg, left)</label>
    <br>
    <label><input type="checkbox" class="extra">Optional</label>
    <br><br>
    <button name="remove_button">Remove Position</button>`
  next.innerHTML = html;

  const update_racedep = (race) => {
    const racedep = next.getElementsByClassName('race_dep');
    for (const obj of racedep) {
      obj.disabled = race !== "Human";
    }
  }
  update_racedep(position.race);

  const genders = next.getElementsByClassName('gender');
  for (const gender of genders) {
    if (gender.disabled)
      continue;

    const name = gender.hasAttribute('name') ?
      gender.getAttribute('name') : gender.textContent;
    gender.checked = position.genders.includes(name);
  }
  const extras = next.getElementsByClassName('extra');
  for (const extra of extras) {
    if (extra.disabled)
      continue;
    
    const name = extra.hasAttribute('name') ?
      extra.getAttribute('name') : extra.textContent;
    extra.checked = position.extra.includes(name);
  }

  const raceselect = next.querySelector('[name=race_select]');
  raceselect.value = position.race;
  raceselect.addEventListener('change', (evt) => {
    const race = evt.target.value;
    update_racedep(race);
  });
  const removebutton = next.querySelector('[name=remove_button]');
  removebutton.addEventListener('click', removePosition);

  const position_holder = document.getElementById("position_holder");
  return position_holder.appendChild(next);
}

const makePosition = () => {
  invoke("make_position").then(p => {
    stage.positions.push(p);
    appendPosition(p, stage.positions.length - 1);
  });
  if (stage.positions.length == 4) {
    add_position_button.disabled = true;
  }
}

const removePosition = (evt) => {
  let parent = evt.target.parentElement;
  let newpos = [];
  for (let i = 0, ii = 1; i < stage.positions.length; i++) {
    const pos = stage.positions[i];
    if (pos.id === parseInt(parent.id))
      continue;

    let header = document.getElementById(`header${pos.id}`);
    header.innerHTML = `Position ${ii++}`;
    newpos.push(pos);
  }
  stage.positions = newpos;
  parent.remove();

  if (add_position_button.disabled === true)
    add_position_button.disabled = false;
}

const buildStage = async () => {
  stage = await invoke('get_stage');
  let header = document.getElementById("stage_header");
  header.placeholder = stage.name;

  for (let i = 0; i < stage.positions.length; i++) {
    const pos = stage.positions[i];
    appendPosition(pos, i);
  }
}

const saveStage = () => {

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
});
