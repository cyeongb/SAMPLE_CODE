// DOM 요소
const fetchBtn = document.getElementById('fetchBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const jsonUrlInput = document.getElementById('jsonUrl');

// 버튼 클릭 이벤트 핸들러
fetchBtn.addEventListener('click', fetchData);

// async/await를 사용하여 JSON 데이터 가져오기
async function fetchData() {
    // URL 가져오기
    const url = jsonUrlInput.value.trim();
    if (!url) {
        showError("URL을 입력해주세요.");
        return;
    }
    
    // 로딩 표시
    loading.style.display = 'block';
    result.innerHTML = '';
    
    try {
        // fetch API를 사용하여 데이터 가져오기
        const response = await fetch(url);
        
        // 응답 확인
        if (!response.ok) {
            throw new Error(`HTTP 오류! 상태: ${response.status}`);
        }
        
        // JSON 데이터로 변환
        const data = await response.json();
        
        // 데이터 표시
        displayData(data);
    } catch (error) {
        showError(`데이터를 가져오는 중 오류 발생: ${error.message}`);
    } finally {
        // 로딩 표시 제거
        loading.style.display = 'none';
    }
}

// 데이터 화면에 표시하기
function displayData(data) {
    if (Array.isArray(data)) {
        // 배열 데이터 처리
        const html = data.map((item, index) => {
            return `
                <div class="user-item">
                    <h3>항목 ${index + 1}</h3>
                    <pre>${JSON.stringify(item, null, 2)}</pre>
                </div>
            `;
        }).join('');
        
        result.innerHTML = html;
    } else {
        // 객체 데이터 처리
        result.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
}

// 오류 메시지 표시
function showError(message) {
    result.innerHTML = `<div class="error">${message}</div>`;
    loading.style.display = 'none';
}