const invoke = window.__TAURI__.invoke

const makeNewStage = () => {
  invoke('stage_creator', { id: 0 });
}

window.addEventListener("DOMContentLoaded", () => {
  const make_stage = document.getElementById('make_stage');
  make_stage.addEventListener('click', makeNewStage)
});
