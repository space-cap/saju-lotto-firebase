class InternationalizationManager {
  constructor() {
    this.currentLocale = 'ko';
    this.fallbackLocale = 'ko';
    this.translations = {};
    this.dateFormats = {};
    this.numberFormats = {};
    this.init();
  }

  async init() {
    await this.loadLocale();
    await this.loadTranslations();
    this.setupLanguageDetection();
    this.createLanguageSelector();
    this.translatePage();
    console.log('InternationalizationManager 초기화 완료');
  }

  async loadLocale() {
    try {
      // 저장된 언어 설정 로드
      if (window.offlineCache) {
        this.currentLocale = await window.offlineCache.getSetting('currentLocale', 'ko');
      } else {
        this.currentLocale = localStorage.getItem('currentLocale') || 'ko';
      }
      
      // 브라우저 언어 감지 (첫 방문시)
      if (this.currentLocale === 'ko' && !localStorage.getItem('localeSet')) {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('en')) {
          this.currentLocale = 'en';
        } else if (browserLang.startsWith('ja')) {
          this.currentLocale = 'ja';
        } else if (browserLang.startsWith('zh')) {
          this.currentLocale = 'zh';
        }
      }
    } catch (error) {
      console.error('언어 설정 로드 실패:', error);
    }
  }

  async loadTranslations() {
    // 한국어 (기본)
    this.translations.ko = {
      // 앱 제목 및 기본 텍스트
      'app.title': '사주명리 로또번호 생성기',
      'app.subtitle': '전통 사주명리학으로 만나는 당신만의 행운번호',
      'app.description': '운명의 기운을 담은 특별한 번호',
      
      // 네비게이션
      'nav.home': '홈',
      'nav.generate': '번호 생성',
      'nav.fortune': '운세',
      'nav.history': '히스토리',
      'nav.settings': '설정',
      
      // 사용자 인증
      'auth.login': '로그인',
      'auth.register': '회원가입',
      'auth.logout': '로그아웃',
      'auth.email': '이메일',
      'auth.password': '비밀번호',
      'auth.google': 'Google 로그인',
      'auth.welcome': '환영합니다',
      
      // 사주 입력 폼
      'form.birth.date': '생년월일',
      'form.birth.time': '출생시간',
      'form.birth.calendar': '달력 종류',
      'form.birth.solar': '양력',
      'form.birth.lunar': '음력',
      'form.birth.gender': '성별',
      'form.birth.male': '남성',
      'form.birth.female': '여성',
      'form.birth.generate': '번호 생성하기',
      
      // 운세 관련
      'fortune.today': '오늘의 운세',
      'fortune.overall': '종합 운세',
      'fortune.wealth': '재물운',
      'fortune.love': '애정운',
      'fortune.health': '건강운',
      'fortune.career': '직업운',
      'fortune.excellent': '대길',
      'fortune.good': '길',
      'fortune.normal': '평',
      'fortune.bad': '흉',
      'fortune.terrible': '대흉',
      
      // 사주 요소
      'saju.pillars': '사주팔자',
      'saju.year': '년주',
      'saju.month': '월주',
      'saju.day': '일주',
      'saju.hour': '시주',
      'saju.elements': '오행',
      'saju.wood': '목',
      'saju.fire': '화',
      'saju.earth': '토',
      'saju.metal': '금',
      'saju.water': '수',
      
      // 로또 번호
      'lotto.numbers': '추천 번호',
      'lotto.explanation': '번호 해석',
      'lotto.save': '번호 저장하기',
      'lotto.saved': '저장된 번호',
      'lotto.generate': '새 번호 생성',
      'lotto.check': '당첨 확인',
      
      // 알림
      'notification.permission': '알림 권한',
      'notification.enable': '알림 활성화',
      'notification.test': '테스트 알림',
      'notification.settings': '알림 설정',
      
      // 버튼 및 액션
      'button.confirm': '확인',
      'button.cancel': '취소',
      'button.save': '저장',
      'button.delete': '삭제',
      'button.edit': '편집',
      'button.close': '닫기',
      'button.next': '다음',
      'button.previous': '이전',
      'button.refresh': '새로고침',
      
      // 상태 메시지
      'status.loading': '로딩 중...',
      'status.saving': '저장 중...',
      'status.saved': '저장되었습니다',
      'status.error': '오류가 발생했습니다',
      'status.success': '성공했습니다',
      'status.offline': '오프라인 모드',
      'status.online': '온라인',
      
      // 날짜 및 시간
      'date.today': '오늘',
      'date.yesterday': '어제',
      'date.tomorrow': '내일',
      'time.morning': '오전',
      'time.afternoon': '오후',
      'time.evening': '저녁',
      'time.night': '밤',
      
      // 에러 메시지
      'error.network': '네트워크 연결을 확인해주세요',
      'error.auth': '로그인이 필요합니다',
      'error.permission': '권한이 필요합니다',
      'error.invalid.input': '입력 정보를 확인해주세요',
      'error.server': '서버 오류가 발생했습니다'
    };

    // 영어
    this.translations.en = {
      'app.title': 'Saju Fortune Lottery Generator',
      'app.subtitle': 'Your Lucky Numbers Based on Traditional Korean Astrology',
      'app.description': 'Special Numbers Infused with Destiny\'s Energy',
      
      'nav.home': 'Home',
      'nav.generate': 'Generate',
      'nav.fortune': 'Fortune',
      'nav.history': 'History',
      'nav.settings': 'Settings',
      
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.logout': 'Logout',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.google': 'Google Login',
      'auth.welcome': 'Welcome',
      
      'form.birth.date': 'Birth Date',
      'form.birth.time': 'Birth Time',
      'form.birth.calendar': 'Calendar Type',
      'form.birth.solar': 'Solar',
      'form.birth.lunar': 'Lunar',
      'form.birth.gender': 'Gender',
      'form.birth.male': 'Male',
      'form.birth.female': 'Female',
      'form.birth.generate': 'Generate Numbers',
      
      'fortune.today': 'Today\'s Fortune',
      'fortune.overall': 'Overall Fortune',
      'fortune.wealth': 'Wealth Luck',
      'fortune.love': 'Love Luck',
      'fortune.health': 'Health Luck',
      'fortune.career': 'Career Luck',
      'fortune.excellent': 'Excellent',
      'fortune.good': 'Good',
      'fortune.normal': 'Normal',
      'fortune.bad': 'Bad',
      'fortune.terrible': 'Terrible',
      
      'saju.pillars': 'Four Pillars',
      'saju.year': 'Year Pillar',
      'saju.month': 'Month Pillar',
      'saju.day': 'Day Pillar',
      'saju.hour': 'Hour Pillar',
      'saju.elements': 'Five Elements',
      'saju.wood': 'Wood',
      'saju.fire': 'Fire',
      'saju.earth': 'Earth',
      'saju.metal': 'Metal',
      'saju.water': 'Water',
      
      'lotto.numbers': 'Lucky Numbers',
      'lotto.explanation': 'Number Analysis',
      'lotto.save': 'Save Numbers',
      'lotto.saved': 'Saved Numbers',
      'lotto.generate': 'Generate New',
      'lotto.check': 'Check Winning',
      
      'notification.permission': 'Notification Permission',
      'notification.enable': 'Enable Notifications',
      'notification.test': 'Test Notification',
      'notification.settings': 'Notification Settings',
      
      'button.confirm': 'Confirm',
      'button.cancel': 'Cancel',
      'button.save': 'Save',
      'button.delete': 'Delete',
      'button.edit': 'Edit',
      'button.close': 'Close',
      'button.next': 'Next',
      'button.previous': 'Previous',
      'button.refresh': 'Refresh',
      
      'status.loading': 'Loading...',
      'status.saving': 'Saving...',
      'status.saved': 'Saved successfully',
      'status.error': 'An error occurred',
      'status.success': 'Success',
      'status.offline': 'Offline Mode',
      'status.online': 'Online',
      
      'date.today': 'Today',
      'date.yesterday': 'Yesterday',
      'date.tomorrow': 'Tomorrow',
      'time.morning': 'Morning',
      'time.afternoon': 'Afternoon',
      'time.evening': 'Evening',
      'time.night': 'Night',
      
      'error.network': 'Please check your network connection',
      'error.auth': 'Login required',
      'error.permission': 'Permission required',
      'error.invalid.input': 'Please check your input',
      'error.server': 'Server error occurred'
    };

    // 일본어
    this.translations.ja = {
      'app.title': '四柱推命ロト番号生成器',
      'app.subtitle': '伝統的な四柱推命による運命の番号',
      'app.description': '運命のエネルギーを込めた特別な番号',
      
      'nav.home': 'ホーム',
      'nav.generate': '番号生成',
      'nav.fortune': '運勢',
      'nav.history': '履歴',
      'nav.settings': '設定',
      
      'auth.login': 'ログイン',
      'auth.register': '会員登録',
      'auth.logout': 'ログアウト',
      'auth.email': 'メール',
      'auth.password': 'パスワード',
      'auth.google': 'Googleログイン',
      'auth.welcome': 'ようこそ',
      
      'form.birth.date': '生年月日',
      'form.birth.time': '出生時刻',
      'form.birth.calendar': 'カレンダー',
      'form.birth.solar': '太陽暦',
      'form.birth.lunar': '太陰暦',
      'form.birth.gender': '性別',
      'form.birth.male': '男性',
      'form.birth.female': '女性',
      'form.birth.generate': '番号生成',
      
      'fortune.today': '今日の運勢',
      'fortune.overall': '総合運',
      'fortune.wealth': '金運',
      'fortune.love': '恋愛運',
      'fortune.health': '健康運',
      'fortune.career': '仕事運',
      'fortune.excellent': '大吉',
      'fortune.good': '吉',
      'fortune.normal': '中吉',
      'fortune.bad': '凶',
      'fortune.terrible': '大凶',
      
      'saju.pillars': '四柱',
      'saju.year': '年柱',
      'saju.month': '月柱',
      'saju.day': '日柱',
      'saju.hour': '時柱',
      'saju.elements': '五行',
      'saju.wood': '木',
      'saju.fire': '火',
      'saju.earth': '土',
      'saju.metal': '金',
      'saju.water': '水',
      
      'lotto.numbers': 'ラッキー番号',
      'lotto.explanation': '番号解析',
      'lotto.save': '番号保存',
      'lotto.saved': '保存された番号',
      'lotto.generate': '新規生成',
      'lotto.check': '当選確認',
      
      'button.confirm': '確認',
      'button.cancel': 'キャンセル',
      'button.save': '保存',
      'button.delete': '削除',
      'button.edit': '編集',
      'button.close': '閉じる',
      
      'status.loading': '読み込み中...',
      'status.saving': '保存中...',
      'status.saved': '保存されました',
      'status.error': 'エラーが発生しました',
      'status.success': '成功しました',
      'status.offline': 'オフラインモード',
      'status.online': 'オンライン',
      
      'error.network': 'ネットワーク接続を確認してください',
      'error.auth': 'ログインが必要です',
      'error.permission': '権限が必要です',
      'error.invalid.input': '入力内容を確認してください',
      'error.server': 'サーバーエラーが発生しました'
    };

    // 중국어 (간체)
    this.translations.zh = {
      'app.title': '四柱命理彩票号码生成器',
      'app.subtitle': '基于传统四柱命理的幸运号码',
      'app.description': '蕴含命运能量的特殊号码',
      
      'nav.home': '首页',
      'nav.generate': '生成号码',
      'nav.fortune': '运势',
      'nav.history': '历史',
      'nav.settings': '设置',
      
      'auth.login': '登录',
      'auth.register': '注册',
      'auth.logout': '退出',
      'auth.email': '邮箱',
      'auth.password': '密码',
      'auth.google': '谷歌登录',
      'auth.welcome': '欢迎',
      
      'form.birth.date': '出生日期',
      'form.birth.time': '出生时间',
      'form.birth.calendar': '历法',
      'form.birth.solar': '公历',
      'form.birth.lunar': '农历',
      'form.birth.gender': '性别',
      'form.birth.male': '男',
      'form.birth.female': '女',
      'form.birth.generate': '生成号码',
      
      'fortune.today': '今日运势',
      'fortune.overall': '综合运势',
      'fortune.wealth': '财运',
      'fortune.love': '桃花运',
      'fortune.health': '健康运',
      'fortune.career': '事业运',
      'fortune.excellent': '大吉',
      'fortune.good': '吉',
      'fortune.normal': '平',
      'fortune.bad': '凶',
      'fortune.terrible': '大凶',
      
      'saju.pillars': '四柱',
      'saju.year': '年柱',
      'saju.month': '月柱',
      'saju.day': '日柱',
      'saju.hour': '时柱',
      'saju.elements': '五行',
      'saju.wood': '木',
      'saju.fire': '火',
      'saju.earth': '土',
      'saju.metal': '金',
      'saju.water': '水',
      
      'lotto.numbers': '幸运号码',
      'lotto.explanation': '号码解析',
      'lotto.save': '保存号码',
      'lotto.saved': '已保存号码',
      'lotto.generate': '生成新号码',
      'lotto.check': '中奖查询',
      
      'button.confirm': '确认',
      'button.cancel': '取消',
      'button.save': '保存',
      'button.delete': '删除',
      'button.edit': '编辑',
      'button.close': '关闭',
      
      'status.loading': '加载中...',
      'status.saving': '保存中...',
      'status.saved': '已保存',
      'status.error': '发生错误',
      'status.success': '成功',
      'status.offline': '离线模式',
      'status.online': '在线',
      
      'error.network': '请检查网络连接',
      'error.auth': '需要登录',
      'error.permission': '需要权限',
      'error.invalid.input': '请检查输入内容',
      'error.server': '服务器错误'
    };

    // 날짜 형식 설정
    this.dateFormats = {
      ko: { year: 'numeric', month: 'long', day: 'numeric' },
      en: { year: 'numeric', month: 'long', day: 'numeric' },
      ja: { year: 'numeric', month: 'long', day: 'numeric' },
      zh: { year: 'numeric', month: 'long', day: 'numeric' }
    };

    // 숫자 형식 설정
    this.numberFormats = {
      ko: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
      en: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
      ja: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
      zh: { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    };
  }

  setupLanguageDetection() {
    // URL 파라미터에서 언어 감지
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && this.translations[langParam]) {
      this.setLanguage(langParam);
    }

    // 시스템 언어 변경 감지
    window.addEventListener('languagechange', () => {
      if (!localStorage.getItem('localeSet')) {
        const newLang = navigator.language.substring(0, 2);
        if (this.translations[newLang] && this.currentLocale !== newLang) {
          this.setLanguage(newLang);
        }
      }
    });
  }

  createLanguageSelector() {
    const languageSelector = document.createElement('div');
    languageSelector.className = 'language-selector';
    languageSelector.innerHTML = `
      <button class="language-toggle" onclick="window.i18n.showLanguageMenu()" 
              aria-label="${this.t('nav.settings')}" title="${this.t('nav.settings')}">
        <span class="language-flag">${this.getCurrentFlag()}</span>
        <span class="language-code">${this.currentLocale.toUpperCase()}</span>
      </button>
    `;

    // 헤더에 추가
    const header = document.querySelector('.header') || document.querySelector('header');
    if (header) {
      const existingSelector = header.querySelector('.language-selector');
      if (existingSelector) {
        existingSelector.remove();
      }
      header.appendChild(languageSelector);
    }

    this.addLanguageSelectorStyles();
  }

  addLanguageSelectorStyles() {
    if (document.getElementById('language-selector-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'language-selector-styles';
    styles.textContent = `
      .language-selector {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1001;
      }

      .language-toggle {
        background: var(--surface-color);
        border: 2px solid var(--primary-color);
        border-radius: 25px;
        padding: 8px 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        color: var(--text-color);
        transition: all 0.3s ease;
        min-width: 70px;
      }

      .language-toggle:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px var(--shadow-color);
      }

      .language-flag {
        font-size: 16px;
      }

      .language-code {
        font-size: 11px;
        font-family: monospace;
      }

      .language-menu {
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
        backdrop-filter: blur(10px);
      }

      .language-menu-content {
        background: var(--surface-color);
        border-radius: 15px;
        padding: 25px;
        max-width: 400px;
        width: 90%;
        border: 2px solid var(--primary-color);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }

      .language-menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid var(--border-color);
      }

      .language-menu-title {
        font-size: 20px;
        font-weight: bold;
        color: var(--text-color);
        margin: 0;
      }

      .language-menu-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-secondary);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .language-menu-close:hover {
        background: var(--border-color);
      }

      .language-options {
        display: grid;
        gap: 10px;
      }

      .language-option {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid var(--border-color);
        border-radius: 10px;
        padding: 15px 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 15px;
        position: relative;
      }

      .language-option:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px var(--shadow-color);
      }

      .language-option.active {
        border-color: var(--primary-color);
        background: rgba(212, 175, 55, 0.1);
      }

      .language-option.active::after {
        content: '✓';
        position: absolute;
        right: 15px;
        color: var(--primary-color);
        font-weight: bold;
        font-size: 18px;
      }

      .language-flag-large {
        font-size: 24px;
        min-width: 32px;
        text-align: center;
      }

      .language-info {
        flex: 1;
      }

      .language-name {
        font-size: 16px;
        font-weight: bold;
        color: var(--text-color);
        margin-bottom: 4px;
      }

      .language-native {
        font-size: 14px;
        color: var(--text-secondary);
      }

      @media (max-width: 480px) {
        .language-selector {
          top: 15px;
          left: 15px;
        }

        .language-toggle {
          padding: 6px 12px;
          font-size: 12px;
          min-width: 60px;
        }

        .language-menu-content {
          width: 95%;
          padding: 20px;
        }

        .language-option {
          padding: 12px 15px;
        }

        .language-flag-large {
          font-size: 20px;
          min-width: 28px;
        }

        .language-name {
          font-size: 14px;
        }

        .language-native {
          font-size: 12px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  showLanguageMenu() {
    const modal = document.createElement('div');
    modal.className = 'language-menu';
    
    const languages = [
      { code: 'ko', flag: '🇰🇷', name: '한국어', native: '한국어' },
      { code: 'en', flag: '🇺🇸', name: 'English', native: 'English' },
      { code: 'ja', flag: '🇯🇵', name: '일본어', native: '日本語' },
      { code: 'zh', flag: '🇨🇳', name: '중국어', native: '中文' }
    ];

    modal.innerHTML = `
      <div class="language-menu-content">
        <div class="language-menu-header">
          <h3 class="language-menu-title">🌐 ${this.t('nav.settings')}</h3>
          <button class="language-menu-close" onclick="this.closest('.language-menu').remove()">&times;</button>
        </div>
        <div class="language-options">
          ${languages.map(lang => `
            <div class="language-option ${this.currentLocale === lang.code ? 'active' : ''}" 
                 onclick="window.i18n.setLanguage('${lang.code}')">
              <div class="language-flag-large">${lang.flag}</div>
              <div class="language-info">
                <div class="language-name">${lang.name}</div>
                <div class="language-native">${lang.native}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  async setLanguage(locale) {
    if (this.translations[locale]) {
      this.currentLocale = locale;
      
      // 언어 설정 저장
      try {
        if (window.offlineCache) {
          await window.offlineCache.saveSetting('currentLocale', locale);
        } else {
          localStorage.setItem('currentLocale', locale);
          localStorage.setItem('localeSet', 'true');
        }
      } catch (error) {
        console.error('언어 설정 저장 실패:', error);
      }

      // 페이지 번역
      this.translatePage();
      
      // HTML lang 속성 업데이트
      document.documentElement.lang = locale;
      
      // 메타 태그 업데이트
      this.updateMetaTags();
      
      // 언어 선택기 업데이트
      this.updateLanguageSelector();
      
      // 날짜/시간 형식 업데이트
      this.updateDateTimeDisplay();
      
      // 언어 변경 모달 닫기
      const modal = document.querySelector('.language-menu');
      if (modal) modal.remove();
      
      // 변경 알림
      this.showLanguageChangeNotification();
      
      // 언어 변경 이벤트 발송
      document.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { locale, translations: this.translations[locale] }
      }));
      
      console.log(`언어가 ${locale}로 변경되었습니다.`);
    }
  }

  translatePage() {
    // 모든 번역 가능한 요소 찾기
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const keys = element.getAttribute('data-i18n').split(',');
      
      keys.forEach(key => {
        const [attribute, translationKey] = key.includes('=') ? key.split('=') : ['text', key];
        const translation = this.t(translationKey.trim());
        
        if (translation) {
          if (attribute === 'text') {
            element.textContent = translation;
          } else if (attribute === 'html') {
            element.innerHTML = translation;
          } else {
            element.setAttribute(attribute, translation);
          }
        }
      });
    });

    // 특별한 요소들 처리
    this.translateSpecialElements();
  }

  translateSpecialElements() {
    // 제목 업데이트
    const title = document.querySelector('title');
    if (title) {
      title.textContent = this.t('app.title');
    }

    // 메타 디스크립션 업데이트
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', this.t('app.subtitle'));
    }

    // 동적으로 생성된 콘텐츠 번역
    this.translateDynamicContent();
  }

  translateDynamicContent() {
    // 운세 레벨 번역
    const fortuneLevels = document.querySelectorAll('.fortune-level');
    fortuneLevels.forEach(element => {
      const level = element.getAttribute('data-level');
      if (level) {
        element.textContent = this.t(`fortune.${level}`);
      }
    });

    // 오행 요소 번역
    const elements = document.querySelectorAll('.element');
    elements.forEach(element => {
      const elementType = element.getAttribute('data-element');
      if (elementType) {
        element.textContent = this.t(`saju.${elementType}`);
      }
    });

    // 버튼 텍스트 번역
    const buttons = document.querySelectorAll('button:not([data-i18n])');
    buttons.forEach(button => {
      if (button.textContent === '번호 생성하기' || button.textContent.includes('Generate Numbers')) {
        button.textContent = this.t('form.birth.generate');
      }
      if (button.textContent.includes('저장') || button.textContent.includes('Save')) {
        button.textContent = this.t('lotto.save');
      }
    });
  }

  updateMetaTags() {
    // Open Graph 태그 업데이트
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', this.t('app.title'));
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', this.t('app.subtitle'));
    }

    // Twitter Card 태그 업데이트
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', this.t('app.title'));
    }

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) {
      twitterDesc.setAttribute('content', this.t('app.subtitle'));
    }
  }

  updateLanguageSelector() {
    const flagElement = document.querySelector('.language-flag');
    const codeElement = document.querySelector('.language-code');
    
    if (flagElement) {
      flagElement.textContent = this.getCurrentFlag();
    }
    
    if (codeElement) {
      codeElement.textContent = this.currentLocale.toUpperCase();
    }
  }

  updateDateTimeDisplay() {
    // 모든 날짜 요소 업데이트
    const dateElements = document.querySelectorAll('[data-date]');
    dateElements.forEach(element => {
      const dateValue = element.getAttribute('data-date');
      if (dateValue) {
        const date = new Date(dateValue);
        element.textContent = this.formatDate(date);
      }
    });

    // 시간 요소 업데이트
    const timeElements = document.querySelectorAll('[data-time]');
    timeElements.forEach(element => {
      const timeValue = element.getAttribute('data-time');
      if (timeValue) {
        const time = new Date(timeValue);
        element.textContent = this.formatTime(time);
      }
    });
  }

  showLanguageChangeNotification() {
    const notification = document.createElement('div');
    notification.className = 'language-change-notification';
    notification.innerHTML = `
      <span class="notification-flag">${this.getCurrentFlag()}</span>
      <span class="notification-text">${this.t('status.success')}</span>
    `;
    
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
      z-index: 10002;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideUp 0.3s ease-out;
      box-shadow: 0 4px 12px var(--shadow-color);
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  getCurrentFlag() {
    const flags = {
      ko: '🇰🇷',
      en: '🇺🇸',
      ja: '🇯🇵',
      zh: '🇨🇳'
    };
    return flags[this.currentLocale] || '🌐';
  }

  // 번역 함수 (t = translate)
  t(key, params = {}) {
    let translation = this.translations[this.currentLocale]?.[key] || 
                     this.translations[this.fallbackLocale]?.[key] || 
                     key;

    // 매개변수 치환
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });

    return translation;
  }

  // 복수형 처리
  tn(key, count, params = {}) {
    const translation = this.t(key, { ...params, count });
    
    // 간단한 복수형 처리 (영어)
    if (this.currentLocale === 'en' && count !== 1) {
      return translation.replace(/\b(\w+)\b/g, (match) => {
        if (match.endsWith('s')) return match;
        return match + 's';
      });
    }
    
    return translation;
  }

  // 날짜 포맷팅
  formatDate(date) {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, this.dateFormats[this.currentLocale]).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  // 시간 포맷팅
  formatTime(date) {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return date.toLocaleTimeString();
    }
  }

  // 숫자 포맷팅
  formatNumber(number) {
    try {
      return new Intl.NumberFormat(this.currentLocale, this.numberFormats[this.currentLocale]).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  // 통화 포맷팅
  formatCurrency(amount, currency = 'KRW') {
    try {
      return new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return amount.toString();
    }
  }

  // 상대 시간 포맷팅
  formatRelativeTime(date) {
    try {
      const rtf = new Intl.RelativeTimeFormat(this.currentLocale);
      const diff = date.getTime() - Date.now();
      const days = Math.round(diff / (1000 * 60 * 60 * 24));
      
      if (Math.abs(days) < 1) {
        const hours = Math.round(diff / (1000 * 60 * 60));
        return rtf.format(hours, 'hour');
      }
      
      return rtf.format(days, 'day');
    } catch (error) {
      return this.formatDate(date);
    }
  }

  // 현재 언어 정보 반환
  getCurrentLanguage() {
    return {
      code: this.currentLocale,
      name: this.t(`language.${this.currentLocale}`),
      flag: this.getCurrentFlag(),
      isRTL: ['ar', 'he'].includes(this.currentLocale)
    };
  }

  // 지원하는 언어 목록 반환
  getSupportedLanguages() {
    return Object.keys(this.translations).map(code => ({
      code,
      name: this.translations[code]['app.title'] || code,
      flag: this.getCurrentFlag(),
      native: this.translations[code]['app.title'] || code
    }));
  }
}

// 전역 인스턴스 생성
window.i18n = new InternationalizationManager();

// DOM 로드 완료 후 번역 적용
document.addEventListener('DOMContentLoaded', () => {
  // 기존 요소들에 번역 속성 추가
  const elementsToTranslate = [
    { selector: '.main-title', key: 'app.title' },
    { selector: '.subtitle', key: 'app.subtitle' },
    { selector: '.auth-toggle-btn', key: 'auth.login' },
    { selector: '.logout-btn', key: 'auth.logout' },
    { selector: 'button[onclick="generateSajuNumbers()"]', key: 'form.birth.generate' },
    { selector: '.generate-btn .btn-text', key: 'form.birth.generate' },
    { selector: 'button[onclick="saveLottoNumbers()"]', key: 'lotto.save' }
  ];

  elementsToTranslate.forEach(({ selector, key }) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      element.setAttribute('data-i18n', key);
    });
  });

  // 초기 번역 적용
  window.i18n.translatePage();
});

console.log('Internationalization Manager 로드 완료');