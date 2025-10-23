// واجهة الطالب والاختبارات مع Supabase

let currentQuestionIndex = 0;
let studentAnswers = [];
let startTime;
let timerInterval;
let questions = [];
let settings = {};

async function initStudent() {
    await loadSettings();
    showLoginInterface();
}

async function loadSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('*')
            .single();
        
        if (error) throw error;
        settings = data;
        
    } catch (error) {
        console.error('Error loading settings from Supabase:', error);
        settings = JSON.parse(localStorage.getItem('settings')) || {
            questionsCount: 10,
            loginType: 'open',
            attemptsCount: 1,
            resultsDisplay: 'show-answers'
        };
    }
    
    showLoginInterface();
}

function showLoginInterface() {
    document.getElementById('open-login').style.display = settings.loginType === 'open' ? 'block' : 'none';
    document.getElementById('restricted-login').style.display = settings.loginType === 'restricted' ? 'block' : 'none';
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('results-container').style.display = 'none';
}

async function validateRestrictedLogin() {
    const studentId = document.getElementById('student-id-input').value.trim();
    const studentName = document.getElementById('student-name-input').value.trim();
    
    if (!studentId || !studentName) {
        alert('يرجى إدخال جميع البيانات');
        return;
    }
    
    let authorizedStudents = [];
    
    try {
        const { data, error } = await supabaseClient
            .from('authorized_students')
            .select('*');
        
        if (error) throw error;
        authorizedStudents = data || [];
        
    } catch (error) {
        console.error('Error loading authorized students from Supabase:', error);
        authorizedStudents = JSON.parse(localStorage.getItem('authorizedStudents')) || [];
    }
    
    const student = authorizedStudents.find(s => s.id === studentId && s.name === studentName);
    
    if (!student) {
        alert('رقم الهوية/الإقامة أو اسم الطالب غير صحيح');
        return;
    }
    
    if (student.used_attempts >= settings.attemptsCount) {
        alert('لقد استنفذت عدد المحاولات المسموحة');
        return;
    }
    
    // تحديث عدد المحاولات المستخدمة
    student.used_attempts = (student.used_attempts || 0) + 1;
    
    try {
        const { error } = await supabaseClient
            .from('authorized_students')
            .update({ used_attempts: student.used_attempts })
            .eq('id', studentId);
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Error updating attempts in Supabase:', error);
        localStorage.setItem('authorizedStudents', JSON.stringify(authorizedStudents));
    }
    
    startTest(studentName);
}

function startTest(studentName) {
    document.getElementById('open-login').style.display = 'none';
    document.getElementById('restricted-login').style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    
    loadQuestionsForTest();
    displayCurrentQuestion();
    
    startTime = new Date();
    startTimer();
    
    localStorage.setItem('currentStudent', studentName);
}

async function loadQuestionsForTest() {
    let allQuestions = [];
    
    try {
        const { data, error } = await supabaseClient
            .from('questions')
            .select('*');
        
        if (error) throw error;
        allQuestions = data || [];
        
    } catch (error) {
        console.error('Error loading questions from Supabase:', error);
        allQuestions = JSON.parse(localStorage.getItem('questions')) || [];
    }
    
    if (allQuestions.length === 0) {
        alert('لا توجد أسئلة متاحة للاختبار');
        showLoginInterface();
        return;
    }
    
    const flattenedQuestions = [];
    allQuestions.forEach(question => {
        if (question.type === 'reading-comprehension' && question.passage_questions) {
            question.passage_questions.forEach(passageQ => {
                flattenedQuestions.push({
                    id: passageQ.id,
                    text: passageQ.text,
                    type: 'reading-comprehension-item',
                    options: passageQ.options,
                    correctAnswer: passageQ.correctAnswer,
                    readingPassage: question.reading_passage,
                    parentQuestionId: question.id
                });
            });
        } else {
            flattenedQuestions.push(question);
        }
    });
    
    const questionsCount = Math.min(settings.questionsCount, flattenedQuestions.length);
    questions = getRandomQuestions(flattenedQuestions, questionsCount);
    
    studentAnswers = new Array(questions.length).fill(null);
}

