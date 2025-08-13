// DOM 요소 가져오기
const sajuForm = document.getElementById('saju-form');
const resultSection = document.getElementById('result-section');
const loadingOverlay = document.getElementById('loading-overlay');
const sajuDisplay = document.getElementById('saju-display');
const numbersDisplay = document.getElementById('numbers-display');
const explanationText = document.getElementById('explanation-text');

// 폼 제출 이벤트 처리
sajuForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 입력값 검증
    if (!validateForm()) {
        return;
    }
    
    // 로딩 표시
    showLoading();
    
    try {
        // 폼 데이터 수집
        const formData = collectFormData();
        
        // 사주 계산
        const sajuResult = calculateSaju(formData);
        
        // 로또 번호 생성
        const lottoNumbers = generateLottoNumbers(sajuResult);
        
        // 결과 표시
        displayResults(sajuResult, lottoNumbers);
        
        // 로딩 숨기기 및 결과 표시
        hideLoading();
        showResults();
        
    } catch (error) {
        console.error('번호 생성 중 오류 발생:', error);
        alert('번호 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        hideLoading();
    }
});

// 폼 입력값 검증
function validateForm() {
    const birthDate = document.getElementById('birth-date').value;
    const birthTime = document.getElementById('birth-time').value;
    const gender = document.querySelector('input[name="gender"]:checked');
    
    if (!birthDate) {
        alert('생년월일을 입력해주세요.');
        return false;
    }
    
    if (!birthTime) {
        alert('출생시간을 선택해주세요.');
        return false;
    }
    
    if (!gender) {
        alert('성별을 선택해주세요.');
        return false;
    }
    
    // 날짜 유효성 검사
    const selectedDate = new Date(birthDate);
    const currentDate = new Date();
    const minDate = new Date('1900-01-01');
    
    if (selectedDate > currentDate) {
        alert('미래의 날짜는 입력할 수 없습니다.');
        return false;
    }
    
    if (selectedDate < minDate) {
        alert('1900년 이후의 날짜만 입력 가능합니다.');
        return false;
    }
    
    return true;
}

// 폼 데이터 수집
function collectFormData() {
    const birthDate = document.getElementById('birth-date').value;
    const calendarType = document.querySelector('input[name="calendar-type"]:checked').value;
    const birthTime = parseInt(document.getElementById('birth-time').value);
    const gender = document.querySelector('input[name="gender"]:checked').value;
    
    return {
        birthDate: new Date(birthDate),
        calendarType,
        birthTime,
        gender
    };
}

// 로또 번호 생성 (사주 기반)
function generateLottoNumbers(sajuResult) {
    const numbers = [];
    const usedNumbers = new Set();
    
    // 사주 요소를 기반으로 시드 생성
    let seed = sajuResult.yearPillar.heavenlyStem.number + 
               sajuResult.monthPillar.heavenlyStem.number + 
               sajuResult.dayPillar.heavenlyStem.number + 
               sajuResult.timePillar.heavenlyStem.number +
               sajuResult.yearPillar.earthlyBranch.number + 
               sajuResult.monthPillar.earthlyBranch.number + 
               sajuResult.dayPillar.earthlyBranch.number + 
               sajuResult.timePillar.earthlyBranch.number;
    
    // 오행 요소 기반 보정
    const elementWeights = getElementWeights(sajuResult);
    
    // 첫 번째 숫자: 년주 기반
    numbers.push(generateNumberFromPillar(sajuResult.yearPillar, 1, 10));
    
    // 두 번째 숫자: 월주 기반
    let secondNum = generateNumberFromPillar(sajuResult.monthPillar, 11, 20);
    while (usedNumbers.has(secondNum)) {
        secondNum = (secondNum % 45) + 1;
    }
    numbers.push(secondNum);
    
    // 세 번째 숫자: 일주 기반
    let thirdNum = generateNumberFromPillar(sajuResult.dayPillar, 21, 30);
    while (usedNumbers.has(thirdNum)) {
        thirdNum = (thirdNum % 45) + 1;
    }
    numbers.push(thirdNum);
    
    // 네 번째 숫자: 시주 기반
    let fourthNum = generateNumberFromPillar(sajuResult.timePillar, 31, 40);
    while (usedNumbers.has(fourthNum)) {
        fourthNum = (fourthNum % 45) + 1;
    }
    numbers.push(fourthNum);
    
    // 나머지 숫자들을 사주 기반으로 생성
    numbers.forEach(num => usedNumbers.add(num));
    
    while (numbers.length < 6) {
        seed = (seed * 16807) % 2147483647; // Linear congruential generator
        let num = (seed % 45) + 1;
        
        // 오행 가중치 적용
        num = applyElementWeight(num, elementWeights);
        
        if (!usedNumbers.has(num)) {
            numbers.push(num);
            usedNumbers.add(num);
        }
    }
    
    // 보너스 번호 생성
    seed = (seed * 16807) % 2147483647;
    let bonusNumber = (seed % 45) + 1;
    while (usedNumbers.has(bonusNumber)) {
        bonusNumber = (bonusNumber % 45) + 1;
    }
    
    return {
        main: numbers.sort((a, b) => a - b),
        bonus: bonusNumber,
        explanation: generateExplanation(sajuResult, numbers)
    };
}

