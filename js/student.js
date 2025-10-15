// إدارة واجهة الطالب
let currentQuestions = [];
let userAnswers = [];
let timerInterval;
let startTime;
let currentStudentName = '';

// تهيئة واجهة الطالب
function initStudent() {
    const settings = getSettings();
    
    // التحقق من نوع الدخول
    if (settings.loginType === 'restricted') {
        showRestrictedLogin();
    } else {
        showOpenLogin();
    }
}

// عرض واجهة الدخول المفتوح
function showOpenLogin() {
    document.getElementById('open-login').style.display = 'block';
    document.getElementById('restricted-login').style.display = 'none';
}

// عرض واجهة الدخول المحدود
function showRestrictedLogin() {
    document.getElementById('open-login').style.display = 'none';
    document.getElementById('restricted-login').style.display = 'block';
}

// بدء الاختبار
function startTest(studentName) {
    currentStudentName = studentName;
    
    // إخفاء واجهة الدخول
    document.getElementById('open-login').style.display = 'none';
    document.getElementById('restricted-login').style.display = 'none';
    
    // إظهار واجهة الاختبار
    document.getElementById('test-container').style.display = 'block';
    
    // تحميل الأسئلة وعرضها
    loadTestQuestions();
    
    // بدء المؤقت
    startTimer();
}

// تحميل أسئلة الاختبار
function loadTestQuestions() {
    const allQuestions = getQuestions();
    const settings = getSettings();
    const questionsCount = settings.questionsCount || 10;
    
    // اختيار أسئلة عشوائية
    currentQuestions = getRandomQuestions(allQuestions, questionsCount);
    userAnswers = new Array(currentQuestions.length).fill(null);
    
    // عرض الأسئلة
    displayQuestions();
}

// الحصول على أسئلة عشوائية
function getRandomQuestions(questions, count) {
    if (questions.length <= count) {
        return [...questions];
    }
    
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// عرض الأسئلة
function displayQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    currentQuestions.forEach((question, index) => {
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
                        <input type="radio" id="q${index}-option${i}" name="q${index}" value="${i}" 
                               onchange="saveAnswer(${index}, ${i})">
                        <label for="q${index}-option${i}">${option}</label>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(questionElement);
    });
}

// حفظ إجابة الطالب
function saveAnswer(questionIndex, answerIndex) {
    userAnswers[questionIndex] = answerIndex;
}

// بدء المؤقت
function startTimer() {
    startTime = new Date();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// تحديث المؤقت
function updateTimer() {
    const now = new Date();
    const diff = now - startTime;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// إرسال الاختبار
function submitTest() {
    if (confirm('هل أنت متأكد من إنهاء الاختبار؟')) {
        clearInterval(timerInterval);
        showResults();
    }
}

// عرض النتائج
function showResults() {
    const settings = getSettings();
    const resultsContainer = document.getElementById('results-container');
    
    // حساب النتائج
    const score = calculateScore();
    const percentage = Math.round((score / currentQuestions.length) * 100);
    const timeTaken = document.getElementById('timer').textContent;
    
    let resultsHTML = `
        <div class="results-summary">
            <h2>نتيجة الاختبار</h2>
            <div class="score">${score} / ${currentQuestions.length}</div>
            <div class="percentage">${percentage}%</div>
            <div class="time-taken">الوقت المستغرق: ${timeTaken}</div>
    `;
    
    // عرض الإجابات إذا كان الخيار مفعلاً
    if (settings.resultsDisplay === 'show-answers') {
        resultsHTML += `<h3 style="margin-top: 20px;">التغذية الراجعة:</h3>`;
        
        currentQuestions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            resultsHTML += `
                <div class="question-feedback" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                    <p><strong>السؤال ${index + 1}:</strong> ${question.text}</p>
                    <p style="color: ${isCorrect ? 'green' : 'red'};">إجابتك: ${userAnswer !== null ? question.options[userAnswer] : 'لم تجب'} ${isCorrect ? '✓' : '✗'}</p>
                    ${!isCorrect ? `<p style="color: green;">الإجابة الصحيحة: ${question.options[question.correctAnswer]}</p>` : ''}
                </div>
            `;
        });
    }
    
    resultsHTML += `
            <button onclick="restartTest()" class="btn-primary" style="margin-top: 20px;">إعادة الاختبار</button>
        </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('results-container').style.display = 'block';
    
    // حفظ النتيجة
    saveStudentResult(percentage, timeTaken);
}

// حساب النتيجة
function calculateScore() {
    let score = 0;
    currentQuestions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            score++;
        }
    });
    return score;
}

// حفظ نتيجة الطالب
function saveStudentResult(percentage, timeTaken) {
    const studentsResults = getStudentsResults();
    
    studentsResults.push({
        name: currentStudentName,
        percentage: percentage,
        timeTaken: timeTaken,
        date: new Date().toLocaleDateString('ar-SA')
    });
    
    localStorage.setItem('studentsResults', JSON.stringify(studentsResults));
}

// إعادة الاختبار
function restartTest() {
    document.getElementById('results-container').style.display = 'none';
    
    const settings = getSettings();
    if (settings.loginType === 'restricted') {
        showRestrictedLogin();
    } else {
        showOpenLogin();
    }
}

// التحقق من دخول الطالب (للنوع المحدود)
function validateRestrictedLogin() {
    const studentId = document.getElementById('student-id-input').value.trim();
    const studentName = document.getElementById('student-name-input').value.trim();
    
    if (!studentId || !studentName) {
        alert('يرجى إدخال رقم الهوية/الإقامة والاسم');
        return;
    }
    
    const authorizedStudents = getAuthorizedStudents();
    const student = authorizedStudents.find(s => s.id === studentId && s.name === studentName);
    
    if (!student) {
        alert('رقم الهوية/الإقامة أو الاسم غير صحيح');
        return;
    }
    
    const settings = getSettings();
    const maxAttempts = settings.attemptsCount || 1;
    
    if (student.attemptsUsed >= maxAttempts) {
        alert(`لقد استنفذت عدد المحاولات المسموحة (${maxAttempts} محاولة)`);
        return;
    }
    
    // زيادة عدد المحاولات المستخدمة
    student.attemptsUsed = (student.attemptsUsed || 0) + 1;
    localStorage.setItem('authorizedStudents', JSON.stringify(authorizedStudents));
    
    // بدء الاختبار
    startTest(studentName);
}

// الحصول على إعدادات الاختبار
function getSettings() {
    return JSON.parse(localStorage.getItem('testSettings') || '{}');
}

// الحصول على قائمة الطلاب المصرح لهم
function getAuthorizedStudents() {
    return JSON.parse(localStorage.getItem('authorizedStudents') || '[]');
}

// الحصول على الأسئلة
function getQuestions() {
    return JSON.parse(localStorage.getItem('questions') || '[]');
}

// الحصول على نتائج الطلاب
function getStudentsResults() {
    return JSON.parse(localStorage.getItem('studentsResults') || '[]');
}

// دوال مساعدة للوسائط
function isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYouTubeEmbedUrl(url) {
    if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1];
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
            return `https://www.youtube.com/embed/${videoId.substring(0, ampersandPosition)}`;
        }
        return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
}
