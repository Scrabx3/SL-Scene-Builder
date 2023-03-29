import * as jsPlumb from './../node_modules/@jsplumb/browser-ui';

const invoke = window.__TAURI__.invoke
const { emit, listen } = window.__TAURI__.event

var clicks = 0;
var lastClick = [0, 0];

const makeNewStage = () => {
  invoke('stage_creator', { id: 0 });
}

const test = async () =>  {
  const jsPlumbBrowserUI = await import('./../node_modules/@jsplumb/browser-ui')

  const instance = jsPlumbBrowserUI.newInstance({
    container: this.$refs.diagram
  })
  console.log(instance)
}

window.addEventListener("DOMContentLoaded", () => {
  const make_stage = document.getElementById('make_stage');
  make_stage.addEventListener('click', makeNewStage)

  console.log(window);
  // console.log(listen);
  console.log(jsPlumb);
  
  test();

  // canvas = document.getElementById('canvas');
  // ctx = canvas.getContext('2d');
  // boxes = document.querySelectorAll('.box');

  // boxes.forEach(box => {
  //   box.addEventListener('mousedown', onMouseDown);
  // });

  // document.getElementById('canvas').addEventListener('click', drawLine, false);

  // ctx.strokeStyle = 'red';
  // ctx.lineWidth = 5;

  // document.addEventListener('mousemove', onMouseMove);
  // document.addEventListener('mouseup', onMouseUp);

  // updateCanvas();
});
