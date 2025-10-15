// إدارة الأسئلة والإعدادات للمسؤول

let questions = JSON.parse(localStorage.getItem('questions')) || [];
let authorizedStudents = JSON.parse(localStorage.getItem('authorizedStudents')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    questionsCount: 10,
    loginType: 'open',
    attemptsCount: 1,
    resultsDisplay: 'show-answers'
};

let readingQuestions = [];

function initAdmin() {
    loadQuestions();
    loadReports();
    loadSettings();
    loadAuthorizedStudents();
    setupEventListeners();
}

function setupEventListeners() {
    // تبديل التبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // تغيير نوع السؤال
    document.getElementById('question-type').addEventListener('change', function() {
        const type = this.value;
        const mediaGroup = document.getElementById('media-url-group');
        const readingGroup = document.getElementById('reading-passage-group');
        const readingQuestionsContainer = document.getElementById('reading-questions-container');
        const standardOptionsGroup = document.getElementById('standard-options-group');
        const correctAnswerGroup = document.getElementById('correct-answer-group');
        
        mediaGroup.style.display = type === 'multiple-with-media' ? 'block' : 'none';
        readingGroup.style.display = type === 'reading-comprehension' ? 'block' : 'none';
        readingQuestionsContainer.style.display = type === 'reading-comprehension' ? 'block' : 'none';
        standardOptionsGroup.style.display = type === 'reading-comprehension' ? 'none' : 'block';
        correctAnswerGroup.style.display = type === 'reading-comprehension' ? 'none' : 'block';
        
        if (type === 'reading-comprehension') {
            readingQuestions = [];
            loadReadingQuestions();
        } else {
            updateOptionsContainer();
        }
    });

    // تغيير عدد الخيارات
    document.getElementById('options-count').addEventListener('change', updateOptionsContainer);

    // إضافة سؤال استيعاب مقروء
    document.getElementById('add-reading-question').addEventListener('click', addReadingQuestion);

    // إضافة سؤال جديد
    document.getElementById('add-question-form').addEventListener('submit', addQuestion);

    // حفظ الإعدادات
    document.getElementById('save-settings').addEventListener('click', saveSettings);

    // تغيير نوع الدخول
    document.getElementById('login-type').addEventListener('change', function() {
        const attemptsGroup = document.getElementById('attempts-count-group');
        const authorizedSection = document.getElementById('authorized-students-section');
        const isRestricted = this.value === 'restricted';
        
        attemptsGroup.style.display = isRestricted ? 'block' : 'none';
        authorizedSection.style.display = isRestricted ? 'block' : 'none';
    });

    // إضافة طالب مصرح له
    document.getElementById('add-authorized-student').addEventListener('click', addAuthorizedStudent);

    // أحداث التقارير
    document.getElementById('show-top-students').addEventListener('click', showTopStudents);
    document.getElementById('delete-all-students').addEventListener('click', deleteAllStudents);
    document.getElementById('delete-selected-students').addEventListener('click', deleteSelectedStudents);
    document.getElementById('select-all-students').addEventListener('change', toggleSelectAllStudents);
    document.getElementById('print-report').addEventListener('click', printReport);
    document.getElementById('print-authorized-students').addEventListener('click', printAuthorizedStudents);
}

function switchTab(tabId) {
    // إخفاء جميع المحتويات
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // إلغاء تنشيط جميع الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار المحتوى المحدد
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

function updateOptionsContainer() {
    const optionsCount = parseInt(document.getElementById('options-count').value);
    const container = document.getElementById('options-container');
    const correctAnswerContainer = document.getElementById('correct-answer-container');
    
    container.innerHTML = '';
    correctAnswerContainer.innerHTML = '';
    
    for (let i = 1; i <= optionsCount; i++) {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'form-group';
        optionDiv.innerHTML = `
            <label>الخيار ${i}</label>
            <input type="text" class="option-input" data-option="${i}" placeholder="أدخل نص الخيار ${i}" required>
        `;
        container.appendChild(optionDiv);
        
        const radioDiv = document.createElement('div');
        radioDiv.className = 'option-item';
        radioDiv.innerHTML = `
            <input type="radio" name="correct-answer" id="correct-${i}" value="${i}" required>
            <label for="correct-${i}">الخيار ${i}</label>
        `;
        correctAnswerContainer.appendChild(radioDiv);
    }
}

function addReadingQuestion() {
    const questionId = Date.now();
    const questionDiv = document.createElement('div');
    questionDiv.className = 'reading-question-container';
    questionDiv.setAttribute('data-id', questionId);
    questionDiv.innerHTML = `
        <div class="reading-question-header">
            <h4>سؤال جديد</h4>
            <button type="button" class="btn-danger btn-small" onclick="removeReadingQuestion(${questionId})">حذف</button>
        </div>
        <div class="form-group">
            <label>نص السؤال</label>
            <textarea class="reading-question-text" placeholder="أدخل نص السؤال..." required></textarea>
        </div>
        <div class="form-group">
            <label>عدد الخيارات</label>
            <select class="reading-options-count">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4" selected>4</option>
                <option value="5">5</option>
                <option value="6">6</option>
            </select>
        </div>
        <div class="reading-options-container"></div>
        <div class="form-group">
            <label>الإجابة الصحيحة</label>
            <div class="reading-correct-answer-container"></div>
        </div>
        <hr>
    `;
    
    document.getElementById('reading-questions-list').appendChild(questionDiv);
    
    // تحديث الخيارات لهذا السؤال
    const optionsCountSelect = questionDiv.querySelector('.reading-options-count');
    optionsCountSelect.addEventListener('change', function() {
        updateReadingQuestionOptions(questionId);
    });
    
    updateReadingQuestionOptions(questionId);
}

function updateReadingQuestionOptions(questionId) {
    const questionDiv = document.querySelector(`.reading-question-container[data-id="${questionId}"]`);
    const optionsCount = parseInt(questionDiv.querySelector('.reading-options-count').value);
    const optionsContainer = questionDiv.querySelector('.reading-options-container');
    const correctAnswerContainer = questionDiv.querySelector('.reading-correct-answer-container');
    
    optionsContainer.innerHTML = '';
    correctAnswerContainer.innerHTML = '';
    
    for (let i = 1; i <= optionsCount; i++) {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'form-group';
        optionDiv.innerHTML = `
            <label>الخيار ${i}</label>
            <input type="text" class="reading-option-input" data-option="${i}" placeholder="أدخل نص الخيار ${i}" required>
        `;
        optionsContainer.appendChild(optionDiv);
        
       
