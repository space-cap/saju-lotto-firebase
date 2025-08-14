// DOM 요소 가져오기
const sajuForm = document.getElementById('saju-form');
const resultSection = document.getElementById('result-section');
const loadingOverlay = document.getElementById('loading-overlay');
const sajuDisplay = document.getElementById('saju-display');
const numbersDisplay = document.getElementById('numbers-display');
const explanationText = document.getElementById('explanation-text');

// 당첨번호 관련 변수
let winningNumbersListener = null;
let currentSajuData = null;
let latestWinningNumbers = [];

// 고급 사주 기능 관련 변수
let currentFortune = null;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let selectedDate = null;

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
        
        // 로또 번호 생성 (새로운 사주 기반 알고리즘 사용)
        const lottoNumbers = generateSajuBasedLottoNumbers(sajuResult);
        
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

// 새로운 번호 생성 (다중 세트 지원)
function generateMultipleLottoSets(sajuResult, setCount = 1) {
    const sets = [];
    
    for (let i = 0; i < setCount; i++) {
        // 각 세트마다 약간 다른 시드를 사용하여 변화 주기
        const modifiedResult = JSON.parse(JSON.stringify(sajuResult));
        modifiedResult.setIndex = i;
        modifiedResult.timeOffset = i * 1000;
        
        const lottoSet = generateSajuBasedLottoNumbers(modifiedResult);
        sets.push({
            setNumber: i + 1,
            numbers: lottoSet.numbers,
            reasons: lottoSet.reasons,
            balance: lottoSet.balance
        });
    }
    
    return sets;
}

// 오늘의 운세 가중치 계산
function calculateDailyLuckWeight(sajuResult) {
    const today = new Date();
    const todayElement = getDayElement(today);
    const dayCompatibility = calculateElementCompatibility(
        sajuResult.dayPillar.heavenlyStem.element, 
        todayElement
    );
    
    return {
        todayElement,
        compatibility: dayCompatibility,
        weight: dayCompatibility > 0.5 ? 1.2 : 0.8
    };
}

// 날짜의 오행 계산
function getDayElement(date) {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const elements = ['wood', 'fire', 'earth', 'metal', 'water'];
    return elements[dayOfYear % 5];
}

// 오행 상성 계산
function calculateElementCompatibility(element1, element2) {
    if (element1 === element2) return 1.0;
    if (ELEMENT_RELATIONS.generation[element1] === element2) return 0.8;
    if (ELEMENT_RELATIONS.generation[element2] === element1) return 0.7;
    if (ELEMENT_RELATIONS.destruction[element1] === element2) return 0.3;
    if (ELEMENT_RELATIONS.destruction[element2] === element1) return 0.2;
    return 0.5; // 중성
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
    // 대운/세운 기본 정보 추가
    addBasicLuckInfo(sajuResult);
    
    // 사주 정보 표시
    displaySajuInfo(sajuResult);
    
    // 로또 번호 표시
    displayLottoNumbers(lottoNumbers);
    
    // 설명 표시
    explanationText.textContent = lottoNumbers.explanation;
}

// 사주 정보 표시 (개선된 버전)
function displaySajuInfo(sajuResult) {
    // 사주명반 HTML 생성
    const sajuPillarsHTML = `
        <div class="pillar-container">
            <div class="pillar">
                <div class="pillar-title">년주 (年柱)</div>
                <div class="pillar-content">
                    <div class="pillar-stem element-${sajuResult.yearPillar.heavenlyStem.element}">${sajuResult.yearPillar.heavenlyStem.name}</div>
                    <div class="pillar-branch element-${sajuResult.yearPillar.earthlyBranch.element}">${sajuResult.yearPillar.earthlyBranch.name}</div>
                </div>
            </div>
            <div class="pillar">
                <div class="pillar-title">월주 (月柱)</div>
                <div class="pillar-content">
                    <div class="pillar-stem element-${sajuResult.monthPillar.heavenlyStem.element}">${sajuResult.monthPillar.heavenlyStem.name}</div>
                    <div class="pillar-branch element-${sajuResult.monthPillar.earthlyBranch.element}">${sajuResult.monthPillar.earthlyBranch.name}</div>
                </div>
            </div>
            <div class="pillar">
                <div class="pillar-title">일주 (日柱)</div>
                <div class="pillar-content">
                    <div class="pillar-stem element-${sajuResult.dayPillar.heavenlyStem.element}">${sajuResult.dayPillar.heavenlyStem.name}</div>
                    <div class="pillar-branch element-${sajuResult.dayPillar.earthlyBranch.element}">${sajuResult.dayPillar.earthlyBranch.name}</div>
                </div>
            </div>
            <div class="pillar">
                <div class="pillar-title">시주 (時柱)</div>
                <div class="pillar-content">
                    <div class="pillar-stem element-${sajuResult.timePillar.heavenlyStem.element}">${sajuResult.timePillar.heavenlyStem.name}</div>
                    <div class="pillar-branch element-${sajuResult.timePillar.earthlyBranch.element}">${sajuResult.timePillar.earthlyBranch.name}</div>
                </div>
            </div>
        </div>
    `;
    
    // 오행 분석 차트 생성
    const elementAnalysisHTML = generateElementAnalysisHTML(sajuResult.elementAnalysis);
    
    // 사주 해석 생성
    const interpretationHTML = generateInterpretationHTML(sajuResult.interpretation, sajuResult.yongSin);
    
    // 모든 HTML 조합
    const fullSajuHTML = `
        ${sajuPillarsHTML}
        ${elementAnalysisHTML}
        ${interpretationHTML}
    `;
    
    sajuDisplay.innerHTML = fullSajuHTML;
}

// 오행 분석 차트 HTML 생성
function generateElementAnalysisHTML(elementAnalysis) {
    const elements = elementAnalysis.total;
    const elementNames = {
        wood: '목(木)', fire: '화(火)', earth: '토(土)', 
        metal: '금(金)', water: '수(水)'
    };
    
    let analysisHTML = '<div class="element-analysis">';
    
    Object.entries(elements).forEach(([element, strength]) => {
        const roundedStrength = Math.round(strength * 10) / 10;
        analysisHTML += `
            <div class="element-item">
                <div class="element-name">${elementNames[element]}</div>
                <div class="element-strength element-${element}">${roundedStrength}</div>
            </div>
        `;
    });
    
    analysisHTML += '</div>';
    return analysisHTML;
}

// 사주 해석 HTML 생성
function generateInterpretationHTML(interpretation, yongSin) {
    return `
        <div class="saju-interpretation">
            <div class="interpretation-section">
                <div class="interpretation-title">성격 특성</div>
                <div class="interpretation-content">${interpretation.personality}</div>
            </div>
            <div class="interpretation-section">
                <div class="interpretation-title">장점 및 강점</div>
                <div class="interpretation-content">${interpretation.strengths}</div>
            </div>
            <div class="interpretation-section">
                <div class="interpretation-title">용신 및 권고사항</div>
                <div class="interpretation-content">${interpretation.recommendations}</div>
            </div>
            <div class="interpretation-section">
                <div class="interpretation-title">행운의 색상</div>
                <div class="interpretation-content">${interpretation.luckyColors.join(', ')}</div>
            </div>
            <div class="interpretation-section">
                <div class="interpretation-title">길한 방향</div>
                <div class="interpretation-content">${interpretation.favorableDirections.join(', ')}</div>
            </div>
        </div>
    `;
}

// 로또 번호 표시 (개선된 버전)
function displayLottoNumbers(lottoNumbers) {
    const numberBalls = numbersDisplay.querySelector('.number-balls');
    if (!numberBalls) return;
    
    numberBalls.innerHTML = '';
    
    // 메인 번호들 - 오행별 색상 적용
    lottoNumbers.numbers.forEach((number, index) => {
        const ball = document.createElement('div');
        ball.className = 'number-ball';
        ball.textContent = number;
        ball.style.animationDelay = `${index * 0.15}s`;
        
        // 오행별 색상 적용
        const element = getNumberElement(number);
        ball.style.backgroundColor = ELEMENT_COLORS[element];
        ball.style.color = '#fff';
        ball.setAttribute('data-element', element);
        ball.setAttribute('data-element-name', getElementName(element));
        
        numberBalls.appendChild(ball);
    });
    
    // 번호 설명 섹션 추가
    displayNumberExplanations(lottoNumbers.reasons);
    
    // 오행 균형 차트 표시
    displayElementBalance(lottoNumbers.balance);
}

