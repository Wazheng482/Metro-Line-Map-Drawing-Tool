// 工具栏
const Toolbar = (() => {
  function init() {
    setupToolButtons();
  }

  function setupToolButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'select' || tool === 'station' || tool === 'line') {
          State.setTool(tool);
        }
      });
    });

    // 监听 State 变化更新按钮高亮
    State.subscribe((state) => {
      document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === state.selectedTool);
      });
    });
  }

  return { init };
})();
