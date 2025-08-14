// Firebase 설정 및 초기화
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, setDoc, getDoc, where, onSnapshot, limit, serverTimestamp } from 'firebase/firestore';

// Firebase 구성 정보 (실제 프로젝트에서는 환경변수 사용 권장)
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
const auth = getAuth(app);
const db = getFirestore(app);

// Google 인증 제공자 설정
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 현재 사용자 상태
let currentUser = null;
let currentUserSaju = null; // 사용자 사주 정보 캐시

// 인증 상태 변화 감지
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateUIForAuthState(user);
});

// UI 업데이트 함수
function updateUIForAuthState(user) {
  const loginSection = document.querySelector('.login-section');
  const userSection = document.querySelector('.user-section');
  const loginBtn = document.querySelector('.login-btn');
  const logoutBtn = document.querySelector('.logout-btn');
  const userEmail = document.querySelector('.user-email');
  
  if (user) {
    // 로그인 상태
    if (loginSection) loginSection.style.display = 'none';
    if (userSection) userSection.style.display = 'block';
    if (userEmail) userEmail.textContent = user.email;
    
    // 저장 기능 활성화
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '번호 저장하기';
    }
    
    // 사주 이력 버튼 표시
    showSajuHistoryButton();
    
    // 사용자 프로필 자동 로드
    loadUserProfile();
    
  } else {
    // 로그아웃 상태  
    if (loginSection) loginSection.style.display = 'block';
    if (userSection) userSection.style.display = 'none';
    
    // 저장 기능 비활성화
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = '로그인 후 저장 가능';
    }
    
    // 사주 이력 버튼 숨기기
    hideSajuHistoryButton();
  }
}

// 이메일/비밀번호 회원가입
async function signUpWithEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('회원가입 성공:', userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('회원가입 실패:', error);
    let errorMessage = '회원가입 중 오류가 발생했습니다.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = '이미 사용 중인 이메일 주소입니다.';
        break;
      case 'auth/invalid-email':
        errorMessage = '올바르지 않은 이메일 형식입니다.';
        break;
      case 'auth/weak-password':
        errorMessage = '비밀번호는 6자 이상이어야 합니다.';
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

// 이메일/비밀번호 로그인
async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('로그인 성공:', userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('로그인 실패:', error);
    let errorMessage = '로그인 중 오류가 발생했습니다.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = '존재하지 않는 계정입니다.';
        break;
      case 'auth/wrong-password':
        errorMessage = '비밀번호가 올바르지 않습니다.';
        break;
      case 'auth/invalid-email':
        errorMessage = '올바르지 않은 이메일 형식입니다.';
        break;
      case 'auth/too-many-requests':
        errorMessage = '너무 많은 시도로 계정이 일시적으로 잠겼습니다.';
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Google 로그인
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google 로그인 성공:', result.user);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Google 로그인 실패:', error);
    
    let errorMessage = 'Google 로그인 중 오류가 발생했습니다.';
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      errorMessage = '로그인이 취소되었습니다.';
    }
    
    return { success: false, error: errorMessage };
  }
}

