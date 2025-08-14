class AccessibilityManager {
  constructor() {
    this.settings = {
      screenReader: false,
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      keyboardNavigation: true,
      voiceAnnouncements: false,
      colorBlindness: 'none' // none, protanopia, deuteranopia, tritanopia
    };
    
    this.announcer = null;
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      this.detectSystemPreferences();
      this.createAccessibilityControls();
      this.setupKeyboardNavigation();
      this.setupScreenReaderSupport();
      this.setupFocusManagement();
      this.applyAccessibilitySettings();
      this.addAccessibilityStyles();
      console.log('AccessibilityManager 초기화 완료');
    } catch (error) {
      console.error('AccessibilityManager 초기화 실패:', error);
    }
  }

  async loadSettings() {
    try {
      if (window.offlineCache) {
        const saved = await window.offlineCache.getSetting('accessibilitySettings');
        if (saved) {
          this.settings = { ...this.settings, ...saved };
        }
      } else {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      }
    } catch (error) {
      console.error('접근성 설정 로드 실패:', error);
    }
  }

  async saveSettings() {
    try {
      if (window.offlineCache) {
        await window.offlineCache.saveSetting('accessibilitySettings', this.settings);
      } else {
        localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
      }
    } catch (error) {
      console.error('접근성 설정 저장 실패:', error);
    }
  }

  detectSystemPreferences() {
    // 시스템 고대비 모드 감지
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.settings.highContrast = true;
    }

    // 시스템 동작 감소 설정 감지
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.reducedMotion = true;
    }

    // 시스템 큰 글씨 설정 감지 (추정)
    if (window.devicePixelRatio && window.devicePixelRatio > 1.5) {
      // 고해상도 기기에서는 큰 글씨 옵션을 제공
    }

    // 스크린 리더 감지 (매우 제한적)
    if (navigator.userAgent.includes('NVDA') || 
        navigator.userAgent.includes('JAWS') || 
        navigator.userAgent.includes('VoiceOver')) {
      this.settings.screenReader = true;
    }
  }

  createAccessibilityControls() {
    const accessibilityPanel = document.createElement('div');
    accessibilityPanel.className = 'accessibility-panel';
    accessibilityPanel.innerHTML = `
      <button class="accessibility-toggle" onclick="window.accessibilityManager.showAccessibilityMenu()" 
              aria-label="접근성 설정" title="접근성 설정">
        <span class="accessibility-icon">♿</span>
      </button>
    `;

    document.body.appendChild(accessibilityPanel);
  }

  showAccessibilityMenu() {
    const modal = document.createElement('div');
    modal.className = 'accessibility-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'accessibility-title');
    modal.setAttribute('aria-modal', 'true');
    
    modal.innerHTML = `
      <div class="accessibility-modal-overlay" onclick="window.accessibilityManager.hideAccessibilityMenu()"></div>
      <div class="accessibility-modal-content">
        <div class="accessibility-modal-header">
          <h2 id="accessibility-title">♿ 접근성 설정</h2>
          <button class="accessibility-modal-close" onclick="window.accessibilityManager.hideAccessibilityMenu()" 
                  aria-label="닫기">&times;</button>
        </div>
        
        <div class="accessibility-modal-body">
          <div class="accessibility-section">
            <h3>🎨 시각 접근성</h3>
            <div class="accessibility-controls">
              <label class="accessibility-control">
                <input type="checkbox" ${this.settings.highContrast ? 'checked' : ''} 
                       onchange="window.accessibilityManager.toggleHighContrast(this.checked)">
                <span>고대비 모드</span>
                <small>배경과 텍스트의 대비를 높여 가독성을 향상시킵니다.</small>
              </label>
              
              <label class="accessibility-control">
                <input type="checkbox" ${this.settings.largeText ? 'checked' : ''} 
                       onchange="window.accessibilityManager.toggleLargeText(this.checked)">
                <span>큰 글씨</span>
                <small>모든 텍스트 크기를 125% 확대합니다.</small>
              </label>
              
              <div class="accessibility-control">
                <label for="colorblind-filter">색약 지원:</label>
                <select id="colorblind-filter" onchange="window.accessibilityManager.setColorBlindnessFilter(this.value)">
                  <option value="none" ${this.settings.colorBlindness === 'none' ? 'selected' : ''}>없음</option>
                  <option value="protanopia" ${this.settings.colorBlindness === 'protanopia' ? 'selected' : ''}>적색약 (Protanopia)</option>
                  <option value="deuteranopia" ${this.settings.colorBlindness === 'deuteranopia' ? 'selected' : ''}>녹색약 (Deuteranopia)</option>
                  <option value="tritanopia" ${this.settings.colorBlindness === 'tritanopia' ? 'selected' : ''}>청색약 (Tritanopia)</option>
                </select>
                <small>색상 구분이 어려운 사용자를 위한 필터입니다.</small>
              </div>
            </div>
          </div>
          
          <div class="accessibility-section">
            <h3>⌨️ 키보드 접근성</h3>
            <div class="accessibility-controls">
              <label class="accessibility-control">
                <input type="checkbox" ${this.settings.keyboardNavigation ? 'checked' : ''} 
                       onchange="window.accessibilityManager.toggleKeyboardNavigation(this.checked)">
                <span>키보드 네비게이션</span>
                <small>Tab 키로 모든 요소를 탐색할 수 있습니다.</small>
              </label>
              
              <div class="keyboard-shortcuts">
                <h4>키보드 단축키</h4>
                <ul>
                  <li><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> - 요소 간 이동</li>
                  <li><kbd>Enter</kbd> / <kbd>Space</kbd> - 버튼 활성화</li>
                  <li><kbd>Esc</kbd> - 모달 닫기</li>
                  <li><kbd>Alt+G</kbd> - 번호 생성</li>
                  <li><kbd>Alt+F</kbd> - 운세 확인</li>
                  <li><kbd>Alt+H</kbd> - 히스토리</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="accessibility-section">
            <h3>🔊 청각 접근성</h3>
            <div class="accessibility-controls">
              <label class="accessibility-control">
                <input type="checkbox" ${this.settings.voiceAnnouncements ? 'checked' : ''} 
                       onchange="window.accessibilityManager.toggleVoiceAnnouncements(this.checked)">
                <span>음성 안내</span>
                <small>주요 동작과 결과를 음성으로 안내합니다.</small>
              </label>
              
              <label class="accessibility-control">
                <input type="checkbox" ${this.settings.reducedMotion ? 'checked' : ''} 
                       onchange="window.accessibilityManager.toggleReducedMotion(this.checked)">
                <span>애니메이션 감소</span>
                <small>화면의 움직임과 애니메이션을 최소화합니다.</small>
              </label>
            </div>
          </div>
          
          <div class="accessibility-section">
            <h3>🖥️ 스크린 리더</h3>
            <div class="accessibility-controls">
              <label class="accessibility-control">
                <input type="checkbox" ${this.settings.screenReader ? 'checked' : ''} 
                       onchange="window.accessibilityManager.toggleScreenReader(this.checked)">
                <span>스크린 리더 최적화</span>
                <small>NVDA, JAWS, VoiceOver 등 스크린 리더에 최적화합니다.</small>
              </label>
              
              <button class="test-screen-reader" onclick="window.accessibilityManager.testScreenReader()">
                🧪 스크린 리더 테스트
              </button>
            </div>
          </div>
        </div>
        
        <div class="accessibility-modal-footer">
          <button onclick="window.accessibilityManager.resetSettings()">기본값으로 복원</button>
          <button onclick="window.accessibilityManager.hideAccessibilityMenu()">완료</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // 포커스 관리
    const firstFocusable = modal.querySelector('button, input, select');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    // ESC 키로 닫기
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAccessibilityMenu();
      }
    });
  }

  hideAccessibilityMenu() {
    const modal = document.querySelector('.accessibility-modal');
    if (modal) {
      modal.remove();
    }
  }

  async toggleHighContrast(enabled) {
    this.settings.highContrast = enabled;
    document.body.classList.toggle('high-contrast', enabled);
    await this.saveSettings();
    this.announce(enabled ? '고대비 모드가 활성화되었습니다' : '고대비 모드가 비활성화되었습니다');
  }

  async toggleLargeText(enabled) {
    this.settings.largeText = enabled;
    document.body.classList.toggle('large-text', enabled);
    await this.saveSettings();
    this.announce(enabled ? '큰 글씨 모드가 활성화되었습니다' : '큰 글씨 모드가 비활성화되었습니다');
  }

  async toggleKeyboardNavigation(enabled) {
    this.settings.keyboardNavigation = enabled;
    
    if (enabled) {
      this.setupKeyboardNavigation();
    } else {
      this.removeKeyboardNavigation();
    }
    
    await this.saveSettings();
    this.announce(enabled ? '키보드 네비게이션이 활성화되었습니다' : '키보드 네비게이션이 비활성화되었습니다');
  }

  async toggleVoiceAnnouncements(enabled) {
    this.settings.voiceAnnouncements = enabled;
    await this.saveSettings();
    this.announce(enabled ? '음성 안내가 활성화되었습니다' : '음성 안내가 비활성화되었습니다');
  }

  async toggleReducedMotion(enabled) {
    this.settings.reducedMotion = enabled;
    document.body.classList.toggle('reduced-motion', enabled);
    await this.saveSettings();
    this.announce(enabled ? '애니메이션이 감소되었습니다' : '애니메이션이 복원되었습니다');
  }

  async toggleScreenReader(enabled) {
    this.settings.screenReader = enabled;
    
    if (enabled) {
      this.enhanceForScreenReader();
    } else {
      this.removeScreenReaderEnhancements();
    }
    
    await this.saveSettings();
    this.announce(enabled ? '스크린 리더 최적화가 활성화되었습니다' : '스크린 리더 최적화가 비활성화되었습니다');
  }

  async setColorBlindnessFilter(type) {
    this.settings.colorBlindness = type;
    
    // 기존 필터 제거
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    
    // 새 필터 적용
    if (type !== 'none') {
      document.body.classList.add(type);
    }
    
    await this.saveSettings();
    
    const filterNames = {
      'none': '없음',
      'protanopia': '적색약',
      'deuteranopia': '녹색약',
      'tritanopia': '청색약'
    };
    
    this.announce(`색약 지원이 ${filterNames[type]}로 설정되었습니다`);
  }

  setupKeyboardNavigation() {
    // 모든 포커스 가능한 요소 수집
    this.updateFocusableElements();

    // 키보드 이벤트 리스너
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    
    // 포커스 시각화 개선
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
    
    // 동적 콘텐츠 변경 감지
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupFocusManagement() {
    // 포커스 관리 기본 설정
    this.currentFocusIndex = -1;
    
    // 포커스 트랩 설정 (모달이 열렸을 때)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const modal = document.querySelector('.modal:not([style*="display: none"])');
        if (modal) {
          this.trapFocus(event, modal);
        }
      }
    });
    
    // 메인 콘텐츠로 건너뛰기 링크 추가
    this.addSkipToMainLink();
  }
  
  trapFocus(event, container) {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
  
  addSkipToMainLink() {
    if (document.querySelector('#skip-to-main')) return;
    
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-main';
    skipLink.href = '#main-content';
    skipLink.textContent = '메인 콘텐츠로 건너뛰기';
    skipLink.className = 'sr-only-focusable';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // 메인 콘텐츠에 ID 추가
    const mainContent = document.querySelector('main, .container, #app, .app');
    if (mainContent && !mainContent.id) {
      mainContent.id = 'main-content';
    }
  }

  updateFocusableElements() {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      'details summary'
    ];
    
    this.focusableElements = Array.from(document.querySelectorAll(selectors.join(', ')))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
  }

  handleKeyboardNavigation(event) {
    if (!this.settings.keyboardNavigation) return;

    switch (event.key) {
      case 'Tab':
        // 기본 Tab 동작 유지하되 향상된 시각적 피드백 제공
        break;
        
      case 'Enter':
      case ' ':
        // 스페이스바와 엔터키로 버튼 활성화
        if (event.target.tagName === 'BUTTON' || event.target.getAttribute('role') === 'button') {
          event.preventDefault();
          event.target.click();
          this.announce(`${event.target.textContent || '버튼'}이 활성화되었습니다`);
        }
        break;
        
      case 'Escape':
        // 모달이나 드롭다운 닫기
        const modal = document.querySelector('.modal, .dropdown, .menu');
        if (modal) {
          const closeBtn = modal.querySelector('.close, .modal-close, [aria-label="닫기"]');
          if (closeBtn) {
            closeBtn.click();
          }
        }
        break;
        
      case 'Home':
        if (event.ctrlKey) {
          event.preventDefault();
          document.body.focus();
          window.scrollTo(0, 0);
          this.announce('페이지 상단으로 이동했습니다');
        }
        break;
        
      case 'End':
        if (event.ctrlKey) {
          event.preventDefault();
          window.scrollTo(0, document.body.scrollHeight);
          this.announce('페이지 하단으로 이동했습니다');
        }
        break;
    }
  }

  handleFocusIn(event) {
    const element = event.target;
    
    // 포커스된 요소에 시각적 강조 추가
    element.classList.add('keyboard-focused');
    
    // ARIA 레이블이나 제목을 음성으로 안내
    const label = this.getAccessibleLabel(element);
    if (label && this.settings.screenReader) {
      this.announce(label);
    }
    
    // 포커스된 요소가 화면에 보이도록 스크롤
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }

  handleFocusOut(event) {
    event.target.classList.remove('keyboard-focused');
  }

  getAccessibleLabel(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('title') ||
           element.textContent?.trim() ||
           element.getAttribute('alt') ||
           element.getAttribute('placeholder');
  }

  setupScreenReaderSupport() {
    // ARIA 라이브 영역 생성
    this.createAriaLiveRegion();
    
    // 랜드마크 역할 추가
    this.addLandmarkRoles();
    
    // 의미있는 제목 구조 확인
    this.validateHeadingStructure();
    
    // 폼 레이블 연결
    this.associateFormLabels();
  }

  createAriaLiveRegion() {
    if (this.announcer) return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.id = 'aria-announcer';
    
    document.body.appendChild(this.announcer);
  }

  addLandmarkRoles() {
    // 메인 콘텐츠
    const main = document.querySelector('main') || document.querySelector('.main-content');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }

    // 네비게이션
    const nav = document.querySelector('nav') || document.querySelector('.navigation');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
    }

    // 헤더
    const header = document.querySelector('header') || document.querySelector('.header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }

    // 푸터
    const footer = document.querySelector('footer') || document.querySelector('.footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }
  }

  validateHeadingStructure() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    let hasH1 = false;

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      
      if (level === 1) {
        hasH1 = true;
      }
      
      if (level > lastLevel + 1) {
        console.warn(`제목 구조 경고: h${lastLevel}에서 h${level}로 건너뛰었습니다.`, heading);
      }
      
      lastLevel = level;
    });

    if (!hasH1) {
      console.warn('접근성 경고: 페이지에 h1 요소가 없습니다.');
    }
  }

  associateFormLabels() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label) {
          console.warn('접근성 경고: 레이블이 없는 입력 필드:', input);
          
          // 자동으로 레이블 찾기 시도
          const placeholder = input.getAttribute('placeholder');
          if (placeholder) {
            input.setAttribute('aria-label', placeholder);
          }
        }
      }
    });
  }

  enhanceForScreenReader() {
    // 추가 ARIA 속성 설정
    this.addAriaDescriptions();
    
    // 상태 변경 알림 설정
    this.setupStateChangeAnnouncements();
    
    // 진행률 표시기 개선
    this.enhanceProgressIndicators();
  }

  addAriaDescriptions() {
    // 로또 번호에 설명 추가
    const numberElements = document.querySelectorAll('.number-ball');
    numberElements.forEach((element, index) => {
      element.setAttribute('role', 'text');
      element.setAttribute('aria-label', `로또 번호 ${element.textContent}`);
    });

    // 운세 정보에 설명 추가
    const fortuneElements = document.querySelectorAll('.fortune-item');
    fortuneElements.forEach(element => {
      const title = element.querySelector('.fortune-title')?.textContent;
      const value = element.querySelector('.fortune-value')?.textContent;
      if (title && value) {
        element.setAttribute('aria-label', `${title}: ${value}`);
      }
    });
  }

  setupStateChangeAnnouncements() {
    // 폼 상태 변경 감지
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        this.announce('폼이 제출되었습니다. 처리 중입니다.');
      });
    });

    // 버튼 상태 변경 감지
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const originalClick = button.onclick;
      button.onclick = (e) => {
        const action = button.textContent || button.getAttribute('aria-label');
        this.announce(`${action} 버튼이 클릭되었습니다.`);
        if (originalClick) originalClick.call(button, e);
      };
    });
  }

  enhanceProgressIndicators() {
    const progressBars = document.querySelectorAll('.progress-bar, [role="progressbar"]');
    progressBars.forEach(bar => {
      if (!bar.getAttribute('aria-valuenow')) {
        const observer = new MutationObserver(() => {
          const value = this.extractProgressValue(bar);
          if (value !== null) {
            bar.setAttribute('aria-valuenow', value);
            bar.setAttribute('aria-valuemin', '0');
            bar.setAttribute('aria-valuemax', '100');
            this.announce(`진행률 ${value}%`);
          }
        });
        
        observer.observe(bar, { attributes: true, childList: true, subtree: true });
      }
    });
  }

  extractProgressValue(element) {
    const text = element.textContent;
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1]) : null;
  }

  announce(message) {
    if (!this.settings.voiceAnnouncements && !this.settings.screenReader) return;
    
    if (this.announcer) {
      this.announcer.textContent = message;
      
      // 웹 스피치 API 사용 (지원되는 경우)
      if ('speechSynthesis' in window && this.settings.voiceAnnouncements) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = window.i18n?.currentLocale || 'ko-KR';
        utterance.rate = 0.8;
        utterance.volume = 0.7;
        speechSynthesis.speak(utterance);
      }
    }
  }

  testScreenReader() {
    const testMessages = [
      '스크린 리더 테스트를 시작합니다.',
      '이것은 첫 번째 테스트 메시지입니다.',
      '두 번째 메시지: 버튼과 링크가 올바르게 읽힙니다.',
      '세 번째 메시지: 폼 필드에 적절한 레이블이 있습니다.',
      '마지막 메시지: 테스트가 완료되었습니다.'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < testMessages.length) {
        this.announce(testMessages[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 2000);
  }

  async resetSettings() {
    this.settings = {
      screenReader: false,
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      keyboardNavigation: true,
      voiceAnnouncements: false,
      colorBlindness: 'none'
    };

    await this.saveSettings();
    this.applyAccessibilitySettings();
    this.hideAccessibilityMenu();
    this.announce('접근성 설정이 기본값으로 복원되었습니다');
  }

  applyAccessibilitySettings() {
    // 클래스 적용
    document.body.classList.toggle('high-contrast', this.settings.highContrast);
    document.body.classList.toggle('large-text', this.settings.largeText);
    document.body.classList.toggle('reduced-motion', this.settings.reducedMotion);
    document.body.classList.toggle(this.settings.colorBlindness, this.settings.colorBlindness !== 'none');

    // 키보드 네비게이션
    if (this.settings.keyboardNavigation) {
      this.setupKeyboardNavigation();
    }

    // 스크린 리더 지원
    if (this.settings.screenReader) {
      this.enhanceForScreenReader();
    }
  }

  addAccessibilityStyles() {
    const styles = document.createElement('style');
    styles.id = 'accessibility-styles';
    styles.textContent = `
      /* 접근성 패널 */
      .accessibility-panel {
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 1002;
      }

      .accessibility-toggle {
        background: var(--surface-color);
        border: 2px solid var(--primary-color);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 20px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px var(--shadow-color);
      }

      .accessibility-toggle:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px var(--shadow-color);
      }

      .accessibility-toggle:focus {
        outline: 3px solid var(--primary-color);
        outline-offset: 2px;
      }

      /* 스크린 리더 전용 텍스트 */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }

      /* 키보드 포커스 스타일 */
      .keyboard-focused {
        outline: 3px solid var(--primary-color) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 5px rgba(212, 175, 55, 0.3) !important;
      }

      /* 고대비 모드 */
      .high-contrast {
        filter: contrast(200%) brightness(1.2);
      }

      .high-contrast * {
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
      }

      .high-contrast button,
      .high-contrast input,
      .high-contrast select {
        border: 3px solid currentColor !important;
        background: var(--surface-color) !important;
      }

      .high-contrast .number-ball {
        border: 3px solid var(--text-color) !important;
        background: var(--background-color) !important;
        color: var(--text-color) !important;
      }

      /* 큰 글씨 모드 */
      .large-text {
        font-size: 125% !important;
      }

      .large-text * {
        font-size: inherit !important;
      }

      .large-text .number-ball {
        width: 50px !important;
        height: 50px !important;
        font-size: 20px !important;
      }

      /* 애니메이션 감소 */
      .reduced-motion,
      .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* 색약 지원 필터 */
      .protanopia {
        filter: url('#protanopia-filter');
      }

      .deuteranopia {
        filter: url('#deuteranopia-filter');
      }

      .tritanopia {
        filter: url('#tritanopia-filter');
      }

      /* 접근성 모달 */
      .accessibility-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.7);
      }

      .accessibility-modal-content {
        background: var(--surface-color);
        border-radius: 15px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid var(--primary-color);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }

      .accessibility-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: var(--primary-color);
        color: white;
        border-radius: 13px 13px 0 0;
      }

      .accessibility-modal-header h2 {
        margin: 0;
        font-size: 20px;
      }

      .accessibility-modal-close {
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

      .accessibility-modal-body {
        padding: 20px;
      }

      .accessibility-section {
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
      }

      .accessibility-section h3 {
        margin: 0 0 15px 0;
        color: var(--text-color);
        font-size: 16px;
      }

      .accessibility-controls {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .accessibility-control {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px solid var(--border-color);
      }

      .accessibility-control > span {
        font-weight: bold;
        color: var(--text-color);
      }

      .accessibility-control small {
        color: var(--text-secondary);
        font-size: 12px;
        line-height: 1.4;
      }

      .accessibility-control input[type="checkbox"] {
        margin-right: 10px;
      }

      .accessibility-control select {
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--surface-color);
        color: var(--text-color);
      }

      .keyboard-shortcuts ul {
        list-style: none;
        padding: 0;
        margin: 10px 0;
      }

      .keyboard-shortcuts li {
        padding: 5px 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .keyboard-shortcuts kbd {
        background: var(--accent-color);
        padding: 4px 8px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        border: 1px solid var(--border-color);
      }

      .test-screen-reader {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
      }

      .test-screen-reader:hover {
        background: var(--secondary-color);
        transform: translateY(-1px);
      }

      .accessibility-modal-footer {
        padding: 20px;
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .accessibility-modal-footer button {
        padding: 10px 20px;
        border: 1px solid var(--border-color);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .accessibility-modal-footer button:first-child {
        background: none;
        color: var(--text-secondary);
      }

      .accessibility-modal-footer button:last-child {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      /* 모바일 최적화 */
      @media (max-width: 480px) {
        .accessibility-panel {
          top: 60px;
          right: 15px;
        }

        .accessibility-toggle {
          width: 45px;
          height: 45px;
          font-size: 18px;
        }

        .accessibility-modal-content {
          width: 95%;
          margin: 10px;
        }

        .accessibility-modal-body {
          padding: 15px;
        }

        .accessibility-control {
          padding: 12px;
        }
      }
    `;

    document.head.appendChild(styles);
    this.createColorBlindnessFilters();
  }

  createColorBlindnessFilters() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    
    svg.innerHTML = `
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0
                                               0.558 0.442 0 0 0
                                               0 0.242 0.758 0 0
                                               0 0 0 1 0"/>
        </filter>
        
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0
                                               0.7 0.3 0 0 0
                                               0 0.3 0.7 0 0
                                               0 0 0 1 0"/>
        </filter>
        
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0
                                               0 0.433 0.567 0 0
                                               0 0.475 0.525 0 0
                                               0 0 0 1 0"/>
        </filter>
      </defs>
    `;
    
    document.body.appendChild(svg);
  }

  // 접근성 검사 도구
  auditAccessibility() {
    const issues = [];

    // 제목 구조 검사
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      issues.push('페이지에 제목 요소가 없습니다.');
    }

    // 이미지 alt 텍스트 검사
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length}개의 이미지에 alt 텍스트가 없습니다.`);
    }

    // 폼 레이블 검사
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputs).filter(input => {
      return !document.querySelector(`label[for="${input.id}"]`);
    });
    
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length}개의 입력 필드에 레이블이 없습니다.`);
    }

    // 색상 대비 검사 (간단한 버전)
    const textElements = document.querySelectorAll('p, span, div, button, a');
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      
      if (bgColor && textColor && this.getContrastRatio(bgColor, textColor) < 4.5) {
        issues.push(`색상 대비가 충분하지 않은 텍스트가 발견되었습니다: ${element.textContent?.substring(0, 50)}...`);
      }
    });

    return issues;
  }

  getContrastRatio(color1, color2) {
    // 매우 단순화된 대비 계산 (실제로는 더 복잡한 계산이 필요)
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  getLuminance(color) {
    // RGB 값 추출 및 상대 휘도 계산 (단순화됨)
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0.5;
    
    const [r, g, b] = rgb.map(c => {
      c = parseInt(c) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}

// 전역 인스턴스 생성
window.accessibilityManager = new AccessibilityManager();

console.log('Accessibility Manager 로드 완료');