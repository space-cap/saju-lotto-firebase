class OfflineCache {
  constructor() {
    this.dbName = 'SajuLottoOfflineDB';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.init();
  }

  async init() {
    try {
      await this.initDB();
      this.setupNetworkListeners();
      this.startSyncProcess();
      console.log('OfflineCache 초기화 완료');
    } catch (error) {
      console.error('OfflineCache 초기화 실패:', error);
    }
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 사주 프로필 저장소
        if (!db.objectStoreNames.contains('sajuProfiles')) {
          const sajuStore = db.createObjectStore('sajuProfiles', { keyPath: 'id' });
          sajuStore.createIndex('userId', 'userId', { unique: false });
          sajuStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // 생성된 로또 번호 저장소
        if (!db.objectStoreNames.contains('lottoNumbers')) {
          const lottoStore = db.createObjectStore('lottoNumbers', { keyPath: 'id' });
          lottoStore.createIndex('userId', 'userId', { unique: false });
          lottoStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // 운세 데이터 저장소
        if (!db.objectStoreNames.contains('fortuneData')) {
          const fortuneStore = db.createObjectStore('fortuneData', { keyPath: 'id' });
          fortuneStore.createIndex('userId', 'userId', { unique: false });
          fortuneStore.createIndex('date', 'date', { unique: false });
        }
        
        // 당첨 번호 저장소
        if (!db.objectStoreNames.contains('winningNumbers')) {
          const winningStore = db.createObjectStore('winningNumbers', { keyPath: 'drawNumber' });
          winningStore.createIndex('drawDate', 'drawDate', { unique: false });
        }
        
        // 동기화 대기열
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('action', 'action', { unique: false });
        }
        
        // 설정 저장소
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNetworkStatus('✅ 인터넷에 연결되었습니다', 'success');
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNetworkStatus('⚠️ 오프라인 모드입니다', 'warning');
    });
  }

  showNetworkStatus(message, type) {
    const statusDiv = document.createElement('div');
    statusDiv.className = `network-status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#4CAF50' : '#FF9800'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(statusDiv);
    setTimeout(() => statusDiv.remove(), 4000);
  }

  startSyncProcess() {
    // 5분마다 동기화 시도
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 5 * 60 * 1000);
  }

  // 사주 프로필 캐싱
  async cacheSajuProfile(profileData, userId) {
    try {
      const data = {
        id: `profile_${userId}`,
        userId,
        ...profileData,
        timestamp: new Date().toISOString(),
        isOffline: !this.isOnline
      };
      
      await this.storeData('sajuProfiles', data);
      console.log('사주 프로필 캐시 저장:', data.id);
      
      return data;
    } catch (error) {
      console.error('사주 프로필 캐싱 실패:', error);
      throw error;
    }
  }

  // 로또 번호 캐싱
  async cacheLottoNumbers(numbersData, userId) {
    try {
      const data = {
        id: `lotto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ...numbersData,
        timestamp: new Date().toISOString(),
        isOffline: !this.isOnline,
        synced: this.isOnline
      };
      
      await this.storeData('lottoNumbers', data);
      console.log('로또 번호 캐시 저장:', data.id);
      
      // 온라인 상태가 아니면 동기화 대기열에 추가
      if (!this.isOnline) {
        await this.addToSyncQueue('saveLotto', data);
      }
      
      return data;
    } catch (error) {
      console.error('로또 번호 캐싱 실패:', error);
      throw error;
    }
  }

  // 운세 데이터 캐싱
  async cacheFortuneData(fortuneData, userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = {
        id: `fortune_${userId}_${today}`,
        userId,
        date: today,
        ...fortuneData,
        timestamp: new Date().toISOString(),
        isOffline: !this.isOnline
      };
      
      await this.storeData('fortuneData', data);
      console.log('운세 데이터 캐시 저장:', data.id);
      
      return data;
    } catch (error) {
      console.error('운세 데이터 캐싱 실패:', error);
      throw error;
    }
  }

  // 당첨 번호 캐싱
  async cacheWinningNumbers(winningData) {
    try {
      const data = {
        ...winningData,
        timestamp: new Date().toISOString(),
        isOffline: false
      };
      
      await this.storeData('winningNumbers', data);
      console.log('당첨 번호 캐시 저장:', data.drawNumber);
      
      return data;
    } catch (error) {
      console.error('당첨 번호 캐싱 실패:', error);
      throw error;
    }
  }

  // 캐시된 사주 프로필 조회
  async getCachedSajuProfile(userId) {
    try {
      const data = await this.getData('sajuProfiles', `profile_${userId}`);
      if (data && !this.isExpired(data.timestamp, 24 * 60 * 60 * 1000)) { // 24시간
        return data;
      }
      return null;
    } catch (error) {
      console.error('캐시된 사주 프로필 조회 실패:', error);
      return null;
    }
  }

  // 캐시된 로또 번호 조회
  async getCachedLottoNumbers(userId, limit = 10) {
    try {
      return await this.queryData('lottoNumbers', 'userId', userId, limit);
    } catch (error) {
      console.error('캐시된 로또 번호 조회 실패:', error);
      return [];
    }
  }

  // 캐시된 운세 데이터 조회
  async getCachedFortuneData(userId, date) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const data = await this.getData('fortuneData', `fortune_${userId}_${targetDate}`);
      
      if (data && !this.isExpired(data.timestamp, 6 * 60 * 60 * 1000)) { // 6시간
        return data;
      }
      return null;
    } catch (error) {
      console.error('캐시된 운세 데이터 조회 실패:', error);
      return null;
    }
  }

  // 캐시된 당첨 번호 조회
  async getCachedWinningNumbers(limit = 10) {
    try {
      return await this.queryData('winningNumbers', 'drawDate', null, limit, 'prev');
    } catch (error) {
      console.error('캐시된 당첨 번호 조회 실패:', error);
      return [];
    }
  }

  // 오프라인 사주 계산
  async generateOfflineSaju(birthData) {
    try {
      const result = await this.calculateBasicSaju(birthData);
      
      // 캐시에 저장
      if (result) {
        await this.cacheLottoNumbers({
          numbers: result.numbers,
          explanation: result.explanation,
          birthInfo: birthData,
          isOfflineGenerated: true
        }, 'offline_user');
      }
      
      return result;
    } catch (error) {
      console.error('오프라인 사주 계산 실패:', error);
      throw error;
    }
  }

  calculateBasicSaju(birthData) {
    const { year, month, day, hour, isLunar } = birthData;
    
    const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    
    // 기본적인 사주 계산 (단순화됨)
    const yearStem = heavenlyStems[(year - 4) % 10];
    const yearBranch = earthlyBranches[(year - 4) % 12];
    const monthStem = heavenlyStems[(month + year - 1) % 10];
    const monthBranch = earthlyBranches[(month - 1) % 12];
    const dayStem = heavenlyStems[(day - 1) % 10];
    const dayBranch = earthlyBranches[(day - 1) % 12];
    const hourStem = heavenlyStems[hour % 10];
    const hourBranch = earthlyBranches[Math.floor(hour / 2) % 12];
    
    const pillars = {
      year: { stem: yearStem, branch: yearBranch },
      month: { stem: monthStem, branch: monthBranch },
      day: { stem: dayStem, branch: dayBranch },
      hour: { stem: hourStem, branch: hourBranch }
    };
    
    // 번호 생성
    const numbers = [];
    const baseNum = (year + month + day + hour) % 45;
    
    for (let i = 0; i < 6; i++) {
      const num = ((baseNum + i * 7 + heavenlyStems.indexOf(dayStem) + earthlyBranches.indexOf(dayBranch)) % 45) + 1;
      numbers.push(num);
    }
    
    return {
      pillars,
      numbers: [...new Set(numbers)].slice(0, 6).sort((a, b) => a - b),
      explanation: `${dayStem}${dayBranch}일주를 기반으로 한 오프라인 생성 번호입니다.`,
      isOffline: true
    };
  }

  // 데이터 저장
  async storeData(storeName, data) {
    // 데이터베이스 초기화 대기
    if (!this.db) {
      await this.initDB();
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 데이터 조회
  async getData(storeName, key) {
    // 데이터베이스 초기화 대기
    if (!this.db) {
      try {
        await this.initDB();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return null;
      }
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.warn('Database still not available');
        resolve(null);
        return;
      }
      
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        console.error('Transaction error:', error);
        resolve(null);
      }
    });
  }

  // 인덱스로 데이터 조회
  async queryData(storeName, indexName, value, limit = 10, direction = 'next') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      
      const results = [];
      let count = 0;
      
      const cursorRequest = value !== null 
        ? index.openCursor(IDBKeyRange.only(value), direction)
        : index.openCursor(null, direction);
      
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  // 동기화 대기열에 추가
  async addToSyncQueue(action, data) {
    try {
      const syncItem = {
        action,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };
      
      await this.storeData('syncQueue', syncItem);
      this.syncQueue.push(syncItem);
      console.log('동기화 대기열에 추가:', action);
    } catch (error) {
      console.error('동기화 대기열 추가 실패:', error);
    }
  }

  // 동기화 대기열 처리
  async processSyncQueue() {
    if (!this.isOnline) return;
    
    try {
      const queueItems = await this.queryData('syncQueue', 'timestamp', null, 50);
      
      for (const item of queueItems) {
        try {
          await this.syncItem(item);
          await this.removeFromSyncQueue(item.id);
          console.log('동기화 완료:', item.action);
        } catch (error) {
          console.error('동기화 실패:', item.action, error);
          item.retryCount++;
          
          if (item.retryCount >= 3) {
            await this.removeFromSyncQueue(item.id);
            console.log('동기화 포기:', item.action);
          } else {
            await this.storeData('syncQueue', item);
          }
        }
      }
    } catch (error) {
      console.error('동기화 대기열 처리 실패:', error);
    }
  }

  // 개별 항목 동기화
  async syncItem(item) {
    const { action, data } = item;
    
    switch (action) {
      case 'saveLotto':
        if (window.firebaseAuth && window.firebaseAuth.saveLottoNumbers) {
          await window.firebaseAuth.saveLottoNumbers(data);
        }
        break;
      case 'saveProfile':
        if (window.firebaseAuth && window.firebaseAuth.saveSajuProfile) {
          await window.firebaseAuth.saveSajuProfile(data);
        }
        break;
      default:
        console.warn('알 수 없는 동기화 액션:', action);
    }
  }

  // 동기화 대기열에서 제거
  async removeFromSyncQueue(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 데이터 만료 확인
  isExpired(timestamp, maxAge) {
    const now = new Date().getTime();
    const dataTime = new Date(timestamp).getTime();
    return (now - dataTime) > maxAge;
  }

  // 캐시 정리
  async cleanupCache() {
    try {
      const stores = ['sajuProfiles', 'lottoNumbers', 'fortuneData', 'winningNumbers'];
      const now = new Date();
      
      for (const storeName of stores) {
        const data = await this.queryData(storeName, 'timestamp', null, 1000);
        
        for (const item of data) {
          let maxAge;
          switch (storeName) {
            case 'sajuProfiles':
              maxAge = 30 * 24 * 60 * 60 * 1000; // 30일
              break;
            case 'fortuneData':
              maxAge = 7 * 24 * 60 * 60 * 1000; // 7일
              break;
            case 'winningNumbers':
              maxAge = 365 * 24 * 60 * 60 * 1000; // 1년
              break;
            default:
              maxAge = 30 * 24 * 60 * 60 * 1000; // 기본 30일
          }
          
          if (this.isExpired(item.timestamp, maxAge)) {
            await this.deleteData(storeName, item.id || item.drawNumber);
          }
        }
      }
      
      console.log('캐시 정리 완료');
    } catch (error) {
      console.error('캐시 정리 실패:', error);
    }
  }

  // 데이터 삭제
  async deleteData(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 캐시 크기 조회
  async getCacheSize() {
    try {
      const stores = ['sajuProfiles', 'lottoNumbers', 'fortuneData', 'winningNumbers', 'syncQueue'];
      const sizes = {};
      
      for (const storeName of stores) {
        const count = await this.getStoreCount(storeName);
        sizes[storeName] = count;
      }
      
      return sizes;
    } catch (error) {
      console.error('캐시 크기 조회 실패:', error);
      return {};
    }
  }

  async getStoreCount(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 설정 저장/조회
  async saveSetting(key, value) {
    try {
      await this.storeData('settings', { key, value, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }

  async getSetting(key, defaultValue = null) {
    try {
      const data = await this.getData('settings', key);
      return data ? data.value : defaultValue;
    } catch (error) {
      console.error('설정 조회 실패:', error);
      return defaultValue;
    }
  }
}

// 전역 인스턴스 생성
window.offlineCache = new OfflineCache();

// 페이지 로드 시 캐시 정리 (일주일에 한 번)
document.addEventListener('DOMContentLoaded', async () => {
  const lastCleanup = await window.offlineCache.getSetting('lastCacheCleanup', 0);
  const now = Date.now();
  
  if (now - lastCleanup > 7 * 24 * 60 * 60 * 1000) { // 7일
    await window.offlineCache.cleanupCache();
    await window.offlineCache.saveSetting('lastCacheCleanup', now);
  }
});

console.log('Offline Cache 로드 완료');