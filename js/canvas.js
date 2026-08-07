// 画布渲染和交互
const Canvas = (() => {
  let svg, contentGroup, overlay;
  let zoom = 1;
  let offset = { x: 0, y: 0 };
  let isPanning = false;
  let panStart = null;
  let panMoved = false;
  let panClickPending = false;
  let panStationPoint = null; // 站点工具：待创建站点的画布坐标（点击时使用）
  let panStartClient = null; // mousedown 时的客户端坐标，用于拖拽阈值判断
  const PAN_THRESHOLD = 4; // 拖拽阈值（像素），低于此值视为点击
  let dragState = null;
  let lineDragState = null; // 连续拖拽连线路：{ stationIds: [], isExtending, extendLineId, extendAtStart, existingStationIds }
  let hoverStationId = null;

  function init() {
    svg = document.getElementById('canvas');
    contentGroup = document.getElementById('canvasContent');
    overlay = document.getElementById('overlay');

    applyTransform();
    setupEventListeners();
    subscribeToState();
    renderAll();
  }

  function subscribeToState() {
    State.subscribe((state) => {
      zoom = state.zoom;
      offset = state.offset;
      applyTransform();
      renderAll();
      updateStatus(state);
    });
  }

  function applyTransform() {
    const transform = `translate(${offset.x}, ${offset.y}) scale(${zoom})`;
    contentGroup.setAttribute('transform', transform);
    const gridRect = document.getElementById('gridRect');
    if (gridRect) gridRect.setAttribute('transform', transform);
  }

  function setupEventListeners() {
    svg.addEventListener('mousedown', onCanvasMouseDown);
    svg.addEventListener('mousemove', onCanvasMouseMove);
    svg.addEventListener('mouseup', onCanvasMouseUp);
    svg.addEventListener('mouseleave', onCanvasMouseLeave);
    svg.addEventListener('wheel', onWheel, { passive: false });

    // 拖拽接收
    svg.addEventListener('dragover', onDragOver);
    svg.addEventListener('drop', onDrop);

    // 双击编辑文本
    svg.addEventListener('dblclick', onDoubleClick);
  }

  function getCanvasPoint(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / zoom,
      y: (clientY - rect.top - offset.y) / zoom
    };
  }

  function onCanvasMouseDown(e) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      startPan(e);
      return;
    }

    if (e.button !== 0) return;

    const point = getCanvasPoint(e.clientX, e.clientY);
    const state = State.getState();

    // 检查是否点击在空白区域
    const target = e.target;
    const isBackground = target.tagName === 'svg' || 
                         target.id === 'gridRect' || 
                         target.closest('#canvasContent') === null;

    if (isBackground) {
      if (state.selectedTool === 'line') {
        // 线路工具下拖拽空白 = 平移地图
        startPan(e);
      } else if (state.selectedTool === 'station') {
        // 站点工具：按下时记录起点，先当作潜在平移；松开时若未拖拽则创建站点
        startPan(e);
        panClickPending = true;
        panStationPoint = { x: point.x, y: point.y };
      } else if (state.selectedTool === 'select') {
        // 选择工具下拖拽空白 = 平移地图；点击（不拖拽）= 取消选中
        startPan(e);
        panClickPending = true;
      }
    }
  }

  function startPan(e) {
    isPanning = true;
    panMoved = false;
    panStart = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    panStartClient = { x: e.clientX, y: e.clientY };
    svg.style.cursor = 'grabbing';
  }

  function handleBackgroundClick(point, state) {
    const tool = state.selectedTool;

    if (tool === 'line') {
      return;
    }
  }

  function onCanvasMouseMove(e) {
    if (isPanning) {
      // 未超过阈值前不算拖拽，避免微小抖动导致点击失效
      if (!panMoved && panStartClient) {
        const dx = e.clientX - panStartClient.x;
        const dy = e.clientY - panStartClient.y;
        if (Math.sqrt(dx * dx + dy * dy) < PAN_THRESHOLD) {
          return;
        }
        panMoved = true;
        panClickPending = false;
      }
      offset.x = e.clientX - panStart.x;
      offset.y = e.clientY - panStart.y;
      applyTransform();
      return;
    }

    if (dragState) {
      handleDragging(e);
      return;
    }

    if (lineDragState) {
      updateLineDragPreview(e);
      return;
    }

    const state = State.getState();
    if (state.selectedTool === 'line') {
      updateHoverStation(e);
    }
  }

  function onCanvasMouseUp(e) {
    // 平移结束
    if (isPanning) {
      if (panClickPending && !panMoved) {
        if (panStationPoint) {
          // 站点工具：点击（未拖拽）= 创建站点
          State.addStation(panStationPoint.x, panStationPoint.y);
        } else {
          // 选择工具：点击（未拖拽）= 取消选中
          State.selectElement(null);
        }
      } else if (panMoved) {
        // 拖拽结束，同时提交 zoom 和 offset 到状态
        State.setView(zoom, offset.x, offset.y);
      }
      isPanning = false;
      panClickPending = false;
      panStationPoint = null;
      panStartClient = null;
      svg.style.cursor = '';
      return;
    }

    // 完成线路拖拽连接
    if (lineDragState) {
      finishLineDrag(e);
      return;
    }

    if (dragState && dragState.moved) {
      State.pushHistory();
    }
    dragState = null;
    svg.style.cursor = '';
    clearConnectingPreview();
  }

  function finishLineDrag(e) {
    const point = getCanvasPoint(e.clientX, e.clientY);
    const state = State.getState();

    const hoverStation = Geometry.findNearestStation(point.x, point.y, state.stations, 30);
    if (hoverStation && !lineDragState.stationIds.includes(hoverStation.id)) {
      if (!lineDragState.isExtending || !lineDragState.existingStationIds.includes(hoverStation.id)) {
        lineDragState.stationIds.push(hoverStation.id);
      }
    }

    // 自动检测环线：如果最后一个站点回到了起点
    const isLoop = hoverStation && 
                   lineDragState.stationIds.length >= 2 && 
                   hoverStation.id === lineDragState.stationIds[0];

    if (lineDragState.stationIds.length >= 2) {
      if (lineDragState.isReconnecting) {
        State.updateLine(lineDragState.reconnectLineId, { 
          stationIds: [...lineDragState.stationIds],
          isLoop 
        });
        State.setReconnectingLine(null);
        State.setTool('select');
      } else if (lineDragState.isExtending) {
        const newStations = lineDragState.stationIds.slice(1);
        if (newStations.length > 0) {
          const toAdd = lineDragState.extendAtStart ? newStations.reverse() : newStations;
          State.appendStationsToLine(lineDragState.extendLineId, toAdd, lineDragState.extendAtStart);
        }
      } else {
        State.addLineWithStations(lineDragState.stationIds, { isLoop });
      }
    }

    lineDragState = null;
    hoverStationId = null;
    clearConnectingPreview();
    svg.style.cursor = '';
  }

  function updateLineDragPreview(e) {
    const point = getCanvasPoint(e.clientX, e.clientY);
    const state = State.getState();
    const hoverStation = Geometry.findNearestStation(point.x, point.y, state.stations, 30);

    if (hoverStation && !lineDragState.stationIds.includes(hoverStation.id)) {
      if (!lineDragState.isExtending || !lineDragState.existingStationIds.includes(hoverStation.id)) {
        lineDragState.stationIds.push(hoverStation.id);
      }
    }

    // 自动检测环线：悬停在起点时，显示闭环预览
    const isLoopingBack = hoverStation && 
                          lineDragState.stationIds.length >= 2 && 
                          hoverStation.id === lineDragState.stationIds[0];

    let newHoverId = null;
    if (hoverStation) {
      if (!lineDragState.stationIds.includes(hoverStation.id) || isLoopingBack) {
        newHoverId = hoverStation.id;
      }
    }
    if (newHoverId !== hoverStationId) {
      hoverStationId = newHoverId;
      renderAll();
    }

    const stationPoints = lineDragState.stationIds.map(id => {
      const s = state.stations.find(st => st.id === id);
      return s ? { x: s.x, y: s.y } : null;
    }).filter(Boolean);

    if (isLoopingBack && stationPoints.length > 0) {
      stationPoints.push({ x: stationPoints[0].x, y: stationPoints[0].y });
    } else {
      const targetX = hoverStation && !lineDragState.stationIds.includes(hoverStation.id) ? hoverStation.x : point.x;
      const targetY = hoverStation && !lineDragState.stationIds.includes(hoverStation.id) ? hoverStation.y : point.y;
      stationPoints.push({ x: targetX, y: targetY });
    }

    showMultiSegmentPreview(stationPoints);
  }

  function onCanvasMouseLeave() {
    isPanning = false;
    panClickPending = false;
    panStationPoint = null;
    panStartClient = null;
    dragState = null;
    lineDragState = null;
    hoverStationId = null;
    clearConnectingPreview();
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.25, Math.min(4, zoom * delta));
    
    // 以鼠标位置为中心缩放
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    offset.x = mouseX - (mouseX - offset.x) * (newZoom / zoom);
    offset.y = mouseY - (mouseY - offset.y) * (newZoom / zoom);
    zoom = newZoom;

    // 直接更新 transform，不触发 renderAll
    applyTransform();
    updateZoomLabel();
    // 静默同步到 state，避免下次 notify（如创建站点）时回滚缩放
    State.updateView(zoom, offset.x, offset.y);
  }

  function updateZoomLabel() {
    const label = document.getElementById('zoomLabel');
    if (label) label.textContent = Math.round(zoom * 100) + '%';
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function onDrop(e) {
    e.preventDefault();
    const tool = e.dataTransfer.getData('text/plain');
    if (!tool) return;

    const point = getCanvasPoint(e.clientX, e.clientY);
    
    if (tool === 'station' || tool === 'station-normal') {
      State.addStation(point.x, point.y);
    }
  }

  function onDoubleClick(e) {
    const state = State.getState();
    const point = getCanvasPoint(e.clientX, e.clientY);
    
    // 检查是否点击在文本块上
    const clickedText = Geometry.findNearestTextBlock(point.x, point.y, state.textBlocks, 30);
    if (clickedText) {
      const newContent = prompt('输入文本内容:', clickedText.content);
      if (newContent !== null) {
        State.updateTextBlock(clickedText.id, { content: newContent });
      }
    }
  }

  function updateHoverStation(e) {
    const state = State.getState();
    const point = getCanvasPoint(e.clientX, e.clientY);
    const station = Geometry.findNearestStation(point.x, point.y, state.stations, 30);
    
    const newHoverId = station ? station.id : null;
    if (newHoverId !== hoverStationId) {
      hoverStationId = newHoverId;
      renderAll();
    }
  }

  function showMultiSegmentPreview(stationPoints) {
    clearConnectingPreview();
    if (stationPoints.length < 2) return;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = 'connectingPreview';
    g.setAttribute('pointer-events', 'none');

    // 已固定段（实线）
    if (stationPoints.length > 2) {
      const fixedPoints = Geometry.generateMultiStationPath(stationPoints.slice(0, -1));
      const fixedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      fixedPath.setAttribute('d', Geometry.pointsToPathData(fixedPoints));
      fixedPath.setAttribute('fill', 'none');
      fixedPath.setAttribute('stroke', '#f59e0b');
      fixedPath.setAttribute('stroke-width', '4');
      fixedPath.setAttribute('opacity', '0.85');
      g.appendChild(fixedPath);
    }

    // 实时段（虚线，从最后固定站到鼠标）
    const last = stationPoints[stationPoints.length - 2];
    const end = stationPoints[stationPoints.length - 1];
    const livePoints = Geometry.generatePath(last.x, last.y, end.x, end.y);
    const livePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    livePath.setAttribute('d', Geometry.pointsToPathData(livePoints));
    livePath.setAttribute('fill', 'none');
    livePath.setAttribute('stroke', '#f59e0b');
    livePath.setAttribute('stroke-width', '3');
    livePath.setAttribute('stroke-dasharray', '8 4');
    livePath.setAttribute('opacity', '0.6');
    g.appendChild(livePath);

    contentGroup.appendChild(g);
  }

  function clearConnectingPreview() {
    const preview = document.getElementById('connectingPreview');
    if (preview) preview.remove();
  }

  // ========== 渲染 ==========
  function renderAll() {
    const state = State.getState();
    
    // 清空内容
    contentGroup.innerHTML = '';
    
    // 渲染线路（先渲染，在站点下方）
    state.lines.forEach(line => renderLine(line, state));
    
    // 渲染文本块
    state.textBlocks.forEach(tb => renderTextBlock(tb, state));
    
    // 渲染站点
    state.stations.forEach(station => renderStation(station, state));
  }

  function renderStation(station, state) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'station-group' + 
      (state.selectedElement?.type === 'station' && state.selectedElement.id === station.id ? ' selected' : '') +
      (state.selectedTool === 'line' ? ' station-connectable' : '') +
      (hoverStationId === station.id ? ' station-hover' : ''));
    g.setAttribute('data-id', station.id);
    g.setAttribute('data-type', 'station');

    // 站点图形 - 根据站点被引用的线路数量自动判断换乘
    const linesReferencing = state.lines.filter(l => l.stationIds.includes(station.id));
    const isTransfer = linesReferencing.length > 1;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'station-circle');
    circle.setAttribute('cx', station.x);
    circle.setAttribute('cy', station.y);
    circle.setAttribute('r', isTransfer ? 10 : 7);
    
    if (isTransfer) {
      circle.setAttribute('fill', '#f1f5f9');
      circle.setAttribute('stroke', '#0f172a');
      circle.setAttribute('stroke-width', '3');
      
      const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      innerCircle.setAttribute('cx', station.x);
      innerCircle.setAttribute('cy', station.y);
      innerCircle.setAttribute('r', 4);
      innerCircle.setAttribute('fill', '#0f172a');
      g.appendChild(innerCircle);
    } else {
      circle.setAttribute('fill', '#0f172a');
      circle.setAttribute('stroke', '#f1f5f9');
      circle.setAttribute('stroke-width', '2');
    }
    g.appendChild(circle);

    // 标签
    if (station.name) {
      const offset = Geometry.getLabelOffset(station.labelPosition);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'station-label');
      label.setAttribute('x', station.x + offset.x);
      label.setAttribute('y', station.y + offset.y);
      label.setAttribute('text-anchor', offset.anchor);
      label.textContent = station.name;
      g.appendChild(label);

      // 英文标签
      if (station.nameEn) {
        const labelEn = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelEn.setAttribute('class', 'station-label-en');
        labelEn.setAttribute('x', station.x + offset.x);
        labelEn.setAttribute('y', station.y + offset.y + 14);
        labelEn.setAttribute('text-anchor', offset.anchor);
        labelEn.textContent = station.nameEn;
        g.appendChild(labelEn);
      }
    }

    // 事件
    g.addEventListener('mousedown', (e) => onStationMouseDown(e, station));
    g.addEventListener('click', (e) => onStationClick(e, station));
    g.addEventListener('dblclick', (e) => onStationDblClick(e, station));

    contentGroup.appendChild(g);
  }

  function onStationMouseDown(e, station) {
    if (e.button !== 0) return;
    e.stopPropagation();

    const state = State.getState();
    
    if (state.selectedTool === 'line') {
      if (state.reconnectingLineId) {
        lineDragState = {
          stationIds: [station.id],
          isExtending: false,
          isReconnecting: true,
          reconnectLineId: state.reconnectingLineId,
          tool: 'line'
        };
        return;
      }

      let isExtending = false;
      let extendLineId = null;
      let extendAtStart = false;
      let existingStationIds = [];

      if (state.selectedElement && state.selectedElement.type === 'line') {
        const selLine = state.lines.find(l => l.id === state.selectedElement.id);
        if (selLine && selLine.stationIds.length >= 2) {
          if (selLine.stationIds[0] === station.id) {
            isExtending = true;
            extendLineId = selLine.id;
            extendAtStart = true;
            existingStationIds = [...selLine.stationIds];
          } else if (selLine.stationIds[selLine.stationIds.length - 1] === station.id) {
            isExtending = true;
            extendLineId = selLine.id;
            extendAtStart = false;
            existingStationIds = [...selLine.stationIds];
          }
        }
      }

      lineDragState = {
        stationIds: [station.id],
        isExtending,
        extendLineId,
        extendAtStart,
        existingStationIds,
        tool: 'line'
      };
      return;
    }

    // 拖拽站点
    if (state.selectedTool === 'select') {
      State.selectElement({ type: 'station', id: station.id });
      
      const point = getCanvasPoint(e.clientX, e.clientY);
      dragState = {
        type: 'station',
        id: station.id,
        offsetX: point.x - station.x,
        offsetY: point.y - station.y,
        moved: false
      };
      svg.style.cursor = 'grabbing';
    }
  }

  function onStationClick(e, station) {
    e.stopPropagation();
    const state = State.getState();
    
    if (state.selectedTool === 'select') {
      State.selectElement({ type: 'station', id: station.id });
    }
  }

  function onStationDblClick(e, station) {
    e.stopPropagation();
    const newName = prompt('输入站点名称:', station.name);
    if (newName !== null) {
      State.updateStation(station.id, { name: newName });
    }
  }

  function handleDragging(e) {
    if (!dragState) return;

    const point = getCanvasPoint(e.clientX, e.clientY);
    
    if (dragState.type === 'station') {
      const state = State.getState();
      const station = state.stations.find(s => s.id === dragState.id);
      if (station) {
        station.x = point.x - dragState.offsetX;
        station.y = point.y - dragState.offsetY;
        dragState.moved = true;
        renderAll();
      }
    } else if (dragState.type === 'text') {
      const state = State.getState();
      const tb = state.textBlocks.find(t => t.id === dragState.id);
      if (tb) {
        tb.x = point.x - dragState.offsetX;
        tb.y = point.y - dragState.offsetY;
        dragState.moved = true;
        renderAll();
      }
    }
  }

  function renderLine(line, state) {
    const stations = line.stationIds.map(id => state.stations.find(s => s.id === id)).filter(Boolean);
    if (stations.length < 2) return;

    // 环线：首尾相连，把第一个站点加到末尾
    const pathStations = line.isLoop ? [...stations, stations[0]] : stations;
    const points = Geometry.generateMultiStationPath(pathStations);
    const pathData = Geometry.pointsToPathData(points);
    const isSelected = state.selectedElement?.type === 'line' && state.selectedElement.id === line.id;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'line-group' + (isSelected ? ' selected' : ''));
    g.setAttribute('data-id', line.id);
    g.setAttribute('data-type', 'line');

    // 粗线（点击区域）
    const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitbox.setAttribute('class', 'line-hitbox');
    hitbox.setAttribute('d', pathData);
    g.appendChild(hitbox);

    // 实际线路
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'line-path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', line.color);
    path.setAttribute('stroke-width', isSelected ? 5 : 4);
    g.appendChild(path);

    // 线路标签
    if (line.name) {
      const mid = Geometry.pathMidpoint(points);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'line-label');
      label.setAttribute('x', mid.x);
      label.setAttribute('y', mid.y - 10);
      label.textContent = line.name;
      g.appendChild(label);
    }

    // 事件
    g.addEventListener('mousedown', (e) => onLineMouseDown(e, line));

    contentGroup.appendChild(g);
  }

  function onLineMouseDown(e, line) {
    e.stopPropagation();
    const state = State.getState();

    if (state.selectedTool === 'select') {
      State.selectElement({ type: 'line', id: line.id });
    }
  }

  function renderTextBlock(tb, state) {
    const isSelected = state.selectedElement?.type === 'text' && state.selectedElement.id === tb.id;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'text-group' + (isSelected ? ' selected' : ''));
    g.setAttribute('data-id', tb.id);
    g.setAttribute('data-type', 'text');

    // 文本框边界（选中时显示）
    const bbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bbox.setAttribute('class', 'text-bbox');
    bbox.setAttribute('x', tb.x - 4);
    bbox.setAttribute('y', tb.y - tb.fontSize - 2);
    bbox.setAttribute('width', tb.content.length * tb.fontSize * 0.6 + 8);
    bbox.setAttribute('height', tb.fontSize + 8);
    g.appendChild(bbox);

    // 文本内容
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'text-content');
    text.setAttribute('x', tb.x);
    text.setAttribute('y', tb.y);
    text.setAttribute('font-family', tb.fontFamily);
    text.setAttribute('font-size', tb.fontSize);
    text.setAttribute('fill', tb.color);
    text.textContent = tb.content;
    g.appendChild(text);

    // 事件
    g.addEventListener('mousedown', (e) => onTextMouseDown(e, tb));

    contentGroup.appendChild(g);
  }

  function onTextMouseDown(e, tb) {
    e.stopPropagation();
    const state = State.getState();

    if (state.selectedTool === 'select') {
      State.selectElement({ type: 'text', id: tb.id });
      
      // 允许拖拽移动文本
      const point = getCanvasPoint(e.clientX, e.clientY);
      dragState = {
        type: 'text',
        id: tb.id,
        offsetX: point.x - tb.x,
        offsetY: point.y - tb.y,
        moved: false
      };
      svg.style.cursor = 'grabbing';
    }
  }

  // ========== 状态提示 ==========
  function updateStatus(state) {
    const statusEl = document.getElementById('statusText');
    const hintMap = {
      line: Settings.t('statusLineMode'),
      station: Settings.t('statusStationMode')
    };
    const hint = hintMap[state.selectedTool];
    if (hint) {
      statusEl.textContent = hint;
    } else {
      statusEl.textContent = `${Settings.t('stations')}: ${state.stations.length}  |  ${Settings.t('lines')}: ${state.lines.length}`;
    }
  }

  return {
    init,
    renderAll,
    updateStatus,
    getCanvasPoint,
    zoom: () => zoom,
    setZoom: (z) => {
      zoom = z;
      State.setView(z, offset.x, offset.y);
      applyTransform();
    },
    fitView: () => {
      zoom = 1;
      offset = { x: 0, y: 0 };
      State.setView(1, 0, 0);
      applyTransform();
    }
  };
})();