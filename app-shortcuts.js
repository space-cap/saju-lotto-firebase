class AppShortcuts {
  constructor() {
    this.shortcuts = [
      {
        id: 'generate',
        name: '번호 생성',
        icon: '🎯',
        description: '사주 기반 로또번호 즉시 생성',
        action: 'generateNumbers',
        color: '#d4af37',
        shortcut: 'G'
      },
      {
        id: 'fortune',
        name: '운세 확인',
        icon: '🌟',
        description: '오늘의 운세 및 길흉 확인',
        action: 'showFortune',
        color: '#8b4513',
        shortcut: 'F'
      },
      {
        id: 'check',
        name: '당첨 확인',
        icon: '🎰',
        description: '내 번호 당첨 여부 확인',
        action: 'checkWinning',
        color: '#32cd32',
        shortcut: 'C'
      },
      {
        id: 'history',
        name: '히스토리',
        icon: '📜',
        description: '이전 생성 번호 기록 보기',
        action: 'showHistory',
        color: '#ff8c00',
        shortcut: 'H'
      },
      {
        id: 'settings',
        name: '설정',
        icon: '⚙️',
        description: '알림 및 앱 설정 관리',
        action: 'showSettings',
        color: '#6a5acd',
        shortcut: 'S'
      },
      {
        id: 'offline',
        name: '오프라인',
        icon: '📱',
        description: '오프라인 모드로 전환',
        action: 'toggleOfflineMode',
        color: '#dc143c',
        shortcut: 'O'
      }
    ];
    
    this.isVisible = false;
    this.init();
  }

  init() {
    this.createShortcutInterface();
    this.setupKeyboardShortcuts();
    this.setupGestures();
    this.setupFloatingActionButton();
    console.log('AppShortcuts 초기화 완료');
  }

  createShortcutInterface() {
    // 플로팅 액션 버튼
    const fab = document.createElement('div');
    fab.className = 'floating-action-button';
    fab.innerHTML = `
      <button class="fab-main" onclick="window.appShortcuts.toggleShortcuts()" aria-label="앱 바로가기 메뉴">
        <span class="fab-icon">⚡</span>
      </button>
    `;

    // 바로가기 메뉴
    const shortcutMenu = document.createElement('div');
    shortcutMenu.className = 'shortcut-menu';
    shortcutMenu.innerHTML = `
      <div class="shortcut-overlay" onclick="window.appShortcuts.hideShortcuts()"></div>
      <div class="shortcut-container">
        <div class="shortcut-header">
          <h3>⚡ 빠른 실행</h3>
          <button class="shortcut-close" onclick="window.appShortcuts.hideShortcuts()">&times;</button>
        </div>
        <div class="shortcut-grid">
          ${this.shortcuts.map(shortcut => `
            <div class="shortcut-item" onclick="window.appShortcuts.executeAction('${shortcut.action}')" 
                 data-shortcut="${shortcut.shortcut}">
              <div class="shortcut-icon" style="color: ${shortcut.color};">${shortcut.icon}</div>
              <div class="shortcut-name">${shortcut.name}</div>
              <div class="shortcut-description">${shortcut.description}</div>
              <div class="shortcut-key">Alt + ${shortcut.shortcut}</div>
            </div>
          `).join('')}
        </div>
        <div class="shortcut-footer">
          <div class="quick-tip">
            💡 <strong>팁:</strong> Alt + 키를 눌러 빠르게 실행하세요
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(shortcutMenu);

    this.addShortcutStyles();
  }

  addShortcutStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .floating-action-button {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 1000;
        transition: all 0.3s ease;
      }

      .fab-main {
        background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 24px;
        color: white;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        animation: fabPulse 2s infinite;
      }

      .fab-main:hover {
        transform: scale(1.1) rotate(180deg);
        box-shadow: 0 8px 25px rgba(212, 175, 55, 0.5);
      }

      .fab-main:active {
        transform: scale(0.95);
      }

      @keyframes fabPulse {
        0%, 100% { box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        50% { box-shadow: 0 6px 25px rgba(212, 175, 55, 0.4); }
      }

      .shortcut-menu {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: none;
      }

      .shortcut-menu.visible {
        display: flex;
        animation: fadeIn 0.3s ease-out;
      }

      .shortcut-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
      }

      .shortcut-container {
        position: relative;
        background: var(--surface-color);
        border-radius: 20px;
        margin: auto;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        border: 2px solid var(--primary-color);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(50px) scale(0.9);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .shortcut-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 25px 30px;
        background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
        color: white;
      }

      .shortcut-header h3 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }

      .shortcut-close {
        background: none;
        border: none;
        color: white;
        font-size: 32px;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .shortcut-close:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: rotate(90deg);
      }

      .shortcut-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        padding: 30px;
        max-height: 60vh;
        overflow-y: auto;
      }

      .shortcut-item {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid var(--border-color);
        border-radius: 15px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .shortcut-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
        transition: left 0.5s ease;
      }

      .shortcut-item:hover {
        transform: translateY(-5px) scale(1.02);
        border-color: var(--primary-color);
        box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
      }

      .shortcut-item:hover::before {
        left: 100%;
      }

      .shortcut-item:active {
        transform: translateY(-2px) scale(0.98);
      }

      .shortcut-icon {
        font-size: 48px;
        margin-bottom: 15px;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      }

      .shortcut-name {
        font-size: 18px;
        font-weight: bold;
        color: var(--text-color);
        margin-bottom: 10px;
        text-align: center;
      }

      .shortcut-description {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 15px;
        text-align: center;
        line-height: 1.4;
      }

      .shortcut-key {
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--primary-color);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        font-family: monospace;
      }

      .shortcut-footer {
        padding: 20px 30px;
        background: rgba(212, 175, 55, 0.1);
        border-top: 1px solid var(--border-color);
      }

      .quick-tip {
        color: var(--text-secondary);
        font-size: 14px;
        text-align: center;
        line-height: 1.5;
      }

      .shortcut-item.executing {
        animation: pulse 0.6s ease-in-out;
      }

      @keyframes pulse {
        0%, 100% { 
          transform: translateY(-5px) scale(1.02); 
        }
        50% { 
          transform: translateY(-8px) scale(1.05);
          box-shadow: 0 15px 30px rgba(212, 175, 55, 0.5);
        }
      }

      /* 모바일 최적화 */
      @media (max-width: 768px) {
        .floating-action-button {
          bottom: 20px;
          right: 20px;
        }

        .fab-main {
          width: 50px;
          height: 50px;
          font-size: 20px;
        }

        .shortcut-container {
          width: 95%;
          margin: 20px auto;
          max-height: 85vh;
        }

        .shortcut-header {
          padding: 20px;
        }

        .shortcut-header h3 {
          font-size: 20px;
        }

        .shortcut-grid {
          grid-template-columns: 1fr;
          gap: 15px;
          padding: 20px;
        }

        .shortcut-item {
          padding: 15px;
        }

        .shortcut-icon {
          font-size: 36px;
          margin-bottom: 10px;
        }

        .shortcut-name {
          font-size: 16px;
        }

        .shortcut-description {
          font-size: 13px;
        }
      }

      /* 다크 모드 대응 */
      @media (prefers-color-scheme: dark) {
        .shortcut-item {
          background: rgba(0, 0, 0, 0.3);
        }
      }

      /* 접근성 개선 */
      @media (prefers-reduced-motion: reduce) {
        .fab-main {
          animation: none;
        }

        .shortcut-item::before,
        .shortcut-container,
        .shortcut-menu {
          animation: none;
          transition: none;
        }
      }

      /* 고대비 모드 */
      @media (prefers-contrast: high) {
        .shortcut-item {
          border-width: 3px;
        }

        .shortcut-key {
          border: 2px solid white;
        }
      }
    `;
    
    document.head.appendChild(styleSheet);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + 키 조합 감지
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const shortcut = this.shortcuts.find(s => s.shortcut.toLowerCase() === e.key.toLowerCase());
        if (shortcut) {
          e.preventDefault();
          this.executeAction(shortcut.action);
          this.showKeyboardFeedback(shortcut);
        }
      }
      
      // ESC 키로 메뉴 닫기
      if (e.key === 'Escape' && this.isVisible) {
        this.hideShortcuts();
      }
    });
  }

  setupGestures() {
    let startY = 0;
    let startTime = 0;
    
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) { // 두 손가락 제스처
        startY = e.touches[0].clientY + e.touches[1].clientY;
        startTime = Date.now();
      }
    });
    
    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 2) {
        const endY = e.changedTouches[0].clientY + e.changedTouches[1].clientY;
        const deltaY = startY - endY;
        const deltaTime = Date.now() - startTime;
        
        // 빠른 위쪽 스와이프 감지
        if (deltaY > 100 && deltaTime < 500) {
          this.toggleShortcuts();
        }
      }
    });
  }

  setupFloatingActionButton() {
    // FAB 위치 저장/복원
    this.loadFABPosition();
    this.makeFABDraggable();
  }

  makeFABDraggable() {
    const fab = document.querySelector('.floating-action-button');
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    
    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
      if (e.target.closest('.fab-main')) {
        isDragging = true;
        
        if (e.type === 'mousedown') {
          startX = e.clientX;
          startY = e.clientY;
        } else {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        }
        
        const rect = fab.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        
        fab.style.transition = 'none';
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);
      }
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      e.preventDefault();
      
      let currentX, currentY;
      if (e.type === 'mousemove') {
        currentX = e.clientX;
        currentY = e.clientY;
      } else {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      }
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      // 화면 경계 제한
      const maxX = window.innerWidth - fab.offsetWidth;
      const maxY = window.innerHeight - fab.offsetHeight;
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));
      
      fab.style.left = constrainedX + 'px';
      fab.style.top = constrainedY + 'px';
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
    }
    
    function endDrag() {
      if (isDragging) {
        isDragging = false;
        fab.style.transition = 'all 0.3s ease';
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', endDrag);
        
        window.appShortcuts.saveFABPosition();
      }
    }
  }

  async saveFABPosition() {
    const fab = document.querySelector('.floating-action-button');
    const rect = fab.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top
    };
    
    try {
      if (window.offlineCache) {
        await window.offlineCache.saveSetting('fabPosition', position);
      } else {
        localStorage.setItem('fabPosition', JSON.stringify(position));
      }
    } catch (error) {
      console.error('FAB 위치 저장 실패:', error);
    }
  }

  async loadFABPosition() {
    try {
      let position;
      if (window.offlineCache) {
        position = await window.offlineCache.getSetting('fabPosition');
      } else {
        const saved = localStorage.getItem('fabPosition');
        position = saved ? JSON.parse(saved) : null;
      }
      
      if (position) {
        const fab = document.querySelector('.floating-action-button');
        if (fab) {
          fab.style.left = position.left + 'px';
          fab.style.top = position.top + 'px';
          fab.style.right = 'auto';
          fab.style.bottom = 'auto';
        }
      }
    } catch (error) {
      console.error('FAB 위치 로드 실패:', error);
    }
  }

  toggleShortcuts() {
    if (this.isVisible) {
      this.hideShortcuts();
    } else {
      this.showShortcuts();
    }
  }

  showShortcuts() {
    const menu = document.querySelector('.shortcut-menu');
    if (menu) {
      menu.classList.add('visible');
      this.isVisible = true;
      
      // 접근성: 첫 번째 항목에 포커스
      setTimeout(() => {
        const firstItem = menu.querySelector('.shortcut-item');
        if (firstItem) firstItem.focus();
      }, 300);
    }
  }

  hideShortcuts() {
    const menu = document.querySelector('.shortcut-menu');
    if (menu) {
      menu.classList.remove('visible');
      this.isVisible = false;
    }
  }

  async executeAction(actionName) {
    const shortcut = this.shortcuts.find(s => s.action === actionName);
    if (shortcut) {
      // 실행 애니메이션
      const item = document.querySelector(`[onclick="window.appShortcuts.executeAction('${actionName}')"]`);
      if (item) {
        item.classList.add('executing');
        setTimeout(() => item.classList.remove('executing'), 600);
      }
    }
    
    try {
      switch (actionName) {
        case 'generateNumbers':
          this.hideShortcuts();
          if (typeof generateSajuNumbers === 'function') {
            generateSajuNumbers();
          } else {
            this.scrollToSection('saju-form');
          }
          break;
          
        case 'showFortune':
          this.hideShortcuts();
          if (typeof showFortuneAnalysis === 'function') {
            showFortuneAnalysis();
          } else {
            this.scrollToSection('fortune-dashboard');
          }
          break;
          
        case 'checkWinning':
          this.hideShortcuts();
          if (typeof checkWinningNumbers === 'function') {
            checkWinningNumbers();
          } else {
            this.scrollToSection('winning-check');
          }
          break;
          
        case 'showHistory':
          this.hideShortcuts();
          if (window.firebaseAuth && window.firebaseAuth.showSajuHistory) {
            window.firebaseAuth.showSajuHistory();
          } else {
            alert('로그인 후 이용 가능합니다.');
          }
          break;
          
        case 'showSettings':
          this.hideShortcuts();
          this.showSettingsModal();
          break;
          
        case 'toggleOfflineMode':
          this.hideShortcuts();
          await this.toggleOfflineMode();
          break;
          
        default:
          console.warn('알 수 없는 액션:', actionName);
      }
    } catch (error) {
      console.error('액션 실행 실패:', actionName, error);
      this.showErrorNotification(`${shortcut?.name || '기능'} 실행 중 오류가 발생했습니다.`);
    }
  }

  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  showSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.innerHTML = `
      <div class="settings-overlay" onclick="this.closest('.settings-modal').remove()"></div>
      <div class="settings-content">
        <div class="settings-header">
          <h3>⚙️ 설정</h3>
          <button class="settings-close" onclick="this.closest('.settings-modal').remove()">&times;</button>
        </div>
        <div class="settings-body">
          <div class="settings-section">
            <h4>🔔 알림 설정</h4>
            <div class="settings-item">
              <label>
                <input type="checkbox" id="notification-enabled" ${Notification.permission === 'granted' ? 'checked' : ''}>
                푸시 알림 활성화
              </label>
              <button onclick="window.firebaseAuth.requestNotificationPermission()">권한 요청</button>
            </div>
            <div class="settings-item">
              <label>
                <input type="checkbox" id="smart-notifications" checked>
                스마트 알림 (사주 기반)
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>🎨 테마 설정</h4>
            <div class="settings-item">
              <label>현재 테마: ${window.themeManager?.getCurrentTheme()?.name || '기본'}</label>
              <button onclick="window.themeManager.showThemeSelector(); this.closest('.settings-modal').remove();">
                테마 변경
              </button>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>📱 앱 설정</h4>
            <div class="settings-item">
              <label>바로가기 메뉴 위치</label>
              <button onclick="window.appShortcuts.resetFABPosition()">위치 초기화</button>
            </div>
            <div class="settings-item">
              <label>오프라인 모드</label>
              <button onclick="window.appShortcuts.toggleOfflineMode()">전환</button>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>🗄️ 데이터 관리</h4>
            <div class="settings-item">
              <label>캐시 크기: <span id="cache-size">계산 중...</span></label>
              <button onclick="window.appShortcuts.clearCache()">캐시 정리</button>
            </div>
          </div>
        </div>
        
        <div class="settings-footer">
          <button class="test-notification-btn" onclick="window.firebaseAuth.sendTestNotification()">
            🧪 테스트 알림 발송
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 캐시 크기 업데이트
    this.updateCacheSize();

    // 설정 모달 스타일 추가
    this.addSettingsModalStyles();
  }

  async updateCacheSize() {
    if (window.offlineCache) {
      const sizes = await window.offlineCache.getCacheSize();
      const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);
      const sizeElement = document.getElementById('cache-size');
      if (sizeElement) {
        sizeElement.textContent = `${total}개 항목`;
      }
    }
  }

  addSettingsModalStyles() {
    if (document.getElementById('settings-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'settings-modal-styles';
    styles.textContent = `
      .settings-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .settings-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
      }

      .settings-content {
        position: relative;
        background: var(--surface-color);
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid var(--primary-color);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }

      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: var(--primary-color);
        color: white;
        border-radius: 13px 13px 0 0;
      }

      .settings-header h3 {
        margin: 0;
        font-size: 20px;
      }

      .settings-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .settings-body {
        padding: 20px;
      }

      .settings-section {
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
      }

      .settings-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .settings-section h4 {
        margin: 0 0 15px 0;
        color: var(--text-color);
        font-size: 16px;
      }

      .settings-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }

      .settings-item label {
        color: var(--text-secondary);
        flex: 1;
      }

      .settings-item button {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
      }

      .settings-item button:hover {
        background: var(--secondary-color);
        transform: translateY(-1px);
      }

      .settings-footer {
        padding: 20px;
        border-top: 1px solid var(--border-color);
        text-align: center;
      }

      .test-notification-btn {
        background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      }

      .test-notification-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
      }
    `;
    
    document.head.appendChild(styles);
  }

  async resetFABPosition() {
    const fab = document.querySelector('.floating-action-button');
    if (fab) {
      fab.style.left = 'auto';
      fab.style.top = 'auto';
      fab.style.right = '30px';
      fab.style.bottom = '30px';
      
      try {
        if (window.offlineCache) {
          await window.offlineCache.saveSetting('fabPosition', null);
        } else {
          localStorage.removeItem('fabPosition');
        }
        this.showSuccessNotification('바로가기 버튼 위치가 초기화되었습니다.');
      } catch (error) {
        console.error('위치 초기화 실패:', error);
      }
    }
  }

  async toggleOfflineMode() {
    const isOffline = !navigator.onLine;
    const currentMode = await this.getOfflineMode();
    const newMode = !currentMode;
    
    try {
      if (window.offlineCache) {
        await window.offlineCache.saveSetting('forceOfflineMode', newMode);
      } else {
        localStorage.setItem('forceOfflineMode', newMode.toString());
      }
      
      this.showSuccessNotification(
        newMode ? '오프라인 모드가 활성화되었습니다.' : '온라인 모드로 전환되었습니다.'
      );
      
      // 강제 오프라인 모드 시뮬레이션
      if (newMode) {
        this.simulateOfflineMode();
      }
      
    } catch (error) {
      console.error('오프라인 모드 전환 실패:', error);
    }
  }

  async getOfflineMode() {
    try {
      if (window.offlineCache) {
        return await window.offlineCache.getSetting('forceOfflineMode', false);
      } else {
        return localStorage.getItem('forceOfflineMode') === 'true';
      }
    } catch (error) {
      return false;
    }
  }

  simulateOfflineMode() {
    // 네트워크 요청 차단 시뮬레이션
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return Promise.reject(new Error('강제 오프라인 모드'));
    };
    
    setTimeout(() => {
      window.fetch = originalFetch;
    }, 5 * 60 * 1000); // 5분 후 복원
  }

  async clearCache() {
    try {
      if (window.offlineCache) {
        await window.offlineCache.cleanupCache();
      }
      
      // Service Worker 캐시도 정리
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      this.showSuccessNotification('캐시가 정리되었습니다.');
      this.updateCacheSize();
    } catch (error) {
      console.error('캐시 정리 실패:', error);
      this.showErrorNotification('캐시 정리 중 오류가 발생했습니다.');
    }
  }

  showKeyboardFeedback(shortcut) {
    const feedback = document.createElement('div');
    feedback.className = 'keyboard-feedback';
    feedback.innerHTML = `
      <div class="feedback-icon">${shortcut.icon}</div>
      <div class="feedback-text">${shortcut.name}</div>
      <div class="feedback-key">Alt + ${shortcut.shortcut}</div>
    `;
    
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 15px;
      text-align: center;
      z-index: 10002;
      animation: feedbackPulse 0.8s ease-out forwards;
      pointer-events: none;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes feedbackPulse {
        0% { 
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
        30% { 
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.1);
        }
        70% { 
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        100% { 
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.9);
        }
      }
      
      .feedback-icon {
        font-size: 32px;
        margin-bottom: 10px;
      }
      
      .feedback-text {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      
      .feedback-key {
        font-size: 12px;
        opacity: 0.8;
        font-family: monospace;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
      style.remove();
    }, 800);
  }

  showSuccessNotification(message) {
    this.showNotification(message, 'success', '✅');
  }

  showErrorNotification(message) {
    this.showNotification(message, 'error', '❌');
  }

  showNotification(message, type, icon) {
    const notification = document.createElement('div');
    notification.className = `app-notification ${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${message}</span>
    `;
    
    const colors = {
      success: '#4CAF50',
      error: '#F44336',
      info: '#2196F3'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      font-weight: bold;
      z-index: 10003;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .notification-icon {
        margin-right: 10px;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
  }
}

// 전역 인스턴스 생성
window.appShortcuts = new AppShortcuts();

console.log('App Shortcuts 로드 완료');