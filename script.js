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