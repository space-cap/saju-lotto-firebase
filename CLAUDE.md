# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean traditional fortune-telling (사주) based lottery number generator with Firebase integration. The application calculates personalized lottery numbers based on traditional Korean astrology principles and provides user authentication, data persistence, and number history management.

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase (Authentication, Firestore)
- **Dependencies**: Firebase v12.1.0
- **Fonts**: Noto Sans KR, Nanum Myeongjo
- **Design**: Korean traditional motifs and colors

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start local HTTP server (required for Firebase)
python -m http.server 8000
# OR
npx http-server

# Access application
# Navigate to http://localhost:8000
```

### Firebase Setup
Before development, Firebase must be configured:

1. Update `firebase-config.js` with actual Firebase project credentials
2. Refer to `firebase-setup-guide.md` for complete setup instructions
3. Check `.env.example` for required Firebase configuration variables

## Architecture Overview

### Core Components

1. **saju-engine.js** - Traditional Korean astrology calculation engine
   - Implements 천간지지 (Heavenly Stems and Earthly Branches) system
   - Calculates 사주팔자 (Four Pillars of Destiny)
   - Performs 오행 (Five Elements) analysis
   - Generates lottery numbers based on astrology principles

2. **firebase-config.js** - Firebase backend integration
   - User authentication (email/password, Google OAuth)
   - Firestore database operations
   - User profile and lottery history management
   - Data synchronization across devices

3. **script.js** - Main application logic
   - Form validation and user input handling
   - UI state management
   - Integration between astrology engine and Firebase

4. **auth-handler.js** - Authentication UI management
   - Login/signup modal handling
   - Authentication state management
   - Error handling for auth operations

5. **style.css** - Korean traditional design system
   - Traditional color schemes and typography
   - Responsive design for mobile/desktop
   - Cultural UI elements (팔괘 symbols, traditional patterns)

### Data Structure

**Firestore Collections:**
```
users/{userId}
├── email: string
├── sajuProfile: object (birth info, calendar type, gender)
├── updatedAt: timestamp
└── lottoNumbers/ (subcollection)
    └── {documentId}
        ├── numbers: number[]
        ├── timestamp: string
        ├── birthInfo: object
        ├── explanation: string
        └── createdAt: timestamp
```

### Key Functions

- `calculateSaju(formData)` in saju-engine.js:712 - Core astrology calculation
- `generateSajuBasedLottoNumbers(sajuResult)` in saju-engine.js:892 - Number generation algorithm
- `saveLottoNumbers(numbers, explanation)` in firebase-config.js:234 - Persist numbers to Firestore
- `loadUserSajuProfile()` in firebase-config.js:167 - Load saved user profile
- `showSajuHistory()` in script.js:445 - Display number history

## Firebase Security Rules

The application uses user-scoped security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /lottoNumbers/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Important Notes

- **CORS Requirements**: Must run on HTTP server (not file://) for Firebase to work
- **Configuration**: Firebase config values in `firebase-config.js` must be updated with real project credentials
- **Cultural Context**: All UI text and calculations are in Korean, following traditional 명리학 (Myeongri-hak) principles
- **No Test Framework**: Currently no automated testing implemented
- **Authentication Required**: Most features require user login to function

## File Purpose Summary

| File | Purpose |
|------|---------|
| `index.html` | Main HTML structure with Korean traditional design |
| `script.js` | Primary application logic and DOM manipulation |
| `saju-engine.js` | Traditional Korean astrology calculation algorithms |
| `firebase-config.js` | Firebase integration and database operations |
| `auth-handler.js` | Authentication UI and modal management |
| `style.css` | Traditional Korean visual design system |
| `package.json` | Node.js dependencies (only Firebase) |
| `README.md` | Comprehensive project documentation in Korean |
| `firebase-setup-guide.md` | Step-by-step Firebase configuration guide |
| `.env.example` | Template for Firebase environment variables |