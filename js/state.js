// 状态管理 - 简单的全局状态管理
const State = (() => {
  const listeners = new Set();
  
  const state = {
    stations: [],
    lines: [],
    textBlocks: [],
    selectedTool: 'select', // select | station | line
    selectedElement: null, // { type: 'station'|'line'|'text', id: string }
    connectingFrom: null, // 线路连接模式：从哪个站点开始
    reconnectingLineId: null, // 重新连接模式的线路ID
    zoom: 1,
    offset: { x: 0, y: 0 },
    history: [],
    historyIndex: -1,
    nextId: 1
  };

  function generateId(prefix) {
    return `${prefix}_${state.nextId++}_${Date.now().toString(36)}`;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify() {
    listeners.forEach(fn => fn({ ...state }));
  }

  function pushHistory() {
    const snapshot = JSON.stringify({
      stations: state.stations,
      lines: state.lines,
      textBlocks: state.textBlocks
    });
    
    // 清除重做历史
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);
    
    // 限制历史长度
    if (state.history.length > 50) {
      state.history.shift();
    } else {
      state.historyIndex++;
    }
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      const snapshot = JSON.parse(state.history[state.historyIndex]);
      state.stations = snapshot.stations;
      state.lines = snapshot.lines;
      state.textBlocks = snapshot.textBlocks;
      state.selectedElement = null;
      notify();
      return true;
    }
    return false;
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      const snapshot = JSON.parse(state.history[state.historyIndex]);
      state.stations = snapshot.stations;
      state.lines = snapshot.lines;
      state.textBlocks = snapshot.textBlocks;
      state.selectedElement = null;
      notify();
      return true;
    }
    return false;
  }

  // 站点操作
  function addStation(x, y) {
    const idx = state.stations.length + 1;
    const station = {
      id: generateId('station'),
      x, y,
      name: `站点${idx}`,
      nameEn: `Station ${idx}`,
      labelPosition: 'auto'
    };
    state.stations.push(station);
    state.selectedElement = { type: 'station', id: station.id };
    pushHistory();
    notify();
    return station;
  }

  function updateStation(id, updates, options = {}) {
    const idx = state.stations.findIndex(s => s.id === id);
    if (idx !== -1) {
      state.stations[idx] = { ...state.stations[idx], ...updates };
      if (!options.silent) pushHistory();
      notify();
    }
  }

  function deleteStation(id) {
    state.stations = state.stations.filter(s => s.id !== id);
    // 从线路中移除该站点；少于2站的线路删除
    state.lines = state.lines.map(l => ({
      ...l,
      stationIds: l.stationIds.filter(sid => sid !== id)
    })).filter(l => l.stationIds.length >= 2);
    if (state.selectedElement?.id === id) {
      state.selectedElement = null;
    }
    pushHistory();
    notify();
  }

  // 线路操作
  function addLine(fromId, toId) {
    if (fromId === toId) return null;
    const from = state.stations.find(s => s.id === fromId);
    const to = state.stations.find(s => s.id === toId);
    if (!from || !to) return null;

    const lineNum = state.lines.length + 1;
    const line = {
      id: generateId('line'),
      name: `线路${lineNum}`,
      nameEn: `Line ${lineNum}`,
      color: '#E53935',
      stationIds: [fromId, toId]
    };
    state.lines.push(line);
    state.selectedElement = { type: 'line', id: line.id };
    pushHistory();
    notify();
    return line;
  }

  // 向已有线路追加站点（延伸）
  function appendStationToLine(lineId, stationId, atStart = false) {
    const line = state.lines.find(l => l.id === lineId);
    if (!line) return false;
    if (line.stationIds.includes(stationId)) return false;
    if (atStart) {
      line.stationIds.unshift(stationId);
    } else {
      line.stationIds.push(stationId);
    }
    pushHistory();
    notify();
    return true;
  }

  // 批量追加多个站点
  function appendStationsToLine(lineId, stationIds, atStart = false) {
    const line = state.lines.find(l => l.id === lineId);
    if (!line) return false;
    const newIds = stationIds.filter(id => !line.stationIds.includes(id));
    if (newIds.length === 0) return false;
    if (atStart) {
      line.stationIds = [...newIds, ...line.stationIds];
    } else {
      line.stationIds = [...line.stationIds, ...newIds];
    }
    pushHistory();
    notify();
    return true;
  }

  // 创建包含多个站点的新线路
  function addLineWithStations(stationIds, options = {}) {
    if (!stationIds || stationIds.length < 2) return null;
    const lineNum = state.lines.length + 1;
    const line = {
      id: generateId('line'),
      name: `线路${lineNum}`,
      nameEn: `Line ${lineNum}`,
      color: options.color || '#E53935',
      stationIds: [...stationIds],
      isLoop: options.isLoop || false,
      type: options.type || 'normal'
    };
    state.lines.push(line);
    state.selectedElement = { type: 'line', id: line.id };
    pushHistory();
    notify();
    return line;
  }

  function updateLine(id, updates, options = {}) {
    const idx = state.lines.findIndex(l => l.id === id);
    if (idx !== -1) {
      state.lines[idx] = { ...state.lines[idx], ...updates };
      if (!options.silent) pushHistory();
      notify();
    }
  }

  function deleteLine(id) {
    state.lines = state.lines.filter(l => l.id !== id);
    if (state.selectedElement?.id === id) {
      state.selectedElement = null;
    }
    pushHistory();
    notify();
  }

  // 文本操作
  function addTextBlock(x, y) {
    const textBlock = {
      id: generateId('text'),
      x, y,
      content: '双击编辑文字',
      fontFamily: 'Microsoft YaHei',
      fontSize: 16,
      color: '#f1f5f9'
    };
    state.textBlocks.push(textBlock);
    state.selectedElement = { type: 'text', id: textBlock.id };
    pushHistory();
    notify();
    return textBlock;
  }

  function updateTextBlock(id, updates, options = {}) {
    const idx = state.textBlocks.findIndex(t => t.id === id);
    if (idx !== -1) {
      state.textBlocks[idx] = { ...state.textBlocks[idx], ...updates };
      if (!options.silent) pushHistory();
      notify();
    }
  }

  function deleteTextBlock(id) {
    state.textBlocks = state.textBlocks.filter(t => t.id !== id);
    if (state.selectedElement?.id === id) {
      state.selectedElement = null;
    }
    pushHistory();
    notify();
  }

  // 通用操作
  function setTool(tool) {
    state.selectedTool = tool;
    state.connectingFrom = null;
    if (tool !== 'line') state.reconnectingLineId = null;
    notify();
  }

  function setReconnectingLine(lineId) {
    state.reconnectingLineId = lineId;
    notify();
  }

  function selectElement(element) {
    state.selectedElement = element;
    if (!element) {
      state.connectingFrom = null;
    }
    notify();
  }

  function setConnectingFrom(stationId) {
    state.connectingFrom = stationId;
    notify();
  }

  function setZoom(zoom) {
    state.zoom = Math.max(0.25, Math.min(4, zoom));
    notify();
  }

  function setOffset(x, y) {
    state.offset = { x, y };
    notify();
  }

  function setView(zoomValue, x, y) {
    state.zoom = Math.max(0.25, Math.min(4, zoomValue));
    state.offset = { x, y };
    notify();
  }

  // 静默更新视图（不触发 notify，避免重复渲染）
  function updateView(zoomValue, x, y) {
    state.zoom = Math.max(0.25, Math.min(4, zoomValue));
    state.offset = { x, y };
  }

  function clearAll() {
    state.stations = [];
    state.lines = [];
    state.textBlocks = [];
    state.selectedElement = null;
    state.connectingFrom = null;
    pushHistory();
    notify();
  }

  function deleteSelected() {
    if (!state.selectedElement) return;
    const { type, id } = state.selectedElement;
    if (type === 'station') deleteStation(id);
    else if (type === 'line') deleteLine(id);
    else if (type === 'text') deleteTextBlock(id);
  }

  // 复制粘贴
  let clipboard = null;

  function copySelected() {
    if (!state.selectedElement) return;
    const { type, id } = state.selectedElement;
    if (type === 'station') {
      const s = state.stations.find(s => s.id === id);
      if (s) clipboard = { type: 'station', data: { ...s } };
    } else if (type === 'text') {
      const t = state.textBlocks.find(t => t.id === id);
      if (t) clipboard = { type: 'text', data: { ...t } };
    }
  }

  function paste() {
    if (!clipboard) return;
    if (clipboard.type === 'station') {
      const s = clipboard.data;
      const newStation = {
        id: generateId('station'),
        x: s.x + 30,
        y: s.y + 30,
        name: s.name,
        nameEn: s.nameEn,
        labelPosition: s.labelPosition || 'auto'
      };
      state.stations.push(newStation);
      state.selectedElement = { type: 'station', id: newStation.id };
      pushHistory();
      notify();
    } else if (clipboard.type === 'text') {
      const t = clipboard.data;
      const newText = {
        id: generateId('text'),
        x: t.x + 30,
        y: t.y + 30,
        content: t.content,
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        color: t.color
      };
      state.textBlocks.push(newText);
      state.selectedElement = { type: 'text', id: newText.id };
      pushHistory();
      notify();
    }
  }

  // 项目数据导出/导入（用于 MLMDT 文件和本地保存）
  function exportProjectData(name) {
    return {
      format: 'MLMDT',
      version: '1.0',
      name: name || '未命名项目',
      exported: new Date().toISOString(),
      data: {
        stations: JSON.parse(JSON.stringify(state.stations)),
        lines: JSON.parse(JSON.stringify(state.lines)),
        textBlocks: JSON.parse(JSON.stringify(state.textBlocks))
      }
    };
  }

  function importProjectData(projectData) {
    if (!projectData || projectData.format !== 'MLMDT' || !projectData.data) return false;
    state.stations = JSON.parse(JSON.stringify(projectData.data.stations || []));
    state.lines = JSON.parse(JSON.stringify(projectData.data.lines || []));
    state.textBlocks = JSON.parse(JSON.stringify(projectData.data.textBlocks || []));
    state.selectedElement = null;
    state.connectingFrom = null;
    state.history = [];
    state.historyIndex = -1;
    pushHistory();
    notify();
    return true;
  }

  function loadState(stations, lines, textBlocks) {
    state.stations = JSON.parse(JSON.stringify(stations || []));
    state.lines = JSON.parse(JSON.stringify(lines || []));
    state.textBlocks = JSON.parse(JSON.stringify(textBlocks || []));
    state.selectedElement = null;
    state.connectingFrom = null;
    state.history = [];
    state.historyIndex = -1;
    pushHistory();
    notify();
  }

  function getState() {
    return state;
  }

  function getSelectedData() {
    if (!state.selectedElement) return null;
    const { type, id } = state.selectedElement;
    if (type === 'station') return state.stations.find(s => s.id === id);
    if (type === 'line') return state.lines.find(l => l.id === id);
    if (type === 'text') return state.textBlocks.find(t => t.id === id);
    return null;
  }

  // 初始化历史快照
  pushHistory();

  return {
    subscribe,
    getState,
    getSelectedData,
    generateId,
    addStation, updateStation, deleteStation,
    addLine, addLineWithStations, updateLine, deleteLine,
    appendStationToLine, appendStationsToLine,
    addTextBlock, updateTextBlock, deleteTextBlock,
    setTool, selectElement, setConnectingFrom, setReconnectingLine,
    setZoom, setOffset, setView, updateView,
    undo, redo,
    clearAll, deleteSelected,
    copySelected, paste,
    exportProjectData, importProjectData, loadState,
    pushHistory
  };
})();