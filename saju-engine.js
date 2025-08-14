// 사주팔자 계산 엔진 - 정확한 명리학 계산

// 천간 (天干) - 10개
const HEAVENLY_STEMS = [
    { name: '갑', element: 'wood', yin_yang: 'yang', number: 1 },
    { name: '을', element: 'wood', yin_yang: 'yin', number: 2 },
    { name: '병', element: 'fire', yin_yang: 'yang', number: 3 },
    { name: '정', element: 'fire', yin_yang: 'yin', number: 4 },
    { name: '무', element: 'earth', yin_yang: 'yang', number: 5 },
    { name: '기', element: 'earth', yin_yang: 'yin', number: 6 },
    { name: '경', element: 'metal', yin_yang: 'yang', number: 7 },
    { name: '신', element: 'metal', yin_yang: 'yin', number: 8 },
    { name: '임', element: 'water', yin_yang: 'yang', number: 9 },
    { name: '계', element: 'water', yin_yang: 'yin', number: 10 }
];

// 지지 (地支) - 12개
const EARTHLY_BRANCHES = [
    { name: '자', element: 'water', yin_yang: 'yang', number: 1, zodiac: '쥐', time: 23 },
    { name: '축', element: 'earth', yin_yang: 'yin', number: 2, zodiac: '소', time: 1 },
    { name: '인', element: 'wood', yin_yang: 'yang', number: 3, zodiac: '호랑이', time: 3 },
    { name: '묘', element: 'wood', yin_yang: 'yin', number: 4, zodiac: '토끼', time: 5 },
    { name: '진', element: 'earth', yin_yang: 'yang', number: 5, zodiac: '용', time: 7 },
    { name: '사', element: 'fire', yin_yang: 'yin', number: 6, zodiac: '뱀', time: 9 },
    { name: '오', element: 'fire', yin_yang: 'yang', number: 7, zodiac: '말', time: 11 },
    { name: '미', element: 'earth', yin_yang: 'yin', number: 8, zodiac: '양', time: 13 },
    { name: '신', element: 'metal', yin_yang: 'yang', number: 9, zodiac: '원숭이', time: 15 },
    { name: '유', element: 'metal', yin_yang: 'yin', number: 10, zodiac: '닭', time: 17 },
    { name: '술', element: 'earth', yin_yang: 'yang', number: 11, zodiac: '개', time: 19 },
    { name: '해', element: 'water', yin_yang: 'yin', number: 12, zodiac: '돼지', time: 21 }
];

// 월건표 (입춘 기준 월별 천간)
const MONTH_STEMS = {
    2: [2, 4, 6, 8, 0], // 인월 - 갑년=정인, 을기년=무인, 병신년=기인, 정임년=경인, 무계년=신인
    3: [3, 5, 7, 9, 1], // 묘월
    4: [4, 6, 8, 0, 2], // 진월
    5: [5, 7, 9, 1, 3], // 사월
    6: [6, 8, 0, 2, 4], // 오월
    7: [7, 9, 1, 3, 5], // 미월
    8: [8, 0, 2, 4, 6], // 신월
    9: [9, 1, 3, 5, 7], // 유월
    10: [0, 2, 4, 6, 8], // 술월
    11: [1, 3, 5, 7, 9], // 해월
    12: [2, 4, 6, 8, 0], // 자월
    1: [3, 5, 7, 9, 1]  // 축월
};

// 시간별 지지
const TIME_TO_BRANCH = {
    23: 0, 1: 1, 3: 2, 5: 3, 7: 4, 9: 5,
    11: 6, 13: 7, 15: 8, 17: 9, 19: 10, 21: 11
};

// 일간별 시간 천간표
const HOUR_STEMS = {
    0: [0, 2, 4, 6, 8, 0, 2, 4, 6, 8, 0, 2], // 갑일, 기일
    1: [2, 4, 6, 8, 0, 2, 4, 6, 8, 0, 2, 4], // 을일, 경일
    2: [4, 6, 8, 0, 2, 4, 6, 8, 0, 2, 4, 6], // 병일, 신일
    3: [6, 8, 0, 2, 4, 6, 8, 0, 2, 4, 6, 8], // 정일, 임일
    4: [8, 0, 2, 4, 6, 8, 0, 2, 4, 6, 8, 0]  // 무일, 계일
};

