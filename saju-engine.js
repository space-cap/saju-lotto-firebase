// 사주명리학 계산 엔진

// 천간 (天干) - 10개
const HEAVENLY_STEMS = [
    { name: '갑(甲)', element: 'wood', yin: false, number: 1 },
    { name: '을(乙)', element: 'wood', yin: true, number: 2 },
    { name: '병(丙)', element: 'fire', yin: false, number: 3 },
    { name: '정(丁)', element: 'fire', yin: true, number: 4 },
    { name: '무(戊)', element: 'earth', yin: false, number: 5 },
    { name: '기(己)', element: 'earth', yin: true, number: 6 },
    { name: '경(庚)', element: 'metal', yin: false, number: 7 },
    { name: '신(辛)', element: 'metal', yin: true, number: 8 },
    { name: '임(壬)', element: 'water', yin: false, number: 9 },
    { name: '계(癸)', element: 'water', yin: true, number: 10 }
];

// 지지 (地支) - 12개
const EARTHLY_BRANCHES = [
    { name: '자(子)', element: 'water', time: '23-01', animal: '쥐', number: 1 },
    { name: '축(丑)', element: 'earth', time: '01-03', animal: '소', number: 2 },
    { name: '인(寅)', element: 'wood', time: '03-05', animal: '호랑이', number: 3 },
    { name: '묘(卯)', element: 'wood', time: '05-07', animal: '토끼', number: 4 },
    { name: '진(辰)', element: 'earth', time: '07-09', animal: '용', number: 5 },
    { name: '사(巳)', element: 'fire', time: '09-11', animal: '뱀', number: 6 },
    { name: '오(午)', element: 'fire', time: '11-13', animal: '말', number: 7 },
    { name: '미(未)', element: 'earth', time: '13-15', animal: '양', number: 8 },
    { name: '신(申)', element: 'metal', time: '15-17', animal: '원숭이', number: 9 },
    { name: '유(酉)', element: 'metal', time: '17-19', animal: '닭', number: 10 },
    { name: '술(戌)', element: 'earth', time: '19-21', animal: '개', number: 11 },
    { name: '해(亥)', element: 'water', time: '21-23', animal: '돼지', number: 12 }
];

// 24절기 데이터 (매년 변동이 있지만 대략적인 날짜)
const SOLAR_TERMS = {
    1: { start: 4, name: '소한' },   // 1월 소한
    2: { start: 4, name: '입춘' },   // 2월 입춘
    3: { start: 6, name: '경칭' },   // 3월 경칩
    4: { start: 5, name: '청명' },   // 4월 청명
    5: { start: 6, name: '입하' },   // 5월 입하
    6: { start: 6, name: '망종' },   // 6월 망종
    7: { start: 7, name: '소서' },   // 7월 소서
    8: { start: 8, name: '입추' },   // 8월 입추
    9: { start: 8, name: '백로' },   // 9월 백로
    10: { start: 8, name: '한로' },  // 10월 한로
    11: { start: 7, name: '입동' },  // 11월 입동
    12: { start: 7, name: '대설' }   // 12월 대설
};

// 음력 변환 테이블 (간단한 근사치 - 실제로는 더 복잡한 계산 필요)
const LUNAR_OFFSET_DAYS = 29.5; // 음력 한달 평균 일수

/**
 * 메인 사주 계산 함수
 * @param {Object} formData - 폼에서 입력받은 데이터
 * @returns {Object} 사주팔자 결과
 */
function calculateSaju(formData) {
    const { birthDate, calendarType, birthTime, gender } = formData;
    
    // 양력 날짜로 변환
    const solarDate = calendarType === 'lunar' ? 
        convertLunarToSolar(birthDate) : birthDate;
    
    // 각 기둥 계산
    const yearPillar = calculateYearPillar(solarDate);
    const monthPillar = calculateMonthPillar(solarDate, yearPillar);
    const dayPillar = calculateDayPillar(solarDate);
    const timePillar = calculateTimePillar(birthTime, dayPillar);
    
    return {
        birthInfo: {
            solarDate,
            birthTime,
            gender,
            calendarType
        },
        yearPillar,
        monthPillar,
        dayPillar,
        timePillar,
        elements: analyzeElements(yearPillar, monthPillar, dayPillar, timePillar)
    };
}

