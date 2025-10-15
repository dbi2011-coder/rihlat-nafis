// إدارة واجهة المسؤول
let questions = [];

function initAdmin() {
    loadQuestions();
    loadReports();
    initTabs();
    initQuestionForm();
    loadSettings();
    
    document.getElementById('delete-all-students').addEventListener('click', deleteAllStudents);
    document.getElementById('delete-selected-students').addEventListener('click', deleteSelectedStudents);
    document.getElementById('select-all-students').addEventListener('change', toggleSelectAllStudents);
    document.getElementById('login-type').addEventListener('change', toggleLoginTypeSettings);
    document.getElementById('add-authorized-student').addEventListener('click', addAuthorizedStudent);
    document.getElementById('print-authorized-students').addEventListener('click', printAuthorizedStudents);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function initQuestionForm() {
    const questionType = document.getElementById('question-type');
    const optionsCount = document.getElementById('options-count');
    
    questionType.addEventListener('change', function() {
        const mediaUrlGroup = document.getElementById('media-url-group');
        if (this.value === 'multiple-with-media') {
            mediaUrlGroup.style.display = 'block';
        } else {
            mediaUrlGroup.style.display = 'none';
        }
    });
    
    optionsCount.addEventListener('change', generateOptions);
    generateOptions();
    
    document.getElementById('add-question-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addQuestion();
    });
}

function generateOptions() {
    const optionsCount = parseInt(document.getElementById('options-count').value);
    const optionsContainer = document.getElementById('options-container');
    const correctAnswerContainer = document.getElementById('correct-answer-container');
    
    optionsContainer.innerHTML = '';
    correctAnswerContainer.innerHTML = '';
    
    for (let i = 0; i < optionsCount; i++) {
        const optionGroup = document.createElement('div');
        optionGroup.className = 'form-group';
        optionGroup.innerHTML = `<label for="option-${i}">الخيار ${i + 1}</label><input type="text" id="option-${i}" required>`;
        optionsContainer.appendChild(optionGroup);
    }
    
    const correctAnswerLabel = document.createElement('label');
    correctAnswerLabel.textContent = 'اختر الإجابة الصحيحة';
    correctAnswerContainer.appendChild(correctAnswerLabel);
    
    for (let i = 0; i < optionsCount; i++) {
        const radioGroup = document.createElement('div');
        radioGroup.className = 'option-item';
        radioGroup.innerHTML = `<input type="radio" id="correct-${i}" name="correct-answer" value="${i}" required><label for="correct-${i}">الخيار ${i + 1}</label>`;
        correctAnswerContainer.appendChild(radioGroup);
    }
}

function addQuestion() {
    const questionText = document.getElementById('question-text').value;
    const questionType = document.getElementById('question-type').value;
    const optionsCount = parseInt(document.getElementById('options-count').value);
    const mediaUrl = document.getElementById('media-url').value;
    
    const options = [];
    for (let i = 0; i < optionsCount; i++) {
        const optionValue = document.getElementById(`option-${i}`).value;
        if (optionValue.trim()) {
            options.push(optionValue);
        }
    }
    
    const correctAnswer = parseInt(document.querySelector('input[name="correct-answer"]:checked').value);
    
    const question = {
        id: Date.now(),
        text: questionText,
        type: questionType,
        options: options,
        correctAnswer: correctAnswer,
        mediaUrl: mediaUrl || null
    };
    
    questions.push(question);
    saveQuestions();
    document.getElementById('add-question-form').reset();
    document.getElementById('media-url-group').style.display = 'none';
    generateOptions();
    loadQuestions();
    alert('تم إضافة السؤال بنجاح');
}

function loadQuestions() {
    questions = getQuestions();
    const questionsList = document.getElementById('questions-list');
    
    if (questions.length === 0) {
        questionsList.innerHTML = '<p>لا توجد أسئلة مضافة بعد.</p>';
        return;
    }
    
    questionsList.innerHTML = '';
    questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question-container';
        questionElement.innerHTML = `
            <h3>السؤال ${index + 1}</h3>
            <p>${question.text}</p>
            ${question.mediaUrl ? `<div class="media-attachment">${isYouTubeUrl(question.mediaUrl) ? 
                `<iframe src="${getYouTubeEmbedUrl(question.mediaUrl)}" frameborder="0" allowfullscreen></iframe>` : 
                `<img src="${question.mediaUrl}" alt="مرفق السؤال">`}</div>` : ''}
            <div class="options-container">
                ${question.options.map((option, i) => `
                    <div class="option-item">
                        <input type="radio" ${i === question.correctAnswer ? 'checked' : ''} disabled>
                        <label>${option}</label>
                    </div>
                `).join('')}
            </div>
            <button class="btn-danger" onclick="deleteQuestion(${question.id})">حذف السؤال</button>
        `;
        questionsList.appendChild(questionElement);
    });
}

function deleteQuestion(questionId) {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        questions = questions.filter(q => q.id !== questionId);
        saveQuestions();
        loadQuestions();
    }
}

