# 📦 桌面应用构建指南

本指南说明如何将「地铁线路图绘制工具」打包为 Windows 桌面安装程序（.exe）。

## 一、环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.x | [下载地址](https://nodejs.org/)（选 LTS 版本） |
| npm | ≥ 9.x | 随 Node.js 安装 |

安装 Node.js 后，在 PowerShell 中验证：
```powershell
node --version
npm --version
```

## 二、项目结构

```
Metro Line Map Drawing Tool/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本
├── package.json         # 项目配置 + electron-builder 配置
├── index.html           # 前端入口
├── css/                 # 样式
├── js/                  # 业务逻辑
├── vendor/mespeak/      # meSpeak.js 离线 TTS 引擎
│   ├── mespeak.js
│   ├── mespeak-core.js
│   └── voices/
│       ├── zh.json          # 中文语音
│       └── en/en-us.json    # 英文语音
├── build/               # 构建资源
│   ├── icon.ico         # 应用图标（多尺寸）
│   ├── icon.png         # PNG 图标
│   ├── license.txt      # 安装向导协议
│   └── generate-icon.ps1  # 图标生成脚本
└── dist/                # 构建输出（自动生成）
```

## 三、开发模式（本地调试）

```powershell
npm install
npm start
```

这会安装依赖并以开发模式启动 Electron 应用，可实时查看效果。

## 四、构建安装包

### 1. 安装依赖

```powershell
npm install
```

### 2. 生成 NSIS 安装程序

```powershell
npm run dist
```

构建完成后，`dist/` 目录下会生成：
- `MetroLineMap-Setup-1.0.0.exe` — NSIS 安装程序（**主产物**）

### 3. 生成免安装便携版（可选）

```powershell
npm run dist:portable
```

生成单个 `MetroLineMap-1.0.0.exe` 便携版，双击即可运行，无需安装。

### 4. 仅打包不制作安装程序（调试用）

```powershell
npm run pack
```

在 `dist/win-unpacked/` 下生成未打包的应用目录，可直接运行其中的 `.exe`。

## 五、安装向导特性

NSIS 安装程序提供完整的安装向导体验：

- **语言选择**：安装时可选 中文 / English
- **协议页**：显示服务条款与隐私政策（`build/license.txt`）
- **安装路径**：允许用户自定义安装目录
- **快捷方式**：自动创建桌面快捷方式 + 开始菜单快捷方式
- **安装后运行**：安装完成可选立即启动应用
- **卸载**：通过控制面板或卸载程序卸载

## 六、重新生成图标

如需修改图标设计，编辑 `build/generate-icon.ps1` 后运行：

```powershell
powershell -ExecutionPolicy Bypass -File build\generate-icon.ps1
```

会重新生成 `build/icon.ico`（多尺寸）和 `build/icon.png`。

## 七、常见问题

### Q1：构建时下载 Electron 二进制缓慢？

设置国内镜像：
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm run dist
```

### Q2：报站音频功能在桌面版中不工作？

meSpeak.js 使用 Web Worker 离线合成。若语音模块加载失败：
1. 确认 `vendor/mespeak/` 目录完整（含 `mespeak.js`、`mespeak-core.js`、`voices/`）
2. 查看 开发者工具（Ctrl+Shift+I）控制台错误信息
3. 系统会自动回退为「文本 + Python 脚本」方案

### Q3：如何修改应用名称或版本号？

编辑 `package.json`：
- `version` — 版本号
- `build.productName` — 应用显示名
- `build.appId` — 应用唯一标识

### Q4：打包后应用体积较大？

Electron 应用基础体积约 80-120MB（含 Chromium）。这是 Electron 架构的正常表现，如需更小体积可考虑 Tauri 等方案（但需 Rust 环境）。

## 八、技术说明

- **Electron**：跨平台桌面应用框架，将 Web 技术封装为原生应用
- **electron-builder**：打包工具，生成各平台安装程序
- **NSIS**：Windows 安装程序制作系统，electron-builder 内置集成
- **meSpeak.js**：基于 eSpeak 的纯前端 TTS 引擎，离线合成语音
