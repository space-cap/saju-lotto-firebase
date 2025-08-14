// Firebase 설정 및 초기화
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, setDoc, getDoc, where } from 'firebase/firestore';

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
  deleteFirebaseLottoNumber
};

console.log('Firebase 설정 완료');