// 기둥에서 숫자 생성
function generateNumberFromPillar(pillar, min, max) {
    let base = (pillar.heavenlyStem.number * 10 + pillar.earthlyBranch.number) % (max - min + 1);
    let result = base + min;
    return Math.max(1, Math.min(45, result));
}

// 오행 가중치 계산
function getElementWeights(sajuResult) {
    const elements = {
        wood: 0, fire: 0, earth: 0, metal: 0, water: 0
    };
    
    // 각 기둥의 오행 계산
    const pillars = [sajuResult.yearPillar, sajuResult.monthPillar, 
                    sajuResult.dayPillar, sajuResult.timePillar];
    
    pillars.forEach(pillar => {
        elements[pillar.heavenlyStem.element]++;
        elements[pillar.earthlyBranch.element]++;
    });
    
    return elements;
}

// 오행 가중치 적용
function applyElementWeight(number, elementWeights) {
    const numberToElement = {
        1: 'water', 2: 'water', 
        3: 'wood', 4: 'wood',
        5: 'fire', 6: 'fire',
        7: 'earth', 8: 'earth',
        9: 'metal', 10: 'metal'
    };
    
    const baseElement = numberToElement[number % 10] || 'earth';
    const weight = elementWeights[baseElement] || 1;
    
    // 가중치가 높은 오행의 숫자는 약간 조정
    if (weight > 2) {
        return Math.max(1, Math.min(45, number + weight));
    }
    
    return number;
}

// 설명 생성
function generateExplanation(sajuResult, numbers) {
    const dayElement = sajuResult.dayPillar.heavenlyStem.element;
    const strongElement = findStrongestElement(sajuResult);
    
    let explanation = `이 번호들은 당신의 일간 ${getElementName(dayElement)}의 기운을 바탕으로 생성되었습니다. `;
    
    if (strongElement !== dayElement) {
        explanation += `특히 ${getElementName(strongElement)}의 에너지가 강하게 작용하여 `;
    }
    
    explanation += `균형잡힌 오행의 조화를 이루도록 선택되었습니다. `;
    explanation += `각 숫자는 사주의 년주, 월주, 일주, 시주의 기운을 담고 있어 당신만의 특별한 의미를 가집니다.`;
    
    return explanation;
}

// 가장 강한 오행 찾기
function findStrongestElement(sajuResult) {
    const weights = getElementWeights(sajuResult);
    return Object.keys(weights).reduce((a, b) => weights[a] > weights[b] ? a : b);
}

// 오행 이름 변환
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

// 결과 표시
function displayResults(sajuResult, lottoNumbers) {
    // 사주 정보 표시
    displaySajuInfo(sajuResult);
    
    // 로또 번호 표시
    displayLottoNumbers(lottoNumbers);
    
    // 설명 표시
    explanationText.textContent = lottoNumbers.explanation;
}