// 번호별 설명 표시
function displayNumberExplanations(reasons) {
    let explanationHTML = '<div class="number-explanations"><h4>번호별 의미</h4>';
    
    reasons.forEach(reason => {
        const elementName = getElementName(reason.element);
        const elementColor = ELEMENT_COLORS[reason.element];
        
        explanationHTML += `
            <div class="number-explanation-item">
                <div class="explanation-number" style="background-color: ${elementColor};">${reason.number}</div>
                <div class="explanation-text">
                    <span class="explanation-element">${elementName}</span>
                    <span class="explanation-reason">${reason.reason}</span>
                </div>
            </div>
        `;
    });
    
    explanationHTML += '</div>';
    
    // 설명을 기존 설명 텍스트 아래에 추가
    const explanationContainer = document.querySelector('.numbers-explanation');
    if (explanationContainer) {
        explanationContainer.innerHTML += explanationHTML;
    }
}

// 오행 균형 표시
function displayElementBalance(balance) {
    let balanceHTML = '<div class="element-balance-chart"><h4>번호의 오행 균형</h4>';
    
    Object.entries(balance).forEach(([element, count]) => {
        if (count > 0) {
            const elementName = getElementName(element);
            const elementColor = ELEMENT_COLORS[element];
            const percentage = (count / 6) * 100;
            
            balanceHTML += `
                <div class="balance-item">
                    <div class="balance-label">${elementName}</div>
                    <div class="balance-bar">
                        <div class="balance-fill" style="background-color: ${elementColor}; width: ${percentage}%"></div>
                    </div>
                    <div class="balance-count">${count}개</div>
                </div>
            `;
        }
    });
    
    balanceHTML += '</div>';
    
    const explanationContainer = document.querySelector('.numbers-explanation');
    if (explanationContainer) {
        explanationContainer.innerHTML += balanceHTML;
    }
}

// 새로운 번호 생성
function generateNewNumbers() {
    if (!validateForm()) return;
    
    showLoading();
    
    try {
        const formData = collectFormData();
        const sajuResult = calculateSaju(formData);
        
        // 시드를 약간 변경하여 다른 번호 생성
        const timestamp = Date.now();
        sajuResult.randomSeed = timestamp;
        
        const lottoNumbers = generateSajuBasedLottoNumbers(sajuResult);
        displayLottoNumbers(lottoNumbers);
        
        // 전체 설명 업데이트
        updateGeneralExplanation(sajuResult, lottoNumbers);
        
        hideLoading();
    } catch (error) {
        console.error('새로운 번호 생성 중 오류:', error);
        alert('번호 생성 중 오류가 발생했습니다.');
        hideLoading();
    }
}

// 전체 설명 업데이트
function updateGeneralExplanation(sajuResult, lottoNumbers) {
    const dayElement = sajuResult.dayPillar.heavenlyStem.element;
    const primaryElement = sajuResult.yongSin.primary;
    
    let explanation = `이 번호들은 당신의 일간 ${getElementName(dayElement)}과 용신 ${getElementName(primaryElement)}의 기운을 중심으로 `;
    explanation += `사주팔자의 균형과 조화를 고려하여 선택되었습니다. `;
    
    // 오늘의 운세 추가
    const dailyLuck = calculateDailyLuckWeight(sajuResult);
    const todayElementName = getElementName(dailyLuck.todayElement);
    
    if (dailyLuck.compatibility > 0.6) {
        explanation += `오늘은 ${todayElementName}의 날로 당신과 특히 좋은 상성을 보입니다. `;
    } else if (dailyLuck.compatibility < 0.4) {
        explanation += `오늘은 ${todayElementName}의 날로 신중한 접근이 필요할 수 있습니다. `;
    }
    
    explanation += `각 번호는 사주의 깊은 의미를 담고 있어 당신만의 특별한 행운을 가져다 줄 것입니다.`;
    
    if (explanationText) {
        explanationText.textContent = explanation;
    }
}

// 다중 세트 생성 기능 추가
function generateMultipleSets(setCount) {
    if (!validateForm()) return;
    
    showLoading();
    
    try {
        const formData = collectFormData();
        const sajuResult = calculateSaju(formData);
        const multipleSets = generateMultipleLottoSets(sajuResult, setCount);
        
        displayMultipleSets(multipleSets, sajuResult);
        hideLoading();
    } catch (error) {
        console.error('다중 세트 생성 중 오류:', error);
        alert('다중 세트 생성 중 오류가 발생했습니다.');
        hideLoading();
    }
}