/**
 * 년주 계산
 * @param {Date} solarDate - 양력 생일
 * @returns {Object} 년주 정보
 */
function calculateYearPillar(solarDate) {
    const year = solarDate.getFullYear();
    const month = solarDate.getMonth() + 1;
    const day = solarDate.getDate();
    
    // 입춘 기준으로 년주 결정 (대략 2월 4일)
    let sajuYear = year;
    if (month < 2 || (month === 2 && day < 4)) {
        sajuYear = year - 1;
    }
    
    // 기준년도 1984년 갑자년부터 계산
    const baseYear = 1984;
    const yearIndex = (sajuYear - baseYear) % 60;
    
    const heavenlyStemIndex = yearIndex % 10;
    const earthlyBranchIndex = yearIndex % 12;
    
    return {
        heavenlyStem: HEAVENLY_STEMS[heavenlyStemIndex],
        earthlyBranch: EARTHLY_BRANCHES[earthlyBranchIndex]
    };
}

/**
 * 월주 계산
 * @param {Date} solarDate - 양력 생일
 * @param {Object} yearPillar - 년주 정보
 * @returns {Object} 월주 정보
 */
function calculateMonthPillar(solarDate, yearPillar) {
    const month = solarDate.getMonth() + 1;
    const day = solarDate.getDate();
    
    // 절기 기준으로 월주 결정
    let sajuMonth = month;
    if (day < (SOLAR_TERMS[month]?.start || 5)) {
        sajuMonth = month === 1 ? 12 : month - 1;
    }
    
    // 월지 결정 (인월부터 시작하여 순차적)
    const monthBranchIndex = (sajuMonth + 1) % 12; // 인월=2월부터
    
    // 월간 계산 (년간에 따라 결정)
    const yearStemIndex = yearPillar.heavenlyStem.number - 1;
    const monthStemBase = {
        0: 2, 1: 4, 2: 6, 3: 8, 4: 0,  // 갑기년 - 정인
        5: 2, 6: 4, 7: 6, 8: 8, 9: 0   // 을경년 - 무인
    };
    
    const monthStemIndex = (monthStemBase[yearStemIndex] + monthBranchIndex) % 10;
    
    return {
        heavenlyStem: HEAVENLY_STEMS[monthStemIndex],
        earthlyBranch: EARTHLY_BRANCHES[monthBranchIndex]
    };
}

/**
 * 일주 계산
 * @param {Date} solarDate - 양력 생일
 * @returns {Object} 일주 정보
 */
function calculateDayPillar(solarDate) {
    // 기준일: 1900년 1월 1일 = 갑자일
    const baseDate = new Date(1900, 0, 1);
    const daysDiff = Math.floor((solarDate - baseDate) / (1000 * 60 * 60 * 24));
    
    // 60갑자 주기로 계산
    const cycle = daysDiff % 60;
    
    const heavenlyStemIndex = cycle % 10;
    const earthlyBranchIndex = cycle % 12;
    
    return {
        heavenlyStem: HEAVENLY_STEMS[heavenlyStemIndex < 0 ? heavenlyStemIndex + 10 : heavenlyStemIndex],
        earthlyBranch: EARTHLY_BRANCHES[earthlyBranchIndex < 0 ? earthlyBranchIndex + 12 : earthlyBranchIndex]
    };
}

/**
 * 시주 계산
 * @param {number} birthTime - 출생시간 (24시간 형식)
 * @param {Object} dayPillar - 일주 정보
 * @returns {Object} 시주 정보
 */
