const Welcome = (() => {
  let currentStep = 1;
  let selectedLang = 'zh';
  let selectedBg = 'dark-blue';

  function init() {
    const hasVisited = localStorage.getItem('metroMapVisited');
    if (!hasVisited) {
      showWelcome();
    }
  }

  function showWelcome() {
    const modal = document.getElementById('welcomeModal');
    modal.classList.add('show');
    bindEvents();
  }

  function hideWelcome() {
    const modal = document.getElementById('welcomeModal');
    modal.classList.remove('show');
  }

  function bindEvents() {
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLang = btn.dataset.lang;
        Settings.applyLang(selectedLang);
      });
    });

    document.getElementById('welcomeNext1').addEventListener('click', () => {
      goToStep(2);
    });

    const agreeTerms = document.getElementById('agreeTerms');
    const agreePrivacy = document.getElementById('agreePrivacy');
    const nextBtn2 = document.getElementById('welcomeNext2');

    function checkAgreements() {
      nextBtn2.disabled = !(agreeTerms.checked && agreePrivacy.checked);
    }

    agreeTerms.addEventListener('change', checkAgreements);
    agreePrivacy.addEventListener('change', checkAgreements);

    document.getElementById('welcomeBack2').addEventListener('click', () => goToStep(1));
    nextBtn2.addEventListener('click', () => goToStep(3));

    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedBg = btn.dataset.bg;
        Settings.applyBg(selectedBg);
      });
    });

    document.getElementById('welcomeBack3').addEventListener('click', () => goToStep(2));
    document.getElementById('welcomeNext3').addEventListener('click', () => goToStep(4));

    document.getElementById('welcomeStart').addEventListener('click', () => {
      Settings.applyLang(selectedLang);
      Settings.applyBg(selectedBg);
      localStorage.setItem('metroMapVisited', 'true');
      hideWelcome();
      // 直接进入新项目
      Home.createNewProject();
    });
  }

  function goToStep(step) {
    currentStep = step;
    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`welcomeStep${i}`);
      stepEl.style.display = i === step ? 'block' : 'none';
    }
  }

  return { init };
})();