// 다중 세트 표시
function displayMultipleSets(sets, sajuResult) {
    const numberBalls = numbersDisplay.querySelector('.number-balls');
    if (!numberBalls) return;
    
    numberBalls.innerHTML = '';
    
    sets.forEach((set, setIndex) => {
        const setContainer = document.createElement('div');
        setContainer.className = 'lotto-set';
        setContainer.innerHTML = `<h4>${set.setNumber}번째 세트</h4>`;
        
        const ballsContainer = document.createElement('div');
        ballsContainer.className = 'set-balls';
        
        set.numbers.forEach((number, index) => {
            const ball = document.createElement('div');
            ball.className = 'number-ball small';
            ball.textContent = number;
            ball.style.animationDelay = `${(setIndex * 6 + index) * 0.1}s`;
            
            const element = getNumberElement(number);
            ball.style.backgroundColor = ELEMENT_COLORS[element];
            ball.style.color = '#fff';
            
            ballsContainer.appendChild(ball);
        });
        
        setContainer.appendChild(ballsContainer);
        numberBalls.appendChild(setContainer);
    });
    
    // 전체 설명 업데이트
    updateGeneralExplanation(sajuResult, sets[0]);
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

// 대운/세운 기본 정보 추가 (간략화된 버전)
function addBasicLuckInfo(sajuResult) {
    const currentYear = new Date().getFullYear();
    const birthYear = sajuResult.birthInfo.originalDate.getFullYear();
    const age = currentYear - birthYear + 1;
    
    // 현재 대운 추정 (10년 단위)
    const currentGreatLuckPeriod = Math.floor(age / 10) + 1;
    
    // 올해 세운 (간단한 계산)
    const yearDiff = currentYear - 1984; // 1984년 갑자년 기준
    const annualStemIndex = yearDiff % 10;
    const annualBranchIndex = yearDiff % 12;
    
    if (sajuResult.elementAnalysis) {
        sajuResult.elementAnalysis.currentLuck = {
            greatLuckPeriod: currentGreatLuckPeriod,
            annualStem: window.HEAVENLY_STEMS ? window.HEAVENLY_STEMS[annualStemIndex]?.name || '미정' : '미정',
            annualBranch: window.EARTHLY_BRANCHES ? window.EARTHLY_BRANCHES[annualBranchIndex]?.name || '미정' : '미정',
            age: age
        };
    }
}

// =================================
// 당첨번호 확인 관련 함수들
// =================================

// 페이지 로드 시 당첨번호 리스너 시작
document.addEventListener('DOMContentLoaded', function() {
    initializeWinningFeatures();
    loadLatestWinningNumbers();
    
    // 인증 상태 변경 감지하여 UI 업데이트
    setInterval(updateWinningUIForAuth, 2000);
});

// 당첨 기능 초기화
function initializeWinningFeatures() {
    if (typeof window.firebaseAuth?.listenToWinningNumbers === 'function') {
        startWinningNumbersListener();
    } else {
        // Firebase 로드 대기
        setTimeout(initializeWinningFeatures, 1000);
    }
}

// 실시간 당첨번호 리스너 시작
function startWinningNumbersListener() {
    if (winningNumbersListener) return;
    
    winningNumbersListener = window.firebaseAuth.listenToWinningNumbers((winnings) => {
        latestWinningNumbers = winnings;
        displayLatestWinningNumbers(winnings);
        
        // 로그인된 사용자의 당첨 확인 업데이트
        const user = window.firebaseAuth?.getCurrentUser();
        if (user) {
            updateMyWinningCheck();
        }
    });
}

// 최신 당첨번호 불러오기
async function loadLatestWinningNumbers() {
    try {
        if (!window.firebaseAuth?.getLatestWinningNumbers) return;
        
        const winnings = await window.firebaseAuth.getLatestWinningNumbers(5);
        latestWinningNumbers = winnings;
        displayLatestWinningNumbers(winnings);
    } catch (error) {
        console.error('당첨번호 불러오기 실패:', error);
        displayWinningLoadError();
    }
}

// 최신 당첨번호 표시
function displayLatestWinningNumbers(winnings) {
    const display = document.getElementById('latest-winning-display');
    if (!display) return;
    
    if (!winnings || winnings.length === 0) {
        display.innerHTML = '<div class="loading-text">등록된 당첨번호가 없습니다.</div>';
        return;
    }
    
    display.innerHTML = winnings.map(winning => `
        <div class="winning-draw-info">
            <div class="draw-details">
                <div class="draw-number">${winning.drawNumber}회</div>
                <div class="draw-date">${formatDrawDate(winning.drawDate)}</div>
            </div>
            <div class="winning-numbers-row">
                ${winning.numbers.map(num => 
                    `<span class="winning-ball">${num}</span>`
                ).join('')}
                <span class="winning-ball bonus">${winning.bonusNumber}</span>
            </div>
        </div>
    `).join('');
}

// 날짜 포맷팅
function formatDrawDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// 당첨번호 로딩 오류 표시
function displayWinningLoadError() {
    const display = document.getElementById('latest-winning-display');
    if (display) {
        display.innerHTML = '<div class="loading-text">당첨번호를 불러올 수 없습니다.</div>';
    }
}

// 인증 상태에 따른 UI 업데이트
function updateWinningUIForAuth() {
    const user = window.firebaseAuth?.getCurrentUser();
    const myWinningResults = document.getElementById('my-winning-results');
    const winningCheckBtn = document.querySelector('.winning-check-btn');
    const sajuAnalysisContent = document.getElementById('saju-winning-analysis');
    
    if (user) {
        // 로그인 상태
        if (myWinningResults) {
            const loginRequired = myWinningResults.querySelector('.login-required');
            if (loginRequired) {
                myWinningResults.innerHTML = '<div class="loading-text">당첨 확인 중...</div>';
            }
        }
        
        if (winningCheckBtn) {
            winningCheckBtn.style.display = 'block';
        }
        
        if (sajuAnalysisContent) {
            const placeholder = sajuAnalysisContent.querySelector('.analysis-placeholder');
            if (placeholder) {
                sajuAnalysisContent.innerHTML = '<div class="loading-text">분석 중...</div>';
                loadSajuAnalysis();
            }
        }
        
    } else {
        // 로그아웃 상태
        if (myWinningResults) {
            myWinningResults.innerHTML = '<p class="login-required">로그인 후 당첨 확인이 가능합니다.</p>';
        }
        
        if (winningCheckBtn) {
            winningCheckBtn.style.display = 'none';
        }
        
        if (sajuAnalysisContent) {
            sajuAnalysisContent.innerHTML = '<p class="analysis-placeholder">로그인 후 개인 맞춤 분석을 확인하세요.</p>';
        }
    }
}

// 내 번호 당첨 확인
async function checkMyWinnings() {
    const user = window.firebaseAuth?.getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    try {
        const analysis = await window.firebaseAuth.analyzeSajuWinningHistory();
        if (!analysis) {
            document.getElementById('my-winning-results').innerHTML = 
                '<p class="login-required">저장된 번호가 없거나 분석할 수 없습니다.</p>';
            return;
        }
        
        displayMyWinningResults(analysis);
        
    } catch (error) {
        console.error('당첨 확인 실패:', error);
        alert('당첨 확인 중 오류가 발생했습니다.');
    }
}

// 내 당첨 결과 표시
function displayMyWinningResults(analysis) {
    const resultsDiv = document.getElementById('my-winning-results');
    if (!resultsDiv) return;
    
    if (analysis.winningResults.length === 0) {
        resultsDiv.innerHTML = `
            <div class="winning-result-item">
                <p>저장된 ${analysis.totalNumbers}개의 번호 중 당첨된 번호가 없습니다.</p>
                <p>계속 도전하시면 좋은 결과가 있을 것입니다! 🍀</p>
            </div>
        `;
        return;
    }
    
    const winningHTML = analysis.winningResults.map(result => `
        <div class="winning-result-item ${result.isWin ? 'win' : 'lose'}">
            <div class="result-header">
                <span class="result-prize ${result.isWin ? 'win' : 'lose'}">${result.prize}</span>
                <span class="result-date">${formatDrawDate(result.drawDate)}</span>
            </div>
            <div class="number-comparison">
                <div class="user-numbers">
                    ${result.userNumbers.map(num => 
                        `<span class="number-ball ${result.matches.includes(num) ? 'matched' : ''}">${num}</span>`
                    ).join('')}
                </div>
                <div class="comparison-arrow">→</div>
                <div class="winning-numbers-display">
                    ${result.winningNumbers.map(num => 
                        `<span class="number-ball ${result.matches.includes(num) ? 'matched' : ''}">${num}</span>`
                    ).join('')}
                </div>
            </div>
            <p><strong>맞춘 개수:</strong> ${result.matchCount}개 | 
               <strong>상금:</strong> ${result.prizeAmount.toLocaleString()}원</p>
        </div>
    `).join('');
    
    const summaryHTML = `
        <div class="winning-summary">
            <h4>당첨 요약</h4>
            <p>총 당첨 횟수: <strong>${analysis.totalWins}회</strong></p>
            <p>총 상금: <strong>${analysis.totalPrize.toLocaleString()}원</strong></p>
            <p>최고 맞춘 개수: <strong>${analysis.bestMatch}개</strong></p>
        </div>
    `;
    
    resultsDiv.innerHTML = summaryHTML + winningHTML;
}

// 사주 분석 로드
async function loadSajuAnalysis() {
    const user = window.firebaseAuth?.getCurrentUser();
    if (!user) return;
    
    try {
        const sajuProfile = await window.firebaseAuth.getSajuProfile();
        const analysis = await window.firebaseAuth.analyzeSajuWinningHistory();
        
        if (!analysis || !sajuProfile) {
            document.getElementById('saju-winning-analysis').innerHTML = 
                '<p class="analysis-placeholder">사주 정보나 번호 기록이 없어 분석할 수 없습니다.</p>';
            return;
        }
        
        const patterns = window.firebaseAuth.analyzeSajuWinningPattern(sajuProfile, analysis);
        displaySajuAnalysis(analysis, patterns);
        
    } catch (error) {
        console.error('사주 분석 실패:', error);
    }
}

// 사주 분석 결과 표시
function displaySajuAnalysis(analysis, patterns) {
    const analysisDiv = document.getElementById('saju-winning-analysis');
    if (!analysisDiv) return;
    
    const statsHTML = `
        <div class="analysis-stats">
            <div class="stat-item">
                <div class="stat-value">${analysis.totalNumbers}</div>
                <div class="stat-label">생성 번호</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${analysis.totalWins}</div>
                <div class="stat-label">당첨 횟수</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${((analysis.totalWins / analysis.totalNumbers) * 100).toFixed(1)}%</div>
                <div class="stat-label">당첨 비율</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${analysis.bestMatch}</div>
                <div class="stat-label">최고 적중</div>
            </div>
        </div>
    `;
    
    let elementHTML = '';
    if (patterns) {
        const totalMatches = Object.values(patterns.elementDistribution).reduce((sum, val) => sum + val, 0);
        elementHTML = `
            <div class="element-distribution">
                ${Object.entries(patterns.elementDistribution).map(([element, count]) => `
                    <div class="element-item">
                        <div class="element-name">${getElementKoreanName(element)}</div>
                        <div class="element-bar">
                            <div class="element-fill ${element}" style="width: ${totalMatches > 0 ? (count / totalMatches) * 100 : 0}%"></div>
                        </div>
                        <div class="element-percentage">${totalMatches > 0 ? ((count / totalMatches) * 100).toFixed(1) : 0}%</div>
                    </div>
                `).join('')}
            </div>
            <p class="analysis-insight">
                <strong>${getElementKoreanName(patterns.recommendedElements[0])}</strong> 속성의 번호가 당첨에 유리한 것으로 분석됩니다.
            </p>
        `;
    }
    
    analysisDiv.innerHTML = statsHTML + elementHTML;
}

// 오행 한국어 이름
function getElementKoreanName(element) {
    const names = {
        wood: '목(木)',
        fire: '화(火)', 
        earth: '토(土)',
        metal: '금(金)',
        water: '수(水)'
    };
    return names[element] || element;
}

// 추천 번호 생성
async function generateRecommendedNumbers() {
    const user = window.firebaseAuth?.getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    try {
        const sajuProfile = await window.firebaseAuth.getSajuProfile();
        if (!sajuProfile) {
            alert('먼저 사주 정보를 입력해주세요.');
            return;
        }
        
        const analysis = await window.firebaseAuth.analyzeSajuWinningHistory();
        const patterns = analysis ? window.firebaseAuth.analyzeSajuWinningPattern(sajuProfile, analysis) : null;
        
        // 추천 번호 생성
        let recommendedNumbers;
        if (patterns && patterns.luckyNumbers.length > 0) {
            // 기존 패턴 기반 추천
            recommendedNumbers = generateNumbersFromLucky(patterns.luckyNumbers);
        } else {
            // 사주 기반 기본 추천
            recommendedNumbers = generateBasicSajuRecommendation(sajuProfile);
        }
        
        displayRecommendedNumbers(recommendedNumbers, patterns);
        
    } catch (error) {
        console.error('추천 번호 생성 실패:', error);
        alert('추천 번호 생성 중 오류가 발생했습니다.');
    }
}

// 행운 번호에서 로또 번호 생성
function generateNumbersFromLucky(luckyNumbers) {
    const numbers = [];
    const usedNumbers = new Set();
    
    // 행운 번호에서 우선 선택
    for (const num of luckyNumbers) {
        if (numbers.length < 6 && !usedNumbers.has(num)) {
            numbers.push(num);
            usedNumbers.add(num);
        }
    }
    
    // 부족한 만큼 랜덤으로 채우기
    while (numbers.length < 6) {
        const randomNum = Math.floor(Math.random() * 45) + 1;
        if (!usedNumbers.has(randomNum)) {
            numbers.push(randomNum);
            usedNumbers.add(randomNum);
        }
    }
    
    return numbers.sort((a, b) => a - b);
}

// 기본 사주 추천 번호 생성
function generateBasicSajuRecommendation(sajuProfile) {
    // 간단한 사주 기반 번호 생성 로직
    const numbers = [];
    const usedNumbers = new Set();
    
    // 생년월일 기반 시드 생성
    const birthDate = new Date(sajuProfile.birthDate);
    const seed = birthDate.getFullYear() + birthDate.getMonth() + birthDate.getDate();
    
    // 시드 기반으로 번호 생성
    for (let i = 0; i < 6; i++) {
        let num;
        do {
            num = ((seed + i * 7) % 45) + 1;
        } while (usedNumbers.has(num));
        
        numbers.push(num);
        usedNumbers.add(num);
    }
    
    return numbers.sort((a, b) => a - b);
}

// 추천 번호 표시
function displayRecommendedNumbers(numbers, patterns) {
    const display = document.getElementById('recommended-display');
    if (!display) return;
    
    const explanation = patterns 
        ? `당신의 사주와 당첨 패턴 분석을 통해 ${getElementKoreanName(patterns.recommendedElements[0])} 속성이 강조된 추천 번호입니다.`
        : '사주 정보를 바탕으로 생성된 개인 맞춤 추천 번호입니다.';
    
    display.innerHTML = `
        <div class="recommendation-result">
            <div class="recommendation-title">🎯 맞춤 추천 번호</div>
            <div class="recommended-numbers-display">
                ${numbers.map(num => `<span class="recommended-ball">${num}</span>`).join('')}
            </div>
            <div class="recommendation-explanation">${explanation}</div>
            <button class="get-recommendation-btn" onclick="saveRecommendedNumbers(${JSON.stringify(numbers).replace(/"/g, '&quot;')})">
                이 번호 저장하기
            </button>
        </div>
    `;
}

// 추천 번호 저장
async function saveRecommendedNumbers(numbers) {
    const user = window.firebaseAuth?.getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    try {
        const sajuProfile = await window.firebaseAuth.getSajuProfile();
        const numbersData = {
            numbers: numbers,
            explanation: '사주 분석 기반 추천 번호',
            birthInfo: sajuProfile,
            timestamp: new Date().toISOString(),
            isRecommended: true
        };
        
        await window.firebaseAuth.saveLottoNumbers(numbersData);
        alert('추천 번호가 저장되었습니다!');
        
    } catch (error) {
        console.error('추천 번호 저장 실패:', error);
        alert('번호 저장 중 오류가 발생했습니다.');
    }
}

// 내 당첨 확인 업데이트 (실시간)
function updateMyWinningCheck() {
    const user = window.firebaseAuth?.getCurrentUser();
    if (user) {
        checkMyWinnings();
    }
}

// 번호 저장 기능 (Firebase 통합)
async function saveNumbers() {
    const numberBalls = document.querySelectorAll('.number-ball:not(.small)');
    if (numberBalls.length === 0) {
        alert('저장할 번호가 없습니다. 먼저 번호를 생성해주세요.');
        return;
    }
    
    // 로그인 체크
    const currentUser = window.firebaseAuth?.getCurrentUser();
    if (!currentUser) {
        if (confirm('번호를 저장하려면 로그인이 필요합니다. 로그인하시겠습니까?')) {
            showLoginModal();
        }
        return;
    }
    
    try {
        // 번호 수집
        const numbers = Array.from(numberBalls).map(ball => parseInt(ball.textContent)).sort((a, b) => a - b);
        const formData = collectFormData();
        
        const saveData = {
            numbers: numbers,
            timestamp: new Date().toLocaleString('ko-KR'),
            birthInfo: {
                birthDate: formData.birthDate.toLocaleDateString('ko-KR'),
                calendarType: formData.calendarType === 'solar' ? '양력' : '음력',
                birthTime: document.getElementById('birth-time').selectedOptions[0]?.textContent.split(' - ')[0] || '',
                gender: formData.gender === 'male' ? '남성' : '여성'
            },
            explanation: explanationText ? explanationText.textContent : ''
        };
        
        // Firebase에 저장
        const result = await window.firebaseAuth.saveLottoNumbers(saveData);
        
        if (result.success) {
            // 사주 프로필도 함께 저장
            try {
                const sajuProfileData = {
                    birthDate: saveData.birthInfo.birthDate,
                    calendarType: saveData.birthInfo.calendarType,
                    birthTime: saveData.birthInfo.birthTime,
                    gender: saveData.birthInfo.gender,
                    savedAt: new Date().toISOString()
                };
                await window.firebaseAuth.saveSajuProfile(sajuProfileData);
            } catch (profileError) {
                console.error('사주 프로필 저장 실패:', profileError);
            }
            
            // 로컬 스토리지에도 백업 저장
            let savedNumbers = JSON.parse(localStorage.getItem('sajuLottoNumbers') || '[]');
            savedNumbers.unshift(saveData);
            if (savedNumbers.length > 20) {
                savedNumbers = savedNumbers.slice(0, 20);
            }
            localStorage.setItem('sajuLottoNumbers', JSON.stringify(savedNumbers));
            
            showSaveConfirmation();
        }
        
    } catch (error) {
        console.error('번호 저장 실패:', error);
        alert('번호 저장에 실패했습니다. 다시 시도해주세요.');
    }
}

// 저장 완료 알림
function showSaveConfirmation() {
    const confirmation = document.createElement('div');
    confirmation.className = 'save-confirmation';
    confirmation.innerHTML = `
        <div class="save-message">
            <span class="save-icon">✓</span>
            번호가 저장되었습니다!
        </div>
    `;
    
    document.body.appendChild(confirmation);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        confirmation.remove();
    }, 3000);
    
    // 저장된 번호 보기 버튼 추가 (한 번만)
    if (!document.querySelector('.view-saved-btn')) {
        const viewSavedBtn = document.createElement('button');
        viewSavedBtn.className = 'view-saved-btn';
        viewSavedBtn.textContent = '저장된 번호 보기';
        viewSavedBtn.onclick = showSavedNumbers;
        
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.appendChild(viewSavedBtn);
        }
    }
}

