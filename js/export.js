// 导出功能
const Export = (() => {
  let modal;
  let previewArea;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function init() {
    modal = document.getElementById('exportModal');
    previewArea = document.getElementById('previewArea');

    document.getElementById('exportBtn').addEventListener('click', showExport);
    document.getElementById('closeExportBtn').addEventListener('click', hideExport);

    // 图片下载面板展开/折叠
    const toggleImg = document.getElementById('toggleImageDownload');
    const imgPanel = document.getElementById('imageDownloadPanel');
    toggleImg.addEventListener('change', () => {
      imgPanel.classList.toggle('show', toggleImg.checked);
      updateStartBtn();
    });

    // 格式切换时显示/隐藏分辨率选项
    document.querySelectorAll('input[name="imgFormat"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const isPng = document.querySelector('input[name="imgFormat"]:checked').value === 'png';
        document.getElementById('resolutionGroup').style.display = isPng ? 'block' : 'none';
      });
    });

    // 音频下载面板展开/折叠
    const toggleAudio = document.getElementById('toggleAudioDownload');
    const audioPanel = document.getElementById('audioDownloadPanel');
    toggleAudio.addEventListener('change', () => {
      audioPanel.classList.toggle('show', toggleAudio.checked);
      updateStartBtn();
    });

    // 图例位置变更 → 刷新预览
    const legendCorner = document.getElementById('legendCorner');
    if (legendCorner) {
      legendCorner.addEventListener('change', generatePreview);
    }

    const legendLangCn = document.getElementById('legendLangCn');
    const legendLangEn = document.getElementById('legendLangEn');
    if (legendLangCn) legendLangCn.addEventListener('change', generatePreview);
    if (legendLangEn) legendLangEn.addEventListener('change', generatePreview);

    // 统一"开始下载"按钮
    document.getElementById('startDownloadBtn').addEventListener('click', startDownload);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideExport();
    });
  }

  function updateStartBtn() {
    const imgChecked = document.getElementById('toggleImageDownload').checked;
    const audioChecked = document.getElementById('toggleAudioDownload').checked;
    const btn = document.getElementById('startDownloadBtn');
    if (!imgChecked && !audioChecked) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  }

  async function startDownload() {
    const imgChecked = document.getElementById('toggleImageDownload').checked;
    const audioChecked = document.getElementById('toggleAudioDownload').checked;

    if (!imgChecked && !audioChecked) {
      alert('请至少选择一项下载内容。');
      return;
    }

    // 图片和音频同时开始
    const tasks = [];
    if (imgChecked) {
      const format = document.querySelector('input[name="imgFormat"]:checked').value;
      if (format === 'svg') downloadSvg();
      else downloadPng();
    }
    if (audioChecked) {
      tasks.push(downloadAudioZip());
    }
    await Promise.all(tasks);
  }

  function showExport() {
    modal.classList.add('show');
    updateStartBtn();
    generatePreview();
  }

  function hideExport() {
    modal.classList.remove('show');
  }

  function generatePreview() {
    const state = State.getState();

    // 创建离屏SVG用于导出
    const exportSvg = createExportSvg(state);

    // 显示预览
    previewArea.innerHTML = '';
    previewArea.appendChild(exportSvg);
  }

  function getLegendCorner() {
    const sel = document.getElementById('legendCorner');
    return sel ? sel.value : 'top-right';
  }

  function getLegendLangs() {
    const cn = document.getElementById('legendLangCn');
    const en = document.getElementById('legendLangEn');
    return {
      cn: cn ? cn.checked : true,
      en: en ? en.checked : true
    };
  }

  function createExportSvg(state) {
    // 计算边界
    const bounds = calculateBounds(state);

    const padding = 60;
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    // 白色背景
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', width);
    bg.setAttribute('height', height);
    bg.setAttribute('fill', '#ffffff');
    svg.appendChild(bg);

    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    // 渲染线路（不再渲染中点线路名标签）
    state.lines.forEach(line => {
      const stations = line.stationIds.map(id => state.stations.find(s => s.id === id)).filter(Boolean);
      if (stations.length < 2) return;

      // 环线：首尾相连
      const pathStations = line.isLoop ? [...stations, stations[0]] : stations;
      const points = Geometry.generateMultiStationPath(pathStations);
      const pathData = Geometry.pointsToPathData(
        points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }))
      );

      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', line.color);
      path.setAttribute('stroke-width', 4);
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
    });

    // 渲染站点（含双语标签）
    state.stations.forEach(station => {
      const linesReferencing = state.lines.filter(l => l.stationIds.includes(station.id));
      const isTransfer = linesReferencing.length > 1;
      const x = station.x + offsetX;
      const y = station.y + offsetY;

      // 站点圆形
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', isTransfer ? 10 : 7);

      if (isTransfer) {
        circle.setAttribute('fill', '#ffffff');
        circle.setAttribute('stroke', '#0f172a');
        circle.setAttribute('stroke-width', '3');

        const innerCircle = document.createElementNS(SVG_NS, 'circle');
        innerCircle.setAttribute('cx', x);
        innerCircle.setAttribute('cy', y);
        innerCircle.setAttribute('r', 4);
        innerCircle.setAttribute('fill', '#0f172a');
        svg.appendChild(innerCircle);
      } else {
        circle.setAttribute('fill', '#0f172a');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '2');
      }
      svg.appendChild(circle);

      // 中文标签
      if (station.name) {
        const offset = Geometry.getLabelOffset(station.labelPosition);
        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('x', x + offset.x);
        label.setAttribute('y', y + offset.y);
        label.setAttribute('text-anchor', offset.anchor);
        label.setAttribute('font-size', '13');
        label.setAttribute('font-weight', '500');
        label.setAttribute('font-family', 'Microsoft YaHei, sans-serif');
        label.setAttribute('fill', '#0f172a');
        label.textContent = station.name;
        svg.appendChild(label);

        // 英文标签（中文下方 y+14，字号 10，灰色）
        if (station.nameEn) {
          const labelEn = document.createElementNS(SVG_NS, 'text');
          labelEn.setAttribute('x', x + offset.x);
          labelEn.setAttribute('y', y + offset.y + 14);
          labelEn.setAttribute('text-anchor', offset.anchor);
          labelEn.setAttribute('font-size', '10');
          labelEn.setAttribute('font-family', 'Microsoft YaHei, sans-serif');
          labelEn.setAttribute('fill', '#64748b');
          labelEn.textContent = station.nameEn;
          svg.appendChild(labelEn);
        }
      }
    });

    // 渲染文本块
    state.textBlocks.forEach(tb => {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', tb.x + offsetX);
      text.setAttribute('y', tb.y + offsetY);
      text.setAttribute('font-family', tb.fontFamily);
      text.setAttribute('font-size', tb.fontSize);
      text.setAttribute('fill', tb.color);
      text.textContent = tb.content;
      svg.appendChild(text);
    });

    // 渲染角落图例
    appendCornerLegend(svg, state, width, height);

    return svg;
  }

  // 在指定角落添加图例（每条线路一条垂直色条 + 中英文名）
  function appendCornerLegend(svg, state, width, height) {
    if (!state.lines || state.lines.length === 0) return;

    const lines = state.lines;
    const pad = 12;
    const barWidth = 6;
    const barHeight = 40;
    const entryGap = 8;
    const textGap = 8;
    const langs = getLegendLangs();
    const showCn = langs.cn;
    const showEn = langs.en;

    function estimateTextWidth(line) {
      let w = 0;
      if (showCn) w = Math.max(w, (line.name || '').length * 14);
      if (showEn) w = Math.max(w, (line.nameEn || '').length * 7);
      return Math.max(60, w);
    }

    const maxTextWidth = Math.max(...lines.map(estimateTextWidth));
    const entryWidth = barWidth + textGap + maxTextWidth;
    const legendWidth = entryWidth + pad * 2;
    const legendHeight = lines.length * barHeight + (lines.length - 1) * entryGap + pad * 2;

    const corner = getLegendCorner();
    const margin = 20;
    let legendX, legendY;
    if (corner === 'top-left') {
      legendX = margin;
      legendY = margin;
    } else if (corner === 'top-right') {
      legendX = width - margin - legendWidth;
      legendY = margin;
    } else if (corner === 'bottom-left') {
      legendX = margin;
      legendY = height - margin - legendHeight;
    } else {
      legendX = width - margin - legendWidth;
      legendY = height - margin - legendHeight;
    }

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'legend');

    const bgRect = document.createElementNS(SVG_NS, 'rect');
    bgRect.setAttribute('x', legendX);
    bgRect.setAttribute('y', legendY);
    bgRect.setAttribute('width', legendWidth);
    bgRect.setAttribute('height', legendHeight);
    bgRect.setAttribute('fill', '#ffffff');
    bgRect.setAttribute('fill-opacity', '0.85');
    bgRect.setAttribute('stroke', '#cbd5e1');
    bgRect.setAttribute('stroke-width', '1');
    bgRect.setAttribute('rx', '4');
    group.appendChild(bgRect);

    lines.forEach((line, i) => {
      const entryX = legendX + pad;
      const entryY = legendY + pad + i * (barHeight + entryGap);

      const bar = document.createElementNS(SVG_NS, 'rect');
      bar.setAttribute('x', entryX);
      bar.setAttribute('y', entryY);
      bar.setAttribute('width', barWidth);
      bar.setAttribute('height', barHeight);
      bar.setAttribute('fill', line.color || '#999999');
      bar.setAttribute('rx', '2');
      group.appendChild(bar);

      const textX = entryX + barWidth + textGap;
      let nameY = entryY + 16;

      if (showCn) {
        const nameCn = document.createElementNS(SVG_NS, 'text');
        nameCn.setAttribute('x', textX);
        nameCn.setAttribute('y', nameY);
        nameCn.setAttribute('font-size', '13');
        nameCn.setAttribute('font-weight', 'bold');
        nameCn.setAttribute('font-family', 'Microsoft YaHei, sans-serif');
        nameCn.setAttribute('fill', '#0f172a');
        nameCn.textContent = line.name || '未命名线路';
        group.appendChild(nameCn);
      }

      if (showEn) {
        const nameEn = document.createElementNS(SVG_NS, 'text');
        nameEn.setAttribute('x', textX);
        nameEn.setAttribute('y', nameY + (showCn ? 16 : 0));
        nameEn.setAttribute('font-size', '10');
        nameEn.setAttribute('font-family', 'Microsoft YaHei, sans-serif');
        nameEn.setAttribute('fill', '#64748b');
        nameEn.textContent = line.nameEn || '';
        group.appendChild(nameEn);
      }
    });

    svg.appendChild(group);
  }

  function calculateBounds(state) {
    const elements = [
      ...state.stations.map(s => ({ x: s.x, y: s.y })),
      ...state.textBlocks.map(t => ({ x: t.x, y: t.y }))
    ];

    if (elements.length === 0) {
      return { minX: -100, minY: -100, width: 200, height: 200 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(e => {
      minX = Math.min(minX, e.x);
      minY = Math.min(minY, e.y);
      maxX = Math.max(maxX, e.x);
      maxY = Math.max(maxY, e.y);
    });

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function downloadSvg() {
    const state = State.getState();
    const svg = createExportSvg(state);
    const svgData = new XMLSerializer().serializeToString(svg);

    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `metro-map-${Date.now()}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    const state = State.getState();
    const svg = createExportSvg(state);
    const svgData = new XMLSerializer().serializeToString(svg);

    const scaleSelect = document.getElementById('pngScale');
    const scale = scaleSelect ? parseInt(scaleSelect.value) : 2;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = svg.viewBox.baseVal.width * scale;
      canvas.height = svg.viewBox.baseVal.height * scale;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `metro-map-${scale}x-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };

    img.src = url;
  }

  // ============ 音频 ZIP 导出 ============

  // 检测换乘：两条线路若共享至少一个 stationId 则视为可换乘
  function getTransfersForLine(line, allLines) {
    const set = new Set(line.stationIds);
    return allLines.filter(other => other.id !== line.id && other.stationIds.some(id => set.has(id)));
  }

  // 文件名/路径安全化（移除 Windows/Linux 非法字符）
  function sanitizeFileName(name) {
    return String(name).replace(/[\/\\:*?"<>|]/g, '_').trim() || 'unnamed';
  }

  // 构建所有待写入 ZIP 的文本文件
  function buildAudioFilesData(state) {
    const cnFixed = [
      { name: '下一站.txt', content: '下一站' },
      { name: '可换乘.txt', content: '可换乘' },
      { name: '是本次列车的终点站.txt', content: '是本次列车的终点站' },
      { name: '车厢内严禁饮食.txt', content: '车厢内严禁饮食' },
      { name: '请上车的乘客往车厢中部走.txt', content: '请上车的乘客往车厢中部走' },
      { name: '本次列车开往.txt', content: '本次列车开往' },
      { name: '请勿在车厢地板上蹲、坐、躺、卧.txt', content: '请勿在车厢地板上蹲、坐、躺、卧' }
    ];
    const enFixed = [
      { name: 'Next station.txt', content: 'Next station' },
      { name: 'Interchange available.txt', content: 'Interchange available' },
      { name: 'This is the terminal station.txt', content: 'This is the terminal station' },
      { name: 'No eating or drinking in the carriage.txt', content: 'No eating or drinking in the carriage' },
      { name: 'Please move to the center of the carriage.txt', content: 'Please move to the center of the carriage' },
      { name: 'This train is bound for.txt', content: 'This train is bound for' },
      { name: 'Please do not squat, sit, lie down on the floor.txt', content: 'Please do not squat, sit, lie down on the floor' }
    ];

    const files = []; // { path, content }

    cnFixed.forEach(f => files.push({ path: `中文/固定音频/${f.name}`, content: f.content }));
    enFixed.forEach(f => files.push({ path: `英语/固定音频/${f.name}`, content: f.content }));

    state.lines.forEach(line => {
      const lineNameCn = (line.name || '未命名线路').trim() || '未命名线路';
      const lineNameEn = (line.nameEn || line.name || 'Unnamed Line').trim() || 'Unnamed Line';
      const safeLineCn = sanitizeFileName(lineNameCn);
      const safeLineEn = sanitizeFileName(lineNameEn);

      // 站点音频
      line.stationIds.forEach(sid => {
        const st = state.stations.find(s => s.id === sid);
        if (!st) return;
        const stNameCn = (st.name || '未命名站点').trim() || '未命名站点';
        const stNameEn = (st.nameEn || st.name || 'Unnamed Station').trim() || 'Unnamed Station';
        files.push({
          path: `中文/${safeLineCn}/${sanitizeFileName(stNameCn)}.txt`,
          content: stNameCn
        });
        files.push({
          path: `英语/${safeLineEn}/${sanitizeFileName(stNameEn)}.txt`,
          content: stNameEn
        });
      });

      // 换乘音频
      const transfers = getTransfersForLine(line, state.lines);
      transfers.forEach(other => {
        const otherNameCn = (other.name || '未命名线路').trim() || '未命名线路';
        const otherNameEn = (other.nameEn || other.name || 'Unnamed Line').trim() || 'Unnamed Line';
        files.push({
          path: `中文/${safeLineCn}/可换乘_${sanitizeFileName(otherNameCn)}.txt`,
          content: `可换乘${otherNameCn}`
        });
        files.push({
          path: `英语/${safeLineEn}/Interchange_${sanitizeFileName(otherNameEn)}.txt`,
          content: `Interchange ${otherNameEn}`
        });
      });
    });

    return files;
  }

  // 生成 gTTS 转换脚本（Python），用于将 ZIP 内文本文件批量转换为同名 MP3
  function buildGenerateAudioScript() {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
报站音频生成脚本

读取 ZIP 解压后所有 .txt 文本文件，使用 gTTS 生成对应的同名 .mp3 文件。
- 中文/ 目录下使用 lang='zh-CN'
- 英语/ 目录下使用 lang='en'
- 生成的 .mp3 与 .txt 文件位于同一目录

依赖：pip install gTTS
"""
import os
import sys

try:
    from gtts import gTTS
except ImportError:
    print('未安装 gTTS，请运行: pip install gTTS')
    sys.exit(1)


def read_text(txt_path):
    with open(txt_path, 'r', encoding='utf-8') as f:
        return f.read().strip()


def detect_lang(txt_path, root):
    rel = os.path.relpath(txt_path, root).replace('\\\\', '/')
    if rel.startswith('中文'):
        return 'zh-CN'
    if rel.startswith('英语'):
        return 'en'
    return 'en'


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    generated = 0
    skipped = 0
    failed = 0

    for dirpath, dirnames, filenames in os.walk(root):
        for fn in filenames:
            if not fn.lower().endswith('.txt'):
                continue
            txt_path = os.path.join(dirpath, fn)
            mp3_path = os.path.splitext(txt_path)[0] + '.mp3'
            if os.path.exists(mp3_path):
                skipped += 1
                continue
            try:
                text = read_text(txt_path)
                if not text:
                    continue
                lang = detect_lang(txt_path, root)
                tts = gTTS(text=text, lang=lang)
                tts.save(mp3_path)
                generated += 1
                print(f'生成: {os.path.relpath(mp3_path, root)}')
            except Exception as e:
                failed += 1
                print(f'失败: {os.path.relpath(txt_path, root)} -> {e}')

    print(f'完成。生成 {generated} 个，跳过 {skipped} 个已存在，失败 {failed} 个。')


if __name__ == '__main__':
    main()
`;
  }

  // ============ 浏览器内 TTS 录制为 WAV ============

  // AudioBuffer 转 WAV Blob
  function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    const numSamples = buffer.length;
    const dataSize = numSamples * numChannels * (bitDepth / 8);
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    function writeStr(off, s) { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    const channels = [];
    for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, channels[ch][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // 朗读单条文本并录制为 WAV Blob
  function recordTTS(text, lang, audioStream) {
    return new Promise((resolve, reject) => {
      let recorder;
      try {
        recorder = new MediaRecorder(audioStream);
      } catch (e) { reject(e); return; }
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        try {
          const webmBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const arrayBuffer = await webmBlob.arrayBuffer();
          const audioCtx = new AudioContext();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const wavBlob = audioBufferToWav(audioBuffer);
          audioCtx.close();
          resolve(wavBlob);
        } catch (e) {
          resolve(null);
        }
      };
      recorder.start();

      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.95;
      // 尝试选择对应语言的语音
      const voices = speechSynthesis.getVoices();
      const matched = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      if (matched) u.voice = matched;

      u.onend = () => { setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, 300); };
      u.onerror = () => { if (recorder.state !== 'inactive') recorder.stop(); };
      speechSynthesis.speak(u);
    });
  }

  // 显示进度浮层
  function showProgress(total) {
    const div = document.createElement('div');
    div.id = 'audioProgress';
    div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#f1f5f9;padding:24px 32px;border-radius:12px;z-index:99999;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,0.5);text-align:center;min-width:300px;';
    div.innerHTML = `
      <div style="margin-bottom:12px;font-weight:600;">正在生成报站音频...</div>
      <div style="background:#334155;border-radius:6px;height:8px;overflow:hidden;">
        <div id="audioProgressBar" style="background:#22c55e;height:100%;width:0%;transition:width 0.3s;"></div>
      </div>
      <div id="audioProgressText" style="margin-top:8px;font-size:12px;color:#94a3b8;">0 / ${total}</div>
    `;
    document.body.appendChild(div);
  }
  function updateProgress(done, total, label) {
    const bar = document.getElementById('audioProgressBar');
    const text = document.getElementById('audioProgressText');
    if (bar) bar.style.width = (done / total * 100) + '%';
    if (text) text.textContent = `${done} / ${total}` + (label ? ` — ${label}` : '');
  }
  function hideProgress() {
    const el = document.getElementById('audioProgress');
    if (el) el.remove();
  }

  async function downloadAudioZip() {
    if (typeof JSZip === 'undefined') { alert('JSZip 未加载，无法生成 ZIP。'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('当前浏览器不支持音频捕获，将导出文本文件 + Python 脚本。');
      return downloadTextOnlyZip();
    }

    const state = State.getState();
    const files = buildAudioFilesData(state);
    if (files.length === 0) { alert('没有可导出的线路数据。'); return; }

    // 请求用户共享标签页音频
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
    } catch (e) {
      // 用户拒绝或不支持，回退到纯文本
      return downloadTextOnlyZip();
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      stream.getTracks().forEach(t => t.stop());
      alert('未捕获到音频，请勾选"分享标签页音频"。将导出文本文件。');
      return downloadTextOnlyZip();
    }

    const audioStream = new MediaStream(audioTracks);
    // 停止视频轨（不需要）
    stream.getVideoTracks().forEach(t => t.stop());

    // 确保语音已加载
    if (speechSynthesis.getVoices().length === 0) {
      await new Promise(r => { speechSynthesis.onvoiceschanged = r; setTimeout(r, 1000); });
    }

    showProgress(files.length);
    const zip = new JSZip();
    let done = 0;

    for (const f of files) {
      const lang = f.path.startsWith('中文') ? 'zh-CN' : 'en';
      const label = f.path.split('/').pop().replace('.txt', '');
      updateProgress(done, files.length, label);

      try {
        const wavBlob = await recordTTS(f.content, lang, audioStream);
        if (wavBlob) {
          const wavPath = f.path.replace('.txt', '.wav');
          zip.file(wavPath, wavBlob);
        } else {
          zip.file(f.path, f.content); // 回退文本
        }
      } catch (e) {
        zip.file(f.path, f.content); // 回退文本
      }
      done++;
      updateProgress(done, files.length, label);
      // 间隔避免连续朗读卡顿
      await new Promise(r => setTimeout(r, 200));
    }

    // 停止音频捕获
    audioTracks.forEach(t => t.stop());
    hideProgress();

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metro-audio-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 纯文本回退方案
  async function downloadTextOnlyZip() {
    const state = State.getState();
    const files = buildAudioFilesData(state);
    const zip = new JSZip();
    files.forEach(f => zip.file(f.path, f.content));
    zip.file('generate_audio.py', buildGenerateAudioScript());
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metro-audio-text-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { init };
})();