function getRandomQuestions(allQuestions, count) {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function displayCurrentQuestion() {
    const container = document.getElementById('questions-container');
    const question = questions[currentQuestionIndex];
    
    container.innerHTML = '';
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';
    
    let questionHTML = `
        <h3>السؤال ${currentQuestionIndex + 1} من ${questions.length}</h3>
    `;
    
    if (question.type === 'reading-comprehension-item' && question.readingPassage) {
        questionHTML += `
            <div class="reading-passage">
                <h4>اقرأ القطعة التالية ثم أجب عن السؤال:</h4>
                <div class="passage-content">${question.readingPassage}</div>
            </div>
        `;
    }
    
    questionHTML += `
        <p class="question-text">${question.text}</p>
    `;
    
    if (question.type === 'multiple-with-media' && question.media_url) {
        questionHTML += `
            <div class="media-attachment">
                ${isYouTubeUrl(question.media_url) ? 
                    `<iframe src="${getYouTubeEmbedUrl(question.media_url)}" frameborder="0" allowfullscreen></iframe>` :
                    `<img src="${question.media_url}" alt="مرفق السؤال">`
                }
            </div>
        `;
    }
    
    questionHTML += `
        <div class="options-container">
            ${question.options.map((option, index) => `
                <div class="option-item">
                    <input type="radio" name="answer" id="option-${index}" value="${index + 1}" 
                           ${studentAnswers[currentQuestionIndex] === index + 1 ? 'checked' : ''}>
                    <label for="option-${index}">${option}</label>
                </div>
            `).join('')}
        </div>
    `;
    
    questionDiv.innerHTML = questionHTML;
    container.appendChild(questionDiv);
    
    const navigationDiv = document.createElement('div');
    navigationDiv.className = 'navigation-buttons';
    navigationDiv.innerHTML = `
        <button class="btn-secondary" onclick="previousQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>السابق</button>
        <button class="btn-primary" onclick="nextQuestion()">${currentQuestionIndex === questions.length - 1 ? 'إنهاء الاختبار' : 'التالي'}</button>
    `;
    container.appendChild(navigationDiv);
    
    question.options.forEach((_, index) => {
        document.getElementById(`option-${index}`).addEventListener('change', function() {
            studentAnswers[currentQuestionIndex] = parseInt(this.value);
        });
    });
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayCurrentQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
    } else {
        submitTest();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    
    document.getElementById('timer').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function submitTest() {
    clearInterval(timerInterval);
    
    const endTime = new Date();
    const timeTaken = document.getElementById('timer').textContent;
    
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    const studentName = localStorage.getItem('currentStudent');
    const studentResult = {
        name: studentName,
        score: score,
        total: questions.length,
        percentage: percentage,
        time_taken: timeTaken,
        date: new Date().toLocaleDateString('ar-SA')
    };
    
    try {
        const { error } = await supabaseClient
            .from('students')
            .insert([studentResult]);
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Error saving to Supabase, using localStorage:', error);
        const students = JSON.parse(localStorage.getItem('students')) || [];
        students.push(studentResult);
        localStorage.setItem('students', JSON.stringify(students));
    }
    
    showResults(score, percentage, timeTaken);
}

function calculateScore() {
    let score = 0;
    
    for (let i = 0; i < questions.length; i++) {
        if (studentAnswers[i] === questions[i].correctAnswer) {
            score++;
        }
    }
    
    return score;
}

function showResults(score, percentage, timeTaken) {
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('results-container').style.display = 'block';
    
    const container = document.getElementById('results-container');
    container.innerHTML = '';
    
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'results-summary';
    
    let resultsHTML = `
        <h2>نتيجة الاختبار</h2>
        <div class="score">${percentage}%</div>
        <p>الإجابات الصحيحة: ${score} من ${questions.length}</p>
        <p class="time-taken">الوقت المستغرق: ${timeTaken}</p>
    `;
    
    if (settings.resultsDisplay === 'show-answers') {
        resultsHTML += `
            <div class="questions-review">
                <h3>مراجعة الأسئلة</h3>
                ${questions.map((question, index) => {
                    const studentAnswer = studentAnswers[index];
                    const isCorrect = studentAnswer === question.correctAnswer;
                    
                    return `
                        <div class="question-feedback ${isCorrect ? 'correct' : 'incorrect'}">
                            <h4>السؤال ${index + 1}</h4>
                            ${question.readingPassage ? `
                                <div class="reading-passage">
                                    <strong>قطعة الاستيعاب:</strong>
                                    <div class="passage-content">${question.readingPassage}</div>
                                </div>
                            ` : ''}
                            <p><strong>النص:</strong> ${question.text}</p>
                            <p><strong>إجابتك:</strong> ${studentAnswer ? question.options[studentAnswer - 1] : 'لم تجب'}</p>
                            <p><strong>الإجابة الصحيحة:</strong> ${question.options[question.correctAnswer - 1]}</p>
                            <p class="result ${isCorrect ? 'correct-text' : 'incorrect-text'}">
                                ${isCorrect ? '✓ إجابة صحيحة' : '✗ إجابة خاطئة'}
                            </p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    resultsHTML += `
        <button class="btn-primary" onclick="location.reload()">إعادة الاختبار</button>
    `;
    
    resultsDiv.innerHTML = resultsHTML;
    container.appendChild(resultsDiv);
}

function isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYouTubeEmbedUrl(url) {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
}

// جعل الدوال متاحة globally
window.validateRestrictedLogin = validateRestrictedLogin;
window.startTest = startTest;
window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.submitTest = submitTest;