// 저장된 번호들 보기
function showSavedNumbers() {
    const savedNumbers = JSON.parse(localStorage.getItem('sajuLottoNumbers') || '[]');
    
    if (savedNumbers.length === 0) {
        alert('저장된 번호가 없습니다.');
        return;
    }
    
    let modalHTML = `
        <div class="saved-numbers-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>저장된 로또 번호 (${savedNumbers.length}개)</h3>
                    <button class="modal-close" onclick="closeSavedNumbersModal()">&times;</button>
                </div>
                <div class="saved-numbers-list">
    `;
    
    savedNumbers.forEach((data, index) => {
        modalHTML += `
            <div class="saved-number-item">
                <div class="saved-header">
                    <span class="save-date">${data.timestamp}</span>
                    <button class="delete-saved" onclick="deleteSavedNumber(${index})">&times;</button>
                </div>
                <div class="saved-numbers">
                    ${data.numbers.map(num => `<span class="mini-ball">${num}</span>`).join('')}
                </div>
                <div class="saved-info">
                    <small>${data.birthInfo.birthDate} (${data.birthInfo.calendarType}) / ${data.birthInfo.birthTime} / ${data.birthInfo.gender}</small>
                </div>
            </div>
        `;
    });
    
    modalHTML += `
                </div>
                <div class="modal-footer">
                    <button class="clear-all-btn" onclick="clearAllSavedNumbers()">전체 삭제</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 저장된 번호 모달 닫기
function closeSavedNumbersModal() {
    const modal = document.querySelector('.saved-numbers-modal');
    if (modal) {
        modal.remove();
    }
}

// 특정 저장된 번호 삭제
function deleteSavedNumber(index) {
    if (confirm('이 번호를 삭제하시겠습니까?')) {
        let savedNumbers = JSON.parse(localStorage.getItem('sajuLottoNumbers') || '[]');
        savedNumbers.splice(index, 1);
        localStorage.setItem('sajuLottoNumbers', JSON.stringify(savedNumbers));
        
        // 모달 다시 열기
        closeSavedNumbersModal();
        showSavedNumbers();
    }
}

// 전체 저장된 번호 삭제
function clearAllSavedNumbers() {
    if (confirm('모든 저장된 번호를 삭제하시겠습니까?')) {
        localStorage.removeItem('sajuLottoNumbers');
        closeSavedNumbersModal();
        alert('모든 번호가 삭제되었습니다.');
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 오늘 날짜를 기본값으로 설정 (30년 전)
    const today = new Date();
    const defaultDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    document.getElementById('birth-date').value = defaultDate.toISOString().split('T')[0];
    
    // 양력을 기본값으로 설정
    document.querySelector('input[name="calendar-type"][value="solar"]').checked = true;
    
    // Firebase 인증 상태 체크 후 사주 프로필 로드
    setTimeout(async () => {
        try {
            const currentUser = window.firebaseAuth?.getCurrentUser();
            if (currentUser) {
                await loadSajuProfileIfExists();
            }
        } catch (error) {
            console.error('사주 프로필 로드 실패:', error);
        }
        
        // 로컬 저장된 번호가 있으면 버튼 표시
        const savedNumbers = JSON.parse(localStorage.getItem('sajuLottoNumbers') || '[]');
        if (savedNumbers.length > 0) {
            const viewSavedBtn = document.createElement('button');
            viewSavedBtn.className = 'view-saved-btn';
            viewSavedBtn.textContent = '저장된 번호 보기 (로컬)';
            viewSavedBtn.onclick = showSavedNumbers;
            
            const actionButtons = document.querySelector('.action-buttons');
            if (actionButtons && !document.querySelector('.view-saved-btn')) {
                actionButtons.appendChild(viewSavedBtn);
            }
        }
    }, 1000);
    
    console.log('사주 로또 번호 생성기가 준비되었습니다.');
});

// 저장된 사주 프로필이 있으면 폼에 자동 입력
async function loadSajuProfileIfExists() {
    try {
        const sajuProfile = await window.firebaseAuth.getSajuProfile();
        if (sajuProfile) {
            // 생년월일 설정
            if (sajuProfile.birthDate) {
                const dateInput = document.getElementById('birth-date');
                const dateParts = sajuProfile.birthDate.split('.');
                if (dateParts.length === 3) {
                    const year = dateParts[0].trim();
                    const month = dateParts[1].trim().padStart(2, '0');
                    const day = dateParts[2].trim().padStart(2, '0');
                    dateInput.value = `${year}-${month}-${day}`;
                }
            }
            
            // 성별 설정
            if (sajuProfile.gender) {
                const genderValue = sajuProfile.gender === '남성' ? 'male' : 'female';
                const genderInput = document.querySelector(`input[name="gender"][value="${genderValue}"]`);
                if (genderInput) {
                    genderInput.checked = true;
                }
            }
            
            // 달력 타입 설정
            if (sajuProfile.calendarType) {
                const calendarValue = sajuProfile.calendarType === '양력' ? 'solar' : 'lunar';
                const calendarInput = document.querySelector(`input[name="calendar-type"][value="${calendarValue}"]`);
                if (calendarInput) {
                    calendarInput.checked = true;
                }
            }
            
            console.log('사주 프로필 자동 로드 완료');
            showSuccessMessage('저장된 사주 정보를 불러왔습니다!');
        }
    } catch (error) {
        console.error('사주 프로필 로드 오류:', error);
    }
}

// =================================
// 고급 사주명리학 기능들
// =================================

// 운세 대시보드 초기화
async function initializeFortuneDashboard() {
    const user = window.firebaseAuth?.getCurrentUser();
    if (!user) return;
    
    try {
        const sajuProfile = await window.firebaseAuth.getSajuProfile();
        if (!sajuProfile) return;
        
        // 사주 기반으로 종합 운세 계산
        const formData = {
            birthDate: new Date(sajuProfile.birthDate.replace(/\./g, '-')),
            calendarType: sajuProfile.calendarType === '양력' ? 'solar' : 'lunar',
            birthTime: parseInt(sajuProfile.birthTime) || 23,
            gender: sajuProfile.gender === '남성' ? 'male' : 'female'
        };
        
        const sajuResult = calculateSaju(formData);
        currentFortune = calculateComprehensiveFortune(sajuResult);
        currentSajuData = sajuResult;
        
        // 대시보드 표시 및 업데이트
        showFortuneDashboard();
        updateFortuneDashboard();
        
        // 운세 패턴 저장 (매일 한 번)
        const today = new Date().toISOString().split('T')[0];
        const lastSaved = localStorage.getItem('lastFortuneSaved');
        
        if (lastSaved !== today) {
            await saveUserFortunePattern(currentFortune, currentFortune.overallFortune.recommendation);
            localStorage.setItem('lastFortuneSaved', today);
        }
        
    } catch (error) {
        console.error('운세 대시보드 초기화 실패:', error);
    }
}

// 운세 대시보드 표시
function showFortuneDashboard() {
    const dashboard = document.getElementById('fortune-dashboard');
    const inputSection = document.querySelector('.input-section');
    
    if (dashboard && inputSection) {
        dashboard.style.display = 'block';
        inputSection.style.order = '2'; // 대시보드 다음에 배치
        
        // 스크롤로 이동
        dashboard.scrollIntoView({ behavior: 'smooth' });
    }
}

// 운세 대시보드 업데이트
function updateFortuneDashboard() {
    if (!currentFortune || !currentSajuData) return;
    
    // 날짜 업데이트
    updateTodayDate();
    
    // 종합 운세 점수 및 레벨 업데이트
    updateFortuneScore();
    
    // 절기 정보 업데이트
    updateSolarTermInfo();
    
    // 대운/세운/월운/일운 정보 업데이트
    updateLuckInfo();
    
    // 오행 에너지 시각화 업데이트
    updateElementEnergy();
    
    // 운세 기반 번호 생성 및 표시
    updateFortuneNumbers();
    
    // 추천사항 업데이트
    updateFortuneRecommendations();
}

// 오늘 날짜 업데이트
function updateTodayDate() {
    const todayElement = document.getElementById('today-date');
    if (todayElement) {
        const today = new Date();
        todayElement.textContent = today.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }
}

// 운세 점수 및 레벨 업데이트
function updateFortuneScore() {
    const scoreElement = document.getElementById('fortune-score');
    const levelElement = document.getElementById('fortune-level');
    const descriptionElement = document.getElementById('fortune-description');
    
    if (scoreElement && levelElement && descriptionElement) {
        const fortune = currentFortune.overallFortune;
        
        scoreElement.textContent = fortune.score;
        levelElement.textContent = fortune.level.level;
        levelElement.style.backgroundColor = fortune.level.color;
        descriptionElement.textContent = fortune.level.description;
        
        // 점수에 따른 애니메이션 효과
        animateScoreNumber(scoreElement, fortune.score);
    }
}

// 점수 애니메이션
function animateScoreNumber(element, targetScore) {
    const currentScore = parseInt(element.textContent) || 0;
    const increment = Math.ceil((targetScore - currentScore) / 20);
    
    const animate = () => {
        const current = parseInt(element.textContent);
        if (current < targetScore) {
            element.textContent = Math.min(current + increment, targetScore);
            requestAnimationFrame(animate);
        }
    };
    
    animate();
}

// 절기 정보 업데이트
function updateSolarTermInfo() {
    const currentTermElement = document.getElementById('current-solar-term');
    const daysToNextElement = document.getElementById('days-to-next-term');
    
    if (currentTermElement && daysToNextElement && currentFortune.solarTerm) {
        const solarTerm = currentFortune.solarTerm;
        
        currentTermElement.textContent = solarTerm.current ? solarTerm.current.name : '미정';
        daysToNextElement.textContent = solarTerm.next ? 
            `${solarTerm.daysToNext}일 후 ${solarTerm.next.name}` : '미정';
    }
}

// 대운/세운/월운/일운 정보 업데이트
function updateLuckInfo() {
    const fortune = currentFortune;
    
    // 대운 정보
    const greatLuckPillar = document.getElementById('great-luck-pillar');
    const greatLuckPeriod = document.getElementById('great-luck-period');
    const greatLuckInfluence = document.getElementById('great-luck-influence');
    
    if (greatLuckPillar && greatLuckPeriod && greatLuckInfluence) {
        if (fortune.greatLuck.currentPillar) {
            greatLuckPillar.textContent = 
                `${fortune.greatLuck.currentPillar.heavenlyStem.name}${fortune.greatLuck.currentPillar.earthlyBranch.name}`;
            greatLuckPeriod.textContent = 
                `${fortune.greatLuck.currentPillar.startAge}-${fortune.greatLuck.currentPillar.endAge}세`;
        }
        greatLuckInfluence.textContent = fortune.overallFortune.influences[0] || '안정적인 시기입니다.';
    }
    
    // 세운 정보
    const yearlyLuckPillar = document.getElementById('yearly-luck-pillar');
    const yearlyLuckYear = document.getElementById('yearly-luck-year');
    const yearlyLuckInfluence = document.getElementById('yearly-luck-influence');
    
    if (yearlyLuckPillar && yearlyLuckYear && yearlyLuckInfluence) {
        yearlyLuckPillar.textContent = 
            `${fortune.yearlyLuck.heavenlyStem.name}${fortune.yearlyLuck.earthlyBranch.name}`;
        yearlyLuckYear.textContent = `${fortune.yearlyLuck.year}년`;
        yearlyLuckInfluence.textContent = fortune.overallFortune.influences[1] || '꾸준한 노력이 중요한 해입니다.';
    }
    
    // 월운 정보
    const monthlyLuckPillar = document.getElementById('monthly-luck-pillar');
    const monthlyLuckMonth = document.getElementById('monthly-luck-month');
    const monthlyLuckInfluence = document.getElementById('monthly-luck-influence');
    
    if (monthlyLuckPillar && monthlyLuckMonth && monthlyLuckInfluence) {
        monthlyLuckPillar.textContent = 
            `${fortune.monthlyLuck.heavenlyStem.name}${fortune.monthlyLuck.earthlyBranch.name}`;
        monthlyLuckMonth.textContent = `${fortune.monthlyLuck.month}월`;
        monthlyLuckInfluence.textContent = fortune.overallFortune.influences[2] || '차분하게 계획을 세우는 달입니다.';
    }
    
    // 일운 정보
    const dailyLuckPillar = document.getElementById('daily-luck-pillar');
    const dailyLuckToday = document.getElementById('daily-luck-today');
    const dailyLuckInfluence = document.getElementById('daily-luck-influence');
    
    if (dailyLuckPillar && dailyLuckToday && dailyLuckInfluence) {
        dailyLuckPillar.textContent = 
            `${fortune.dailyLuck.heavenlyStem.name}${fortune.dailyLuck.earthlyBranch.name}`;
        dailyLuckToday.textContent = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
        dailyLuckInfluence.textContent = fortune.overallFortune.influences[3] || '긍정적인 마음가짐이 중요한 하루입니다.';
    }
}

// 오행 에너지 시각화 업데이트
function updateElementEnergy() {
    if (!currentSajuData || !currentSajuData.elementAnalysis) return;
    
    const elements = currentSajuData.elementAnalysis.total;
    const maxValue = Math.max(...Object.values(elements));
    
    Object.entries(elements).forEach(([element, value]) => {
        const energyFill = document.getElementById(`${element}-energy`);
        const energyValue = document.getElementById(`${element}-value`);
        
        if (energyFill && energyValue) {
            const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
            
            // 애니메이션과 함께 업데이트
            setTimeout(() => {
                energyFill.style.width = `${percentage}%`;
                energyValue.textContent = `${percentage}%`;
            }, 300);
        }
    });
}

// 운세 기반 번호 업데이트
function updateFortuneNumbers() {
    if (!currentSajuData) return;
    
    // 운세 기반 번호 생성
    const fortuneNumbers = generateFortuneBasedNumbers(currentSajuData);
    const timeNumbers = generateTimeBasedNumbers(currentSajuData);
    
    // 운세 기반 번호 표시
    updateFortuneBasedNumbers(fortuneNumbers);
    
    // 시간 기반 번호 표시
    updateTimeBasedNumbers(timeNumbers);
}

function updateFortuneBasedNumbers(fortuneNumbers) {
    const container = document.getElementById('fortune-based-numbers');
    const confidenceElement = document.getElementById('fortune-confidence');
    
    if (container && fortuneNumbers) {
        container.innerHTML = fortuneNumbers.numbers.map(number => 
            `<div class="fortune-number-ball">${number}</div>`
        ).join('');
        
        if (confidenceElement) {
            confidenceElement.textContent = `${fortuneNumbers.confidence}%`;
        }
    }
}

function updateTimeBasedNumbers(timeNumbers) {
    const container = document.getElementById('time-based-numbers');
    const timeElement = document.getElementById('current-time-element');
    
    if (container && timeNumbers) {
        container.innerHTML = timeNumbers.map(number => 
            `<div class="time-number-ball">${number}</div>`
        ).join('');
        
        if (timeElement) {
            const hour = new Date().getHours();
            const timeElementType = getTimeElement(hour);
            timeElement.textContent = `${hour}시 (${getElementKoreanName(timeElementType)})`;
        }
    }
}

// 운세 추천사항 업데이트
function updateFortuneRecommendations() {
    if (!currentFortune) return;
    
    const recommendationElement = document.getElementById('fortune-recommendation');
    const favorableDirectionElement = document.getElementById('favorable-direction');
    const luckyColorsElement = document.getElementById('lucky-colors');
    const cautionAdviceElement = document.getElementById('caution-advice');
    
    if (recommendationElement) {
        recommendationElement.textContent = currentFortune.overallFortune.recommendation;
    }
    
    if (favorableDirectionElement && currentSajuData) {
        const direction = getFavorableDirectionToday(currentSajuData, currentFortune);
        favorableDirectionElement.textContent = getDirectionName(direction);
    }
    
    if (luckyColorsElement && currentSajuData) {
        const colors = getLuckyColors(currentSajuData.yongSin.primary);
        luckyColorsElement.textContent = colors.join(', ');
    }
    
    if (cautionAdviceElement) {
        const score = currentFortune.overallFortune.score;
        if (score < 30) {
            cautionAdviceElement.textContent = '중요한 결정은 미루고 신중하게 행동하세요';
        } else if (score < 50) {
            cautionAdviceElement.textContent = '평상심을 유지하며 꾸준히 노력하세요';
        } else {
            cautionAdviceElement.textContent = '좋은 기회를 놓치지 말고 적극적으로 행동하세요';
        }
    }
}

// 대시보드 새로고침
async function refreshFortuneDashboard() {
    showLoading();
    
    try {
        // 캐시 초기화
        currentFortune = null;
        
        // 대시보드 재초기화
        await initializeFortuneDashboard();
        
        showSuccessMessage('운세 정보가 새로고침되었습니다!');
    } catch (error) {
        console.error('운세 대시보드 새로고침 실패:', error);
        alert('운세 새로고침 중 오류가 발생했습니다.');
    } finally {
        hideLoading();
    }
}

// 운세 번호 생성
async function generateFortuneNumbers() {
    if (!currentSajuData) {
        alert('먼저 사주 정보를 입력해주세요.');
        return;
    }
    
    try {
        showLoading();
        
        const fortuneNumbers = generateFortuneBasedNumbers(currentSajuData);
        
        // 결과 섹션에 표시
        displayResults(currentSajuData, fortuneNumbers);
        showResults();
        
        // Firebase에 저장 (선택사항)
        const user = window.firebaseAuth?.getCurrentUser();
        if (user) {
            await window.firebaseAuth.saveFortuneNumberResult(fortuneNumbers, currentFortune);
        }
        
    } catch (error) {
        console.error('운세 번호 생성 실패:', error);
        alert('운세 번호 생성 중 오류가 발생했습니다.');
    } finally {
        hideLoading();
    }
}

// 상세 운세 보기
function showDetailedFortune() {
    const consultationSection = document.getElementById('saju-consultation');
    if (consultationSection) {
        consultationSection.style.display = 'block';
        initializeConsultationPage();
        consultationSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// =================================
// 운세 달력 기능들
// =================================

// 달력 초기화
function initializeFortuneCalendar() {
    const calendarSection = document.getElementById('fortune-calendar');
    if (calendarSection && currentSajuData) {
        calendarSection.style.display = 'block';
        generateCalendar(currentCalendarYear, currentCalendarMonth);
    }
}

// 달력 생성
function generateCalendar(year, month) {
    const calendarBody = document.getElementById('calendar-body');
    const yearMonthDisplay = document.getElementById('calendar-year-month');
    
    if (!calendarBody || !yearMonthDisplay) return;
    
    // 년월 표시 업데이트
    yearMonthDisplay.textContent = `${year}년 ${month + 1}월`;
    
    // 달력 날짜 생성
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    let calendarHTML = '';
    
    // 이전 달 마지막 날짜들
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const date = new Date(year, month - 1, day);
        const fortune = calculateDayFortune(date);
        
        calendarHTML += `
            <div class="calendar-day other-month" data-date="${date.toISOString().split('T')[0]}">
                <div class="day-number">${day}</div>
                <div class="fortune-indicator ${fortune.level}"></div>
            </div>
        `;
    }
    
    // 현재 달 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const fortune = calculateDayFortune(date);
        const isToday = isDateToday(date);
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" 
                 data-date="${date.toISOString().split('T')[0]}"
                 onclick="selectCalendarDate('${date.toISOString().split('T')[0]}')">
                <div class="day-number">${day}</div>
                <div class="fortune-indicator ${fortune.level}"></div>
            </div>
        `;
    }
    
    // 다음 달 첫 날짜들
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        const fortune = calculateDayFortune(date);
        
        calendarHTML += `
            <div class="calendar-day other-month" data-date="${date.toISOString().split('T')[0]}">
                <div class="day-number">${day}</div>
                <div class="fortune-indicator ${fortune.level}"></div>
            </div>
        `;
    }
    
    calendarBody.innerHTML = calendarHTML;
}

