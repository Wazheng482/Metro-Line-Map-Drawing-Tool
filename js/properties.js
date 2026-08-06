// 属性面板
const Properties = (() => {
  let panel;
  let skipRender = false;

  function init() {
    panel = document.getElementById('propertyPanel');
    State.subscribe(() => {
      if (!skipRender) render();
    });
    render();
  }

  function render() {
    const selected = State.getSelectedData();
    const state = State.getState();

    if (!selected) {
      panel.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>选择画布中的元素以编辑属性</p>
        </div>
      `;
      return;
    }

    if (state.selectedElement.type === 'station') {
      renderStationProps(selected);
    } else if (state.selectedElement.type === 'line') {
      renderLineProps(selected);
    } else if (state.selectedElement.type === 'text') {
      renderTextProps(selected);
    }
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      };
    }
    return { r: 0, g: 0, b: 0 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function renderColorSlider(color, idPrefix, onChange) {
    const rgb = hexToRgb(color);
    const currentColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    
    return `
      <div class="rgb-slider-group">
        <div class="rgb-preview" id="${idPrefix}Preview" style="background:${currentColor}"></div>
        <div class="rgb-inputs">
          <div class="rgb-row">
            <span class="rgb-label r">R</span>
            <input type="range" min="0" max="255" value="${rgb.r}" id="${idPrefix}R" class="rgb-r">
            <span class="rgb-value" id="${idPrefix}RVal">${rgb.r}</span>
          </div>
          <div class="rgb-row">
            <span class="rgb-label g">G</span>
            <input type="range" min="0" max="255" value="${rgb.g}" id="${idPrefix}G" class="rgb-g">
            <span class="rgb-value" id="${idPrefix}GVal">${rgb.g}</span>
          </div>
          <div class="rgb-row">
            <span class="rgb-label b">B</span>
            <input type="range" min="0" max="255" value="${rgb.b}" id="${idPrefix}B" class="rgb-b">
            <span class="rgb-value" id="${idPrefix}BVal">${rgb.b}</span>
          </div>
          <div class="rgb-hex-row">
            <span class="rgb-label">#</span>
            <input type="text" class="rgb-hex-input" id="${idPrefix}Hex" value="${currentColor}" maxlength="7">
          </div>
        </div>
      </div>
    `;
  }

  function bindColorSlider(idPrefix, initialColor, onChange) {
    let rgb = hexToRgb(initialColor);
    
    const rInput = document.getElementById(`${idPrefix}R`);
    const gInput = document.getElementById(`${idPrefix}G`);
    const bInput = document.getElementById(`${idPrefix}B`);
    const rVal = document.getElementById(`${idPrefix}RVal`);
    const gVal = document.getElementById(`${idPrefix}GVal`);
    const bVal = document.getElementById(`${idPrefix}BVal`);
    const hexInput = document.getElementById(`${idPrefix}Hex`);
    const preview = document.getElementById(`${idPrefix}Preview`);

    function updateFromRgb() {
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      preview.style.background = hex;
      hexInput.value = hex;
      skipRender = true;
      onChange(hex);
      skipRender = false;
    }

    rInput.addEventListener('input', e => {
      rgb.r = parseInt(e.target.value);
      rVal.textContent = rgb.r;
      updateFromRgb();
    });
    gInput.addEventListener('input', e => {
      rgb.g = parseInt(e.target.value);
      gVal.textContent = rgb.g;
      updateFromRgb();
    });
    bInput.addEventListener('input', e => {
      rgb.b = parseInt(e.target.value);
      bVal.textContent = rgb.b;
      updateFromRgb();
    });
    hexInput.addEventListener('input', e => {
      let val = e.target.value;
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        rgb = hexToRgb(val);
        rInput.value = rgb.r;
        gInput.value = rgb.g;
        bInput.value = rgb.b;
        rVal.textContent = rgb.r;
        gVal.textContent = rgb.g;
        bVal.textContent = rgb.b;
        preview.style.background = val;
        skipRender = true;
        onChange(val);
        skipRender = false;
      }
    });
  }

  function renderStationProps(station) {
    const positions = [
      { key: 'top-left', icon: '↖' },
      { key: 'top', icon: '↑' },
      { key: 'top-right', icon: '↗' },
      { key: 'left', icon: '←' },
      { key: '', icon: '' },
      { key: 'right', icon: '→' },
      { key: 'bottom-left', icon: '↙' },
      { key: 'bottom', icon: '↓' },
      { key: 'bottom-right', icon: '↘' }
    ];

    panel.innerHTML = `
      <div class="prop-form">
        <div class="prop-group">
          <label class="prop-label">站点名称（中文）</label>
          <input type="text" class="prop-input" id="stationName" value="${escapeHtml(station.name)}" placeholder="输入站点名称">
        </div>
        <div class="prop-group">
          <label class="prop-label">站点名称（英文）</label>
          <input type="text" class="prop-input" id="stationNameEn" value="${escapeHtml(station.nameEn || '')}" placeholder="Station Name">
        </div>
        <div class="prop-group">
          <label class="prop-label">站点类型</label>
          <select class="prop-input prop-select" id="stationType">
            <option value="normal" ${station.type === 'normal' ? 'selected' : ''}>普通站点</option>
            <option value="interchange" ${station.type === 'interchange' ? 'selected' : ''}>换乘站点</option>
          </select>
        </div>
        <div class="prop-group">
          <label class="prop-label">标签位置</label>
          <div class="position-grid" id="positionGrid">
            ${positions.map(p => p.key ? `
              <button class="position-btn ${station.labelPosition === p.key ? 'active' : ''}" data-position="${p.key}" title="${p.key}">
                ${p.icon}
              </button>
            ` : '<div class="position-btn empty"></div>').join('')}
          </div>
        </div>
        <div class="prop-group">
          <button class="btn-ghost" id="deleteStationBtn" style="width:100%; justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除站点
          </button>
        </div>
      </div>
    `;

    document.getElementById('stationName').addEventListener('input', (e) => {
      skipRender = true;
      State.updateStation(station.id, { name: e.target.value }, { silent: true });
      skipRender = false;
    });
    document.getElementById('stationName').addEventListener('change', () => {
      State.pushHistory();
    });

    document.getElementById('stationNameEn').addEventListener('input', (e) => {
      skipRender = true;
      State.updateStation(station.id, { nameEn: e.target.value }, { silent: true });
      skipRender = false;
    });
    document.getElementById('stationNameEn').addEventListener('change', () => {
      State.pushHistory();
    });

    document.getElementById('stationType').addEventListener('change', (e) => {
      State.updateStation(station.id, { type: e.target.value });
    });

    document.querySelectorAll('#positionGrid .position-btn:not(.empty)').forEach(btn => {
      btn.addEventListener('click', () => {
        State.updateStation(station.id, { labelPosition: btn.dataset.position });
      });
    });

    document.getElementById('deleteStationBtn').addEventListener('click', () => {
      State.deleteStation(station.id);
    });
  }

  function renderLineProps(line) {
    panel.innerHTML = `
      <div class="prop-form">
        <div class="prop-group">
          <label class="prop-label">线路名称（中文）</label>
          <input type="text" class="prop-input" id="lineName" value="${escapeHtml(line.name)}" placeholder="输入线路名称">
        </div>
        <div class="prop-group">
          <label class="prop-label">线路名称（英文）</label>
          <input type="text" class="prop-input" id="lineNameEn" value="${escapeHtml(line.nameEn || '')}" placeholder="Line Name">
        </div>
        <div class="prop-group">
          <label class="prop-label">线路颜色</label>
          ${renderColorSlider(line.color, 'lineColor', (hex) => {
            State.updateLine(line.id, { color: hex });
          })}
        </div>
        <div class="prop-group">
          <label class="prop-label">线路信息</label>
          <div style="font-size:12px; color:var(--text-muted); padding:8px; background:var(--bg-primary); border-radius:6px;">
            <div>站点数: ${line.stationIds.length}</div>
            <div style="margin-top:4px; line-height:1.6;">途经: ${line.stationIds.map(id => getStationName(id)).join(' → ')}</div>
          </div>
        </div>
        <div class="prop-group">
          <button class="btn-ghost" id="reconnectLineBtn" style="width:100%; justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            重新连接
          </button>
        </div>
        <div class="prop-group">
          <button class="btn-ghost" id="deleteLineBtn" style="width:100%; justify-content:center; color:var(--danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除线路
          </button>
        </div>
      </div>
    `;

    document.getElementById('lineName').addEventListener('input', (e) => {
      skipRender = true;
      State.updateLine(line.id, { name: e.target.value }, { silent: true });
      skipRender = false;
    });
    document.getElementById('lineName').addEventListener('change', () => {
      State.pushHistory();
    });

    document.getElementById('lineNameEn').addEventListener('input', (e) => {
      skipRender = true;
      State.updateLine(line.id, { nameEn: e.target.value }, { silent: true });
      skipRender = false;
    });
    document.getElementById('lineNameEn').addEventListener('change', () => {
      State.pushHistory();
    });

    bindColorSlider('lineColor', line.color, (hex) => {
      State.updateLine(line.id, { color: hex }, { silent: true });
    });
    document.getElementById('lineColorHex').addEventListener('change', () => {
      State.pushHistory();
    });

    document.getElementById('reconnectLineBtn').addEventListener('click', () => {
      State.setReconnectingLine(line.id);
      State.setTool('line');
    });

    document.getElementById('deleteLineBtn').addEventListener('click', () => {
      State.deleteLine(line.id);
    });
  }

  function renderTextProps(tb) {
    panel.innerHTML = `
      <div class="prop-form">
        <div class="prop-group">
          <label class="prop-label">文本内容</label>
          <input type="text" class="prop-input" id="textContent" value="${escapeHtml(tb.content)}" placeholder="输入文本">
        </div>
        <div class="prop-group">
          <label class="prop-label">字体</label>
          <select class="prop-input prop-select" id="textFont">
            <option value="Microsoft YaHei" ${tb.fontFamily === 'Microsoft YaHei' ? 'selected' : ''}>微软雅黑</option>
            <option value="SimSun" ${tb.fontFamily === 'SimSun' ? 'selected' : ''}>宋体</option>
            <option value="KaiTi" ${tb.fontFamily === 'KaiTi' ? 'selected' : ''}>楷体</option>
            <option value="FangSong" ${tb.fontFamily === 'FangSong' ? 'selected' : ''}>仿宋</option>
            <option value="SimHei" ${tb.fontFamily === 'SimHei' ? 'selected' : ''}>黑体</option>
            <option value="sans-serif" ${tb.fontFamily === 'sans-serif' ? 'selected' : ''}>无衬线</option>
            <option value="serif" ${tb.fontFamily === 'serif' ? 'selected' : ''}>衬线体</option>
          </select>
        </div>
        <div class="prop-group">
          <label class="prop-label">字体大小</label>
          <div class="font-size-row">
            <input type="range" min="10" max="48" value="${tb.fontSize}" id="fontSize">
            <span class="font-size-value" id="fontSizeValue">${tb.fontSize}</span>
          </div>
        </div>
        <div class="prop-group">
          <label class="prop-label">颜色</label>
          ${renderColorSlider(tb.color, 'textColor', (hex) => {
            State.updateTextBlock(tb.id, { color: hex });
          })}
        </div>
        <div class="prop-group">
          <button class="btn-ghost" id="deleteTextBtn" style="width:100%; justify-content:center; color:var(--danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除文本
          </button>
        </div>
      </div>
    `;

    document.getElementById('textContent').addEventListener('input', (e) => {
      skipRender = true;
      State.updateTextBlock(tb.id, { content: e.target.value }, { silent: true });
      skipRender = false;
    });
    document.getElementById('textContent').addEventListener('change', () => {
      State.pushHistory();
    });

    document.getElementById('textFont').addEventListener('change', (e) => {
      State.updateTextBlock(tb.id, { fontFamily: e.target.value });
    });

    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    fontSize.addEventListener('input', (e) => {
      fontSizeValue.textContent = e.target.value;
      skipRender = true;
      State.updateTextBlock(tb.id, { fontSize: parseInt(e.target.value) }, { silent: true });
      skipRender = false;
    });
    fontSize.addEventListener('change', () => {
      State.pushHistory();
    });

    bindColorSlider('textColor', tb.color, (hex) => {
      State.updateTextBlock(tb.id, { color: hex }, { silent: true });
    });
    document.getElementById('textColorHex').addEventListener('change', () => {
      State.pushHistory();
    });

    document.getElementById('deleteTextBtn').addEventListener('click', () => {
      State.deleteTextBlock(tb.id);
    });
  }

  function getStationName(stationId) {
    const state = State.getState();
    const station = state.stations.find(s => s.id === stationId);
    return station ? station.name : '未知';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return { init };
})();