function calculateTimePillar(birthTime, dayPillar) {
    // 시지 결정 (2시간마다 하나의 지지)
    const timeBranchIndex = Math.floor((birthTime + 1) / 2) % 12;
    
    // 시간 계산 (일간에 따라 결정)
    const dayStemIndex = dayPillar.heavenlyStem.number - 1;
    const timeStemBase = {
        0: 0, 1: 2, 2: 4, 3: 6, 4: 8,  // 갑기일
        5: 0, 6: 2, 7: 4, 8: 6, 9: 8   // 을경일
    };
    
    const timeStemIndex = (timeStemBase[dayStemIndex] + timeBranchIndex) % 10;
    
    return {
        heavenlyStem: HEAVENLY_STEMS[timeStemIndex],
        earthlyBranch: EARTHLY_BRANCHES[timeBranchIndex]
    };
}

/**
 * 음력을 양력으로 변환 (간단한 근사치)
 * @param {Date} lunarDate - 음력 날짜
 * @returns {Date} 양력 날짜
 */
function convertLunarToSolar(lunarDate) {
    // 실제로는 복잡한 천문학적 계산이 필요하지만,
    // 여기서는 간단한 근사치를 사용
    const year = lunarDate.getFullYear();
    const month = lunarDate.getMonth();
    const day = lunarDate.getDate();
    
    // 대략적인 오프셋 계산 (음력이 양력보다 약 20-50일 늦음)
    const avgOffset = Math.floor(Math.random() * 30) + 20; // 20-50일 사이
    const solarDate = new Date(lunarDate);
    solarDate.setDate(day + avgOffset);
    
    // 년도가 바뀌는 경우 처리
    if (solarDate.getFullYear() !== year) {
        solarDate.setFullYear(year);
        solarDate.setDate(day + 30); // 평균 오프셋
    }
    
    return solarDate;
}

/**
 * 오행 분석
 * @param {Object} yearPillar - 년주
 * @param {Object} monthPillar - 월주
 * @param {Object} dayPillar - 일주
 * @param {Object} timePillar - 시주
 * @returns {Object} 오행 분석 결과
 */
function analyzeElements(yearPillar, monthPillar, dayPillar, timePillar) {
    const elements = {
        wood: 0,
        fire: 0,
        earth: 0,
        metal: 0,
        water: 0
    };
    
    // 천간 오행 (가중치 2)
    [yearPillar, monthPillar, dayPillar, timePillar].forEach(pillar => {
        elements[pillar.heavenlyStem.element] += 2;
    });
    
    // 지지 오행 (가중치 1)
    [yearPillar, monthPillar, dayPillar, timePillar].forEach(pillar => {
        elements[pillar.earthlyBranch.element] += 1;
    });
    
    // 가장 강한 오행과 약한 오행 찾기
    const strongestElement = Object.keys(elements).reduce((a, b) => 
        elements[a] > elements[b] ? a : b
    );
    const weakestElement = Object.keys(elements).reduce((a, b) => 
        elements[a] < elements[b] ? a : b
    );
    
    return {
        counts: elements,
        strongest: strongestElement,
        weakest: weakestElement,
        balance: calculateBalance(elements)
    };
}

/**
 * 오행 균형 계산
 * @param {Object} elements - 오행 개수
 * @returns {number} 균형도 (0-100)
 */
function calculateBalance(elements) {
    const values = Object.values(elements);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b) / values.length;
    
    // 표준편차 계산
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // 균형도 계산 (표준편차가 작을수록 높은 균형도)
    const balance = Math.max(0, 100 - (stdDev * 20));
    
    return Math.round(balance);
}

/**
 * 사주 호환성 계산 (로또 번호 생성에 활용)
 * @param {Object} sajuResult - 사주 결과
 * @returns {Array} 길한 숫자들
 */