// 특정 날짜의 운세 계산
function calculateDayFortune(date) {
    if (!currentSajuData) {
        return { score: 50, level: 'normal' };
    }
    
    // 간단한 일운 계산
    const dayPillar = calculateDayPillar(date);
    const dayElement = dayPillar.heavenlyStem.element;
    const yongSinElement = currentSajuData.yongSin.primary;
    
    let score = 50; // 기본 점수
    
    // 용신과의 관계로 점수 조정
    if (dayElement === yongSinElement) {
        score += 30;
    } else if (ELEMENT_RELATIONS.generation[dayElement] === yongSinElement) {
        score += 20;
    } else if (ELEMENT_RELATIONS.generation[yongSinElement] === dayElement) {
        score += 15;
    } else if (dayElement === currentSajuData.yongSin.avoid) {
        score -= 20;
    }
    
    // 현재 대운과의 조화 고려
    if (currentFortune && currentFortune.greatLuck.currentPillar) {
        const greatLuckElement = currentFortune.greatLuck.currentPillar.heavenlyStem.element;
        if (dayElement === greatLuckElement) {
            score += 15;
        }
    }
    
    // 점수를 레벨로 변환
    let level = 'normal';
    if (score >= 80) level = 'excellent';
    else if (score >= 65) level = 'good';
    else if (score >= 35) level = 'normal';
    else if (score >= 20) level = 'caution';
    else level = 'bad';
    
    return { score, level };
}

