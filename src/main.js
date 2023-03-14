const invoke = window.__TAURI__.invoke

const addstagewindow = async () => {
  invoke('stage_creator');
  // alert(WebviewWindow);
};
