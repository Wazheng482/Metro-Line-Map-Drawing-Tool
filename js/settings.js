const Settings = (() => {
  const translations = {
    zh: {
      export: '导出',
      backgroundColor: '背景颜色',
      grid: '网格',
      language: '语言',
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
      audioHint: '点击"开始下载"后，浏览器会弹出共享对话框：\n1. 选择<strong>当前标签页</strong>\n2. <strong>务必勾选</strong>底部"分享标签页音频"复选框\n3. 点击"分享"，系统将逐条朗读并录制为 WAV 音频\n4. 请保持标签页在前台，录制完成自动下载 ZIP\n\n注意：如不勾选音频共享，将回退为导出文本文件 + Python 脚本。',
      deleteStation: '删除站点',
      deleteLine: '删除线路',
      deleteText: '删除文本',
      reconnectLine: '重新连接',
      stationNameCn: '站点名称（中文）',
      stationNameEn: '站点名称（英文）',
      lineNameCn: '线路名称（中文）',
      lineNameEn: '线路名称（英文）',
      labelPosition: '标签位置',
      stationType: '站点类型',
      normalStation: '普通站点',
      interchangeStation: '换乘站点',
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
      chooseElement: '选择画布中的元素以编辑属性',
      dragToCanvas: '拖拽到画布'
    },
    en: {
      export: 'Export',
      backgroundColor: 'Background',
      grid: 'Grid',
      language: 'Language',
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
      audioHint: 'After clicking "Start Download", the browser will show a share dialog:\n1. Select <strong>Current Tab</strong>\n2. <strong>Must check</strong> the "Share tab audio" checkbox\n3. Click "Share", the system will read and record as WAV audio\n4. Keep the tab in foreground, ZIP will auto-download when done\n\nNote: If audio sharing is not checked, it will fallback to exporting text files + Python script.',
      deleteStation: 'Delete Station',
      deleteLine: 'Delete Line',
      deleteText: 'Delete Text',
      reconnectLine: 'Reconnect',
      stationNameCn: 'Station Name (CN)',
      stationNameEn: 'Station Name (EN)',
      lineNameCn: 'Line Name (CN)',
      lineNameEn: 'Line Name (EN)',
      labelPosition: 'Label Position',
      stationType: 'Station Type',
      normalStation: 'Normal Station',
      interchangeStation: 'Interchange Station',
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
      chooseElement: 'Select an element on the canvas to edit properties',
      dragToCanvas: 'Drag to canvas'
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
    const dropdown = document.getElementById('settingsDropdown');

    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !settingsBtn.contains(e.target)) {
        dropdown.classList.remove('show');
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

    document.title = currentLang === 'zh' ? '地铁线路图绘制工具' : 'Metro Line Map Drawing Tool';

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

  return { init, getCurrentLang, t };
})();