// 오늘 날짜 확인
function isDateToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

// 달력 날짜 선택
function selectCalendarDate(dateString) {
    // 기존 선택 해제
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // 새 날짜 선택
    const selectedDay = document.querySelector(`[data-date="${dateString}"]`);
    if (selectedDay) {
        selectedDay.classList.add('selected');
        selectedDate = dateString;
        
        // 선택된 날짜 정보 표시
        showSelectedDateInfo(dateString);
    }
}

// 선택된 날짜 정보 표시
function showSelectedDateInfo(dateString) {
    const infoSection = document.getElementById('selected-date-info');
    const dateDisplay = document.getElementById('selected-date-display');
    const fortuneBadge = document.getElementById('date-fortune-badge');
    const fortuneDesc = document.getElementById('date-fortune-desc');
    const actionAdvice = document.getElementById('date-action-advice');
    const luckyTime = document.getElementById('date-lucky-time');
    const caution = document.getElementById('date-caution');
    const numbersContainer = document.getElementById('date-recommended-numbers');
    
    if (!infoSection) return;
    
    infoSection.style.display = 'block';
    
    const date = new Date(dateString);
    const fortune = calculateDayFortune(date);
    
    // 날짜 표시
    if (dateDisplay) {
        dateDisplay.textContent = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }
    
    // 운세 레벨 표시
    if (fortuneBadge && fortuneDesc) {
        const levelInfo = getFortuneLevel(fortune.score);
        fortuneBadge.textContent = levelInfo.level;
        fortuneBadge.className = `fortune-badge ${levelInfo.level}`;
        fortuneDesc.textContent = levelInfo.description;
    }
    
    // 추천사항 표시
    if (actionAdvice) {
        actionAdvice.textContent = getDateActionAdvice(fortune.score);
    }
    
    if (luckyTime) {
        luckyTime.textContent = getDateLuckyTime(date);
    }
    
    if (caution) {
        caution.textContent = getDateCaution(fortune.score);
    }
    
    // 추천 번호 표시
    if (numbersContainer && currentSajuData) {
        const dayNumbers = generateDateBasedNumbers(date, currentSajuData);
        numbersContainer.innerHTML = dayNumbers.map(num => 
            `<div class="date-number-ball">${num}</div>`
        ).join('');
    }
}

