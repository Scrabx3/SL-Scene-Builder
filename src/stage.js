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

const genders = [
  "Male",
  "Female",
  "Futa",
  "Male Creature",
  "Female Creature"
];

let stage;

const buildStage = async () => {
  stage = await invoke('get_stage');
  console.log(stage);

  let header = document.getElementById("stage_header");
  header.innerHTML = stage.name;

  let position_holder = document.getElementById("position_holder");
  position_holder.innerHTML = '';
  for (let i = 0; i < stage.positions.length; i++) {
    // { event, extra, gender, race }
    const obj = stage.positions[i];
    let html = `
      <div>
        <h3>Position ${i + 1}</h3>
        <label for="event${i}">Animation Event:</label>
        <input type="text" id="event${i}" name="event${i}">${obj.event}</input>
  
        <h4>Gender:</h4>`
        genders.forEach(g => {
          html += `
            <label for="${g}${i}">${g}</label>
            <input type="checkbox" id="${g}${i}" name="${g}_name${i}" ${obj.genders.includes(g) ? "checked" : ""}></input>`
        });

        html += `<h4>Race and Extra:</h4>
        <label for=racekey${i}>Race Key:</label>
        <select id=racekey${i} name=racekey_name${i}>`
        racekeys.forEach(key => {
          html += `
            <option value="${key}" ${obj.race === key ? "selected" : "" }>${key}</option>`
        });
    html += `</div>`
    position_holder.innerHTML += html;
  }
};

window.addEventListener("DOMContentLoaded", buildStage);
