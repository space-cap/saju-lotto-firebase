// 인증 관련 UI 처리 및 이벤트 핸들러

let currentAuthMode = 'login'; // 'login' 또는 'signup'

// 로그인 모달 표시
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // 폼 초기화
        document.getElementById('auth-form').reset();
        hideAuthError();
    }
}

// 로그인 모달 닫기
function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('hidden');
        hideAuthError();
    }
}

// 인증 탭 전환
function switchAuthTab(mode) {
    currentAuthMode = mode;
    
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (mode === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('auth-modal-title').textContent = '로그인';
        document.getElementById('auth-submit-btn').textContent = '로그인';
        document.getElementById('confirm-password-group').classList.add('hidden');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('auth-modal-title').textContent = '회원가입';
        document.getElementById('auth-submit-btn').textContent = '회원가입';
        document.getElementById('confirm-password-group').classList.remove('hidden');
    }
    
    hideAuthError();
}

// 인증 에러 표시
function showAuthError(message) {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

// 인증 에러 숨기기
function hideAuthError() {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

// 폼 제출 처리
document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }
});

// 인증 폼 제출 처리
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const passwordConfirm = document.getElementById('auth-password-confirm').value;
    
    // 유효성 검사
    if (!email || !password) {
        showAuthError('이메일과 비밀번호를 입력해주세요.');
        return;
    }
    
    if (currentAuthMode === 'signup') {
        if (password !== passwordConfirm) {
            showAuthError('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (password.length < 6) {
            showAuthError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
    }
    
    // 버튼 비활성화
    const submitBtn = document.getElementById('auth-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '처리 중...';
    
    try {
        let result;
        if (currentAuthMode === 'login') {
            result = await window.firebaseAuth.signInWithEmail(email, password);
        } else {
            result = await window.firebaseAuth.signUpWithEmail(email, password);
        }
        
        if (result.success) {
            closeLoginModal();
            showSuccessMessage(currentAuthMode === 'login' ? '로그인되었습니다!' : '회원가입이 완료되었습니다!');
            
            // 사주 프로필 자동 저장 체크
            if (currentAuthMode === 'signup') {
                setTimeout(checkAndSaveSajuProfile, 1000);
            }
        } else {
            showAuthError(result.error);
        }
    } catch (error) {
        console.error('인증 오류:', error);
        showAuthError('인증 처리 중 오류가 발생했습니다.');
    } finally {
        // 버튼 복구
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Google 로그인 처리
async function handleGoogleLogin() {
    const googleBtn = document.querySelector('.google-login-btn');
    const originalText = googleBtn.textContent;
    
    googleBtn.disabled = true;
    googleBtn.textContent = '처리 중...';
    
    try {
        if (!window.firebaseAuth || !window.firebaseAuth.signInWithGoogle) {
            throw new Error('Firebase 인증이 아직 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
        }
        const result = await window.firebaseAuth.signInWithGoogle();
        
        if (result.success) {
            closeLoginModal();
            showSuccessMessage('Google 로그인되었습니다!');
            
            // 새 사용자인 경우 사주 프로필 저장 체크
            setTimeout(checkAndSaveSajuProfile, 1000);
        } else {
            if (result.error !== '로그인이 취소되었습니다.') {
                showAuthError(result.error);
            }
        }
    } catch (error) {
        console.error('Google 로그인 오류:', error);
        showAuthError('Google 로그인 중 오류가 발생했습니다.');
    } finally {
        googleBtn.disabled = false;
        googleBtn.textContent = originalText;
    }
}

// 로그아웃 처리
async function handleLogout() {
    if (confirm('로그아웃하시겠습니까?')) {
        try {
            const result = await window.firebaseAuth.signOutUser();
            if (result.success) {
                showSuccessMessage('로그아웃되었습니다.');
            }
        } catch (error) {
            console.error('로그아웃 오류:', error);
            alert('로그아웃 처리 중 오류가 발생했습니다.');
        }
    }
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✓</span>
            ${message}
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// 현재 폼 데이터로 사주 프로필 저장 체크
async function checkAndSaveSajuProfile() {
    const birthDate = document.getElementById('birth-date').value;
    const birthTime = document.getElementById('birth-time').value;
    const gender = document.querySelector('input[name="gender"]:checked');
    const calendarType = document.querySelector('input[name="calendar-type"]:checked');
    
    if (birthDate && birthTime && gender) {
        try {
            const sajuProfileData = {
                birthDate: new Date(birthDate).toLocaleDateString('ko-KR'),
                calendarType: calendarType ? calendarType.value : 'solar',
                birthTime: document.getElementById('birth-time').selectedOptions[0]?.textContent.split(' - ')[0] || '',
                gender: gender.value === 'male' ? '남성' : '여성',
                savedAt: new Date().toISOString()
            };
            
            await window.firebaseAuth.saveSajuProfile(sajuProfileData);
            console.log('사주 프로필 자동 저장 완료');
        } catch (error) {
            console.error('사주 프로필 자동 저장 실패:', error);
        }
    }
}

// 모달 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
    const loginModal = document.getElementById('login-modal');
    if (e.target === loginModal) {
        closeLoginModal();
    }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
});

console.log('인증 핸들러 로드 완료');