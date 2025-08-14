class ThemeManager {
  constructor() {
    this.themes = {
      light: {
        name: '기본 테마',
        primary: '#8b4513',
        secondary: '#d4af37',
        background: 'linear-gradient(135deg, #f5e6d3 0%, #e6d4b7 100%)',
        surface: 'rgba(255, 255, 255, 0.9)',
        text: '#2c1810',
        textSecondary: '#5a4037',
        border: 'rgba(139, 69, 19, 0.3)',
        shadow: 'rgba(44, 24, 16, 0.1)',
        accent: '#f4e4bc',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336'
      },
      dark: {
        name: '다크 테마',
        primary: '#d4af37',
        secondary: '#f4e4bc',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2c1810 100%)',
        surface: 'rgba(44, 24, 16, 0.8)',
        text: '#f5e6d3',
        textSecondary: '#d4af37',
        border: 'rgba(212, 175, 55, 0.3)',
        shadow: 'rgba(0, 0, 0, 0.3)',
        accent: '#8b4513',
        success: '#66BB6A',
        warning: '#FFA726',
        error: '#EF5350'
      },
      autumn: {
        name: '가을 테마',
        primary: '#b8860b',
        secondary: '#daa520',
        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #d2691e 100%)',
        surface: 'rgba(139, 69, 19, 0.8)',
        text: '#fff8dc',
        textSecondary: '#daa520',
        border: 'rgba(218, 165, 32, 0.4)',
        shadow: 'rgba(0, 0, 0, 0.4)',
        accent: '#cd853f',
        success: '#8BC34A',
        warning: '#FF8F00',
        error: '#E53935'
      },
      spring: {
        name: '봄 테마',
        primary: '#32cd32',
        secondary: '#98fb98',
        background: 'linear-gradient(135deg, #f0fff0 0%, #e6ffe6 50%, #ccffcc 100%)',
        surface: 'rgba(144, 238, 144, 0.6)',
        text: '#006400',
        textSecondary: '#228b22',
        border: 'rgba(50, 205, 50, 0.3)',
        shadow: 'rgba(0, 100, 0, 0.1)',
        accent: '#90ee90',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336'
      },
      winter: {
        name: '겨울 테마',
        primary: '#4682b4',
        secondary: '#87ceeb',
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #cce7ff 100%)',
        surface: 'rgba(176, 196, 222, 0.6)',
        text: '#191970',
        textSecondary: '#4682b4',
        border: 'rgba(70, 130, 180, 0.3)',
        shadow: 'rgba(25, 25, 112, 0.1)',
        accent: '#b0c4de',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336'
      },
      royal: {
        name: '황실 테마',
        primary: '#800080',
        secondary: '#dda0dd',
        background: 'linear-gradient(135deg, #4b0082 0%, #663399 50%, #8b008b 100%)',
        surface: 'rgba(75, 0, 130, 0.8)',
        text: '#e6e6fa',
        textSecondary: '#dda0dd',
        border: 'rgba(221, 160, 221, 0.4)',
        shadow: 'rgba(0, 0, 0, 0.4)',
        accent: '#9370db',
        success: '#66BB6A',
        warning: '#FFA726',
        error: '#EF5350'
      }
    };
    
    this.currentTheme = 'light';
    this.isAutoTheme = false;
    this.init();
  }

  async init() {
    try {
      await this.loadThemeSettings();
      this.setupThemeDetection();
      this.createThemeControls();
      this.applyTheme();
      console.log('ThemeManager 초기화 완료');
    } catch (error) {
      console.error('ThemeManager 초기화 실패:', error);
    }
  }

  async loadThemeSettings() {
    try {
      if (window.offlineCache) {
        this.currentTheme = await window.offlineCache.getSetting('currentTheme', 'light');
        this.isAutoTheme = await window.offlineCache.getSetting('isAutoTheme', false);
      } else {
        this.currentTheme = localStorage.getItem('currentTheme') || 'light';
        this.isAutoTheme = localStorage.getItem('isAutoTheme') === 'true';
      }
    } catch (error) {
      console.error('테마 설정 로드 실패:', error);
    }
  }

  async saveThemeSettings() {
    try {
      if (window.offlineCache) {
        await window.offlineCache.saveSetting('currentTheme', this.currentTheme);
        await window.offlineCache.saveSetting('isAutoTheme', this.isAutoTheme);
      } else {
        localStorage.setItem('currentTheme', this.currentTheme);
        localStorage.setItem('isAutoTheme', this.isAutoTheme.toString());
      }
    } catch (error) {
      console.error('테마 설정 저장 실패:', error);
    }
  }

  setupThemeDetection() {
    // 시스템 다크모드 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      if (this.isAutoTheme) {
        this.currentTheme = e.matches ? 'dark' : 'light';
        this.applyTheme();
      }
    });

    // 시간 기반 자동 테마
    this.setupTimeBasedTheme();
  }

  setupTimeBasedTheme() {
    if (this.isAutoTheme) {
      const hour = new Date().getHours();
      const month = new Date().getMonth() + 1;
      
      // 계절별 자동 테마
      if (month >= 3 && month <= 5) {
        this.currentTheme = 'spring';
      } else if (month >= 6 && month <= 8) {
        this.currentTheme = 'light';
      } else if (month >= 9 && month <= 11) {
        this.currentTheme = 'autumn';
      } else {
        this.currentTheme = 'winter';
      }
      
      // 시간대별 조정
      if (hour >= 20 || hour <= 6) {
        this.currentTheme = 'dark';
      }
    }
  }

  createThemeControls() {
    // 테마 선택 버튼이 이미 있는지 확인
    if (document.querySelector('.theme-control')) return;

    const themeControl = document.createElement('div');
    themeControl.className = 'theme-control';
    themeControl.innerHTML = `
      <button class="theme-toggle-btn" onclick="window.themeManager.showThemeSelector()" aria-label="테마 변경">
        <span class="theme-icon">🎨</span>
      </button>
    `;

    // 헤더에 추가
    const header = document.querySelector('.header') || document.querySelector('header');
    if (header) {
      header.appendChild(themeControl);
    }

    this.addThemeControlStyles();
  }

  addThemeControlStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .theme-control {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
      }

      .theme-toggle-btn {
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

      .theme-toggle-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px var(--shadow-color);
      }

      .theme-selector-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .theme-selector-content {
        background: var(--surface-color);
        border-radius: 15px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid var(--primary-color);
      }

      .theme-selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid var(--border-color);
      }

      .theme-selector-title {
        font-size: 24px;
        font-weight: bold;
        color: var(--text-color);
        margin: 0;
      }

      .theme-selector-close {
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
      }

      .theme-selector-close:hover {
        background: var(--border-color);
      }

      .theme-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .theme-option {
        border: 2px solid var(--border-color);
        border-radius: 10px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .theme-option:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px var(--shadow-color);
      }

      .theme-option.active {
        border-color: var(--primary-color);
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
      }

      .theme-option.active::before {
        content: '✓';
        position: absolute;
        top: 10px;
        right: 10px;
        color: var(--primary-color);
        font-weight: bold;
        font-size: 18px;
      }

      .theme-preview {
        height: 60px;
        border-radius: 8px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      }

      .theme-name {
        font-weight: bold;
        color: var(--text-color);
        text-align: center;
        font-size: 14px;
      }

      .auto-theme-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        background: var(--accent-color);
        border-radius: 10px;
        margin-bottom: 15px;
      }

      .auto-theme-toggle label {
        color: var(--text-color);
        font-weight: bold;
        cursor: pointer;
      }

      .auto-theme-toggle input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .theme-info {
        background: rgba(212, 175, 55, 0.1);
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 8px;
        padding: 15px;
        color: var(--text-secondary);
        font-size: 14px;
        line-height: 1.5;
      }

      @media (max-width: 480px) {
        .theme-control {
          top: 15px;
          right: 15px;
        }

        .theme-toggle-btn {
          width: 45px;
          height: 45px;
          font-size: 18px;
        }

        .theme-selector-content {
          padding: 20px;
          width: 95%;
        }

        .theme-options {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(styleSheet);
  }

  showThemeSelector() {
    const modal = document.createElement('div');
    modal.className = 'theme-selector-modal';
    modal.innerHTML = `
      <div class="theme-selector-content">
        <div class="theme-selector-header">
          <h3 class="theme-selector-title">🎨 테마 선택</h3>
          <button class="theme-selector-close" onclick="this.closest('.theme-selector-modal').remove()">&times;</button>
        </div>
        
        <div class="auto-theme-toggle">
          <label for="auto-theme-checkbox">자동 테마 (계절/시간 기반)</label>
          <input type="checkbox" id="auto-theme-checkbox" ${this.isAutoTheme ? 'checked' : ''} 
                 onchange="window.themeManager.toggleAutoTheme(this.checked)">
        </div>
        
        <div class="theme-options">
          ${Object.keys(this.themes).map(themeKey => `
            <div class="theme-option ${this.currentTheme === themeKey ? 'active' : ''}" 
                 onclick="window.themeManager.setTheme('${themeKey}')">
              <div class="theme-preview" style="background: ${this.themes[themeKey].background};">
                ${this.getThemeIcon(themeKey)}
              </div>
              <div class="theme-name">${this.themes[themeKey].name}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="theme-info">
          💡 <strong>팁:</strong> 자동 테마를 활성화하면 계절과 시간에 따라 자동으로 테마가 변경됩니다. 
          봄(3-5월), 여름(6-8월), 가을(9-11월), 겨울(12-2월)과 야간 시간대(20시-6시)에는 다크 테마가 적용됩니다.
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  getThemeIcon(themeKey) {
    const icons = {
      light: '☀️',
      dark: '🌙',
      autumn: '🍂',
      spring: '🌸',
      winter: '❄️',
      royal: '👑'
    };
    return icons[themeKey] || '🎨';
  }

  async setTheme(themeKey) {
    if (this.themes[themeKey]) {
      this.currentTheme = themeKey;
      this.isAutoTheme = false;
      this.applyTheme();
      await this.saveThemeSettings();
      
      // 모달 업데이트
      const modal = document.querySelector('.theme-selector-modal');
      if (modal) {
        const options = modal.querySelectorAll('.theme-option');
        options.forEach(option => {
          option.classList.remove('active');
        });
        modal.querySelector(`[onclick="window.themeManager.setTheme('${themeKey}')"]`).classList.add('active');
        
        const checkbox = modal.querySelector('#auto-theme-checkbox');
        if (checkbox) checkbox.checked = false;
      }
      
      this.showThemeChangeNotification(this.themes[themeKey].name);
    }
  }

  async toggleAutoTheme(enabled) {
    this.isAutoTheme = enabled;
    
    if (enabled) {
      this.setupTimeBasedTheme();
      this.applyTheme();
    }
    
    await this.saveThemeSettings();
    
    this.showThemeChangeNotification(enabled ? '자동 테마 활성화' : '자동 테마 비활성화');
  }

  showThemeChangeNotification(themeName) {
    const notification = document.createElement('div');
    notification.className = 'theme-change-notification';
    notification.textContent = `✨ ${themeName} 적용됨`;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary-color);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-weight: bold;
      z-index: 10001;
      animation: slideUp 0.3s ease-out;
      box-shadow: 0 4px 12px var(--shadow-color);
    `;
    
    // 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  }

  applyTheme() {
    const theme = this.themes[this.currentTheme];
    const root = document.documentElement;
    
    // CSS 변수 설정
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--secondary-color', theme.secondary);
    root.style.setProperty('--background-gradient', theme.background);
    root.style.setProperty('--surface-color', theme.surface);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--shadow-color', theme.shadow);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--error-color', theme.error);
    
    // body 배경 적용
    document.body.style.background = theme.background;
    document.body.style.color = theme.text;
    
    // 메타 테마 컬러 업데이트
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme.primary);
    }
    
    // 테마 변경 이벤트 발송
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: this.currentTheme, colors: theme }
    }));
    
    console.log(`테마 적용: ${theme.name}`);
  }

  getCurrentTheme() {
    return {
      key: this.currentTheme,
      ...this.themes[this.currentTheme]
    };
  }

  // 접근성을 위한 고대비 테마 토글
  toggleHighContrast() {
    const isHighContrast = document.body.classList.contains('high-contrast');
    
    if (isHighContrast) {
      document.body.classList.remove('high-contrast');
    } else {
      document.body.classList.add('high-contrast');
    }
    
    // 고대비 스타일 추가
    if (!document.querySelector('#high-contrast-styles')) {
      const highContrastStyles = document.createElement('style');
      highContrastStyles.id = 'high-contrast-styles';
      highContrastStyles.textContent = `
        .high-contrast {
          filter: contrast(150%) !important;
        }
        
        .high-contrast * {
          text-shadow: 1px 1px 1px rgba(0,0,0,0.8) !important;
          border-width: 2px !important;
        }
        
        .high-contrast button {
          border: 3px solid var(--text-color) !important;
          background: var(--text-color) !important;
          color: var(--background-color) !important;
        }
      `;
      document.head.appendChild(highContrastStyles);
    }
  }

  // 테마 기반 사주 해석 색상
  getSajuElementColors() {
    const theme = this.themes[this.currentTheme];
    return {
      wood: this.currentTheme === 'spring' ? '#32cd32' : theme.success,
      fire: this.currentTheme === 'autumn' ? '#ff4500' : theme.error,
      earth: theme.primary,
      metal: theme.secondary,
      water: this.currentTheme === 'winter' ? '#4682b4' : theme.primary
    };
  }
}

// 전역 인스턴스 생성
window.themeManager = new ThemeManager();

// 테마 관련 CSS 변수를 기본 스타일시트에 추가
document.addEventListener('DOMContentLoaded', () => {
  // 기존 스타일시트에 CSS 변수 사용하도록 업데이트
  const existingStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
  existingStyles.forEach(styleElement => {
    if (styleElement.sheet && styleElement.sheet.cssRules) {
      // CSS 규칙을 순회하며 색상 값을 CSS 변수로 교체
      // 이는 런타임에서 동적으로 처리하기 어려우므로, 
      // 대신 주요 요소들에 CSS 변수 적용 클래스를 추가
    }
  });
  
  // 주요 UI 요소들에 테마 변수 적용
  const elementsToTheme = document.querySelectorAll(`
    .container, .header, .main-content, .section, 
    .button, .input, .modal, .card, .form-group,
    .action-buttons, .result-section, .number-ball
  `);
  
  elementsToTheme.forEach(element => {
    element.classList.add('theme-aware');
  });
  
  // 테마 인식 요소들을 위한 기본 스타일 추가
  const themeAwareStyles = document.createElement('style');
  themeAwareStyles.id = 'theme-aware-styles';
  themeAwareStyles.textContent = `
    .theme-aware {
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(themeAwareStyles);
});

console.log('Theme Manager 로드 완료');