function saveQuestions() {
    localStorage.setItem('questions', JSON.stringify(questions));
}

function getQuestions() {
    return JSON.parse(localStorage.getItem('questions') || '[]');
}

function loadReports() {
    const studentsResults = getStudentsResults();
    const tbody = document.getElementById('students-report').querySelector('tbody');
    tbody.innerHTML = '';
    
    if (studentsResults.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد نتائج للطلاب بعد.</td></tr>';
        updateOverallPercentage();
        return;
    }
    
    studentsResults.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" data-index="${index}"></td>
            <td>${student.name}</td>
            <td>${student.percentage}%</td>
            <td>${student.timeTaken}</td>
            <td>${student.date}</td>
        `;
        tbody.appendChild(row);
    });
    updateOverallPercentage();
}

function updateOverallPercentage() {
    const studentsResults = getStudentsResults();
    const overallPercentage = document.getElementById('overall-percentage');
    
    if (studentsResults.length === 0) {
        overallPercentage.textContent = '0%';
        return;
    }
    
    const totalPercentage = studentsResults.reduce((sum, student) => sum + student.percentage, 0);
    const averagePercentage = Math.round(totalPercentage / studentsResults.length);
    overallPercentage.textContent = `${averagePercentage}%`;
}

function getStudentsResults() {
    return JSON.parse(localStorage.getItem('studentsResults') || '[]');
}

function loadSettings() {
    const settings = getSettings();
    document.getElementById('questions-count').value = settings.questionsCount || 10;
    document.getElementById('login-type').value = settings.loginType || 'open';
    document.getElementById('attempts-count').value = settings.attemptsCount || 1;
    document.getElementById('results-display').value = settings.resultsDisplay || 'hide-answers';
    toggleLoginTypeSettings();
    loadAuthorizedStudents();
}

function toggleLoginTypeSettings() {
    const loginType = document.getElementById('login-type').value;
    const attemptsCountGroup = document.getElementById('attempts-count-group');
    const authorizedStudentsSection = document.getElementById('authorized-students-section');
    
    if (loginType === 'restricted') {
        attemptsCountGroup.style.display = 'block';
        authorizedStudentsSection.style.display = 'block';
    } else {
        attemptsCountGroup.style.display = 'none';
        authorizedStudentsSection.style.display = 'none';
    }
}

function saveSettings() {
    const settings = {
        questionsCount: parseInt(document.getElementById('questions-count').value),
        loginType: document.getElementById('login-type').value,
        resultsDisplay: document.getElementById('results-display').value
    };
    
    if (settings.loginType === 'restricted') {
        settings.attemptsCount = parseInt(document.getElementById('attempts-count').value);
    }
    
    localStorage.setItem('testSettings', JSON.stringify(settings));
    alert('تم حفظ الإعدادات بنجاح');
    loadAuthorizedStudents();
}

function loadAuthorizedStudents() {
    const authorizedStudents = getAuthorizedStudents();
    const settings = getSettings();
    const maxAttempts = settings.attemptsCount || 1;
    const tbody = document.getElementById('authorized-students-list').querySelector('tbody');
    tbody.innerHTML = '';
    
    if (authorizedStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا توجد طلاب مضافة إلى القائمة.</td></tr>';
        return;
    }
    
    authorizedStudents.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.attemptsUsed || 0} / ${maxAttempts}</td>
            <td>
                <button class="btn-danger btn-small" onclick="removeAuthorizedStudent(${index})">حذف</button>
                <button class="btn-warning btn-small" onclick="resetStudentAttempts(${index})">إعادة تعيين المحاولات</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addAuthorizedStudent() {
    const studentId = document.getElementById('student-id').value.trim();
    const studentName = document.getElementById('student-name').value.trim();
    
    if (!studentId || !studentName) {
        alert('يرجى إدخال رقم الهوية واسم الطالب');
        return;
    }
    
    const authorizedStudents = getAuthorizedStudents();
    if (authorizedStudents.some(student => student.id === studentId)) {
        alert('رقم الهوية/الإقامة مسجل مسبقاً');
        return;
    }
    
    authorizedStudents.push({ id: studentId, name: studentName, attemptsUsed: 0 });
    localStorage.setItem('authorizedStudents', JSON.stringify(authorizedStudents));
    document.getElementById('student-id').value = '';
    document.getElementById('student-name').value = '';
    loadAuthorizedStudents();
    alert('تم إضافة الطالب بنجاح');
}

function removeAuthorizedStudent(index) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        const authorizedStudents = getAuthorizedStudents();
        authorizedStudents.splice(index, 1);
        localStorage.setItem('authorizedStudents', JSON.stringify(authorizedStudents));
        loadAuthorizedStudents();
    }
}

function resetStudentAttempts(index) {
    if (confirm('هل أنت متأكد من إعادة تعيين عدد المحاولات لهذا الطالب؟')) {
        const authorizedStudents = getAuthorizedStudents();
        authorizedStudents[index].attemptsUsed = 0;
        localStorage.setItem('authorizedStudents', JSON.stringify(authorizedStudents));
        loadAuthorizedStudents();
        alert('تم إعادة تعيين المحاولات بنجاح');
    }
}

function getAuthorizedStudents() {
    return JSON.parse(localStorage.getItem('authorizedStudents') || '[]');
}

function printAuthorizedStudents() {
    const authorizedStudents = getAuthorizedStudents();
    const settings = getSettings();
    const maxAttempts = settings.attemptsCount || 1;
    
    let printContent = `
        <html><head><title>قائمة الطلاب المصرح لهم بالدخول</title>
        <style>body{font-family:Arial,sans-serif;direction:rtl}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;border:1px solid #ddd;text-align:right}th{background-color:#f2f2f2}h1{text-align:center}.info{margin-bottom:20px}</style>
        </head><body>
        <h1>قائمة الطلاب المصرح لهم بالدخول</h1>
        <div class="info">
            <p><strong>نوع الدخول:</strong> محدود (يتطلب رقم هوية/إقامة)</p>
            <p><strong>عدد المحاولات المسموحة:</strong> ${maxAttempts}</p>
            <p><strong>عدد الطلاب:</strong> ${authorizedStudents.length}</p>
        </div>
        <table><thead><tr><th>رقم الهوية/الإقامة</th><th>اسم الطالب</th><th>عدد المحاولات المستخدمة</th><th>المحاولات المتبقية</th></tr></thead><tbody>
    `;
    
    authorizedStudents.forEach(student => {
        const remainingAttempts = maxAttempts - (student.attemptsUsed || 0);
        printContent += `<tr><td>${student.id}</td><td>${student.name}</td><td>${student.attemptsUsed || 0}</td><td>${remainingAttempts}</td></tr>`;
    });
    
    printContent += `</tbody></table><p style="margin-top:20px;text-align:left">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p></body></html>`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

function deleteAllStudents() {
    if (confirm('هل أنت متأكد من حذف جميع الطلاب ونتائجهم؟ لا يمكن التراجع عن هذا الإجراء.')) {
        localStorage.removeItem('studentsResults');
        alert('تم حذف جميع الطلاب ونتائجهم بنجاح');
        loadReports();
    }
}

function deleteSelectedStudents() {
    const checkboxes = document.querySelectorAll('#students-report tbody input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        alert('يرجى تحديد طلاب للحذف');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف ${checkboxes.length} طالب؟`)) {
        const studentsResults = getStudentsResults();
        const studentIndices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));
        const updatedResults = studentsResults.filter((student, index) => !studentIndices.includes(index));
        localStorage.setItem('studentsResults', JSON.stringify(updatedResults));
        alert('تم حذف الطلاب المحددين بنجاح');
        loadReports();
    }
}

