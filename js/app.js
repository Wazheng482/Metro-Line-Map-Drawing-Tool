// 主应用入口
document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  Canvas.init();
  Properties.init();
  Toolbar.init();
  Export.init();
  Settings.init();
  setupGlobalEvents();
  updateZoomDisplay();
}

function setupGlobalEvents() {
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    // 如果在输入框中，不处理快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }

    const state = State.getState();
    
    // Ctrl+Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      State.undo();
      return;
    }
    
    // Ctrl+Y / Ctrl+Shift+Z 重做
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      State.redo();
      return;
    }
    
    // V - 选择工具
    if (e.key === 'v' || e.key === 'V') {
      State.setTool('select');
    }
    
    // L - 线路工具
    if (e.key === 'l' || e.key === 'L') {
      State.setTool('line');
    }
    
    // T - 文本工具
    if (e.key === 't' || e.key === 'T') {
      State.setTool('text');
    }
    
    // Escape - 取消当前操作
    if (e.key === 'Escape') {
      State.setTool('select');
      State.setConnectingFrom(null);
      State.selectElement(null);
    }
    
    // Delete / Backspace - 删除选中元素
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedElement) {
        e.preventDefault();
        State.deleteSelected();
      }
    }
  });

  // 顶部工具栏按钮
  document.getElementById('undoBtn').addEventListener('click', () => State.undo());
  document.getElementById('redoBtn').addEventListener('click', () => State.redo());
  document.getElementById('zoomInBtn').addEventListener('click', () => {
    State.setZoom(State.getState().zoom * 1.2);
  });
  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    State.setZoom(State.getState().zoom / 1.2);
  });
  document.getElementById('fitViewBtn').addEventListener('click', () => {
    State.setZoom(1);
    State.setOffset(0, 0);
  });

  // 左侧面板折叠/展开
  const leftPanel = document.getElementById('leftPanel');
  const expandLeftBtn = document.getElementById('expandLeftBtn');
  document.getElementById('collapseLeftBtn').addEventListener('click', () => {
    leftPanel.classList.add('collapsed');
    expandLeftBtn.classList.add('visible');
  });
  expandLeftBtn.addEventListener('click', () => {
    leftPanel.classList.remove('collapsed');
    expandLeftBtn.classList.remove('visible');
  });

  // 监听缩放变化
  State.subscribe((state) => {
    updateZoomDisplay();
    updateHistoryButtons(state);
  });
}

function updateZoomDisplay() {
  const zoom = State.getState().zoom;
  document.getElementById('zoomLabel').textContent = `${Math.round(zoom * 100)}%`;
}

function updateHistoryButtons(state) {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  
  undoBtn.disabled = state.historyIndex <= 0;
  redoBtn.disabled = state.historyIndex >= state.history.length - 1;
}

// 初始示例数据 - 一条演示线路
function loadDemo() {
  const s1 = State.addStation(120, 200, 'normal');
  State.updateStation(s1.id, { name: '起点站' });
  
  const s2 = State.addStation(300, 200, 'interchange');
  State.updateStation(s2.id, { name: '换乘中心' });
  
  const s3 = State.addStation(500, 300, 'normal');
  State.updateStation(s3.id, { name: '终点站' });
  
  State.addLine(s1.id, s2.id);
  const line1 = State.getState().lines[0];
  State.updateLine(line1.id, { name: '1号线', color: '#E53935' });
  
  State.addLine(s2.id, s3.id);
  const line2 = State.getState().lines[1];
  State.updateLine(line2.id, { name: '2号线', color: '#1E88E5' });
  
  State.selectElement(null);
}