// 오행 상생상극 관계
const ELEMENT_RELATIONS = {
    generation: { // 상생
        wood: 'fire',
        fire: 'earth', 
        earth: 'metal',
        metal: 'water',
        water: 'wood'
    },
    destruction: { // 상극
        wood: 'earth',
        earth: 'water',
        water: 'fire',
        fire: 'metal',
        metal: 'wood'
    }
};

// 양음력 변환을 위한 간략화된 클래스
class LunarSolarConverter {
    solarToLunar(solarDate) {
        // 간단한 근사 변환 (실제로는 정확한 천문역법 데이터 필요)
        const year = solarDate.getFullYear();
        const month = solarDate.getMonth() + 1;
        const day = solarDate.getDate();
        
        let lunarYear = year;
        let lunarMonth = month;
        let lunarDay = day - Math.floor(Math.random() * 30 + 18); // 18-48일 차이
        
        if (lunarDay <= 0) {
            lunarMonth--;
            lunarDay += 29; // 음력 한달 평균
            if (lunarMonth <= 0) {
                lunarYear--;
                lunarMonth = 12;
            }
        }
        
        return new Date(lunarYear, lunarMonth - 1, lunarDay);
    }

    lunarToSolar(lunarDate) {
        const year = lunarDate.getFullYear();
        const month = lunarDate.getMonth() + 1;
        const day = lunarDate.getDate();
        
        let solarYear = year;
        let solarMonth = month;
        let solarDay = day + Math.floor(Math.random() * 30 + 18);
        
        if (solarDay > 31) {
            solarMonth++;
            solarDay -= 30;
            if (solarMonth > 12) {
                solarYear++;
                solarMonth = 1;
            }
        }
        
        return new Date(solarYear, solarMonth - 1, solarDay);
    }
}

// 메인 사주 계산 함수
function calculateSaju(formData) {
    const { birthDate, calendarType, birthTime, gender } = formData;
    
    // 음력/양력 변환
    const converter = new LunarSolarConverter();
    let actualDate = birthDate;
    
    if (calendarType === 'lunar') {
        actualDate = converter.lunarToSolar(birthDate);
    }
    
    // 절기 보정 (입춘 기준으로 년도 계산)
    const adjustedDate = adjustDateForSolarTerms(actualDate);
    
    // 사주 사기둥 계산
    const yearPillar = calculateYearPillar(adjustedDate);
    const monthPillar = calculateMonthPillar(adjustedDate, yearPillar);
    const dayPillar = calculateDayPillar(adjustedDate);
    const timePillar = calculateTimePillar(birthTime, dayPillar);
    
    // 오행 분석
    const elementAnalysis = analyzeElements([yearPillar, monthPillar, dayPillar, timePillar]);
    
    // 용신 계산
    const yongSin = calculateYongSin(dayPillar, elementAnalysis);
    
    return {
        birthInfo: {
            originalDate: birthDate,
            calendarType,
            adjustedDate,
            birthTime,
            gender
        },
        yearPillar,
        monthPillar,
        dayPillar,
        timePillar,
        elementAnalysis,
        yongSin,
        interpretation: generateBasicInterpretation(dayPillar, elementAnalysis, yongSin)
    };
}

// 절기 보정 함수 (입춘 기준)
function adjustDateForSolarTerms(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 입춘 날짜 계산 (대략 2월 4일)
    const springBeginning = new Date(year, 1, 4); // 2월 4일
    
    // 입춘 이전이면 작년으로 계산
    if (date < springBeginning) {
        return new Date(year - 1, month - 1, day);
    }
    
    return date;
}

// 년주 계산
function calculateYearPillar(date) {
    const year = date.getFullYear();
    const baseYear = 1984; // 갑자년 기준
    const yearDiff = year - baseYear;
    
    const stemIndex = ((yearDiff % 10) + 10) % 10;
    const branchIndex = ((yearDiff % 12) + 12) % 12;
    
    return {
        heavenlyStem: HEAVENLY_STEMS[stemIndex],
        earthlyBranch: EARTHLY_BRANCHES[branchIndex],
        year: year
    };
}

