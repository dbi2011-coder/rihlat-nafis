// إدارة الأسئلة والإعدادات للمسؤول

let questions = JSON.parse(localStorage.getItem('questions')) || [];
let authorizedStudents = JSON.parse(localStorage.getItem('authorizedStudents')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    questionsCount: 10,
    loginType: 'open',
    attemptsCount: 1,
    resultsDisplay: 'show-answers'
};

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
        
        mediaGroup.style.display = type === 'multiple-with-media' ? 'block' : 'none';
        readingGroup.style.display = type === 'reading-comprehension' ? 'block' : 'none';
        
        updateOptionsContainer();
    });

    // تغيير عدد الخيارات
    document.getElementById('options-count').addEventListener('change', updateOptionsContainer);

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
    const questionType = document.getElementById('question-type').value;
    
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
    
    // إذا كان نوع السؤال استيعاب مقروء، إخفاء عدد الخيارات
    if (questionType === 'reading-comprehension') {
        document.querySelector('label[for="options-count"]').style.display = 'none';
        document.getElementById('options-count').style.display = 'none';
    } else {
        document.querySelector('label[for="options-count"]').style.display = 'block';
        document.getElementById('options-count').style.display = 'block';
    }
}

function addQuestion(e) {
    e.preventDefault();
    
    const questionText = document.getElementById('question-text').value;
    const questionType = document.getElementById('question-type').value;
    const optionsCount = parseInt(document.getElementById('options-count').value);
    const correctAnswer = document.querySelector('input[name="correct-answer"]:checked');
    
    if (!correctAnswer) {
        alert('يرجى اختيار الإجابة الصحيحة');
        return;
    }
    
    const options = [];
    for (let i = 1; i <= optionsCount; i++) {
        const optionInput = document.querySelector(`.option-input[data-option="${i}"]`);
        if (optionInput.value.trim() === '') {
            alert(`يرجى إدخال نص الخيار ${i}`);
            return;
        }
        options.push(optionInput.value);
    }
    
    const question = {
        id: Date.now(),
        text: questionText,
        type: questionType,
        options: options,
        correctAnswer: parseInt(correctAnswer.value),
        mediaUrl: questionType === 'multiple-with-media' ? document.getElementById('media-url').value : null,
        readingPassage: questionType === 'reading-comprehension' ? document.getElementById('reading-passage').value : null
    };
    
    questions.push(question);
    saveQuestions();
    loadQuestions();
    
    // إعادة تعيين النموذج
    document.getElementById('add-question-form').reset();
    document.getElementById('media-url-group').style.display = 'none';
    document.getElementById('reading-passage-group').style.display = 'none';
    updateOptionsContainer();
    
    alert('تم إضافة السؤال بنجاح');
}

function loadQuestions() {
    const container = document.getElementById('questions-list');
    container.innerHTML = '';
    
    if (questions.length === 0) {
        container.innerHTML = '<p>لا توجد أسئلة مضافة بعد</p>';
        return;
    }
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        questionDiv.innerHTML = `
            <h4>السؤال ${index + 1}</h4>
            <p><strong>النص:</strong> ${question.text}</p>
            <p><strong>النوع:</strong> ${getQuestionTypeText(question.type)}</p>
            ${question.readingPassage ? `<p><strong>قطعة الاستيعاب:</strong> ${question.readingPassage.substring(0, 100)}...</p>` : ''}
            ${question.mediaUrl ? `<p><strong>المرفق:</strong> ${question.mediaUrl}</p>` : ''}
            <p><strong>الخيارات:</strong></p>
            <ul>
                ${question.options.map((option, i) => `
                    <li class="${i + 1 === question.correctAnswer ? 'correct-answer' : ''}">
                        ${option} ${i + 1 === question.correctAnswer ? '✓' : ''}
                    </li>
                `).join('')}
            </ul>
            <button class="btn-danger btn-small" onclick="deleteQuestion(${question.id})">حذف</button>
        `;
        container.appendChild(questionDiv);
    });
}

function getQuestionTypeText(type) {
    const types = {
        'multiple': 'اختيار من متعدد',
        'multiple-with-media': 'اختيار من متعدد مع مرفق',
        'reading-comprehension': 'استيعاب المقروء'
    };
    return types[type] || type;
}

function deleteQuestion(id) {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        questions = questions.filter(q => q.id !== id);
        saveQuestions();
        loadQuestions();
    }
}

function saveQuestions() {
    localStorage.setItem('questions', JSON.stringify(questions));
}

