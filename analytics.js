class AnalyticsManager {
  constructor() {
    this.isInitialized = false;
    this.config = {
      gtag: {
        measurementId: 'G-XXXXXXXXXX', // Google Analytics 측정 ID
        enabled: false
      },
      firebase: {
        enabled: false
      },
      facebook: {
        pixelId: 'YOUR_PIXEL_ID',
        enabled: false
      },
      naver: {
        wcsid: 'YOUR_WCSID',
        enabled: false
      }
    };
    this.eventQueue = [];
    this.userProperties = {};
    this.sessionData = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      pageViews: 0,
      events: []
    };
    this.init();
  }

  async init() {
    try {
      await this.loadConfig();
      await this.setupConsent();
      await this.initializeProviders();
      this.setupAutomaticTracking();
      this.processQueuedEvents();
      this.isInitialized = true;
      console.log('AnalyticsManager 초기화 완료');
    } catch (error) {
      console.error('AnalyticsManager 초기화 실패:', error);
    }
  }

  async loadConfig() {
    try {
      // 환경변수나 설정 파일에서 분석 도구 설정 로드
      if (window.offlineCache) {
        const savedConfig = await window.offlineCache.getSetting('analyticsConfig');
        if (savedConfig) {
          this.config = { ...this.config, ...savedConfig };
        }
      }
    } catch (error) {
      console.error('Analytics 설정 로드 실패:', error);
    }
  }

  async setupConsent() {
    // GDPR/CCPA 준수를 위한 동의 관리
    const consent = this.getStoredConsent();
    
    if (consent === null) {
      this.showConsentBanner();
    } else if (consent === true) {
      this.enableTracking();
    }
  }

  getStoredConsent() {
    const consent = localStorage.getItem('analytics-consent');
    if (consent === null) return null;
    return consent === 'true';
  }

  showConsentBanner() {
    const banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.innerHTML = `
      <div class="consent-content">
        <div class="consent-text">
          <h4>🍪 쿠키 및 데이터 수집 동의</h4>
          <p>더 나은 서비스 제공을 위해 사용 현황을 분석합니다. 개인 정보는 수집하지 않으며, 언제든 철회할 수 있습니다.</p>
        </div>
        <div class="consent-buttons">
          <button class="consent-accept" onclick="window.analyticsManager.grantConsent()">동의</button>
          <button class="consent-decline" onclick="window.analyticsManager.denyConsent()">거부</button>
          <button class="consent-settings" onclick="window.analyticsManager.showConsentSettings()">설정</button>
        </div>
      </div>
    `;

    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(44, 24, 16, 0.95);
      color: #f5e6d3;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
    `;

    document.body.appendChild(banner);
    this.addConsentStyles();
  }

  addConsentStyles() {
    if (document.getElementById('consent-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'consent-styles';
    styles.textContent = `
      .consent-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .consent-text {
        flex: 1;
        min-width: 300px;
      }

      .consent-text h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: #d4af37;
      }

      .consent-text p {
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
        color: #f5e6d3;
      }

      .consent-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .consent-buttons button {
        padding: 10px 20px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.3s ease;
      }

      .consent-accept {
        background: #4CAF50;
        color: white;
      }

      .consent-decline {
        background: #f44336;
        color: white;
      }

      .consent-settings {
        background: transparent;
        color: #d4af37;
        border: 1px solid #d4af37;
      }

      .consent-buttons button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }

      @media (max-width: 768px) {
        .consent-content {
          flex-direction: column;
          text-align: center;
          gap: 15px;
        }

        .consent-buttons {
          justify-content: center;
        }

        .consent-buttons button {
          min-width: 80px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  grantConsent() {
    localStorage.setItem('analytics-consent', 'true');
    this.removeConsentBanner();
    this.enableTracking();
    this.track('consent_granted', { method: 'banner' });
  }

  denyConsent() {
    localStorage.setItem('analytics-consent', 'false');
    this.removeConsentBanner();
    this.track('consent_denied', { method: 'banner' });
  }

  showConsentSettings() {
    // 상세 설정 모달 표시 (구현 생략)
    alert('상세 설정 기능은 곧 제공될 예정입니다.');
  }

  removeConsentBanner() {
    const banner = document.querySelector('.consent-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => banner.remove(), 300);
    }
  }

  async enableTracking() {
    if (this.getStoredConsent() === false) return;
    
    try {
      await this.initializeProviders();
      this.track('tracking_enabled');
    } catch (error) {
      console.error('Tracking 활성화 실패:', error);
    }
  }

  async initializeProviders() {
    const consent = this.getStoredConsent();
    if (consent === false) return;

    // Google Analytics 4 초기화
    if (this.config.gtag.enabled && this.config.gtag.measurementId) {
      await this.initGoogleAnalytics();
    }

    // Firebase Analytics 초기화
    if (this.config.firebase.enabled) {
      await this.initFirebaseAnalytics();
    }

    // Facebook Pixel 초기화
    if (this.config.facebook.enabled && this.config.facebook.pixelId) {
      await this.initFacebookPixel();
    }

    // Naver Analytics 초기화
    if (this.config.naver.enabled && this.config.naver.wcsid) {
      await this.initNaverAnalytics();
    }
  }

  async initGoogleAnalytics() {
    try {
      // Google Analytics 스크립트 로드
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.gtag.measurementId}`;
      document.head.appendChild(script1);

      // gtag 초기화
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { dataLayer.push(arguments); };
      
      gtag('js', new Date());
      gtag('config', this.config.gtag.measurementId, {
        page_title: document.title,
        page_location: window.location.href,
        custom_map: {
          'user_type': 'dimension1',
          'saju_generated': 'dimension2',
          'theme': 'dimension3',
          'language': 'dimension4'
        }
      });

      console.log('Google Analytics 초기화 완료');
    } catch (error) {
      console.error('Google Analytics 초기화 실패:', error);
    }
  }

  async initFirebaseAnalytics() {
    try {
      if (typeof firebase !== 'undefined' && firebase.analytics) {
        const analytics = firebase.analytics();
        this.firebaseAnalytics = analytics;
        console.log('Firebase Analytics 초기화 완료');
      }
    } catch (error) {
      console.error('Firebase Analytics 초기화 실패:', error);
    }
  }

  async initFacebookPixel() {
    try {
      // Facebook Pixel 스크립트 로드
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${this.config.facebook.pixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      console.log('Facebook Pixel 초기화 완료');
    } catch (error) {
      console.error('Facebook Pixel 초기화 실패:', error);
    }
  }

  async initNaverAnalytics() {
    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//wcs.naver.net/wcslog.js';
      document.head.appendChild(script);

      script.onload = () => {
        if (typeof wcs_add !== 'undefined') {
          wcs_add['wa'] = this.config.naver.wcsid;
          wcs.inflow();
          wcs_do();
        }
      };

      console.log('Naver Analytics 초기화 완료');
    } catch (error) {
      console.error('Naver Analytics 초기화 실패:', error);
    }
  }

  setupAutomaticTracking() {
    // 페이지 뷰 자동 추적
    this.trackPageView();

    // 언어 변경 추적
    document.addEventListener('languageChanged', (event) => {
      this.track('language_change', {
        previous_language: event.detail.previousLocale,
        new_language: event.detail.locale
      });
    });

    // 테마 변경 추적
    document.addEventListener('themeChanged', (event) => {
      this.track('theme_change', {
        theme: event.detail.theme
      });
    });

    // 에러 추적
    window.addEventListener('error', (event) => {
      this.track('javascript_error', {
        error_message: event.error?.message,
        error_stack: event.error?.stack,
        filename: event.filename,
        line_number: event.lineno,
        column_number: event.colno
      });
    });

    // 성능 메트릭 추적
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => this.trackPerformance(), 1000);
      });
    }

    // 스크롤 깊이 추적
    this.setupScrollTracking();

    // 사용자 참여도 추적
    this.setupEngagementTracking();
  }

  trackPageView(page = window.location.pathname + window.location.search) {
    this.sessionData.pageViews++;
    
    const pageData = {
      page_title: document.title,
      page_location: window.location.href,
      page_path: page,
      session_id: this.sessionData.sessionId,
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    };

    this.track('page_view', pageData);
  }

  track(eventName, parameters = {}) {
    if (!this.isInitialized || this.getStoredConsent() === false) {
      // 동의하지 않은 경우 로컬에만 저장
      this.eventQueue.push({ eventName, parameters, timestamp: Date.now() });
      return;
    }

    const eventData = {
      ...parameters,
      session_id: this.sessionData.sessionId,
      user_id: this.getUserId(),
      timestamp: Date.now(),
      page_url: window.location.href,
      user_agent: navigator.userAgent
    };

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
    }

    // Firebase Analytics
    if (this.firebaseAnalytics) {
      this.firebaseAnalytics.logEvent(eventName, eventData);
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', this.mapEventToFacebook(eventName), parameters);
    }

    // 로컬 분석을 위한 데이터 저장
    this.sessionData.events.push({ eventName, parameters: eventData });
    this.saveSessionData();

    console.log('Analytics Event:', eventName, eventData);
  }

  // 사주 관련 특화 이벤트들
  trackSajuGeneration(data) {
    this.track('saju_number_generated', {
      birth_year: data.year,
      birth_month: data.month,
      calendar_type: data.calendarType,
      gender: data.gender,
      generation_method: data.method || 'basic',
      numbers_count: data.numbers?.length || 0
    });
  }

  trackNumberSave(data) {
    this.track('lotto_numbers_saved', {
      numbers: data.numbers,
      explanation_length: data.explanation?.length || 0,
      user_type: data.isLoggedIn ? 'registered' : 'guest'
    });
  }

  trackFortuneView(data) {
    this.track('fortune_viewed', {
      fortune_type: data.type,
      overall_score: data.overallScore,
      fortune_level: data.level,
      view_duration: data.duration
    });
  }

  trackWinningCheck(data) {
    this.track('winning_numbers_checked', {
      user_numbers: data.userNumbers,
      winning_numbers: data.winningNumbers,
      match_count: data.matchCount,
      prize_level: data.prize
    });
  }

  trackNotificationInteraction(data) {
    this.track('notification_interaction', {
      notification_type: data.type,
      action: data.action, // clicked, dismissed, etc.
      notification_time: data.time
    });
  }

  trackPWAInstall() {
    this.track('pwa_installed', {
      install_prompt: 'accepted',
      platform: this.getPlatform()
    });
  }

  trackOfflineUsage(data) {
    this.track('offline_usage', {
      feature_used: data.feature,
      offline_duration: data.duration,
      sync_later: data.willSync
    });
  }

  trackAccessibilityFeature(data) {
    this.track('accessibility_feature_used', {
      feature: data.feature,
      enabled: data.enabled
    });
  }

  // 유틸리티 메서드들
  getUserId() {
    let userId = localStorage.getItem('analytics-user-id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('analytics-user-id', userId);
    }
    return userId;
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getPlatform() {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'Mac';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Unknown';
  }

  mapEventToFacebook(eventName) {
    const mapping = {
      'saju_number_generated': 'Search',
      'lotto_numbers_saved': 'AddToWishlist',
      'winning_numbers_checked': 'ViewContent',
      'pwa_installed': 'CompleteRegistration',
      'user_signup': 'CompleteRegistration',
      'user_login': 'Login'
    };
    return mapping[eventName] || 'CustomEvent';
  }

  trackPerformance() {
    if (!('performance' in window)) return;

    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0];

    const metrics = {
      page_load_time: timing.loadEventEnd - timing.navigationStart,
      dom_content_loaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      first_byte: timing.responseStart - timing.navigationStart,
      dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
      connection_time: timing.connectEnd - timing.connectStart
    };

    if (navigation) {
      metrics.transfer_size = navigation.transferSize;
      metrics.encoded_body_size = navigation.encodedBodySize;
    }

    this.track('performance_metrics', metrics);
  }

  setupScrollTracking() {
    let maxScroll = 0;
    const milestones = [10, 25, 50, 75, 90, 100];
    const tracked = new Set();

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      maxScroll = Math.max(maxScroll, scrollPercent);

      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !tracked.has(milestone)) {
          tracked.add(milestone);
          this.track('scroll_depth', { percent: milestone });
        }
      });
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
  }

  setupEngagementTracking() {
    let engagementTimer;
    let totalEngagementTime = 0;
    let isEngaged = true;

    const startEngagement = () => {
      if (isEngaged) return;
      isEngaged = true;
      engagementTimer = Date.now();
    };

    const endEngagement = () => {
      if (!isEngaged) return;
      isEngaged = false;
      if (engagementTimer) {
        totalEngagementTime += Date.now() - engagementTimer;
      }
    };

    // 사용자 활동 감지
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, startEngagement, { passive: true });
    });

    // 비활성화 감지
    ['blur', 'visibilitychange'].forEach(event => {
      window.addEventListener(event, () => {
        if (document.hidden || !document.hasFocus()) {
          endEngagement();
        } else {
          startEngagement();
        }
      });
    });

    // 주기적으로 참여 시간 전송
    setInterval(() => {
      if (totalEngagementTime > 0) {
        this.track('user_engagement', {
          engagement_time: totalEngagementTime,
          session_duration: Date.now() - this.sessionData.startTime
        });
        totalEngagementTime = 0;
      }
    }, 60000); // 1분마다
  }

  processQueuedEvents() {
    if (this.getStoredConsent() === false) return;

    this.eventQueue.forEach(event => {
      this.track(event.eventName, event.parameters);
    });
    this.eventQueue = [];
  }

  saveSessionData() {
    try {
      localStorage.setItem('analytics-session', JSON.stringify(this.sessionData));
    } catch (error) {
      console.error('세션 데이터 저장 실패:', error);
    }
  }

  getAnalyticsReport() {
    return {
      sessionId: this.sessionData.sessionId,
      startTime: this.sessionData.startTime,
      duration: Date.now() - this.sessionData.startTime,
      pageViews: this.sessionData.pageViews,
      events: this.sessionData.events.length,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: this.getPlatform()
    };
  }

  // 개인정보보호 관련 메서드들
  optOut() {
    localStorage.setItem('analytics-consent', 'false');
    this.track('analytics_opt_out');
    
    // Google Analytics 옵트아웃
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    }
  }

  optIn() {
    localStorage.setItem('analytics-consent', 'true');
    this.enableTracking();
    this.track('analytics_opt_in');
  }

  deleteUserData() {
    // 로컬 데이터 삭제
    localStorage.removeItem('analytics-user-id');
    localStorage.removeItem('analytics-session');
    localStorage.removeItem('analytics-consent');
    
    this.track('user_data_deleted');
    alert('사용자 데이터가 삭제되었습니다.');
  }
}

// 전역 인스턴스 생성
window.analyticsManager = new AnalyticsManager();

console.log('Analytics Manager 로드 완료');