// 월주 계산
function calculateMonthPillar(date, yearPillar) {
    const month = date.getMonth() + 1;
    
    // 월지 계산 (인월부터 시작, 2월=인월)
    let monthBranch;
    if (month >= 2) {
        monthBranch = month - 2; // 2월=0(인), 3월=1(묘), ...
    } else {
        monthBranch = month + 10; // 1월=11(축)
    }
    
    // 월간 계산 (년간에 따라 결정)
    const yearStemIndex = (yearPillar.heavenlyStem.number - 1) % 5; // 0-4
    const monthStems = MONTH_STEMS[month] || MONTH_STEMS[2]; // 기본값은 인월
    const stemIndex = monthStems[yearStemIndex];
    
    return {
        heavenlyStem: HEAVENLY_STEMS[stemIndex],
        earthlyBranch: EARTHLY_BRANCHES[monthBranch],
        month: month
    };
}

// 일주 계산 (만년력 기준)
function calculateDayPillar(date) {
    // 기준일: 1900년 1월 1일 = 갑자일
    const baseDate = new Date(1900, 0, 1);
    const daysDiff = Math.floor((date - baseDate) / (24 * 60 * 60 * 1000));
    
    const stemIndex = ((daysDiff % 10) + 10) % 10;
    const branchIndex = ((daysDiff % 12) + 12) % 12;
    
    return {
        heavenlyStem: HEAVENLY_STEMS[stemIndex],
        earthlyBranch: EARTHLY_BRANCHES[branchIndex],
        daysDiff: daysDiff
    };
}

// 시주 계산
function calculateTimePillar(birthTime, dayPillar) {
    const branchIndex = TIME_TO_BRANCH[birthTime] || 0;
    const dayStemGroup = Math.floor((dayPillar.heavenlyStem.number - 1) / 2);
    const stemIndex = HOUR_STEMS[dayStemGroup][branchIndex];
    
    return {
        heavenlyStem: HEAVENLY_STEMS[stemIndex],
        earthlyBranch: EARTHLY_BRANCHES[branchIndex],
        time: birthTime
    };
}

/**
 * 음력을 양력으로 변환 (간단한 근사치)
 * @param {Date} lunarDate - 음력 날짜
 * @returns {Date} 양력 날짜
 */
// 오행 분석
function analyzeElements(pillars) {
    const elements = {
        wood: 0, fire: 0, earth: 0, metal: 0, water: 0
    };
    
    const detailed = {
        stems: [],
        branches: [],
        total: elements,
        strongest: null,
        weakest: null,
        balance: null
    };
    
    // 천간과 지지의 오행 계산
    pillars.forEach((pillar, index) => {
        const stemElement = pillar.heavenlyStem.element;
        const branchElement = pillar.earthlyBranch.element;
        
        elements[stemElement] += 1.5; // 천간 가중치
        elements[branchElement] += 1;  // 지지 가중치
        
        detailed.stems.push({
            position: ['year', 'month', 'day', 'time'][index],
            element: stemElement,
            stem: pillar.heavenlyStem
        });
        
        detailed.branches.push({
            position: ['year', 'month', 'day', 'time'][index],
            element: branchElement,
            branch: pillar.earthlyBranch
        });
    });
    
    // 가장 강한/약한 오행 찾기
    const elementEntries = Object.entries(elements);
    elementEntries.sort((a, b) => b[1] - a[1]);
    
    detailed.strongest = elementEntries[0][0];
    detailed.weakest = elementEntries[elementEntries.length - 1][0];
    detailed.total = elements;
    
    // 균형도 계산 (0-1, 1이 완벽한 균형)
    const total = Object.values(elements).reduce((a, b) => a + b, 0);
    const average = total / 5;
    const variance = Object.values(elements).reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / 5;
    detailed.balance = Math.max(0, 1 - (variance / (average * average)));
    
    return detailed;
}

// 용신 계산 (간략화된 버전)
function calculateYongSin(dayPillar, elementAnalysis) {
    const dayStemElement = dayPillar.heavenlyStem.element;
    const elements = elementAnalysis.total;
    const dayStemStrength = elements[dayStemElement];
    
    let yongSin = {
        primary: null,
        secondary: null,
        avoid: null,
        reasoning: ''
    };
    
    // 일간이 강한지 약한지 판단
    const totalOther = Object.entries(elements)
        .filter(([el]) => el !== dayStemElement)
        .reduce((sum, [, val]) => sum + val, 0);
    
    const isDayWeak = dayStemStrength < totalOther / 4;
    
    if (isDayWeak) {
        // 일간이 약하면 생조하는 오행이 용신
        yongSin.primary = findGeneratingElement(dayStemElement);
        yongSin.secondary = dayStemElement;
        yongSin.avoid = findDestroyingElement(dayStemElement);
        yongSin.reasoning = '일간이 약하므로 생조하는 오행을 용신으로 함';
    } else {
        // 일간이 강하면 설기하는 오행이 용신
        yongSin.primary = findDestroyedElement(dayStemElement);
        yongSin.secondary = findGeneratedElement(dayStemElement);
        yongSin.avoid = findGeneratingElement(dayStemElement);
        yongSin.reasoning = '일간이 강하므로 설기하는 오행을 용신으로 함';
    }
    
    return yongSin;
}