function calculateLuckyNumbers(sajuResult) {
    const luckyNumbers = [];
    const elements = sajuResult.elements;
    const dayElement = sajuResult.dayPillar.heavenlyStem.element;
    
    // 일간 오행에 따른 길한 숫자
    const elementNumbers = {
        wood: [3, 4, 8, 13, 14, 23, 24, 33, 34, 43, 44],
        fire: [2, 7, 9, 16, 17, 25, 26, 27, 35, 36, 45],
        earth: [5, 6, 10, 15, 20, 28, 29, 30, 38, 39, 40],
        metal: [1, 11, 19, 21, 31, 37, 41, 42],
        water: [12, 18, 22, 32]
    };
    
    // 기본 길한 숫자
    luckyNumbers.push(...(elementNumbers[dayElement] || []));
    
    // 부족한 오행 보완 숫자
    const weakElement = elements.weakest;
    if (weakElement !== dayElement) {
        luckyNumbers.push(...(elementNumbers[weakElement] || []));
    }
    
    return [...new Set(luckyNumbers)].sort((a, b) => a - b);
}

/**
 * 특정 날짜의 운세 계산
 * @param {Object} sajuResult - 사주 결과
 * @param {Date} targetDate - 대상 날짜 (기본: 오늘)
 * @returns {Object} 운세 정보
 */
function calculateFortune(sajuResult, targetDate = new Date()) {
    const dayPillar = calculateDayPillar(targetDate);
    const dayElement = dayPillar.heavenlyStem.element;
    const userDayElement = sajuResult.dayPillar.heavenlyStem.element;
    
    // 상생상극 관계 확인
    const relationship = getElementRelationship(userDayElement, dayElement);
    
    let fortuneScore = 50; // 기본 50점
    
    switch (relationship) {
        case 'same':
            fortuneScore = 70;
            break;
        case 'supporting':
            fortuneScore = 85;
            break;
        case 'supported':
            fortuneScore = 75;
            break;
        case 'conflicting':
            fortuneScore = 30;
            break;
        case 'conflicted':
            fortuneScore = 40;
            break;
    }
    
    return {
        score: fortuneScore,
        relationship,
        advice: getFortunAdvice(relationship, fortuneScore)
    };
}

/**
 * 오행 관계 확인
 * @param {string} element1 - 첫 번째 오행
 * @param {string} element2 - 두 번째 오행
 * @returns {string} 관계 타입
 */
function getElementRelationship(element1, element2) {
    if (element1 === element2) return 'same';
    
    const supportingChain = ['wood', 'fire', 'earth', 'metal', 'water'];
    const index1 = supportingChain.indexOf(element1);
    const index2 = supportingChain.indexOf(element2);
    
    if ((index1 + 1) % 5 === index2) return 'supporting'; // 1이 2를 생성
    if ((index2 + 1) % 5 === index1) return 'supported';  // 2가 1을 생성
    if ((index1 + 2) % 5 === index2) return 'conflicting'; // 1이 2를 극함
    if ((index2 + 2) % 5 === index1) return 'conflicted';  // 2가 1을 극함
    
    return 'neutral';
}

/**
 * 운세 조언 생성
 * @param {string} relationship - 오행 관계
 * @param {number} score - 운세 점수
 * @returns {string} 조언 메시지
 */
function getFortunAdvice(relationship, score) {
    const advices = {
        same: '안정적인 기운이 흐르는 날입니다. 평소 계획했던 일들을 실행하기 좋습니다.',
        supporting: '매우 길한 날입니다! 새로운 도전이나 중요한 결정을 하기에 적합합니다.',
        supported: '도움받는 기운이 강합니다. 주변 사람들과의 협력이 좋은 결과를 가져올 것입니다.',
        conflicting: '신중함이 필요한 날입니다. 급한 결정보다는 차근차근 준비하는 것이 좋습니다.',
        conflicted: '어려움이 있을 수 있지만, 인내심을 가지고 극복한다면 더 큰 성장을 이룰 수 있습니다.',
        neutral: '평범한 하루가 될 것 같습니다. 꾸준히 노력하는 자세가 중요합니다.'
    };
    
    return advices[relationship] || advices.neutral;
}

// 전역 함수로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.calculateSaju = calculateSaju;
    window.calculateLuckyNumbers = calculateLuckyNumbers;
    window.calculateFortune = calculateFortune;
}

// Node.js 환경을 위한 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateSaju,
        calculateLuckyNumbers,
        calculateFortune,
        HEAVENLY_STEMS,
        EARTHLY_BRANCHES
    };
}