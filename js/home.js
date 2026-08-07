// 主页与项目管理
const Home = (() => {
  const STORAGE_KEY = 'metroMapProjects';
  const CURRENT_KEY = 'metroMapCurrentProject';
  let homeView, editorView, projectListEl, recentListEl;

  function init() {
    homeView = document.getElementById('homeView');
    editorView = document.getElementById('app');
    projectListEl = document.getElementById('projectList');
    recentListEl = document.getElementById('recentList');

    document.getElementById('homeNewBtn').addEventListener('click', createNewProject);
    document.getElementById('homeImportBtn').addEventListener('click', importProject);
    document.getElementById('homeImportInput').addEventListener('change', handleImportFile);

    // 主页设置按钮（双重绑定确保可用）
    const homeSettingsBtn = document.getElementById('homeSettingsBtn');
    if (homeSettingsBtn) {
      homeSettingsBtn.addEventListener('click', () => {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.add('show');
      });
    }

    // 新建项目弹窗
    const newProjectModal = document.getElementById('newProjectModal');
    const closeNewProjectBtn = document.getElementById('closeNewProjectBtn');
    const cancelNewProjectBtn = document.getElementById('cancelNewProjectBtn');
    const confirmNewProjectBtn = document.getElementById('confirmNewProjectBtn');
    const newProjectNameInput = document.getElementById('newProjectName');

    if (closeNewProjectBtn) {
      closeNewProjectBtn.addEventListener('click', () => newProjectModal.classList.remove('show'));
    }
    if (cancelNewProjectBtn) {
      cancelNewProjectBtn.addEventListener('click', () => newProjectModal.classList.remove('show'));
    }
    if (newProjectModal) {
      newProjectModal.addEventListener('click', (e) => {
        if (e.target === newProjectModal) newProjectModal.classList.remove('show');
      });
    }
    if (confirmNewProjectBtn) {
      confirmNewProjectBtn.addEventListener('click', confirmNewProject);
    }
    if (newProjectNameInput) {
      newProjectNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmNewProject();
        }
      });
    }

    renderProjectList();
    renderRecentList();
  }

  function show() {
    homeView.style.display = 'flex';
    editorView.style.display = 'none';
    renderProjectList();
    renderRecentList();
  }

  function hide() {
    homeView.style.display = 'none';
    editorView.style.display = 'flex';
  }

  function getProjects() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  function renderProjectList() {
    const projects = getProjects();
    if (projects.length === 0) {
      projectListEl.innerHTML = '<div class="project-empty">暂无项目，点击上方按钮创建或导入</div>';
      return;
    }

    // 按修改时间倒序
    projects.sort((a, b) => new Date(b.modified) - new Date(a.modified));

    projectListEl.innerHTML = projects.map(p => `
      <div class="project-item" data-id="${p.id}">
        <div class="project-info">
          <div class="project-name">${escapeHtml(p.name)}</div>
          <div class="project-meta">
            <span>${p.stations || 0} 站 / ${p.lines || 0} 线</span>
            <span>${formatDate(p.modified)}</span>
          </div>
        </div>
        <button class="project-delete" data-id="${p.id}" title="删除">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');

    // 绑定点击事件
    projectListEl.querySelectorAll('.project-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.project-delete')) return;
        openProject(item.dataset.id);
      });
    });

    projectListEl.querySelectorAll('.project-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProject(btn.dataset.id);
      });
    });
  }

  function renderRecentList() {
    if (!recentListEl) return;
    const recentIds = getRecentIds();
    const projects = getProjects();

    // 过滤出最近打开的项目（最多5个）
    const recentProjects = recentIds
      .map(id => projects.find(p => p.id === id))
      .filter(p => p)
      .slice(0, 5);

    if (recentProjects.length === 0) {
      recentListEl.innerHTML = '<div class="project-empty">暂无最近项目</div>';
      return;
    }

    recentListEl.innerHTML = recentProjects.map(p => `
      <div class="project-item" data-id="${p.id}">
        <div class="project-info">
          <div class="project-name">${escapeHtml(p.name)}</div>
          <div class="project-meta">
            <span>${p.stations || 0} 站 / ${p.lines || 0} 线</span>
            <span>${formatDate(p.modified)}</span>
          </div>
        </div>
      </div>
    `).join('');

    recentListEl.querySelectorAll('.project-item').forEach(item => {
      item.addEventListener('click', () => {
        openProject(item.dataset.id);
      });
    });
  }

  function getRecentIds() {
    try {
      return JSON.parse(localStorage.getItem('metroMapRecent') || '[]');
    } catch (e) {
      return [];
    }
  }

  function addRecent(id) {
    let recent = getRecentIds().filter(rid => rid !== id);
    recent.unshift(id);
    recent = recent.slice(0, 10);
    localStorage.setItem('metroMapRecent', JSON.stringify(recent));
  }

  function createNewProject() {
    const modal = document.getElementById('newProjectModal');
    if (modal) {
      document.getElementById('newProjectName').value = '';
      document.getElementById('newProjectInfo').value = '';
      modal.classList.add('show');
      setTimeout(() => document.getElementById('newProjectName').focus(), 100);
    } else {
      doCreateNewProject('未命名项目', '');
    }
  }

  function confirmNewProject() {
    const nameInput = document.getElementById('newProjectName');
    const infoInput = document.getElementById('newProjectInfo');
    let name = nameInput.value.trim();
    const info = infoInput.value.trim();

    if (!name) {
      name = '未命名项目';
    }

    document.getElementById('newProjectModal').classList.remove('show');
    doCreateNewProject(name, info);
  }

  function doCreateNewProject(name, info) {
    State.clearAll();
    State.setZoom(1);
    State.setOffset(0, 0);
    localStorage.removeItem(CURRENT_KEY);
    localStorage.setItem('metroMapCurrentProjectName', name);
    localStorage.setItem('metroMapCurrentProjectInfo', info);
    updateProjectNameDisplay(name);
    hide();
  }

  function updateProjectNameDisplay(name) {
    const el = document.getElementById('currentProjectName');
    if (el) {
      el.textContent = name || 'Metro Line Map Drawing Tool';
    }
  }

  function openProject(id) {
    const projects = getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return;

    State.loadState(project.data.stations, project.data.lines, project.data.textBlocks);
    State.setZoom(1);
    State.setOffset(0, 0);
    localStorage.setItem(CURRENT_KEY, id);
    localStorage.setItem('metroMapCurrentProjectName', project.name);
    localStorage.setItem('metroMapCurrentProjectInfo', project.info || '');
    updateProjectNameDisplay(project.name);
    addRecent(id);
    hide();
  }

  function saveCurrentProject() {
    const state = State.getState();
    if (state.stations.length === 0 && state.lines.length === 0 && state.textBlocks.length === 0) {
      alert('画布为空，无法保存。');
      return;
    }

    const existingId = localStorage.getItem(CURRENT_KEY);
    const projects = getProjects();
    const existing = projects.find(p => p.id === existingId);

    const name = localStorage.getItem('metroMapCurrentProjectName') || '未命名项目';
    const info = localStorage.getItem('metroMapCurrentProjectInfo') || '';

    const projectData = State.exportProjectData(name);
    const summary = {
      id: existingId || generateProjectId(),
      name: name,
      info: info,
      data: projectData.data,
      stations: state.stations.length,
      lines: state.lines.length,
      created: existing ? existing.created : new Date().toISOString(),
      modified: new Date().toISOString()
    };

    if (existing) {
      const idx = projects.findIndex(p => p.id === existingId);
      projects[idx] = summary;
    } else {
      projects.push(summary);
      localStorage.setItem(CURRENT_KEY, summary.id);
    }

    saveProjects(projects);
    alert('项目已保存：' + name);
  }

  function saveCurrentAndReturn() {
    // 保存当前进度到临时槽位（不提示），然后返回主页
    const state = State.getState();
    const existingId = localStorage.getItem(CURRENT_KEY);

    if (existingId) {
      // 如果是已保存的项目，更新它
      const projects = getProjects();
      const idx = projects.findIndex(p => p.id === existingId);
      if (idx !== -1) {
        projects[idx].data = {
          stations: JSON.parse(JSON.stringify(state.stations)),
          lines: JSON.parse(JSON.stringify(state.lines)),
          textBlocks: JSON.parse(JSON.stringify(state.textBlocks))
        };
        projects[idx].stations = state.stations.length;
        projects[idx].lines = state.lines.length;
        projects[idx].modified = new Date().toISOString();
        saveProjects(projects);
      }
    }
    // 如果不是已保存的项目，不自动保存，只返回主页
    show();
  }

  function deleteProject(id) {
    if (!confirm('确定删除此项目？此操作不可撤销。')) return;
    const projects = getProjects().filter(p => p.id !== id);
    saveProjects(projects);
    if (localStorage.getItem(CURRENT_KEY) === id) {
      localStorage.removeItem(CURRENT_KEY);
    }
    // 同步清理最近打开列表
    const recent = getRecentIds().filter(rid => rid !== id);
    localStorage.setItem('metroMapRecent', JSON.stringify(recent));
    renderProjectList();
    renderRecentList();
  }

  // MLMDT 导入
  function importProject() {
    document.getElementById('homeImportInput').click();
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.format !== 'MLMDT') {
          alert('文件格式不正确，请使用 MLMDT 文件。');
          return;
        }
        const success = State.importProjectData(data);
        if (success) {
          // 保存为新项目
          const state = State.getState();
          const projects = getProjects();
          const newProject = {
            id: generateProjectId(),
            name: data.name || '导入的项目',
            data: {
              stations: JSON.parse(JSON.stringify(state.stations)),
              lines: JSON.parse(JSON.stringify(state.lines)),
              textBlocks: JSON.parse(JSON.stringify(state.textBlocks))
            },
            stations: state.stations.length,
            lines: state.lines.length,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
          };
          projects.push(newProject);
          saveProjects(projects);
          localStorage.setItem(CURRENT_KEY, newProject.id);
          localStorage.setItem('metroMapCurrentProjectName', newProject.name);
          localStorage.setItem('metroMapCurrentProjectInfo', '');
          updateProjectNameDisplay(newProject.name);
          State.setZoom(1);
          State.setOffset(0, 0);
          hide();
        } else {
          alert('导入失败：项目数据无效。');
        }
      } catch (err) {
        alert('导入失败：文件解析错误。');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 重置以便再次导入同一文件
  }

  // MLMDT 导出（从导出窗口调用）
  function exportMLMDT() {
    const state = State.getState();
    const name = localStorage.getItem('metroMapCurrentProjectName') || '未命名项目';

    const projectData = State.exportProjectData(name);
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.mlmdt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function generateProjectId() {
    return 'project_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return { init, show, hide, createNewProject, saveCurrentProject, saveCurrentAndReturn, exportMLMDT };
})();