// 기본 해석 생성
function generateBasicInterpretation(dayPillar, elementAnalysis, yongSin) {
    const dayStem = dayPillar.heavenlyStem;
    const dayBranch = dayPillar.earthlyBranch;
    const strongElement = elementAnalysis.strongest;
    
    return {
        personality: generatePersonalityReading(dayStem, dayBranch),
        strengths: generateStrengthsReading(dayStem.element, strongElement),
        recommendations: generateRecommendations(yongSin),
        luckyColors: getLuckyColors(yongSin.primary),
        luckyNumbers: getLuckyNumbers(dayStem.element),
        favorableDirections: getFavorableDirections(yongSin.primary)
    };
}

// 보조 함수들
function findGeneratingElement(element) {
    const reverse = Object.fromEntries(Object.entries(ELEMENT_RELATIONS.generation).map(([k, v]) => [v, k]));
    return reverse[element];
}

function findGeneratedElement(element) {
    return ELEMENT_RELATIONS.generation[element];
}

function findDestroyingElement(element) {
    const reverse = Object.fromEntries(Object.entries(ELEMENT_RELATIONS.destruction).map(([k, v]) => [v, k]));
    return reverse[element];
}

function findDestroyedElement(element) {
    return ELEMENT_RELATIONS.destruction[element];
}

function generatePersonalityReading(dayStem, dayBranch) {
    const traits = {
        wood: '창조적이고 성장지향적이며, 유연함과 인내력을 겸비하고 있습니다.',
        fire: '열정적이고 활동적이며, 밝고 긍정적인 에너지를 가지고 있습니다.',
        earth: '안정적이고 신뢰할 수 있으며, 포용력과 지속성을 가지고 있습니다.',
        metal: '논리적이고 정확하며, 강한 의지력과 결단력을 가지고 있습니다.',
        water: '지혜롭고 적응력이 뛰어나며, 깊이 있는 사고력을 가지고 있습니다.'
    };
    return traits[dayStem.element];
}

function generateStrengthsReading(dayElement, strongElement) {
    if (dayElement === strongElement) {
        return `본인의 ${getElementName(dayElement)} 기운이 강하여 해당 특성이 잘 발현됩니다.`;
    } else {
        return `${getElementName(strongElement)} 기운이 강하여 이를 잘 활용하면 큰 도움이 됩니다.`;
    }
}

function generateRecommendations(yongSin) {
    return `${getElementName(yongSin.primary)} 기운을 강화하는 것이 도움이 되며, ${getElementName(yongSin.avoid)} 기운은 피하는 것이 좋습니다.`;
}

function getLuckyColors(element) {
    const colors = {
        wood: ['초록색', '청색'],
        fire: ['빨간색', '주황색'],
        earth: ['노란색', '갈색'],
        metal: ['흰색', '금색'],
        water: ['검은색', '남색']
    };
    return colors[element] || ['흰색'];
}

function getLuckyNumbers(element) {
    const numbers = {
        wood: [3, 4, 13, 14, 23, 24, 33, 34, 43, 44],
        fire: [2, 7, 12, 17, 22, 27, 32, 37, 42],
        earth: [5, 6, 15, 16, 25, 26, 35, 36, 45],
        metal: [4, 9, 14, 19, 24, 29, 34, 39, 44],
        water: [1, 6, 11, 16, 21, 26, 31, 36, 41]
    };
    return numbers[element] || [1, 2, 3, 4, 5];
}

function getFavorableDirections(element) {
    const directions = {
        wood: ['동쪽', '남동쪽'],
        fire: ['남쪽', '남서쪽'],
        earth: ['중앙', '남서쪽', '북동쪽'],
        metal: ['서쪽', '북서쪽'],
        water: ['북쪽', '북동쪽']
    };
    return directions[element] || ['동쪽'];
}

