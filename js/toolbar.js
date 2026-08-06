// 右侧工具栏
const Toolbar = (() => {
  function init() {
    setupToolButtons();
    setupDragSources();
    State.subscribe(updateToolStates);
    updateToolStates();
  }

  function setupToolButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'select' || tool === 'line' || tool === 'text') {
          State.setTool(tool);
        }
      });
    });
  }

  function setupDragSources() {
    document.querySelectorAll('.tool-card[draggable="true"]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.tool);
        e.dataTransfer.effectAllowed = 'copy';

        const preview = document.createElement('div');
        preview.className = 'drag-preview drag-preview-station';
        preview.id = 'dragPreview';
        preview.style.left = e.clientX + 'px';
        preview.style.top = e.clientY + 'px';
        document.body.appendChild(preview);

        e.dataTransfer.setDragImage(new Image(), 0, 0);
      });

      card.addEventListener('drag', (e) => {
        const preview = document.getElementById('dragPreview');
        if (preview) {
          preview.style.left = e.clientX + 'px';
          preview.style.top = e.clientY + 'px';
        }
      });

      card.addEventListener('dragend', () => {
        const preview = document.getElementById('dragPreview');
        if (preview) preview.remove();
      });
    });
  }

  function updateToolStates(state) {
    const currentState = state || State.getState();

    document.querySelectorAll('.tool-btn').forEach(btn => {
      const tool = btn.dataset.tool;
      btn.classList.toggle('active', currentState.selectedTool === tool);
    });
  }

  return { init };
})();