// 资源加载器：追踪所有脚本、样式、字体加载进度，全部完成后启动应用并隐藏加载页
(function () {
  const SCRIPTS = [
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'vendor/mespeak/mespeak.js?v=14',
    'js/state.js?v=14',
    'js/geometry.js?v=14',
    'js/settings.js?v=14',
    'js/welcome.js?v=14',
    'js/canvas.js?v=14',
    'js/properties.js?v=14',
    'js/toolbar.js?v=14',
    'js/export.js?v=14',
    'js/home.js?v=14',
    'js/app.js?v=14'
  ];

  const STYLES = [
    'css/styles.css?v=14'
  ];

  // 读取当前语言设置（在 settings.js 加载之前，直接读 localStorage）
  function getCurrentLang() {
    try {
      const saved = localStorage.getItem('metroMapSettings');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.language) return data.language;
      }
    } catch (e) {}
    // 首次访问还没设置过，看浏览器语言
    const nav = (navigator.language || 'zh').toLowerCase();
    return nav.startsWith('zh') ? 'zh' : 'en';
  }
  const LANG = getCurrentLang();

  const I18N = {
    zh: {
      title: 'Metro Line Map Drawing Tool',
      css: '正在加载样式表...',
      js: '正在加载脚本...',
      font: '正在加载字体...',
      final: '即将完成...',
      done: '加载完成'
    },
    en: {
      title: 'Metro Line Map Drawing Tool',
      css: 'Loading stylesheets...',
      js: 'Loading scripts...',
      font: 'Loading fonts...',
      final: 'Almost done...',
      done: 'Ready'
    }
  };
  const T = I18N[LANG] || I18N.en;

  // 应用加载页面标题翻译
  const titleEl = document.querySelector('.loading-title');
  if (titleEl && LANG === 'zh') {
    titleEl.textContent = '地铁线路图绘制工具';
  } else if (titleEl) {
    titleEl.textContent = T.title;
  }

  let totalTasks = SCRIPTS.length + STYLES.length + 1; // +1 字体加载
  let doneTasks = 0;
  let appStarted = false;

  const fillEl = document.getElementById('loadingProgressFill');
  const textEl = document.getElementById('loadingProgressText');
  const statusEl = document.getElementById('loadingStatus');

  function updateProgress(status) {
    const pct = Math.min(100, Math.round((doneTasks / totalTasks) * 100));
    if (fillEl) fillEl.style.width = pct + '%';
    if (textEl) textEl.textContent = pct + '%';
    if (status && statusEl) statusEl.textContent = status;
  }

  function taskDone() {
    doneTasks++;
    updateProgress();
    if (doneTasks >= totalTasks && !appStarted) {
      appStarted = true;
      finishLoading();
    }
  }

  // 加载单个脚本（fetch + eval 方式可追踪进度，但为保持全局作用域，使用 script 标签 + onload）
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // 检查是否已存在（HTML 中已加载的脚本）
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        // 已经存在，直接标记完成
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => {
        console.warn('脚本加载失败:', src);
        resolve(); // 即使失败也继续，避免卡住
      };
      document.body.appendChild(s);
    });
  }

  // 加载样式表
  function loadStyle(href) {
    return new Promise((resolve) => {
      const existing = document.querySelector(`link[href="${href}"]`);
      if (existing) {
        resolve();
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => {
        console.warn('样式加载失败:', href);
        resolve();
      };
      document.head.appendChild(link);
    });
  }

  // 等待字体加载
  function waitForFonts() {
    return new Promise((resolve) => {
      if (!document.fonts || !document.fonts.ready) {
        resolve();
        return;
      }
      document.fonts.ready.then(() => resolve()).catch(() => resolve());
    });
  }

  // 移除 HTML 中原始的 script 标签（避免重复加载），改为由 loader 接管
  function removeOriginalScripts() {
    const srcSet = new Set(SCRIPTS);
    document.querySelectorAll('script[src]').forEach(s => {
      if (srcSet.has(s.getAttribute('src'))) {
        s.remove();
      }
    });
  }

  async function start() {
    updateProgress(T.css);

    // 1. 加载样式表
    for (const href of STYLES) {
      await loadStyle(href);
      taskDone();
    }

    updateProgress(T.js);

    // 2. 加载脚本（按顺序，保证依赖）
    for (const src of SCRIPTS) {
      await loadScript(src);
      taskDone();
    }

    updateProgress(T.font);

    // 3. 等待字体加载
    await waitForFonts();
    taskDone();

    updateProgress(T.final);
  }

  function finishLoading() {
    // 确保进度满
    if (fillEl) fillEl.style.width = '100%';
    if (textEl) textEl.textContent = '100%';
    if (statusEl) statusEl.textContent = T.done;

    // 延迟一点点，让用户看到 100%
    setTimeout(() => {
      // 启动应用
      if (typeof init === 'function') {
        init();
      }
      // 隐藏加载页
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        loadingScreen.classList.add('loading-hidden');
        setTimeout(() => {
          loadingScreen.remove();
        }, 400);
      }
      // 启用交互
      document.body.style.pointerEvents = '';
    }, 300);
  }

  // 禁用交互，直到加载完成
  document.body.style.pointerEvents = 'none';

  // 移除原始 script 标签
  removeOriginalScripts();

  // 开始加载
  start();
})();
