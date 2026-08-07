// Electron 预加载脚本
// 在渲染进程加载前执行，运行在隔离的上下文中
// 目前用于标记 Electron 环境，未来可在此安全地暴露 Node API

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron
});

// 窗口加载完成后注入一个小标记，方便前端检测运行环境
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-env', 'electron');
});