// 날짜별 행동 조언
function getDateActionAdvice(score) {
    if (score >= 80) return '새로운 프로젝트 시작, 중요한 결정';
    if (score >= 65) return '적극적인 활동, 사람들과의 만남';
    if (score >= 35) return '꾸준한 업무, 계획 점검';
    if (score >= 20) return '신중한 판단, 기존 일 정리';
    return '휴식과 재충전, 무리한 일정 피하기';
}

// 길한 시간 조언
function getDateLuckyTime(date) {
    const hour = (date.getDate() % 12) * 2 + 7; // 간단한 계산식
    const timeNames = {
        7: '진시 (07-09시)', 9: '사시 (09-11시)', 11: '오시 (11-13시)',
        13: '미시 (13-15시)', 15: '신시 (15-17시)', 17: '유시 (17-19시)',
        19: '술시 (19-21시)', 21: '해시 (21-23시)', 23: '자시 (23-01시)',
        1: '축시 (01-03시)', 3: '인시 (03-05시)', 5: '묘시 (05-07시)'
    };
    
    return timeNames[hour] || '오시 (11-13시)';
}

// 주의사항
function getDateCaution(score) {
    if (score >= 65) return '과도한 자신감 주의';
    if (score >= 35) return '현실적인 판단 필요';
    return '감정적인 결정 피하기';
}

// 날짜 기반 번호 생성
function generateDateBasedNumbers(date, sajuData) {
    const dayPillar = calculateDayPillar(date);
    const dayElement = dayPillar.heavenlyStem.element;
    const elementNumbers = ELEMENT_LOTTO_MAPPING[dayElement] || [];
    
    // 날짜 시드 생성
    const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear();
    const numbers = [];
    
    for (let i = 0; i < 6; i++) {
        if (elementNumbers.length > 0) {
            const index = (seed + i * 7) % elementNumbers.length;
            numbers.push(elementNumbers[index]);
        } else {
            numbers.push(((seed + i * 11) % 45) + 1);
        }
    }
    
    return [...new Set(numbers)].sort((a, b) => a - b).slice(0, 6);
}

// 달력 월 변경
function changeMonth(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    } else if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    
    generateCalendar(currentCalendarYear, currentCalendarMonth);
}

// =================================
// 상담 페이지 기능들
// =================================

// 상담 페이지 초기화
async function initializeConsultationPage() {
    if (!currentSajuData) {
        alert('먼저 사주 정보를 입력해주세요.');
        return;
    }
    
    // 사주팔자 표시 업데이트
    updateSajuPillarsDisplay();
    
    // 개인 분석 정보 로드
    try {
        const user = window.firebaseAuth?.getCurrentUser();
        if (user) {
            let analysisData = await window.firebaseAuth.loadPersonalAnalysis();
            
            if (!analysisData) {
                // 분석 데이터가 없으면 생성
                analysisData = generatePersonalAnalysis(currentSajuData);
                await window.firebaseAuth.savePersonalAnalysis(analysisData);
            }
            
            // 탭 컨텐츠 업데이트
            updateConsultationTabs(analysisData);
            
            // 맞춤 번호 전략 업데이트
            updatePersonalizedStrategies(analysisData);
        }
    } catch (error) {
        console.error('상담 페이지 초기화 실패:', error);
        // 기본 분석으로 대체
        const basicAnalysis = generatePersonalAnalysis(currentSajuData);
        updateConsultationTabs(basicAnalysis);
        updatePersonalizedStrategies(basicAnalysis);
    }
}

// 사주팔자 표시 업데이트
function updateSajuPillarsDisplay() {
    const pillars = [
        { id: 'year-pillar-detail', data: currentSajuData.yearPillar },
        { id: 'month-pillar-detail', data: currentSajuData.monthPillar },
        { id: 'day-pillar-detail', data: currentSajuData.dayPillar },
        { id: 'time-pillar-detail', data: currentSajuData.timePillar }
    ];
    
    pillars.forEach(pillar => {
        const element = document.getElementById(pillar.id);
        if (element && pillar.data) {
            const stemEl = element.querySelector('.pillar-stem');
            const branchEl = element.querySelector('.pillar-branch');
            
            if (stemEl) stemEl.textContent = pillar.data.heavenlyStem.name;
            if (branchEl) branchEl.textContent = pillar.data.earthlyBranch.name;
        }
    });
}

