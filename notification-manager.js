class NotificationManager {
  constructor() {
    this.isInitialized = false;
    this.settings = null;
    this.scheduledNotifications = new Map();
    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      await this.setupNotificationPermissions();
      await this.setupScheduler();
      this.isInitialized = true;
      console.log('NotificationManager 초기화 완료');
    } catch (error) {
      console.error('NotificationManager 초기화 실패:', error);
    }
  }

  async loadSettings() {
    if (window.firebaseAuth && window.firebaseAuth.getNotificationSettings) {
      this.settings = await window.firebaseAuth.getNotificationSettings();
    } else {
      this.settings = {
        luckyDay: true,
        fortuneChange: true,
        drawNotification: true,
        solarTerm: true,
        winningCheck: true,
        time: '09:00'
      };
    }
  }

  async setupNotificationPermissions() {
    if (!('Notification' in window)) {
      console.log('브라우저가 알림을 지원하지 않습니다.');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('알림 권한:', permission);
    }
  }

  async setupScheduler() {
    this.scheduleRegularNotifications();
    setInterval(() => this.checkScheduledNotifications(), 60000); // 1분마다 체크
  }

  scheduleRegularNotifications() {
    this.scheduleDailyFortuneCheck();
    this.scheduleWeeklyDrawNotification();
    this.scheduleSolarTermNotifications();
    this.scheduleLuckyTimeNotifications();
  }

  scheduleDailyFortuneCheck() {
    const now = new Date();
    const [hour, minute] = this.settings.time.split(':').map(Number);
    const notificationTime = new Date(now);
    notificationTime.setHours(hour, minute, 0, 0);
    
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    this.scheduledNotifications.set('daily-fortune', {
      time: notificationTime,
      type: 'daily-fortune',
      title: '🌅 오늘의 운세 확인',
      body: '새로운 하루의 운세와 행운의 번호를 확인해보세요.',
      data: { action: 'fortune' },
      recurring: 'daily'
    });
  }

  scheduleWeeklyDrawNotification() {
    const nextSaturday = this.getNextSaturday();
    nextSaturday.setHours(21, 0, 0, 0);

    this.scheduledNotifications.set('weekly-draw', {
      time: nextSaturday,
      type: 'weekly-draw',
      title: '🎯 로또 당첨번호 발표',
      body: '이번 주 당첨번호와 당신의 번호를 비교해보세요!',
      data: { action: 'check' },
      recurring: 'weekly'
    });
  }

  scheduleSolarTermNotifications() {
    const solarTerms = this.getSolarTermsForYear();
    const now = new Date();

    solarTerms.forEach(term => {
      if (term.date > now) {
        const notificationTime = new Date(term.date);
        notificationTime.setHours(9, 0, 0, 0);

        this.scheduledNotifications.set(`solar-term-${term.name}`, {
          time: notificationTime,
          type: 'solar-term',
          title: `🌱 ${term.name}`,
          body: `${term.name}입니다. 새로운 기운으로 특별한 번호를 만들어보세요.`,
          data: { action: 'generate', solarTerm: term.name },
          recurring: 'none'
        });
      }
    });
  }

  scheduleLuckyTimeNotifications() {
    const luckyTimes = this.calculateLuckyTimes();
    luckyTimes.forEach(time => {
      this.scheduledNotifications.set(`lucky-time-${time.getTime()}`, {
        time: time,
        type: 'lucky-time',
        title: '✨ 행운의 시간',
        body: '지금이 당신에게 길한 시간입니다. 특별한 번호를 생성해보세요!',
        data: { action: 'generate', source: 'lucky-time' },
        recurring: 'none'
      });
    });
  }

  checkScheduledNotifications() {
    const now = new Date();
    
    this.scheduledNotifications.forEach((notification, key) => {
      if (notification.time <= now) {
        this.sendNotification(notification);
        
        if (notification.recurring === 'daily') {
          notification.time.setDate(notification.time.getDate() + 1);
        } else if (notification.recurring === 'weekly') {
          notification.time.setDate(notification.time.getDate() + 7);
        } else {
          this.scheduledNotifications.delete(key);
        }
      }
    });
  }

  async sendNotification(notification) {
    if (!this.isNotificationEnabled(notification.type)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const notif = new Notification(notification.title, {
        body: notification.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `saju-${notification.type}`,
        data: notification.data,
        requireInteraction: false,
        actions: [
          { action: 'open', title: '앱 열기' },
          { action: 'close', title: '닫기' }
        ]
      });

      notif.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notif.close();
        this.handleNotificationAction(notification.data);
      };

      // 알림 통계 저장
      this.trackNotification(notification.type);

      console.log(`알림 발송: ${notification.title}`);
    } catch (error) {
      console.error('알림 발송 실패:', error);
    }
  }

  handleNotificationAction(data) {
    const { action } = data;
    
    switch (action) {
      case 'generate':
        this.navigateToAction('generate');
        break;
      case 'fortune':
        this.navigateToAction('fortune');
        break;
      case 'check':
        this.navigateToAction('check');
        break;
      default:
        window.location.href = '/';
    }
  }

  navigateToAction(action) {
    const url = new URL(window.location.href);
    url.searchParams.set('action', action);
    window.location.href = url.toString();
  }

  isNotificationEnabled(type) {
    const mapping = {
      'daily-fortune': 'luckyDay',
      'weekly-draw': 'drawNotification',
      'solar-term': 'solarTerm',
      'lucky-time': 'luckyDay',
      'fortune-change': 'fortuneChange',
      'winning-check': 'winningCheck'
    };

    return this.settings[mapping[type]] !== false;
  }

  async trackNotification(type) {
    try {
      const stats = JSON.parse(localStorage.getItem('notification-stats') || '{}');
      stats[type] = (stats[type] || 0) + 1;
      stats.lastNotification = new Date().toISOString();
      localStorage.setItem('notification-stats', JSON.stringify(stats));
    } catch (error) {
      console.error('알림 통계 저장 실패:', error);
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    try {
      if (window.firebaseAuth && window.firebaseAuth.saveNotificationSettings) {
        await window.firebaseAuth.saveNotificationSettings(this.settings);
      }
      
      // 스케줄 재설정
      this.scheduledNotifications.clear();
      this.scheduleRegularNotifications();
      
      console.log('알림 설정 업데이트 완료');
      return { success: true };
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 개인 맞춤 알림 생성
  async createPersonalizedNotifications(sajuData, fortuneData) {
    if (!sajuData || !fortuneData) return;

    const personalNotifications = [];
    
    // 사주 기반 맞춤 알림
    if (sajuData.pillars?.day) {
      const dayPillar = sajuData.pillars.day;
      const luckyDays = this.calculateLuckyDaysForPillar(dayPillar);
      
      luckyDays.forEach(day => {
        personalNotifications.push({
          time: day,
          title: `🍀 ${dayPillar.stem}${dayPillar.branch} 일주의 특별한 날`,
          body: '당신의 일주에 특히 길한 날입니다. 행운의 번호를 확인해보세요.',
          data: { action: 'generate', source: 'personal-lucky-day' }
        });
      });
    }

    // 운세 레벨 기반 알림
    if (fortuneData.overallFortune?.level?.level === 'excellent') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      
      personalNotifications.push({
        time: tomorrow,
        title: '🌟 최고의 운세!',
        body: '내일은 당신에게 최고의 운세입니다. 특별한 번호를 생성해보세요!',
        data: { action: 'generate', source: 'excellent-fortune' }
      });
    }

    // 스케줄에 추가
    personalNotifications.forEach((notif, index) => {
      this.scheduledNotifications.set(`personal-${Date.now()}-${index}`, {
        ...notif,
        type: 'personalized',
        recurring: 'none'
      });
    });

    // Firebase에 저장
    if (window.firebaseAuth && window.firebaseAuth.scheduleSmartNotifications) {
      await window.firebaseAuth.scheduleSmartNotifications(sajuData, fortuneData);
    }
  }

  calculateLuckyDaysForPillar(dayPillar) {
    const luckyDays = [];
    const now = new Date();
    
    // 일주의 천간지지를 기반으로 길한 날 계산
    const stemCycle = this.getHeavenlyStemCycle();
    const branchCycle = this.getEarthlyBranchCycle();
    
    const stemIndex = stemCycle.indexOf(dayPillar.stem);
    const branchIndex = branchCycle.indexOf(dayPillar.branch);
    
    // 앞으로 30일 중에서 길한 날 찾기
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + i);
      
      // 간단한 궁합 계산 (실제로는 더 복잡한 계산 필요)
      if ((i + stemIndex) % 10 === 0 || (i + branchIndex) % 12 === 0) {
        const luckyTime = new Date(futureDate);
        luckyTime.setHours(9, 0, 0, 0);
        luckyDays.push(luckyTime);
      }
    }
    
    return luckyDays.slice(0, 5); // 최대 5일
  }

  calculateLuckyTimes() {
    const luckyTimes = [];
    const now = new Date();
    
    // 오늘과 내일의 길한 시간 계산
    for (let day = 0; day < 2; day++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + day);
      
      // 전통적인 길한 시간: 자시(23-01), 묘시(05-07), 오시(11-13), 유시(17-19)
      const luckyHours = [0, 6, 12, 18]; // 대표 시간
      
      luckyHours.forEach(hour => {
        const luckyTime = new Date(targetDate);
        luckyTime.setHours(hour, 0, 0, 0);
        
        if (luckyTime > now) {
          luckyTimes.push(luckyTime);
        }
      });
    }
    
    return luckyTimes;
  }

  getNextSaturday() {
    const now = new Date();
    const saturday = new Date(now);
    const daysUntilSaturday = 6 - now.getDay();
    
    if (daysUntilSaturday === 0 && now.getHours() >= 21) {
      saturday.setDate(saturday.getDate() + 7);
    } else if (daysUntilSaturday <= 0) {
      saturday.setDate(saturday.getDate() + 7 + daysUntilSaturday);
    } else {
      saturday.setDate(saturday.getDate() + daysUntilSaturday);
    }
    
    return saturday;
  }

  getSolarTermsForYear() {
    const currentYear = new Date().getFullYear();
    const solarTerms = [
      { name: '입춘', month: 2, day: 4 },
      { name: '경칩', month: 3, day: 6 },
      { name: '춘분', month: 3, day: 21 },
      { name: '청명', month: 4, day: 5 },
      { name: '곡우', month: 4, day: 20 },
      { name: '입하', month: 5, day: 6 },
      { name: '소만', month: 5, day: 21 },
      { name: '망종', month: 6, day: 6 },
      { name: '하지', month: 6, day: 21 },
      { name: '소서', month: 7, day: 7 },
      { name: '대서', month: 7, day: 23 },
      { name: '입추', month: 8, day: 8 },
      { name: '처서', month: 8, day: 23 },
      { name: '백로', month: 9, day: 8 },
      { name: '추분', month: 9, day: 23 },
      { name: '한로', month: 10, day: 8 },
      { name: '상강', month: 10, day: 24 },
      { name: '입동', month: 11, day: 7 },
      { name: '소설', month: 11, day: 22 },
      { name: '대설', month: 12, day: 7 },
      { name: '동지', month: 12, day: 22 },
      { name: '소한', month: 1, day: 6 },
      { name: '대한', month: 1, day: 21 }
    ];

    return solarTerms.map(term => ({
      ...term,
      date: new Date(currentYear, term.month - 1, term.day)
    })).filter(term => term.date > new Date());
  }

  getHeavenlyStemCycle() {
    return ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  }

  getEarthlyBranchCycle() {
    return ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  }

  // 테스트 알림 발송
  sendTestNotification() {
    this.sendNotification({
      title: '🏮 사주로또 테스트 알림',
      body: '알림이 정상적으로 작동합니다! 맞춤 알림을 받아보세요.',
      type: 'test',
      data: { action: 'test' }
    });
  }

  // 알림 통계 조회
  getNotificationStats() {
    try {
      return JSON.parse(localStorage.getItem('notification-stats') || '{}');
    } catch (error) {
      console.error('알림 통계 조회 실패:', error);
      return {};
    }
  }

  // 모든 알림 취소
  clearAllNotifications() {
    this.scheduledNotifications.clear();
    console.log('모든 예정된 알림이 취소되었습니다.');
  }
}

// 전역 인스턴스 생성
window.notificationManager = new NotificationManager();

// URL 파라미터 기반 액션 처리
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action) {
    setTimeout(() => {
      switch (action) {
        case 'generate':
          if (typeof generateSajuNumbers === 'function') {
            generateSajuNumbers();
          }
          break;
        case 'fortune':
          if (typeof showFortuneAnalysis === 'function') {
            showFortuneAnalysis();
          }
          break;
        case 'check':
          if (typeof checkWinningNumbers === 'function') {
            checkWinningNumbers();
          }
          break;
        case 'history':
          if (window.firebaseAuth && window.firebaseAuth.showSajuHistory) {
            window.firebaseAuth.showSajuHistory();
          }
          break;
      }
      
      // URL에서 action 파라미터 제거
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('action');
      window.history.replaceState({}, '', newUrl);
    }, 1000);
  }
});

console.log('Notification Manager 로드 완료');