function toggleSelectAllStudents() {
    const selectAll = document.getElementById('select-all-students').checked;
    const checkboxes = document.querySelectorAll('#students-report tbody input[type="checkbox"]');
    checkboxes.forEach(checkbox => { checkbox.checked = selectAll; });
}

function getSettings() {
    return JSON.parse(localStorage.getItem('testSettings') || '{}');
}

document.getElementById('show-top-students').addEventListener('click', function() {
    const count = parseInt(document.getElementById('top-students-count').value);
    showTopStudents(count);
});

function showTopStudents(count) {
    const studentsResults = getStudentsResults();
    if (studentsResults.length === 0) {
        alert('لا توجد نتائج للطلاب بعد.');
        return;
    }
    
    const topStudents = [...studentsResults].sort((a, b) => b.percentage - a.percentage).slice(0, count);
    let message = `أفضل ${count} طلاب أداءً:\n\n`;
    topStudents.forEach((student, index) => { message += `${index + 1}. ${student.name} - ${student.percentage}%\n`; });
    alert(message);
}

document.getElementById('print-report').addEventListener('click', function() {
    const studentsResults = getStudentsResults();
    if (studentsResults.length === 0) {
        alert('لا توجد نتائج للطلاب لطباعتها.');
        return;
    }
    
    let printContent = `<html><head><title>تقرير نتائج الطلاب</title>
    <style>body{font-family:Arial,sans-serif;direction:rtl}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;border:1px solid #ddd;text-align:right}th{background-color:#f2f2f2}h1{text-align:center}.summary{margin-bottom:20px}</style>
    </head><body><h1>تقرير نتائج الطلاب - مبادرة رحلة نافس</h1>
    <div class="summary"><p><strong>إجمالي عدد الطلاب:</strong> ${studentsResults.length}</p>
    <p><strong>النسبة العامة:</strong> ${document.getElementById('overall-percentage').textContent}</p></div>
    <table><thead><tr><th>اسم الطالب</th><th>النسبة المئوية</th><th>الوقت المستغرق</th><th>التاريخ</th></tr></thead><tbody>`;
    
    studentsResults.forEach(student => {
        printContent += `<tr><td>${student.name}</td><td>${student.percentage}%</td><td>${student.timeTaken}</td><td>${student.date}</td></tr>`;
    });
    
    printContent += `</tbody></table><p style="margin-top:20px;text-align:left">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p></body></html>`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
});