// 개인 분석 생성
function generatePersonalAnalysis(sajuData) {
    const dayElement = sajuData.dayPillar.heavenlyStem.element;
    const elementAnalysis = sajuData.elementAnalysis;
    const yongSin = sajuData.yongSin;
    
    return {
        personality: generatePersonalityAnalysis(dayElement, elementAnalysis),
        career: generateCareerAnalysis(dayElement, yongSin),
        wealth: generateWealthAnalysis(elementAnalysis, yongSin),
        relationship: generateRelationshipAnalysis(dayElement),
        health: generateHealthAnalysis(elementAnalysis),
        luckPattern: generateLuckPatternAnalysis(sajuData),
        coreStrategy: generateCoreStrategy(yongSin),
        cycleStrategy: generateCycleStrategy(sajuData),
        specialOpportunity: generateSpecialOpportunity(sajuData)
    };
}

// 각 분석 생성 함수들 (간단한 버전)
function generatePersonalityAnalysis(dayElement, elementAnalysis) {
    const traits = {
        wood: '창의적이고 성장 지향적인 성격입니다. 새로운 도전을 즐기며, 꾸준한 발전을 추구합니다.',
        fire: '열정적이고 활동적인 성격입니다. 사람들과의 교류를 즐기며, 밝은 에너지를 가지고 있습니다.',
        earth: '안정적이고 신뢰할 수 있는 성격입니다. 현실적인 판단력을 가지고 있으며, 인내심이 강합니다.',
        metal: '논리적이고 체계적인 성격입니다. 완벽주의적 성향이 있으며, 강한 의지력을 가지고 있습니다.',
        water: '유연하고 적응력이 뛰어난 성격입니다. 깊이 있는 사고를 하며, 지혜로운 판단력을 가지고 있습니다.'
    };
    
    return traits[dayElement] + ` 오행의 균형도는 ${(elementAnalysis.balance * 100).toFixed(0)}%로, 
             ${elementAnalysis.balance > 0.6 ? '조화로운 성격을 가지고 있습니다.' : '다양한 면모를 가진 복합적인 성격입니다.'}`;
}

function generateCareerAnalysis(dayElement, yongSin) {
    const careers = {
        wood: '교육, 예술, 환경, 성장산업 분야에서 두각을 나타낼 수 있습니다.',
        fire: '미디어, 엔터테인먼트, 서비스업, 영업 분야에서 성공할 가능성이 높습니다.',
        earth: '부동산, 건설, 농업, 금융 분야에서 안정적인 성과를 거둘 수 있습니다.',
        metal: '기술, 제조업, 법률, 의료 분야에서 전문성을 발휘할 수 있습니다.',
        water: '연구, 유통, 해운, IT 분야에서 창의적인 해결책을 제시할 수 있습니다.'
    };
    
    return careers[dayElement] + ` 용신인 ${getElementKoreanName(yongSin.primary)}과 관련된 분야를 
             중점적으로 고려하면 더욱 좋은 결과를 얻을 수 있습니다.`;
}

function generateWealthAnalysis(elementAnalysis, yongSin) {
    const strongest = elementAnalysis.strongest;
    const balance = elementAnalysis.balance;
    
    let analysis = '';
    if (balance > 0.7) {
        analysis = '오행의 균형이 좋아 안정적인 재물 운을 가지고 있습니다.';
    } else if (strongest === yongSin.primary) {
        analysis = '용신이 강해 적극적인 투자나 사업에서 성과를 볼 수 있습니다.';
    } else {
        analysis = '신중한 재정 관리가 필요하며, 장기적인 투자 전략이 유리합니다.';
    }
    
    return analysis + ` ${getElementKoreanName(yongSin.primary)}과 관련된 분야나 
             시기에 재물 운이 상승할 가능성이 높습니다.`;
}

function generateRelationshipAnalysis(dayElement) {
    const relationships = {
        wood: '포용력이 있어 많은 사람들에게 사랑받습니다. 장기적인 관계를 중시합니다.',
        fire: '사교적이고 활발하여 인맥이 넓습니다. 즉흥적인 만남을 즐깁니다.',
        earth: '신뢰할 수 있는 관계를 추구하며, 가족과 친구를 소중히 여깁니다.',
        metal: '선택적이지만 깊은 관계를 맺습니다. 원칙을 중시하는 교류를 선호합니다.',
        water: '직관적으로 사람을 파악하며, 깊이 있는 대화를 즐깁니다.'
    };
    
    return relationships[dayElement];
}

function generateHealthAnalysis(elementAnalysis) {
    const weakest = elementAnalysis.weakest;
    const healthAdvice = {
        wood: '간과 신경계 건강에 주의하세요. 규칙적인 운동과 스트레스 관리가 중요합니다.',
        fire: '심혈관계와 소화기계 건강을 챙기세요. 충분한 휴식과 규칙적인 생활이 필요합니다.',
        earth: '소화기계와 근육 건강에 신경 쓰세요. 균형 잡힌 식단과 적당한 운동이 도움됩니다.',
        metal: '호흡기계와 피부 건강을 관리하세요. 깨끗한 공기와 수분 섭취가 중요합니다.',
        water: '신장과 생식기계 건강에 유의하세요. 충분한 수분 섭취와 보온이 필요합니다.'
    };
    
    return `${getElementKoreanName(weakest)} 기운이 약해 ${healthAdvice[weakest]}`;
}

function generateLuckPatternAnalysis(sajuData) {
    const currentYear = new Date().getFullYear();
    const birthYear = sajuData.birthInfo.originalDate.getFullYear();
    const age = currentYear - birthYear + 1;
    
    const cycle = Math.floor(age / 10);
    const pattern = cycle % 3;
    
    const patterns = [
        '성장과 발전의 시기로, 새로운 기회들이 많이 찾아올 것입니다.',
        '안정화와 성숙의 시기로, 기존 기반을 다지는 것이 중요합니다.',
        '변화와 전환의 시기로, 새로운 방향을 모색해야 할 때입니다.'
    ];
    
    return `현재 ${age}세로 ${patterns[pattern]} 특히 ${age + 2}세경에 중요한 변화가 있을 것으로 예상됩니다.`;
}

function generateCoreStrategy(yongSin) {
    const strategies = {
        wood: [3, 8, 13, 18, 23, 28],
        fire: [2, 7, 12, 17, 22, 27],
        earth: [5, 10, 15, 20, 25, 30],
        metal: [4, 9, 14, 19, 24, 29],
        water: [1, 6, 11, 16, 21, 26]
    };
    
    return strategies[yongSin.primary] || [1, 2, 3, 4, 5, 6];
}

function generateCycleStrategy(sajuData) {
    const dayNumber = sajuData.dayPillar.heavenlyStem.number;
    const baseNumbers = [7, 14, 21, 28, 35, 42];
    
    return baseNumbers.map(num => ((num + dayNumber - 1) % 45) + 1).slice(0, 6);
}

function generateSpecialOpportunity(sajuData) {
    const monthNumber = sajuData.monthPillar.earthlyBranch.number;
    const specialNumbers = [9, 18, 27, 36, 45, 33];
    
    return specialNumbers.map(num => ((num + monthNumber - 1) % 45) + 1).slice(0, 6);
}

// 상담 탭 전환
function switchConsultationTab(tabName) {
    // 모든 탭과 컨텐츠 비활성화
    document.querySelectorAll('.consultation-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 선택된 탭과 컨텐츠 활성화
    document.querySelector(`[onclick="switchConsultationTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');
}

// 상담 탭 컨텐츠 업데이트
function updateConsultationTabs(analysisData) {
    const contentMap = {
        'personality-analysis': analysisData.personality,
        'career-analysis': analysisData.career,
        'wealth-analysis': analysisData.wealth,
        'relationship-analysis': analysisData.relationship,
        'health-analysis': analysisData.health,
        'luck-pattern-analysis': analysisData.luckPattern
    };
    
    Object.entries(contentMap).forEach(([id, content]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    });
}

// 개인화 번호 전략 업데이트
function updatePersonalizedStrategies(analysisData) {
    const strategies = [
        { id: 'core-strategy-numbers', numbers: analysisData.coreStrategy },
        { id: 'cycle-strategy-numbers', numbers: analysisData.cycleStrategy },
        { id: 'special-opportunity-numbers', numbers: analysisData.specialOpportunity }
    ];
    
    strategies.forEach(strategy => {
        const container = document.getElementById(strategy.id);
        if (container && strategy.numbers) {
            container.innerHTML = strategy.numbers.map(num => 
                `<div class="strategy-number-ball">${num}</div>`
            ).join('');
        }
    });
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 1000;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 페이지 로드 시 고급 기능 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 기존 초기화 코드 실행 후
    setTimeout(async () => {
        const user = window.firebaseAuth?.getCurrentUser();
        if (user) {
            // 운세 대시보드 초기화
            await initializeFortuneDashboard();
            
            // 달력 초기화
            initializeFortuneCalendar();
        }
    }, 2000); // Firebase 로드 대기
});