// 로그아웃
async function signOutUser() {
  try {
    await signOut(auth);
    console.log('로그아웃 성공');
    return { success: true };
  } catch (error) {
    console.error('로그아웃 실패:', error);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
}

// 사주 정보 저장
async function saveSajuProfile(sajuData) {
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }
  
  try {
    const userProfileRef = doc(db, 'users', currentUser.uid);
    await setDoc(userProfileRef, {
      email: currentUser.email,
      sajuProfile: sajuData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('사주 프로필 저장 성공');
    return { success: true };
  } catch (error) {
    console.error('사주 프로필 저장 실패:', error);
    throw error;
  }
}

// 사주 정보 불러오기
async function getSajuProfile() {
  if (!currentUser) {
    return null;
  }
  
  try {
    const userProfileRef = doc(db, 'users', currentUser.uid);
    const profileSnap = await getDoc(userProfileRef);
    
    if (profileSnap.exists()) {
      return profileSnap.data().sajuProfile || null;
    }
    return null;
  } catch (error) {
    console.error('사주 프로필 불러오기 실패:', error);
    return null;
  }
}

// 로또 번호 저장
async function saveLottoNumbers(numbersData) {
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }
  
  try {
    const lottoCollection = collection(db, 'users', currentUser.uid, 'lottoNumbers');
    const docRef = await addDoc(lottoCollection, {
      ...numbersData,
      userId: currentUser.uid,
      createdAt: new Date().toISOString()
    });
    
    console.log('로또 번호 저장 성공, ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('로또 번호 저장 실패:', error);
    throw error;
  }
}

// 저장된 로또 번호 목록 가져오기
async function getSavedLottoNumbers() {
  if (!currentUser) {
    return [];
  }
  
  try {
    const lottoCollection = collection(db, 'users', currentUser.uid, 'lottoNumbers');
    const q = query(lottoCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const numbers = [];
    querySnapshot.forEach((doc) => {
      numbers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return numbers;
  } catch (error) {
    console.error('로또 번호 불러오기 실패:', error);
    return [];
  }
}

// 특정 로또 번호 삭제
async function deleteLottoNumbers(docId) {
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }
  
  try {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'lottoNumbers', docId));
    console.log('로또 번호 삭제 성공');
    return { success: true };
  } catch (error) {
    console.error('로또 번호 삭제 실패:', error);
    throw error;
  }
}

// 사주 이력 버튼 표시
function showSajuHistoryButton() {
  const actionButtons = document.querySelector('.action-buttons');
  if (!actionButtons) return;
  
  if (!document.querySelector('.saju-history-btn')) {
    const historyBtn = document.createElement('button');
    historyBtn.className = 'saju-history-btn';
    historyBtn.textContent = '내 사주 이력';
    historyBtn.onclick = showSajuHistory;
    actionButtons.appendChild(historyBtn);
  }
}

// 사주 이력 버튼 숨기기
function hideSajuHistoryButton() {
  const historyBtn = document.querySelector('.saju-history-btn');
  if (historyBtn) {
    historyBtn.remove();
  }
}

// 사주 이력 보기
async function showSajuHistory() {
  try {
    const savedNumbers = await getSavedLottoNumbers();
    const sajuProfile = await getSajuProfile();
    
    displaySajuHistoryModal(savedNumbers, sajuProfile);
  } catch (error) {
    console.error('사주 이력 불러오기 실패:', error);
    alert('사주 이력을 불러오는데 실패했습니다.');
  }
}

// 사주 이력 모달 표시
function displaySajuHistoryModal(savedNumbers, sajuProfile) {
  let modalHTML = `
    <div class="saju-history-modal">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>내 사주 이력</h3>
          <button class="modal-close" onclick="closeSajuHistoryModal()">&times;</button>
        </div>
        <div class="saju-history-content">
  `;
  
  // 사주 프로필 섹션
  if (sajuProfile) {
    modalHTML += `
      <div class="profile-section">
        <h4>내 사주 정보</h4>
        <div class="profile-info">
          <p><strong>생년월일:</strong> ${sajuProfile.birthDate} (${sajuProfile.calendarType})</p>
          <p><strong>출생시간:</strong> ${sajuProfile.birthTime}</p>
          <p><strong>성별:</strong> ${sajuProfile.gender}</p>
        </div>
      </div>
    `;
  }
  
  // 저장된 번호 섹션
  modalHTML += `
    <div class="numbers-section">
      <h4>저장된 번호 (${savedNumbers.length}개)</h4>
      <div class="saved-numbers-grid">
  `;
  
  if (savedNumbers.length > 0) {
    savedNumbers.forEach(data => {
      modalHTML += `
        <div class="saved-number-card">
          <div class="card-header">
            <span class="save-date">${new Date(data.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
            <button class="delete-btn" onclick="deleteFirebaseLottoNumber('${data.id}')">&times;</button>
          </div>
          <div class="card-numbers">
            ${data.numbers.map(num => `<span class="number-ball small">${num}</span>`).join('')}
          </div>
          <div class="card-info">
            <small>${data.explanation ? data.explanation.substring(0, 80) + '...' : ''}</small>
          </div>
        </div>
      `;
    });
  } else {
    modalHTML += '<p class="no-data">저장된 번호가 없습니다.</p>';
  }
  
  modalHTML += `
        </div>
      </div>
    </div>
  </div>
</div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 사주 이력 모달 닫기
function closeSajuHistoryModal() {
  const modal = document.querySelector('.saju-history-modal');
  if (modal) {
    modal.remove();
  }
}

// Firebase 로또 번호 삭제
async function deleteFirebaseLottoNumber(docId) {
  if (confirm('이 번호를 삭제하시겠습니까?')) {
    try {
      await deleteLottoNumbers(docId);
      closeSajuHistoryModal();
      showSajuHistory(); // 모달 새로고침
      alert('번호가 삭제되었습니다.');
    } catch (error) {
      console.error('번호 삭제 실패:', error);
      alert('번호 삭제에 실패했습니다.');
    }
  }
}

// 현재 사용자 가져오기
function getCurrentUser() {
  return currentUser;
}

// 사용자 프로필 자동 로드
async function loadUserProfile() {
  if (!currentUser) return;
  
  try {
    const profile = await getSajuProfile();
    if (profile) {
      // 폼에 저장된 사주 정보 자동 입력
      fillSajuForm(profile);
    }
  } catch (error) {
    console.error('프로필 로드 실패:', error);
  }
}

// 사주 폼에 데이터 채우기
function fillSajuForm(profile) {
  try {
    const birthDateInput = document.getElementById('birth-date');
    const birthTimeSelect = document.getElementById('birth-time');
    const calendarRadios = document.querySelectorAll('input[name="calendar-type"]');
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    
    if (profile.birthDate && birthDateInput) {
      const date = new Date(profile.birthDate);
      birthDateInput.value = date.toISOString().split('T')[0];
    }
    
    if (profile.birthTime && birthTimeSelect) {
      birthTimeSelect.value = profile.birthTime;
    }
    
    if (profile.calendarType && calendarRadios) {
      calendarRadios.forEach(radio => {
        if (radio.value === profile.calendarType) {
          radio.checked = true;
        }
      });
    }
    
    if (profile.gender && genderRadios) {
      genderRadios.forEach(radio => {
        if ((radio.value === 'male' && profile.gender === '남성') || 
            (radio.value === 'female' && profile.gender === '여성')) {
          radio.checked = true;
        }
      });
    }
    
    console.log('사주 프로필이 자동으로 입력되었습니다.');
  } catch (error) {
    console.error('프로필 자동 입력 실패:', error);
  }
}

// =================================
// 당첨 번호 관련 기능
// =================================

// 당첨 번호 저장 (관리자용)
async function saveWinningNumbers(winningData) {
  try {
    const winningCollection = collection(db, 'winningNumbers');
    const docRef = await addDoc(winningCollection, {
      ...winningData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('당첨 번호 저장 성공, ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('당첨 번호 저장 실패:', error);
    throw error;
  }
}

// 최신 당첨 번호 가져오기
async function getLatestWinningNumbers(limitCount = 10) {
  try {
    const winningCollection = collection(db, 'winningNumbers');
    const q = query(winningCollection, orderBy('drawDate', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const winnings = [];
    querySnapshot.forEach((doc) => {
      winnings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return winnings;
  } catch (error) {
    console.error('당첨 번호 불러오기 실패:', error);
    return [];
  }
}

// 실시간 당첨 번호 리스너
function listenToWinningNumbers(callback) {
  const winningCollection = collection(db, 'winningNumbers');
  const q = query(winningCollection, orderBy('drawDate', 'desc'), limit(5));
  
  return onSnapshot(q, (snapshot) => {
    const winnings = [];
    snapshot.forEach((doc) => {
      winnings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(winnings);
  });
}

// 사용자 번호와 당첨 번호 비교
function checkWinningMatch(userNumbers, winningNumbers) {
  const matches = userNumbers.filter(num => winningNumbers.includes(num));
  const matchCount = matches.length;
  
  let prize = '낙첨';
  let prizeAmount = 0;
  
  switch (matchCount) {
    case 6:
      prize = '1등';
      prizeAmount = 2000000000; // 20억 (평균)
      break;
    case 5:
      prize = '2등';
      prizeAmount = 30000000; // 3천만원 (평균)
      break;
    case 4:
      prize = '3등';
      prizeAmount = 1000000; // 100만원 (평균)
      break;
    case 3:
      prize = '4등';
      prizeAmount = 50000; // 5만원 (평균)
      break;
    case 2:
      prize = '5등';
      prizeAmount = 5000; // 5천원 (평균)
      break;
  }
  
  return {
    matches,
    matchCount,
    prize,
    prizeAmount,
    isWin: matchCount >= 2
  };
}

// 사용자 번호들의 당첨 이력 분석
async function analyzeSajuWinningHistory(userId = null) {
  const targetUserId = userId || currentUser?.uid;
  if (!targetUserId) return null;
  
  try {
    const userNumbers = await getSavedLottoNumbers();
    const winningNumbers = await getLatestWinningNumbers(52); // 최근 1년
    
    const analysis = {
      totalNumbers: userNumbers.length,
      winningResults: [],
      totalWins: 0,
      totalPrize: 0,
      bestMatch: 0,
      sajuPatterns: {},
      elementStats: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
    };
    
    userNumbers.forEach(userNum => {
      winningNumbers.forEach(winning => {
        const result = checkWinningMatch(userNum.numbers, winning.numbers);
        if (result.isWin) {
          analysis.winningResults.push({
            ...result,
            userNumbers: userNum.numbers,
            winningNumbers: winning.numbers,
            drawDate: winning.drawDate,
            drawNumber: winning.drawNumber,
            userCreatedAt: userNum.createdAt
          });
          analysis.totalWins++;
          analysis.totalPrize += result.prizeAmount;
          analysis.bestMatch = Math.max(analysis.bestMatch, result.matchCount);
        }
      });
    });
    
    return analysis;
  } catch (error) {
    console.error('당첨 이력 분석 실패:', error);
    return null;
  }
}

// 사주 기반 당첨 패턴 분석
function analyzeSajuWinningPattern(sajuData, winningHistory) {
  if (!sajuData || !winningHistory) return null;
  
  const patterns = {
    elementDistribution: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
    yinYangBalance: { yang: 0, yin: 0 },
    timePatterns: {},
    seasonalPatterns: { spring: 0, summer: 0, autumn: 0, winter: 0 },
    luckyNumbers: [],
    recommendedElements: []
  };
  
  // 당첨된 번호들의 오행 분석
  winningHistory.winningResults.forEach(result => {
    result.matches.forEach(num => {
      const element = getNumberElement(num);
      if (element) {
        patterns.elementDistribution[element]++;
      }
    });
  });
  
  // 사주와 일치하는 패턴 찾기
  const dominantElement = Object.keys(patterns.elementDistribution).reduce((a, b) => 
    patterns.elementDistribution[a] > patterns.elementDistribution[b] ? a : b);
  
  patterns.recommendedElements = [dominantElement];
  patterns.luckyNumbers = generateLuckyNumbersBySaju(sajuData, patterns);
  
  return patterns;
}

// 번호의 오행 속성 계산
function getNumberElement(number) {
  const elementMap = {
    1: 'wood', 2: 'wood', 3: 'fire', 4: 'fire', 5: 'earth',
    6: 'earth', 7: 'metal', 8: 'metal', 9: 'water', 10: 'water',
    11: 'wood', 12: 'wood', 13: 'fire', 14: 'fire', 15: 'earth',
    16: 'earth', 17: 'metal', 18: 'metal', 19: 'water', 20: 'water',
    21: 'wood', 22: 'wood', 23: 'fire', 24: 'fire', 25: 'earth',
    26: 'earth', 27: 'metal', 28: 'metal', 29: 'water', 30: 'water',
    31: 'wood', 32: 'wood', 33: 'fire', 34: 'fire', 35: 'earth',
    36: 'earth', 37: 'metal', 38: 'metal', 39: 'water', 40: 'water',
    41: 'wood', 42: 'wood', 43: 'fire', 44: 'fire', 45: 'earth'
  };
  return elementMap[number] || 'earth';
}

// 사주 기반 행운의 번호 생성
function generateLuckyNumbersBySaju(sajuData, patterns) {
  const luckyNums = [];
  const dominantElements = patterns.recommendedElements || [];
  
  for (let i = 1; i <= 45; i++) {
    const element = getNumberElement(i);
    if (dominantElements.includes(element)) {
      luckyNums.push(i);
    }
  }
  
  // 사주의 일간과 연관된 번호 추가
  if (sajuData && sajuData.dayElement) {
    const dayNum = (sajuData.dayElement.number || 1) % 45;
    if (dayNum > 0 && !luckyNums.includes(dayNum)) {
      luckyNums.push(dayNum);
    }
  }
  
  return luckyNums.slice(0, 12); // 상위 12개 반환
}

// 개인 운세 패턴 저장
async function saveUserFortunePattern(fortuneData, recommendation) {
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }
  
  try {
    const fortunePattern = {
      date: new Date().toISOString().split('T')[0],
      fortuneScore: fortuneData.overallFortune.score,
      fortuneLevel: fortuneData.overallFortune.level.level,
      greatLuck: {
        cycle: fortuneData.greatLuck.currentCycle,
        pillar: fortuneData.greatLuck.currentPillar ? {
          stem: fortuneData.greatLuck.currentPillar.heavenlyStem.name,
          branch: fortuneData.greatLuck.currentPillar.earthlyBranch.name
        } : null
      },
      yearlyLuck: {
        stem: fortuneData.yearlyLuck.heavenlyStem.name,
        branch: fortuneData.yearlyLuck.earthlyBranch.name
      },
      monthlyLuck: {
        stem: fortuneData.monthlyLuck.heavenlyStem.name,
        branch: fortuneData.monthlyLuck.earthlyBranch.name
      },
      solarTerm: fortuneData.solarTerm.current ? fortuneData.solarTerm.current.name : null,
      recommendation: recommendation,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'fortunePatterns'), fortunePattern);
    console.log('운세 패턴 저장 성공:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('운세 패턴 저장 실패:', error);
    throw error;
  }
}

// 운세 기반 번호 사용 결과 저장
async function saveFortuneNumberResult(numbers, fortuneData, actualResult = null) {
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }
  
  try {
    const result = {
      numbers: numbers.numbers,
      confidence: numbers.confidence,
      fortune: {
        score: fortuneData.overallFortune.score,
        level: fortuneData.overallFortune.level.level
      },
      generationDate: new Date().toISOString().split('T')[0],
      actualResult: actualResult, // 실제 당첨 결과 (나중에 업데이트)
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'fortuneNumberResults'), result);
    console.log('운세 번호 결과 저장 성공:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('운세 번호 결과 저장 실패:', error);
    throw error;
  }
}

// 개인 맞춤 분석 정보 저장
async function savePersonalAnalysis(analysisData) {
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }
  
  try {
    const analysis = {
      personality: analysisData.personality,
      career: analysisData.career,
      wealth: analysisData.wealth,
      relationship: analysisData.relationship,
      health: analysisData.health,
      luckPattern: analysisData.luckPattern,
      coreStrategy: analysisData.coreStrategy,
      cycleStrategy: analysisData.cycleStrategy,
      specialOpportunity: analysisData.specialOpportunity,
      lastUpdated: serverTimestamp(),
      version: '1.0'
    };
    
    await setDoc(doc(db, 'users', currentUser.uid, 'analysis', 'personal'), analysis);
    console.log('개인 분석 저장 성공');
    return { success: true };
  } catch (error) {
    console.error('개인 분석 저장 실패:', error);
    throw error;
  }
}

// 개인 맞춤 분석 정보 불러오기
async function loadPersonalAnalysis() {
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }
  
  try {
    const docRef = doc(db, 'users', currentUser.uid, 'analysis', 'personal');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('개인 분석 불러오기 성공');
      return docSnap.data();
    } else {
      console.log('저장된 개인 분석이 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('개인 분석 불러오기 실패:', error);
    throw error;
  }
}

// 운세 패턴 히스토리 조회
async function getFortunePatternHistory(limit = 30) {
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }
  
  try {
    const q = query(
      collection(db, 'users', currentUser.uid, 'fortunePatterns'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const patterns = [];
    
    querySnapshot.forEach((doc) => {
      patterns.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`운세 패턴 ${patterns.length}개 불러오기 성공`);
    return patterns;
  } catch (error) {
    console.error('운세 패턴 히스토리 불러오기 실패:', error);
    return [];
  }
}

// 운세 번호 결과 조회
async function getFortuneNumberResults(limit = 10) {
  if (!currentUser) return [];
  
  try {
    const q = query(
      collection(db, 'users', currentUser.uid, 'fortuneNumberResults'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const results = [];
    
    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return results;
  } catch (error) {
    console.error('운세 번호 결과 조회 실패:', error);
    return [];
  }
}

// 전역 함수로 노출
window.firebaseAuth = {
  signUpWithEmail,
  signInWithEmail, 
  signInWithGoogle,
  signOutUser,
  getCurrentUser,
  saveSajuProfile,
  getSajuProfile,
  saveLottoNumbers,
  getSavedLottoNumbers,
  deleteLottoNumbers,
  showSajuHistory,
  closeSajuHistoryModal,
  deleteFirebaseLottoNumber,
  loadUserProfile,
  fillSajuForm,
  // 당첨 번호 관련 함수들
  saveWinningNumbers,
  getLatestWinningNumbers,
  listenToWinningNumbers,
  checkWinningMatch,
  analyzeSajuWinningHistory,
  analyzeSajuWinningPattern,
  getNumberElement,
  generateLuckyNumbersBySaju,
  // 고급 운세 관련 함수들
  saveUserFortunePattern,
  saveFortuneNumberResult,
  savePersonalAnalysis,
  loadPersonalAnalysis,
  getFortunePatternHistory,
  getFortuneNumberResults
};

console.log('Firebase 설정 완료');