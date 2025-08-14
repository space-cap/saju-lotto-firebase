# Firebase 프로젝트 설정 가이드

이 문서는 사주 로또 번호 생성기에 Firebase를 연동하기 위한 단계별 설정 가이드입니다.

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. https://console.firebase.google.com/ 접속
2. Google 계정으로 로그인

### 1.2 새 프로젝트 생성
1. "프로젝트 추가" 버튼 클릭
2. 프로젝트 이름 입력 (예: `saju-lotto`)
3. 프로젝트 ID 확인 (자동 생성되거나 수정 가능)
4. Google Analytics 설정 (선택사항, 추천: 활성화)
5. "프로젝트 만들기" 클릭

## 2. 웹 앱 추가

### 2.1 앱 등록
1. 프로젝트 개요 페이지에서 웹 앱 아이콘 (</>)  클릭
2. 앱 별명 입력 (예: "사주 로또 웹")
3. "이 앱의 Firebase Hosting도 설정" 체크 (선택사항)
4. "앱 등록" 클릭

### 2.2 SDK 설정 정보 복사
Firebase SDK 설정 코드가 표시되면 `firebaseConfig` 객체 내용을 복사해둡니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "saju-lotto.firebaseapp.com",
  projectId: "saju-lotto",
  storageBucket: "saju-lotto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 3. Authentication 설정

### 3.1 Authentication 활성화
1. 왼쪽 메뉴에서 "Authentication" 클릭
2. "시작하기" 버튼 클릭

### 3.2 로그인 방법 설정

#### 이메일/비밀번호 로그인
1. "Sign-in method" 탭 클릭
2. "이메일/비밀번호" 제공업체 클릭
3. "사용" 토글 활성화
4. "저장" 클릭

#### Google 로그인 (선택사항)
1. "Google" 제공업체 클릭
2. "사용" 토글 활성화
3. 프로젝트 지원 이메일 설정
4. "저장" 클릭

## 4. Firestore Database 설정

### 4.1 Firestore 생성
1. 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 모드 선택:
   - **테스트 모드**: 개발 중에 선택 (30일 후 자동 비활성화)
   - **잠금 모드**: 프로덕션용 (처음에는 테스트 모드 추천)
4. 위치 선택 (아시아-태평양 권장: `asia-northeast3 (서울)`)

### 4.2 보안 규칙 설정 (중요!)
테스트 모드 만료 전에 다음 보안 규칙을 적용하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 데이터만 읽고 쓸 수 있음
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // 사용자의 로또 번호 서브컬렉션
      match /lottoNumbers/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

적용 방법:
1. Firestore Database > 규칙 탭
2. 위 규칙 코드 복사하여 붙여넣기
3. "게시" 클릭

## 5. 프로젝트 설정 적용

### 5.1 설정 값 업데이트
`firebase-config.js` 파일의 `firebaseConfig` 객체를 실제 값으로 교체:

```javascript
const firebaseConfig = {
  apiKey: "실제-API-키-값",
  authDomain: "실제-프로젝트-ID.firebaseapp.com", 
  projectId: "실제-프로젝트-ID",
  storageBucket: "실제-프로젝트-ID.appspot.com",
  messagingSenderId: "실제-메시징-센더-ID",
  appId: "실제-앱-ID"
};
```

### 5.2 도메인 승인 (배포 시)
1. Authentication > Settings > Authorized domains
2. 배포할 도메인 추가 (예: `yourdomain.com`)

## 6. 테스트

### 6.1 로컬 테스트
1. HTTP 서버 실행 (Firebase는 `file://` 프로토콜 지원 안 함)
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

2. `http://localhost:8000` 접속
3. 회원가입/로그인 테스트
4. 번호 생성 및 저장 테스트

### 6.2 기능 확인 사항
- [ ] 이메일/비밀번호 회원가입
- [ ] 이메일/비밀번호 로그인
- [ ] Google 로그인 (설정한 경우)
- [ ] 사주 프로필 저장
- [ ] 로또 번호 저장
- [ ] 저장된 번호 불러오기
- [ ] 로그아웃

## 7. 모니터링 및 관리

### 7.1 사용량 모니터링
1. Firebase Console > 사용량 탭에서 할당량 확인
2. Authentication 사용자 수
3. Firestore 읽기/쓰기 작업 수

### 7.2 무료 할당량 (Spark 요금제)
- **Authentication**: 무제한
- **Firestore**: 
  - 저장소: 1GB
  - 읽기: 50,000/일
  - 쓰기: 20,000/일
  - 삭제: 20,000/일

### 7.3 업그레이드 고려사항
사용량이 무료 할당량을 초과할 경우 Blaze 요금제로 업그레이드 필요

## 8. 보안 권장사항

### 8.1 API 키 보안
- API 키는 공개 저장소에 그대로 노출되어도 비교적 안전하지만, 가능하면 환경변수 사용
- Firebase 보안 규칙으로 실제 데이터 접근 제어

### 8.2 보안 규칙 점검
- 정기적으로 보안 규칙 검토
- 테스트 모드는 개발용으로만 사용

### 8.3 사용자 데이터 보호
- 개인정보 최소 수집 원칙
- 데이터 백업 및 복구 계획 수립

## 9. 문제 해결

### 9.1 자주 발생하는 오류

#### "Firebase: Error (auth/configuration-not-found)"
- 프로젝트 설정이 올바르지 않음
- `firebaseConfig` 값 재확인 필요

#### "Missing or insufficient permissions"
- Firestore 보안 규칙 문제
- 규칙에서 해당 사용자의 접근 권한 확인

#### CORS 오류
- `file://` 프로토콜 사용 시 발생
- HTTP 서버를 통해 접속 필요

### 9.2 디버깅 방법
1. 브라우저 개발자 도구 콘솔 확인
2. Firebase Console의 Authentication/Firestore 로그 확인
3. 네트워크 탭에서 API 요청/응답 확인

---

## 완료 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] 웹 앱 등록 및 설정 복사
- [ ] Authentication 활성화 (이메일/비밀번호)
- [ ] Google 로그인 설정 (선택사항)
- [ ] Firestore Database 생성
- [ ] 보안 규칙 설정
- [ ] 프로젝트 설정 값 업데이트
- [ ] 로컬 테스트 완료
- [ ] 모든 기능 동작 확인

이 가이드를 따라 설정을 완료하면 Firebase가 완전히 연동된 사주 로또 번호 생성기를 사용할 수 있습니다.