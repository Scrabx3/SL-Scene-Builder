import { WebviewWindow } from '@tauri-apps/api/window';

const addstagewindow = async () => {
  const webview = new m('theUniqueLabel', {
    url: 'https://github.com/tauri-apps/tauri',
  });
  alert("yep");
};
