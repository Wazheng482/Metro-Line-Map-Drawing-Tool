const Settings = (() => {
  const translations = {
    zh: {
      export: '导出',
      backgroundColor: '背景颜色',
      grid: '网格',
      language: '语言',
      settings: '设置',
      collapse: '折叠',
      properties: '属性面板',
      chooseElement: '选择画布中的元素以编辑属性',
      ready: '就绪',
      create: '创建',
      imageDownload: '图片下载',
      format: '格式',
      resolution: '分辨率倍数',
      original: '1x（原始尺寸）',
      hd: '2x（高清）',
      uhd: '3x（超清）',
      print: '4x（印刷级）',
      legendPosition: '图例位置',
      topLeft: '左上角',
      topRight: '右上角',
      bottomLeft: '左下角',
      bottomRight: '右下角',
      audioDownload: '报站音频下载',
      audioHint: '点击"开始下载"后，系统将使用内置语音引擎（meSpeak.js）离线合成报站音频：\n1. 中文使用普通话语音，英文使用美式英语语音\n2. 音频为 WAV 格式，自动打包为 ZIP 下载\n3. 完全离线运行，无需联网，无需授权弹窗\n注意：合成音为机器人音。如需真人音质，可使用文本 + Python 脚本方案（gTTS/edge-tts）。\n生成后请等待20秒，如还未开始下载，请重试。',
      deleteStation: '删除站点',
      deleteLine: '删除线路',
      deleteText: '删除文本',
      reconnectLine: '重新连接',
      stationNameCn: '站点名称（中文）',
      stationNameEn: '站点名称（英文）',
      lineNameCn: '线路名称（中文）',
      lineNameEn: '线路名称（英文）',
      labelPosition: '标签位置',
      labelAuto: '自动',
      stationType: '站点类型',
      normalStation: '普通站',
      interchangeStation: '换乘站',
      normalStationFull: '普通站点',
      interchangeStationFull: '换乘站点',
      stationInfo: '线路信息',
      stationCount: '站点数',
      passThrough: '途经',
      lineColor: '线路颜色',
      textContent: '文本内容',
      fontFamily: '字体',
      fontSize: '字体大小',
      textColor: '颜色',
      exportPreview: '导出预览',
      startDownload: '开始下载',
      station: '站点',
      line: '线路',
      text: '文本',
      select: '选择',
      undo: '撤销',
      redo: '重做',
      zoomOut: '缩小',
      zoomIn: '放大',
      fitView: '适应视图',
      clearCanvas: '清空画布',
      tools: '工具',
      selectTool: '选择工具 (V)',
      lineTool: '线路工具 (L)',
      textTool: '文本工具 (T)',
      normalStationTool: '普通站点',
      interchangeStationTool: '换乘站点',
      dragToCanvas: '拖拽到画布',
      enterStationName: '输入站点名称',
      enterLineName: '输入线路名称',
      enterText: '输入文本',
      fontYaHei: '微软雅黑',
      fontSimSun: '宋体',
      fontKaiTi: '楷体',
      fontFangSong: '仿宋',
      fontSimHei: '黑体',
      fontSansSerif: '无衬线',
      fontSerif: '衬线体',
      unknown: '未知',
      expandPanel: '展开属性面板',
      stations: '站点',
      lines: '线路',
      texts: '文本',
      statusLineMode: '线路模式：从站点按下拖拽，经过站点自动连接，松开完成',
      statusReconnect: '重新连接：拖拽经过站点重新指定路径，松开完成',
      statusTextMode: '文本模式：点击画布添加文本',
      hintLineMode: '按住拖拽经过多个站点',
      hintReconnect: '拖拽经过新站点序列',
      hintTextMode: '点击画布添加文本框',
      loopTool: '环线工具 (O)',
      loop: '环线',
      statusLoopMode: '环线模式：从站点按下拖拽，经过站点自动连接成环，松开完成',
      lineType: '线路类型',
      normalLine: '普通线路',
      loopLine: '环线',
      highSpeedLine: '高速铁路',
      hollowLine: '空心线',
      dashedLine: '虚线',
      loopLineLabel: '是否环线',
      yes: '是',
      no: '否',
      termsOfService: '服务条款',
      privacyPolicy: '隐私政策',
      about: '关于',
      welcome: '欢迎使用地铁线路图绘制工具',
      chooseLanguage: '选择语言',
      nextStep: '下一步',
      previousStep: '上一步',
      agreementTitle: '用户协议',
      agreeTerms: '我已阅读并同意服务条款',
      agreePrivacy: '我已阅读并同意隐私政策',
      themeTitle: '选择主题',
      themeWhite: '白色',
      themeDarkBlue: '深蓝',
      themeBlack: '黑色',
      guideTitle: '操作指南',
      guide1: '从右侧工具栏拖拽站点到画布',
      guide2: '选择线路工具，从站点拖拽经过其他站点创建线路',
      guide3: '点击站点或线路，在左侧属性面板编辑名称和颜色',
      guide4: '使用右上角导出按钮导出图片和音频',
      startCreating: '开始创作',
      stationTool: '站点工具 (S)',
      statusStationMode: '站点模式：点击画布创建站点',
      statusLineMode: '线路模式：从站点按下拖拽，经过站点自动连接，拖拽回起点形成环线',
      legendLanguage: '图例语言',
      legendLangCn: '中文',
      legendLangEn: '英文',
      termsText1: '欢迎使用地铁线路图绘制工具。在使用本工具之前，请仔细阅读以下服务条款：',
      termsText2: '1. 本工具为免费工具，您可以自由使用、导出所创建的地铁线路图。',
      termsText3: '2. 您创建的内容仅保存在本地浏览器中，清除浏览器数据将导致丢失。',
      termsText4: '3. 本工具不承担因数据丢失、使用不当造成的任何损失。',
      termsText5: '4. 请勿利用本工具创建违法、违规内容。',
      privacyText1: '本工具高度重视您的隐私：',
      privacyText2: '1. 所有数据仅存储在您本地浏览器的 localStorage 中。',
      privacyText3: '2. 本工具不收集、不上传任何用户数据。',
      privacyText4: '3. 您导出的图片和音频文件仅在您的设备上生成。',
      privacyText5: '4. 如需清除数据，请使用浏览器的"清除浏览数据"功能。',
      guide1: '选择站点工具，点击画布创建站点',
      guide2: '选择线路工具，从站点拖拽经过其他站点创建线路',
      guide3: '拖拽回起点可创建环线，多站点共用即为换乘站',
      guide4: '点击站点或线路，在左侧属性面板编辑名称和颜色'
    },
    en: {
      export: 'Export',
      backgroundColor: 'Background',
      grid: 'Grid',
      language: 'Language',
      settings: 'Settings',
      collapse: 'Collapse',
      properties: 'Properties',
      chooseElement: 'Select an element on the canvas to edit properties',
      ready: 'Ready',
      create: 'Create',
      imageDownload: 'Image Download',
      format: 'Format',
      resolution: 'Resolution',
      original: '1x (Original)',
      hd: '2x (HD)',
      uhd: '3x (UHD)',
      print: '4x (Print)',
      legendPosition: 'Legend Position',
      topLeft: 'Top Left',
      topRight: 'Top Right',
      bottomLeft: 'Bottom Left',
      bottomRight: 'Bottom Right',
      audioDownload: 'Audio Download',
      audioHint: 'After clicking "Start Download", the system will use the built-in speech engine (meSpeak.js) to synthesize station audio offline:\n1. Chinese uses Mandarin voice, English uses American English voice\n2. Audio is WAV format, auto-packaged as ZIP\n3. Fully offline, no internet, no permission dialog\nNote: Synthesized voice is robotic. For natural voice, use the text + Python script option (gTTS/edge-tts).\nPlease wait 20 seconds after generation. If download does not start, please retry.',
      deleteStation: 'Delete Station',
      deleteLine: 'Delete Line',
      deleteText: 'Delete Text',
      reconnectLine: 'Reconnect',
      stationNameCn: 'Station Name (CN)',
      stationNameEn: 'Station Name (EN)',
      lineNameCn: 'Line Name (CN)',
      lineNameEn: 'Line Name (EN)',
      labelPosition: 'Label Position',
      labelAuto: 'Auto',
      stationType: 'Station Type',
      normalStation: 'Normal',
      interchangeStation: 'Interchange',
      normalStationFull: 'Normal Station',
      interchangeStationFull: 'Interchange Station',
      stationInfo: 'Line Info',
      stationCount: 'Stations',
      passThrough: 'Via',
      lineColor: 'Line Color',
      textContent: 'Text Content',
      fontFamily: 'Font Family',
      fontSize: 'Font Size',
      textColor: 'Color',
      exportPreview: 'Export Preview',
      startDownload: 'Start Download',
      station: 'Station',
      line: 'Line',
      text: 'Text',
      select: 'Select',
      undo: 'Undo',
      redo: 'Redo',
      zoomOut: 'Zoom Out',
      zoomIn: 'Zoom In',
      fitView: 'Fit View',
      clearCanvas: 'Clear Canvas',
      tools: 'Tools',
      selectTool: 'Select Tool (V)',
      lineTool: 'Line Tool (L)',
      textTool: 'Text Tool (T)',
      normalStationTool: 'Normal Station',
      interchangeStationTool: 'Interchange Station',
      dragToCanvas: 'Drag to canvas',
      enterStationName: 'Enter station name',
      enterLineName: 'Enter line name',
      enterText: 'Enter text',
      fontYaHei: 'Microsoft YaHei',
      fontSimSun: 'SimSun',
      fontKaiTi: 'KaiTi',
      fontFangSong: 'FangSong',
      fontSimHei: 'SimHei',
      fontSansSerif: 'Sans-serif',
      fontSerif: 'Serif',
      unknown: 'Unknown',
      expandPanel: 'Expand properties panel',
      stations: 'Stations',
      lines: 'Lines',
      texts: 'Texts',
      statusLineMode: 'Line mode: drag from station through stations to connect, release to finish',
      statusReconnect: 'Reconnect: drag through stations to redefine path, release to finish',
      statusTextMode: 'Text mode: click canvas to add text',
      hintLineMode: 'Hold and drag through multiple stations',
      hintReconnect: 'Drag through new station sequence',
      hintTextMode: 'Click canvas to add text box',
      loopTool: 'Loop Line Tool (O)',
      loop: 'Loop',
      statusLoopMode: 'Loop mode: drag from station through stations to form a loop, release to finish',
      lineType: 'Line Type',
      normalLine: 'Normal Line',
      loopLine: 'Loop Line',
      highSpeedLine: 'High-Speed Rail',
      hollowLine: 'Hollow Line',
      dashedLine: 'Dashed Line',
      loopLineLabel: 'Is Loop',
      yes: 'Yes',
      no: 'No',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      about: 'About',
      welcome: 'Welcome to Metro Line Map Drawing Tool',
      chooseLanguage: 'Choose Language',
      nextStep: 'Next',
      previousStep: 'Previous',
      agreementTitle: 'User Agreement',
      agreeTerms: 'I have read and agree to the Terms of Service',
      agreePrivacy: 'I have read and agree to the Privacy Policy',
      themeTitle: 'Choose Theme',
      themeWhite: 'White',
      themeDarkBlue: 'Dark Blue',
      themeBlack: 'Black',
      guideTitle: 'Quick Guide',
      guide1: 'Drag stations from the right toolbar to the canvas',
      guide2: 'Select line tool, drag from station through other stations to create line',
      guide3: 'Click station or line, edit name and color in the left panel',
      guide4: 'Use the export button on the top right to export image and audio',
      startCreating: 'Start Creating',
      stationTool: 'Station Tool (S)',
      statusStationMode: 'Station mode: click canvas to create station',
      statusLineMode: 'Line mode: drag from station through stations to connect, drag back to start to form loop',
      legendLanguage: 'Legend Language',
      legendLangCn: 'Chinese',
      legendLangEn: 'English',
      termsText1: 'Welcome to Metro Line Map Drawing Tool. Please read the following terms carefully before using this tool:',
      termsText2: '1. This tool is free. You can freely use and export the metro maps you create.',
      termsText3: '2. Your creations are stored only in your local browser. Clearing browser data will lose them.',
      termsText4: '3. This tool is not responsible for any loss caused by data loss or misuse.',
      termsText5: '4. Do not use this tool to create illegal or violating content.',
      privacyText1: 'This tool values your privacy highly:',
      privacyText2: '1. All data is stored only in your browser\'s localStorage.',
      privacyText3: '2. This tool does not collect or upload any user data.',
      privacyText4: '3. The images and audio you export are generated only on your device.',
      privacyText5: '4. To clear data, use your browser\'s "Clear Browsing Data" function.',
      guide1: 'Select station tool, click canvas to create station',
      guide2: 'Select line tool, drag from station through other stations to create line',
      guide3: 'Drag back to start to form a loop. Shared stations become interchange stations',
      guide4: 'Click station or line, edit name and color in the left panel'
    }
  };

  const backgrounds = {
    'dark-blue': {
      bg: '#0f172a',
      canvasBg: '#0c1222',
      gridSmall: 'rgba(148, 163, 184, 0.3)',
      gridLarge: 'rgba(148, 163, 184, 0.15)',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#64748b'
    },
    'white': {
      bg: '#f8fafc',
      canvasBg: '#ffffff',
      gridSmall: 'rgba(100, 116, 139, 0.25)',
      gridLarge: 'rgba(100, 116, 139, 0.12)',
      text: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8'
    },
    'black': {
      bg: '#0a0a0a',
      canvasBg: '#000000',
      gridSmall: 'rgba(255, 255, 255, 0.25)',
      gridLarge: 'rgba(255, 255, 255, 0.12)',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#64748b'
    }
  };

  let currentBg = 'dark-blue';
  let currentLang = 'zh';
  let gridVisible = true;

  function init() {
    loadSettings();
    bindSettingsEvents();
    applySettings();
  }

  function loadSettings() {
    const saved = localStorage.getItem('metroMapSettings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        currentBg = s.background || 'dark-blue';
        currentLang = s.language || 'zh';
        gridVisible = s.grid !== undefined ? s.grid : true;
      } catch (e) {}
    }
  }

  function saveSettings() {
    localStorage.setItem('metroMapSettings', JSON.stringify({
      background: currentBg,
      language: currentLang,
      grid: gridVisible
    }));
  }

  function bindSettingsEvents() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    settingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('show');
    });

    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.remove('show');
    });

    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('show');
      }
    });

    document.querySelectorAll('.bg-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBg = btn.dataset.bg;
        applyBackground();
        saveSettings();
      });
    });

    const gridToggle = document.getElementById('gridToggle');
    gridToggle.addEventListener('change', (e) => {
      gridVisible = e.target.checked;
      applyGrid();
      saveSettings();
    });

    const langSelect = document.getElementById('languageSelect');
    langSelect.addEventListener('change', (e) => {
      currentLang = e.target.value;
      applyLanguage();
      saveSettings();
    });
  }

  function applySettings() {
    document.querySelectorAll('.bg-option').forEach(b => {
      b.classList.toggle('active', b.dataset.bg === currentBg);
    });
    document.getElementById('gridToggle').checked = gridVisible;
    document.getElementById('languageSelect').value = currentLang;
    applyBackground();
    applyGrid();
    applyLanguage();
  }

  function applyBackground() {
    const bg = backgrounds[currentBg];
    const root = document.documentElement;

    if (currentBg === 'white') {
      root.style.setProperty('--bg-primary', '#f8fafc');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-tertiary', '#e2e8f0');
      root.style.setProperty('--bg-elevated', '#ffffff');
      root.style.setProperty('--border', '#cbd5e1');
      root.style.setProperty('--border-light', '#94a3b8');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--canvas-bg', '#ffffff');
      root.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.2)');
    } else if (currentBg === 'black') {
      root.style.setProperty('--bg-primary', '#0a0a0a');
      root.style.setProperty('--bg-secondary', '#111111');
      root.style.setProperty('--bg-tertiary', '#1f1f1f');
      root.style.setProperty('--bg-elevated', '#111111');
      root.style.setProperty('--border', '#2a2a2a');
      root.style.setProperty('--border-light', '#444444');
      root.style.setProperty('--text-primary', '#f1f5f9');
      root.style.setProperty('--text-secondary', '#a1a1aa');
      root.style.setProperty('--text-muted', '#71717a');
      root.style.setProperty('--canvas-bg', '#000000');
      root.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.3)');
    } else {
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--bg-tertiary', '#334155');
      root.style.setProperty('--bg-elevated', '#1e293b');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--border-light', '#475569');
      root.style.setProperty('--text-primary', '#f1f5f9');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--canvas-bg', '#0c1222');
      root.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.3)');
    }

    const gridRect = document.getElementById('gridRect');
    if (gridRect) {
      const patternSmall = document.getElementById('grid-small');
      const patternLarge = document.getElementById('grid-large');
      if (patternSmall) {
        patternSmall.innerHTML = `<circle cx="1" cy="1" r="1" fill="${bg.gridSmall}"/>`;
      }
      if (patternLarge) {
        patternLarge.innerHTML = `<rect width="100" height="100" fill="url(#grid-small)"/><path d="M 100 0 L 0 0 0 100" fill="none" stroke="${bg.gridLarge}" stroke-width="1"/>`;
      }
    }

    const canvasBg = document.querySelector('.canvas-container');
    if (canvasBg) {
      canvasBg.style.background = bg.canvasBg;
    }

    const brandIcon = document.querySelector('.brand-icon');
    if (brandIcon) {
      brandIcon.style.color = currentBg === 'white' ? '#f59e0b' : '#f59e0b';
    }
  }

  function applyGrid() {
    const gridRect = document.getElementById('gridRect');
    if (gridRect) {
      gridRect.style.display = gridVisible ? 'block' : 'none';
    }
  }

  function applyLanguage() {
    const t = translations[currentLang];
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

    document.title = currentLang === 'zh' ? '地铁线路图绘制工具-Metro Line Map Drawing Tool' : 'Metro Line Map Drawing Tool-地铁线路图绘制工具';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (t[key]) {
        el.title = t[key];
      }
    });

    updateDynamicText();

    // 重新渲染属性面板（属性面板内容由 JS 动态生成，需要重新渲染以应用新语言）
    if (typeof Properties !== 'undefined' && typeof Properties.render === 'function') {
      try { Properties.render(); } catch (e) { /* Properties 尚未初始化 */ }
    }

    // 更新状态栏文本
    if (typeof Canvas !== 'undefined' && typeof Canvas.updateStatus === 'function') {
      try { Canvas.updateStatus(State.getState()); } catch (e) { /* Canvas 尚未初始化 */ }
    }
  }

  function updateDynamicText() {
    const t = translations[currentLang];
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.title = t.clearCanvas;
    }
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.title = t.exportPreview;
    }
    const downloadBtn = document.getElementById('startDownloadBtn');
    if (downloadBtn) {
      downloadBtn.textContent = t.startDownload;
    }
    const modalTitle = document.querySelector('.modal-header h2');
    if (modalTitle) {
      modalTitle.textContent = t.exportPreview;
    }
  }

  function getCurrentLang() {
    return currentLang;
  }

  function t(key) {
    return translations[currentLang][key] || key;
  }

  function applyLang(lang) {
    currentLang = lang;
    saveSettings();
    applyLanguage();
  }

  function applyBg(bg) {
    currentBg = bg;
    document.querySelectorAll('.bg-option').forEach(b => {
      b.classList.toggle('active', b.dataset.bg === bg);
    });
    saveSettings();
    applyBackground();
  }

  return { init, getCurrentLang, t, applyLang, applyBg };
})();
