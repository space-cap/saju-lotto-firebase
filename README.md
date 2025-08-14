# 사주로 만나는 행운의 번호 - Firebase 연동

Firebase를 활용한 개인화된 사주 기반 로또 번호 생성 서비스입니다.

## 🚀 주요 기능

### 기존 기능
- 정확한 사주팔자 계산 (천간지지, 오행분석)
- 사주 기반 로또 번호 생성 알고리즘
- 다중 세트 생성 (3세트, 5세트)
- 오행별 색상 구분 및 의미 설명
- 반응형 UI 디자인

### 새로운 Firebase 기능
- **사용자 인증**
  - 이메일/비밀번호 로그인/회원가입
  - Google 소셜 로그인
  - 인증 상태 관리

- **사주 프로필 관리**
  - 한 번 입력한 사주 정보 자동 저장
  - 로그인 시 사주 정보 자동 불러오기
  - 개인 프로필 관리

- **번호 이력 관리**
  - 생성한 로또 번호 클라우드 저장
  - 사용자별 번호 이력 관리
  - 저장된 번호 검색 및 관리

- **데이터 동기화**
  - 여러 기기 간 데이터 동기화
  - 로컬 백업과 클라우드 저장 병행

## 🛠️ 설치 및 설정

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd saju-lotto-firebase
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Firebase 프로젝트 설정
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성
3. 웹 앱 추가
4. Authentication 활성화
   - 이메일/비밀번호 로그인 활성화
   - Google 로그인 제공업체 추가
5. Firestore Database 생성 (테스트 모드)

### 4. 환경 설정
1. `.env.example` 파일을 참고하여 Firebase 설정 값 확인
2. `firebase-config.js` 파일의 `firebaseConfig` 객체를 실제 값으로 수정

```javascript
const firebaseConfig = {
  apiKey: "실제-API-키",
  authDomain: "프로젝트-ID.firebaseapp.com",
  projectId: "프로젝트-ID",
  storageBucket: "프로젝트-ID.appspot.com",
  messagingSenderId: "실제-센더-ID",
  appId: "실제-앱-ID"
};
```

### 5. 로컬 서버 실행
```bash
# HTTP 서버 실행 (Python 3 기준)
python -m http.server 8000

# 또는 Node.js http-server 사용
npx http-server
```

브라우저에서 `http://localhost:8000` 접속

## 📊 Firestore 데이터 구조

### Users Collection
```
users/{userId}
├── email: string
├── sajuProfile: {
│   ├── birthDate: string
│   ├── calendarType: string ("양력" | "음력")
│   ├── birthTime: string
│   ├── gender: string ("남성" | "여성")
│   └── savedAt: string (ISO date)
├── updatedAt: string (ISO date)
└── lottoNumbers/ (subcollection)
    └── {documentId}
        ├── numbers: number[]
        ├── timestamp: string
        ├── birthInfo: object
        ├── explanation: string
        ├── userId: string
        └── createdAt: string (ISO date)
```

## 🎯 사용 방법

### 1. 첫 번째 사용
1. 우상단 "로그인 / 회원가입" 버튼 클릭
2. 이메일/비밀번호 또는 Google 계정으로 회원가입
3. 사주 정보 입력 (생년월일, 출생시간, 성별)
4. "운명의 번호 생성" 클릭
5. "번호 저장하기"로 클라우드에 저장

### 2. 재방문 시
1. 로그인하면 저장된 사주 정보가 자동으로 불러와짐
2. 바로 번호 생성 가능
3. "내 사주 이력" 버튼으로 과거 번호 확인

### 3. 다중 세트 생성
- "3세트 생성" / "5세트 생성" 버튼으로 여러 번호 한 번에 생성
- 각 세트마다 다른 변화를 적용한 번호 제공

## 🔧 개발자 정보

### 기술 스택
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase (Authentication, Firestore)
- **Design**: 한국 전통 디자인 모티브
- **Font**: Noto Sans KR, Nanum Myeongjo

### 파일 구조
```
├── index.html              # 메인 HTML
├── style.css              # 스타일시트 
├── script.js              # 메인 자바스크립트
├── saju-engine.js         # 사주 계산 엔진
├── firebase-config.js     # Firebase 설정 및 API
├── auth-handler.js        # 인증 관련 UI 핸들러
├── package.json           # npm 설정
└── README.md             # 프로젝트 문서
```

### 주요 함수
- `calculateSaju()`: 사주팔자 계산
- `generateSajuBasedLottoNumbers()`: 사주 기반 번호 생성
- `saveLottoNumbers()`: Firebase에 번호 저장
- `getSavedLottoNumbers()`: 저장된 번호 불러오기
- `showSajuHistory()`: 사주 이력 표시

## 🔒 보안 및 프라이버시

- 모든 사용자 데이터는 Firebase의 보안 규칙에 따라 보호됨
- 개인 사주 정보는 해당 사용자만 접근 가능
- 로컬 스토리지 백업으로 데이터 손실 방지

## ⚠️ 주의사항

- 본 서비스는 오락 목적으로 제작되었으며 실제 당첨을 보장하지 않습니다
- 사주 해석은 전통적인 명리학 이론을 바탕으로 하되 간소화되었습니다
- Firebase 무료 할당량을 고려하여 사용해주세요

## 📝 라이센스

이 프로젝트는 개인 학습 및 오락 목적으로 자유롭게 사용 가능합니다.

---

**개발 완료일**: 2024년 8월
**버전**: 2.0 (Firebase 연동 버전)