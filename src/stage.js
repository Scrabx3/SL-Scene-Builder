const invoke = window.__TAURI__.invoke

window.addEventListener("DOMContentLoaded", async function () {
  const keys = [
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

  const stage = await invoke('get_stage');

  console.log(stage);

  let header = document.getElementById("stage_header");
  header.innerHTML = stage.name;

  let posholder = document.getElementById("position_holder");
  console.log(posholder);
  let i = 0;
  posholder.innerHTML = stage.positions.map(p => {
    `<div>
      <label for="event${i}">Animation Event:</label>
      <input type="text" id="event${i}" name="event${i}"></input>
    </div>`
  }).join('');
});