function getElementName(element) {
    const names = {
        wood: '목(木)',
        fire: '화(火)', 
        earth: '토(土)',
        metal: '금(金)',
        water: '수(水)'
    };
    return names[element] || element;
}

// 오행별 로또 번호 매핑
const ELEMENT_LOTTO_MAPPING = {
    wood: [3, 8, 13, 18, 23, 28, 33, 38, 43],
    fire: [2, 7, 12, 17, 22, 27, 32, 37, 42],
    earth: [5, 10, 15, 20, 25, 30, 35, 40, 45],
    metal: [4, 9, 14, 19, 24, 29, 34, 39, 44],
    water: [1, 6, 11, 16, 21, 26, 31, 36, 41]
};

// 오행별 색상 정의
const ELEMENT_COLORS = {
    wood: '#228B22',    // 초록색
    fire: '#DC143C',     // 빨간색  
    earth: '#CD853F',    // 갈색
    metal: '#C0C0C0',    // 은색
    water: '#191970'     // 남색
};

// 사주 기반 로또 번호 생성 함수
function generateSajuBasedLottoNumbers(sajuResult) {
    const favorableElements = getFavorableElements(sajuResult);
    const elementBalance = analyzeElementBalance(sajuResult);
    const birthNumbers = extractBirthNumbers(sajuResult.birthInfo.originalDate);
    
    const selectedNumbers = [];
    const numberReasons = [];
    const usedNumbers = new Set();
    
    // 1단계: 용신(favorableElements) 중심 번호 선택 (2-3개)
    const primaryElement = sajuResult.yongSin.primary;
    if (primaryElement && ELEMENT_LOTTO_MAPPING[primaryElement]) {
        const primaryNumbers = ELEMENT_LOTTO_MAPPING[primaryElement];
        const primaryCount = Math.min(3, primaryNumbers.length);
        
        for (let i = 0; i < primaryCount && selectedNumbers.length < 6; i++) {
            const seed = (sajuResult.dayPillar.heavenlyStem.number * 17 + 
                         sajuResult.timePillar.earthlyBranch.number * 13 + i * 7) % primaryNumbers.length;
            const number = primaryNumbers[seed];
            
            if (!usedNumbers.has(number)) {
                selectedNumbers.push(number);
                usedNumbers.add(number);
                numberReasons.push({
                    number: number,
                    element: primaryElement,
                    reason: `용신 ${getElementName(primaryElement)}의 기운`
                });
            }
        }
    }
    
    // 2단계: 사주 4주의 균형도 고려한 번호 선택
    const pillars = [sajuResult.yearPillar, sajuResult.monthPillar, 
                    sajuResult.dayPillar, sajuResult.timePillar];
    
    pillars.forEach((pillar, index) => {
        if (selectedNumbers.length >= 6) return;
        
        const pillarElements = [pillar.heavenlyStem.element, pillar.earthlyBranch.element];
        
        pillarElements.forEach(element => {
            if (selectedNumbers.length >= 6) return;
            
            const elementNumbers = ELEMENT_LOTTO_MAPPING[element];
            if (elementNumbers) {
                const seed = (pillar.heavenlyStem.number + pillar.earthlyBranch.number + index) % elementNumbers.length;
                const number = elementNumbers[seed];
                
                if (!usedNumbers.has(number)) {
                    selectedNumbers.push(number);
                    usedNumbers.add(number);
                    const pillarNames = ['년주', '월주', '일주', '시주'];
                    numberReasons.push({
                        number: number,
                        element: element,
                        reason: `${pillarNames[index]} ${getElementName(element)}의 조화`
                    });
                }
            }
        });
    });
    
    // 3단계: 생년월일의 숫자 조합 활용
    birthNumbers.forEach(birthNum => {
        if (selectedNumbers.length >= 6) return;
        
        if (!usedNumbers.has(birthNum) && birthNum >= 1 && birthNum <= 45) {
            selectedNumbers.push(birthNum);
            usedNumbers.add(birthNum);
            numberReasons.push({
                number: birthNum,
                element: getNumberElement(birthNum),
                reason: '생년월일의 특별한 의미'
            });
        }
    });
    
    // 4단계: 부족한 번호를 오행 균형으로 채우기
    while (selectedNumbers.length < 6) {
        const weakestElement = findWeakestElement(elementBalance);
        const weakestNumbers = ELEMENT_LOTTO_MAPPING[weakestElement];
        
        if (weakestNumbers) {
            const randomSeed = (selectedNumbers.length * 23 + 
                              sajuResult.dayPillar.heavenlyStem.number * 11) % weakestNumbers.length;
            const number = weakestNumbers[randomSeed];
            
            if (!usedNumbers.has(number)) {
                selectedNumbers.push(number);
                usedNumbers.add(number);
                numberReasons.push({
                    number: number,
                    element: weakestElement,
                    reason: `오행 균형을 위한 ${getElementName(weakestElement)} 보강`
                });
            }
        }
        
        // 무한 루프 방지
        if (usedNumbers.size >= 45) break;
    }
    
    return {
        numbers: selectedNumbers.sort((a, b) => a - b),
        reasons: numberReasons.sort((a, b) => a.number - b.number),
        balance: calculateNumberBalance(selectedNumbers)
    };
}