// 사주 정보 표시
function displaySajuInfo(sajuResult) {
    const sajuText = `
        <div class="pillar-container">
            <div class="pillar">
                <div class="pillar-title">년주</div>
                <div class="pillar-content">
                    <div>${sajuResult.yearPillar.heavenlyStem.name}</div>
                    <div>${sajuResult.yearPillar.earthlyBranch.name}</div>
                </div>
            </div>
            <div class="pillar">
                <div class="pillar-title">월주</div>
                <div class="pillar-content">
                    <div>${sajuResult.monthPillar.heavenlyStem.name}</div>
                    <div>${sajuResult.monthPillar.earthlyBranch.name}</div>
                </div>
            </div>
            <div class="pillar">
                <div class="pillar-title">일주</div>
                <div class="pillar-content">
                    <div>${sajuResult.dayPillar.heavenlyStem.name}</div>
                    <div>${sajuResult.dayPillar.earthlyBranch.name}</div>
                </div>
            </div>
            <div class="pillar">
                <div class="pillar-title">시주</div>
                <div class="pillar-content">
                    <div>${sajuResult.timePillar.heavenlyStem.name}</div>
                    <div>${sajuResult.timePillar.earthlyBranch.name}</div>
                </div>
            </div>
        </div>
    `;
    
    sajuDisplay.innerHTML = sajuText;
}

// 로또 번호 표시
function displayLottoNumbers(lottoNumbers) {
    const numberBalls = numbersDisplay.querySelector('.number-balls');
    numberBalls.innerHTML = '';
    
    // 메인 번호들
    lottoNumbers.main.forEach((number, index) => {
        const ball = document.createElement('div');
        ball.className = 'number-ball';
        ball.textContent = number;
        ball.style.animationDelay = `${index * 0.1}s`;
        numberBalls.appendChild(ball);
    });
    
    // 보너스 번호
    const bonusBall = document.createElement('div');
    bonusBall.className = 'number-ball';
    bonusBall.textContent = lottoNumbers.bonus;
    bonusBall.style.animationDelay = '0.6s';
    bonusBall.style.border = '3px solid #FFD700';
    numberBalls.appendChild(bonusBall);
}

// 새로운 번호 생성
function generateNewNumbers() {
    const formData = collectFormData();
    const sajuResult = calculateSaju(formData);
    
    // 시드를 약간 변경하여 다른 번호 생성
    const timestamp = Date.now();
    sajuResult.randomSeed = timestamp;
    
    const lottoNumbers = generateLottoNumbers(sajuResult);
    displayLottoNumbers(lottoNumbers);
    explanationText.textContent = lottoNumbers.explanation;
}

// 로딩 표시/숨기기
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// 결과 표시/숨기기
function showResults() {
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

function hideResults() {
    resultSection.classList.add('hidden');
}

// CSS 스타일 추가 (사주 표시용)
const style = document.createElement('style');
style.textContent = `
    .pillar-container {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        max-width: 400px;
        margin: 0 auto;
    }
    
    .pillar {
        text-align: center;
        border: 2px solid var(--border-color);
        border-radius: 10px;
        padding: 12px 8px;
        background: white;
    }
    
    .pillar-title {
        font-size: 0.9rem;
        color: var(--wood-color);
        margin-bottom: 8px;
        font-weight: 600;
    }
    
    .pillar-content div {
        font-family: 'Nanum Myeongjo', serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--water-color);
        margin: 2px 0;
    }
    
    @media (max-width: 480px) {
        .pillar-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .pillar {
            padding: 10px 6px;
        }
        
        .pillar-title {
            font-size: 0.8rem;
        }
        
        .pillar-content div {
            font-size: 1rem;
        }
    }
`;
document.head.appendChild(style);

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 오늘 날짜를 기본값으로 설정 (30년 전)
    const today = new Date();
    const defaultDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    document.getElementById('birth-date').value = defaultDate.toISOString().split('T')[0];
    
    // 양력을 기본값으로 설정
    document.querySelector('input[name="calendar-type"][value="solar"]').checked = true;
    
    console.log('사주 로또 번호 생성기가 준비되었습니다.');
});