function loadReports() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const tbody = document.querySelector('#students-report tbody');
    
    tbody.innerHTML = '';
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد بيانات للطلاب</td></tr>';
        document.getElementById('overall-percentage').textContent = '0%';
        return;
    }
    
    let totalPercentage = 0;
    
    students.forEach((student, index) => {
        totalPercentage += student.percentage;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="student-checkbox" data-index="${index}"></td>
            <td>${student.name}</td>
            <td>${student.percentage}%</td>
            <td>${student.timeTaken}</td>
            <td>${student.date}</td>
        `;
        tbody.appendChild(tr);
    });
    
    const overallPercentage = (totalPercentage / students.length).toFixed(1);
    document.getElementById('overall-percentage').textContent = `${overallPercentage}%`;
}

function showTopStudents() {
    const count = parseInt(document.getElementById('top-students-count').value);
    const students = JSON.parse(localStorage.getItem('students')) || [];
    
    const topStudents = students
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, count);
    
    const tbody = document.querySelector('#students-report tbody');
    tbody.innerHTML = '';
    
    topStudents.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="student-checkbox" data-index="${index}"></td>
            <td>${student.name}</td>
            <td>${student.percentage}%</td>
            <td>${student.timeTaken}</td>
            <td>${student.date}</td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleSelectAllStudents() {
    const selectAll = document.getElementById('select-all-students').checked;
    document.querySelectorAll('.student-checkbox').forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

function deleteSelectedStudents() {
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('يرجى اختيار طلاب للحذف');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف ${checkboxes.length} طالب؟`)) {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));
        
        const updatedStudents = students.filter((_, index) => !indicesToDelete.includes(index));
        localStorage.setItem('students', JSON.stringify(updatedStudents));
        
        loadReports();
        alert('تم حذف الطلاب المحددين بنجاح');
    }
}

function deleteAllStudents() {
    if (confirm('هل أنت متأكد من حذف جميع الطلاب ونتائجهم؟')) {
        localStorage.removeItem('students');
        loadReports();
        alert('تم حذف جميع الطلاب بنجاح');
    }
}

function printReport() {
    window.print();
}

function loadSettings() {
    document.getElementById('questions-count').value = settings.questionsCount;
    document.getElementById('login-type').value = settings.loginType;
    document.getElementById('attempts-count').value = settings.attemptsCount;
    document.getElementById('results-display').value = settings.resultsDisplay;
    
    // تحديث عرض العناصر بناءً على نوع الدخول
    const attemptsGroup = document.getElementById('attempts-count-group');
    const authorizedSection = document.getElementById('authorized-students-section');
    const isRestricted = settings.loginType === 'restricted';
    
    attemptsGroup.style.display = isRestricted ? 'block' : 'none';
    authorizedSection.style.display = isRestricted ? 'block' : 'none';
}

function saveSettings() {
    settings = {
        questionsCount: parseInt(document.getElementById('questions-count').value),
        loginType: document.getElementById('login-type').value,
        attemptsCount: parseInt(document.getElementById('attempts-count').value),
        resultsDisplay: document.getElementById('results-display').value
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('تم حفظ الإعدادات بنجاح');
}

function loadAuthorizedStudents() {
    const tbody = document.querySelector('#authorized-students-list tbody');
    tbody.innerHTML = '';
    
    authorizedStudents.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.usedAttempts || 0}</td>
            <td>
                <button class="btn-danger btn-small" onclick="deleteAuthorizedStudent(${index})">حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function addAuthorizedStudent() {
    const studentId = document.getElementById('student-id').value.trim();
    const studentName = document.getElementById('student-name').value.trim();
    
    if (!studentId || !studentName) {
        alert('يرجى إدخال جميع البيانات');
        return;
    }
    
    // التحقق من عدم تكرار رقم الهوية
    if (authorizedStudents.some(s => s.id === studentId)) {
        alert('رقم الهوية/الإقامة مسجل مسبقاً');
        return;
    }
    
    authorizedStudents.push({
        id: studentId,
        name: studentName,
        usedAttempts: 0
    });
    
    saveAuthorizedStudents();
    loadAuthorizedStudents();
    
    // إعادة تعيين الحقول
    document.getElementById('student-id').value = '';
    document.getElementById('student-name').value = '';
    
    alert('تم إضافة الطالب بنجاح');
}

function deleteAuthorizedStudent(index) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        authorizedStudents.splice(index, 1);
        saveAuthorizedStudents();
        loadAuthorizedStudents();
    }
}

function saveAuthorizedStudents() {
    localStorage.setItem('authorizedStudents', JSON.stringify(authorizedStudents));
}

function printAuthorizedStudents() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>قائمة الطلاب المصرح لهم</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f2f2f2; }
                h1 { text-align: center; }
            </style>
        </head>
        <body>
            <h1>قائمة الطلاب المصرح لهم بالدخول</h1>
            ${document.getElementById('authorized-students-list').outerHTML}
        </body>
        </html>
    `);
    printWindow.print();
}

// تحديث الحاوية عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    updateOptionsContainer();
});