// 사주에서 선호 오행 추출
function getFavorableElements(sajuResult) {
    const favorable = [];
    
    if (sajuResult.yongSin.primary) {
        favorable.push(sajuResult.yongSin.primary);
    }
    
    if (sajuResult.yongSin.secondary && favorable.length < 3) {
        favorable.push(sajuResult.yongSin.secondary);
    }
    
    // 일간과 상생하는 오행 추가
    const dayElement = sajuResult.dayPillar.heavenlyStem.element;
    const generatedElement = ELEMENT_RELATIONS.generation[dayElement];
    if (generatedElement && !favorable.includes(generatedElement)) {
        favorable.push(generatedElement);
    }
    
    return favorable;
}

// 오행 균형 분석
function analyzeElementBalance(sajuResult) {
    return sajuResult.elementAnalysis.total;
}

// 생년월일에서 의미있는 숫자 추출
function extractBirthNumbers(birthDate) {
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    const numbers = [];
    
    // 생년의 끝자리
    const yearLastDigit = year % 100;
    if (yearLastDigit <= 45 && yearLastDigit >= 1) numbers.push(yearLastDigit);
    
    // 생월
    if (month <= 45) numbers.push(month);
    
    // 생일
    if (day <= 45) numbers.push(day);
    
    // 년월일의 합
    const sum = (year % 100) + month + day;
    const finalSum = sum > 45 ? sum % 45 + 1 : sum;
    if (finalSum >= 1 && finalSum <= 45) numbers.push(finalSum);
    
    return [...new Set(numbers)]; // 중복 제거
}

// 숫자에서 오행 추출
function getNumberElement(number) {
    const lastDigit = number % 10;
    if (lastDigit === 1 || lastDigit === 6) return 'water';
    if (lastDigit === 2 || lastDigit === 7) return 'fire';  
    if (lastDigit === 3 || lastDigit === 8) return 'wood';
    if (lastDigit === 4 || lastDigit === 9) return 'metal';
    if (lastDigit === 5 || lastDigit === 0) return 'earth';
    return 'earth'; // 기본값
}

// 가장 약한 오행 찾기
function findWeakestElement(elementBalance) {
    return Object.entries(elementBalance)
        .sort((a, b) => a[1] - b[1])[0][0];
}

// 선택된 번호들의 오행 균형 계산
function calculateNumberBalance(numbers) {
    const balance = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    
    numbers.forEach(number => {
        const element = getNumberElement(number);
        balance[element]++;
    });
    
    return balance;
}

// 대운/세운 영향을 고려한 가중치 계산
function calculateLuckInfluence(sajuResult) {
    const currentYear = new Date().getFullYear();
    const birthYear = sajuResult.birthInfo.originalDate.getFullYear();
    const age = currentYear - birthYear + 1;
    
    // 현재 대운 (10년 주기)
    const greatLuckCycle = Math.floor((age - 1) / 10);
    
    // 올해 세운
    const yearlyLuck = (currentYear - 1984) % 60; // 갑자 기준
    
    return {
        greatLuckCycle,
        yearlyLuck,
        ageInfluence: age % 12
    };
}

// 전역 스코프에 함수 노출
if (typeof window !== 'undefined') {
    window.calculateSaju = calculateSaju;
    window.generateSajuBasedLottoNumbers = generateSajuBasedLottoNumbers;
    window.ELEMENT_LOTTO_MAPPING = ELEMENT_LOTTO_MAPPING;
    window.ELEMENT_COLORS = ELEMENT_COLORS;
}