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
          <p>${Settings.t('chooseElement')}</p>
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
    const sliderGroup = preview.closest('.rgb-slider-group');

    function updateFromRgb() {
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      preview.style.background = hex;
      preview.style.borderColor = hex;
      // 更新滑动条轨迹颜色，使其跟随当前颜色
      rInput.style.background = `linear-gradient(to right, rgb(0,${rgb.g},${rgb.b}), rgb(255,${rgb.g},${rgb.b}))`;
      gInput.style.background = `linear-gradient(to right, rgb(${rgb.r},0,${rgb.b}), rgb(${rgb.r},255,${rgb.b}))`;
      bInput.style.background = `linear-gradient(to right, rgb(${rgb.r},${rgb.g},0), rgb(${rgb.r},${rgb.g},255))`;
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
        preview.style.borderColor = val;
        // 同步更新滑动条轨迹
        rInput.style.background = `linear-gradient(to right, rgb(0,${rgb.g},${rgb.b}), rgb(255,${rgb.g},${rgb.b}))`;
        gInput.style.background = `linear-gradient(to right, rgb(${rgb.r},0,${rgb.b}), rgb(${rgb.r},255,${rgb.b}))`;
        bInput.style.background = `linear-gradient(to right, rgb(${rgb.r},${rgb.g},0), rgb(${rgb.r},${rgb.g},255))`;
        skipRender = true;
        onChange(val);
        skipRender = false;
      }
    });
    
    // 初始化背景色
    updateFromRgb();
  }

  function renderStationProps(station) {
    const positions = [
      { key: 'auto', label: '⊗', text: Settings.t('labelAuto') },
      { key: 'top-left', label: '↖', text: '左上' },
      { key: 'top', label: '↑', text: '上' },
      { key: 'top-right', label: '↗', text: '右上' },
      { key: 'left', label: '←', text: '左' },
      { key: 'center', label: '●', text: '中' },
      { key: 'right', label: '→', text: '右' },
      { key: 'bottom-left', label: '↙', text: '左下' },
      { key: 'bottom', label: '↓', text: '下' },
      { key: 'bottom-right', label: '↘', text: '右下' }
    ];

    // 计算默认位置
    const currentPos = station.labelPosition || 'auto';

    panel.innerHTML = `
      <div class="prop-form">
        <div class="prop-group">
          <label class="prop-label">${Settings.t('stationNameCn')}</label>
          <input type="text" class="prop-input" id="stationName" value="${escapeHtml(station.name)}" placeholder="${Settings.t('enterStationName')}">
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('stationNameEn')}</label>
          <input type="text" class="prop-input" id="stationNameEn" value="${escapeHtml(station.nameEn || '')}" placeholder="Station Name">
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('labelPosition')}</label>
          <select class="prop-input prop-select" id="labelPosition">
            ${positions.map(p => `
              <option value="${p.key}" ${currentPos === p.key ? 'selected' : ''}>${p.text}</option>
            `).join('')}
          </select>
        </div>
        <div class="prop-group">
          <button class="btn-ghost" id="deleteStationBtn" style="width:100%; justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            ${Settings.t('deleteStation')}
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

    document.getElementById('labelPosition').addEventListener('change', (e) => {
      State.updateStation(station.id, { labelPosition: e.target.value });
    });

    document.getElementById('deleteStationBtn').addEventListener('click', () => {
      State.deleteStation(station.id);
    });
  }

  function renderLineProps(line) {
    panel.innerHTML = `
      <div class="prop-form">
        <div class="prop-group">
          <label class="prop-label">${Settings.t('lineNameCn')}</label>
          <input type="text" class="prop-input" id="lineName" value="${escapeHtml(line.name)}" placeholder="${Settings.t('enterLineName')}">
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('lineNameEn')}</label>
          <input type="text" class="prop-input" id="lineNameEn" value="${escapeHtml(line.nameEn || '')}" placeholder="Line Name">
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('lineType')}</label>
          <select class="prop-input prop-select" id="lineType" style="width:140px;">
            <option value="normal" ${(line.type || 'normal') === 'normal' ? 'selected' : ''}>${Settings.t('normalLine')}</option>
            <option value="highspeed" ${line.type === 'highspeed' ? 'selected' : ''}>${Settings.t('highSpeedLine')}</option>
            <option value="hollow" ${line.type === 'hollow' ? 'selected' : ''}>${Settings.t('hollowLine')}</option>
            <option value="dashed" ${line.type === 'dashed' ? 'selected' : ''}>${Settings.t('dashedLine')}</option>
          </select>
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('lineColor')}</label>
          ${renderColorSlider(line.color, 'lineColor', (hex) => {
            State.updateLine(line.id, { color: hex });
          })}
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('stationInfo')}</label>
          <div style="font-size:12px; color:var(--text-muted); padding:8px; background:var(--bg-primary); border-radius:6px;">
            <div>${Settings.t('loopLineLabel')}: ${line.isLoop ? Settings.t('yes') : Settings.t('no')}</div>
            <div style="margin-top:4px;">${Settings.t('stationCount')}: ${line.stationIds.length}</div>
            <div style="margin-top:4px; line-height:1.6;">${Settings.t('passThrough')}: ${line.stationIds.map(id => getStationName(id)).join(' → ')}${line.isLoop ? ' → ' + getStationName(line.stationIds[0]) : ''}</div>
          </div>
        </div>
        <div class="prop-group">
          <button class="btn-ghost" id="reconnectLineBtn" style="width:100%; justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            ${Settings.t('reconnectLine')}
          </button>
        </div>
        <div class="prop-group">
          <button class="btn-ghost" id="deleteLineBtn" style="width:100%; justify-content:center; color:var(--danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            ${Settings.t('deleteLine')}
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

    const lineTypeSel = document.getElementById('lineType');
    if (lineTypeSel) {
      lineTypeSel.addEventListener('change', (e) => {
        State.updateLine(line.id, { type: e.target.value });
      });
    }

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
          <label class="prop-label">${Settings.t('textContent')}</label>
          <input type="text" class="prop-input" id="textContent" value="${escapeHtml(tb.content)}" placeholder="${Settings.t('enterText')}">
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('fontFamily')}</label>
          <select class="prop-input prop-select" id="textFont">
            <option value="Microsoft YaHei" ${tb.fontFamily === 'Microsoft YaHei' ? 'selected' : ''}>${Settings.t('fontYaHei')}</option>
            <option value="SimSun" ${tb.fontFamily === 'SimSun' ? 'selected' : ''}>${Settings.t('fontSimSun')}</option>
            <option value="KaiTi" ${tb.fontFamily === 'KaiTi' ? 'selected' : ''}>${Settings.t('fontKaiTi')}</option>
            <option value="FangSong" ${tb.fontFamily === 'FangSong' ? 'selected' : ''}>${Settings.t('fontFangSong')}</option>
            <option value="SimHei" ${tb.fontFamily === 'SimHei' ? 'selected' : ''}>${Settings.t('fontSimHei')}</option>
            <option value="sans-serif" ${tb.fontFamily === 'sans-serif' ? 'selected' : ''}>${Settings.t('fontSansSerif')}</option>
            <option value="serif" ${tb.fontFamily === 'serif' ? 'selected' : ''}>${Settings.t('fontSerif')}</option>
          </select>
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('fontSize')}</label>
          <div class="font-size-row">
            <input type="range" min="10" max="48" value="${tb.fontSize}" id="fontSize">
            <span class="font-size-value" id="fontSizeValue">${tb.fontSize}</span>
          </div>
        </div>
        <div class="prop-group">
          <label class="prop-label">${Settings.t('textColor')}</label>
          ${renderColorSlider(tb.color, 'textColor', (hex) => {
            State.updateTextBlock(tb.id, { color: hex });
          })}
        </div>
        <div class="prop-group">
          <button class="btn-ghost" id="deleteTextBtn" style="width:100%; justify-content:center; color:var(--danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            ${Settings.t('deleteText')}
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
    return station ? station.name : Settings.t('unknown');
  }

  function focusStationName(stationId) {
    setTimeout(() => {
      const el = document.getElementById('stationName');
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return { init, render, focusStationName };
})();