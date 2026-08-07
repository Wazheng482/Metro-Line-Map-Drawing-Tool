// Electron 主进程
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '地铁线路图绘制工具-Metro Line Map Drawing Tool',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#0f172a',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // 放宽 file:// 同源限制，确保 meSpeak.js 的 Web Worker 能正常加载核心文件
      webSecurity: false,
      spellcheck: false
    }
  });

  mainWindow.loadFile('index.html');

  // 窗口准备好后再显示，避免启动白屏
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 外部链接（如协议链接）在系统浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // 移除默认应用菜单（保留快捷键功能）
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 阻止创建额外的web view（安全加固）
app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (e) => {
    e.preventDefault();
  });
});
