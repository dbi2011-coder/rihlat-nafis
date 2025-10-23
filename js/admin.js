// إدارة الأسئلة والإعدادات للمسؤول مع Supabase

let questions = [];
let authorizedStudents = [];
let settings = {
    questionsCount: 10,
    loginType: 'open',
    attemptsCount: 1,
    resultsDisplay: 'show-answers'
};

let readingQuestions = [];

async function initAdmin() {
    await loadQuestions();
    await loadReports();
    await loadSettings();
    await loadAuthorizedStudents();
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
        const standardOptionsSection = document.getElementById('standard-options-section');
        const standardQuestionGroup = document.getElementById('standard-question-group');
        
        // إظهار/إخفاء العناصر حسب نوع السؤال
        mediaGroup.style.display = type === 'multiple-with-media' ? 'block' : 'none';
        readingGroup.style.display = type === 'reading-comprehension' ? 'block' : 'none';
        readingQuestionsContainer.style.display = type === 'reading-comprehension' ? 'block' : 'none';
        standardOptionsSection.style.display = type === 'reading-comprehension' ? 'none' : 'block';
        standardQuestionGroup.style.display = type === 'reading-comprehension' ? 'none' : 'block';
        
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
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
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
        
        const radioDiv = document.createElement('div');
        radioDiv.className = 'option-item';
        radioDiv.innerHTML = `
            <input type="radio" name="reading-correct-${questionId}" id="reading-correct-${questionId}-${i}" value="${i}" required>
            <label for="reading-correct-${questionId}-${i}">الخيار ${i}</label>
        `;
        correctAnswerContainer.appendChild(radioDiv);
    }
}

function removeReadingQuestion(questionId) {
    const questionDiv = document.querySelector(`.reading-question-container[data-id="${questionId}"]`);
    if (questionDiv) {
        questionDiv.remove();
    }
}

function loadReadingQuestions() {
    document.getElementById('reading-questions-list').innerHTML = '';
    readingQuestions = [];
}

async function addQuestion(e) {
    e.preventDefault();
    console.log('بدء إضافة سؤال جديد...');
    
    const questionText = document.getElementById('question-text').value;
    const questionType = document.getElementById('question-type').value;
    
    let question;
    
    if (questionType === 'reading-comprehension') {
        const readingPassage = document.getElementById('reading-passage').value;
        
        if (!readingPassage.trim()) {
            alert('يرجى إدخال قطعة الاستيعاب');
            return;
        }
        
        const readingQuestionElements = document.querySelectorAll('.reading-question-container');
        if (readingQuestionElements.length === 0) {
            alert('يرجى إضافة أسئلة للقطعة');
            return;
        }
        
        const passageQuestions = [];
        
        for (const questionDiv of readingQuestionElements) {
            const questionId = questionDiv.getAttribute('data-id');
            const questionText = questionDiv.querySelector('.reading-question-text').value;
            const optionsCount = parseInt(questionDiv.querySelector('.reading-options-count').value);
            const correctAnswer = questionDiv.querySelector(`input[name="reading-correct-${questionId}"]:checked`);
            
            if (!questionText.trim()) {
                alert('يرجى إدخال نص جميع الأسئلة');
                return;
            }
            
            if (!correctAnswer) {
                alert('يرجى اختيار الإجابة الصحيحة لجميع الأسئلة');
                return;
            }
            
            const options = [];
            for (let i = 1; i <= optionsCount; i++) {
                const optionInput = questionDiv.querySelector(`.reading-option-input[data-option="${i}"]`);
                if (!optionInput || !optionInput.value.trim()) {
                    alert(`يرجى إدخال نص جميع الخيارات`);
                    return;
                }
                options.push(optionInput.value);
            }
            
            passageQuestions.push({
                id: parseInt(questionId),
                text: questionText,
                options: options,
                correctAnswer: parseInt(correctAnswer.value)
            });
        }
        
        question = {
            id: Date.now(),
            text: questionText,
            type: questionType,
            reading_passage: readingPassage,
            passage_questions: passageQuestions,
            created_at: new Date().toISOString()
        };
        
    } else {
        const optionsCount = parseInt(document.getElementById('options-count').value);
        const correctAnswer = document.querySelector('input[name="correct-answer"]:checked');
        
        if (!correctAnswer) {
            alert('يرجى اختيار الإجابة الصحيحة');
            return;
        }
        
        const options = [];
        for (let i = 1; i <= optionsCount; i++) {
            const optionInput = document.querySelector(`.option-input[data-option="${i}"]`);
            if (!optionInput || optionInput.value.trim() === '') {
                alert(`يرجى إدخال نص الخيار ${i}`);
                return;
            }
            options.push(optionInput.value);
        }
        
        question = {
            id: Date.now(),
            text: questionText,
            type: questionType,
            options: options,
            correct_answer: parseInt(correctAnswer.value),
            media_url: questionType === 'multiple-with-media' ? document.getElementById('media-url').value : null,
            created_at: new Date().toISOString()
        };
    }
    
    console.log('السؤال المُعد:', question);
    
    try {
        // إضافة السؤال إلى المصفوفة المحلية
        questions.push(question);
        
        // حفظ في Supabase
        const { data, error } = await supabaseClient
            .from('questions')
            .insert([question]);
        
        if (error) {
            console.error('خطأ في حفظ السؤال في Supabase:', error);
            throw error;
        }
        
        console.log('✅ تم حفظ السؤال في Supabase:', data);
        
        // تحديث الواجهة
        await loadQuestions();
        
        // إعادة تعيين النموذج
        document.getElementById('add-question-form').reset();
        document.getElementById('media-url-group').style.display = 'none';
        document.getElementById('reading-passage-group').style.display = 'none';
        document.getElementById('reading-questions-container').style.display = 'none';
        document.getElementById('standard-options-section').style.display = 'block';
        document.getElementById('standard-question-group').style.display = 'block';
        
        updateOptionsContainer();
        loadReadingQuestions();
        
        alert('تم إضافة السؤال بنجاح! ✅');
        
    } catch (error) {
        console.error('❌ خطأ في إضافة السؤال:', error);
        saveToStorage('questions', questions);
        alert('تم إضافة السؤال محلياً (بدون اتصال بالسحابة)');
        displayQuestions();
    }
}

async function loadQuestions() {
    console.log('جاري تحميل الأسئلة...');
    
    try {
        const { data, error } = await supabaseClient
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('خطأ في تحميل الأسئلة من Supabase:', error);
            throw error;
        }
        
        questions = data || [];
        console.log(`✅ تم تحميل ${questions.length} سؤال من Supabase`);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الأسئلة من Supabase:', error);
        questions = loadFromStorage('questions', []);
        console.log(`💾 تم تحميل ${questions.length} سؤال من localStorage`);
    }
    
    displayQuestions();
}

function displayQuestions() {
    const container = document.getElementById('questions-list');
    container.innerHTML = '';
    
    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">لا توجد أسئلة مضافة بعد</p>';
        return;
    }
    
    console.log(`عرض ${questions.length} سؤال في الواجهة`);
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        questionDiv.style.border = '1px solid #ddd';
        questionDiv.style.borderRadius = '8px';
        questionDiv.style.padding = '15px';
        questionDiv.style.marginBottom = '15px';
        questionDiv.style.backgroundColor = '#f9f9f9';
        
        let questionHTML = `
            <h4 style="color: #2c3e50; margin-bottom: 10px;">
                السؤال ${index + 1} - ${getQuestionTypeText(question.type)}
            </h4>
        `;
        
        if (question.type === 'reading-comprehension') {
            questionHTML += `
                <p><strong>قطعة الاستيعاب:</strong> ${(question.reading_passage || '').substring(0, 100)}...</p>
                <p><strong>عدد الأسئلة:</strong> ${(question.passage_questions || []).length}</p>
                <div class="passage-questions" style="margin-top: 10px;">
                    ${(question.passage_questions || []).map((q, qIndex) => `
                        <div class="passage-question" style="padding: 8px; border-bottom: 1px solid #eee;">
                            <strong>سؤال ${qIndex + 1}:</strong> ${q.text}
                            <br><strong>الإجابة الصحيحة:</strong> ${q.options[q.correctAnswer - 1]}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            questionHTML += `
                <p><strong>النص:</strong> ${question.text}</p>
                ${question.media_url ? `<p><strong>المرفق:</strong> ${question.media_url}</p>` : ''}
                <p><strong>الخيارات:</strong></p>
                <ul style="list-style: none; padding-right: 0;">
                    ${(question.options || []).map((option, i) => `
                        <li style="padding: 5px 0; ${i + 1 === question.correct_answer ? 'color: #27ae60; font-weight: bold;' : 'color: #7f8c8d;'}">
                            ${option} ${i + 1 === question.correct_answer ? '✓' : ''}
                        </li>
                    `).join('')}
                </ul>
            `;
        }
        
        questionHTML += `
            <button class="btn-danger btn-small" onclick="deleteQuestion(${question.id})" 
                    style="margin-top: 10px; padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                حذف
            </button>
        `;
        
        questionDiv.innerHTML = questionHTML;
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

async function deleteQuestion(id) {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        try {
            const { error } = await supabaseClient
                .from('questions')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
        } catch (error) {
            console.error('Error deleting from Supabase:', error);
        }
        
        questions = questions.filter(q => q.id !== id);
        await saveQuestions();
        await loadQuestions();
    }
}

async function saveQuestions() {
    try {
        console.log('جاري حفظ الأسئلة في Supabase...');
        
        if (questions.length === 0) {
            console.log('لا توجد أسئلة للحفظ');
            return;
        }
        
        const { data, error } = await supabaseClient
            .from('questions')
            .upsert(questions, { 
                onConflict: 'id',
                ignoreDuplicates: false 
            });
        
        if (error) {
            console.error('خطأ في حفظ الأسئلة في Supabase:', error);
            throw error;
        }
        
        console.log('✅ تم حفظ جميع الأسئلة في Supabase');
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الأسئلة في Supabase:', error);
        saveToStorage('questions', questions);
        console.log('💾 تم حفظ الأسئلة في localStorage كنسخة احتياطية');
    }
}

async function loadReports() {
    let students = [];
    
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        students = data || [];
        
    } catch (error) {
        console.error('Error loading students from Supabase:', error);
        students = JSON.parse(localStorage.getItem('students')) || [];
    }
    
    displayReports(students);
}

function displayReports(students) {
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
            <td>${student.time_taken || student.timeTaken}</td>
            <td>${student.date}</td>
        `;
        tbody.appendChild(tr);
    });
    
    const overallPercentage = (totalPercentage / students.length).toFixed(1);
    document.getElementById('overall-percentage').textContent = `${overallPercentage}%`;
}

function showTopStudents() {
    const count = parseInt(document.getElementById('top-students-count').value);
    let students = JSON.parse(localStorage.getItem('students')) || [];
    
    const topStudents = students
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, count);
    
    displayReports(topStudents);
}

function toggleSelectAllStudents() {
    const selectAll = document.getElementById('select-all-students').checked;
    document.querySelectorAll('.student-checkbox').forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

async function deleteSelectedStudents() {
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('يرجى اختيار طلاب للحذف');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف ${checkboxes.length} طالب؟`)) {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));
        
        const updatedStudents = students.filter((_, index) => !indicesToDelete.includes(index));
        
        try {
            const { error } = await supabaseClient
                .from('students')
                .delete()
                .neq('id', 0);
            
            if (!error && updatedStudents.length > 0) {
                await supabaseClient
                    .from('students')
                    .insert(updatedStudents);
            }
            
        } catch (error) {
            console.error('Error updating Supabase:', error);
        }
        
        localStorage.setItem('students', JSON.stringify(updatedStudents));
        loadReports();
        alert('تم حذف الطلاب المحددين بنجاح');
    }
}

async function deleteAllStudents() {
    if (confirm('هل أنت متأكد من حذف جميع الطلاب ونتائجهم؟')) {
        try {
            const { error } = await supabaseClient
                .from('students')
                .delete()
                .neq('id', 0);
            
            if (error) throw error;
            
        } catch (error) {
            console.error('Error deleting from Supabase:', error);
        }
        
        localStorage.removeItem('students');
        loadReports();
        alert('تم حذف جميع الطلاب بنجاح');
    }
}

function printReport() {
    window.print();
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
    
    applySettings();
}

function applySettings() {
    document.getElementById('questions-count').value = settings.questionsCount;
    document.getElementById('login-type').value = settings.loginType;
    document.getElementById('attempts-count').value = settings.attemptsCount;
    document.getElementById('results-display').value = settings.resultsDisplay;
    
    const attemptsGroup = document.getElementById('attempts-count-group');
    const authorizedSection = document.getElementById('authorized-students-section');
    const isRestricted = settings.loginType === 'restricted';
    
    attemptsGroup.style.display = isRestricted ? 'block' : 'none';
    authorizedSection.style.display = isRestricted ? 'block' : 'none';
}

async function saveSettings() {
    settings = {
        questionsCount: parseInt(document.getElementById('questions-count').value),
        loginType: document.getElementById('login-type').value,
        attemptsCount: parseInt(document.getElementById('attempts-count').value),
        resultsDisplay: document.getElementById('results-display').value
    };
    
    try {
        const { error } = await supabaseClient
            .from('settings')
            .upsert(settings);
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Error saving settings to Supabase:', error);
    }
    
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('تم حفظ الإعدادات بنجاح');
}

async function loadAuthorizedStudents() {
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
    
    displayAuthorizedStudents();
}

function displayAuthorizedStudents() {
    const tbody = document.querySelector('#authorized-students-list tbody');
    tbody.innerHTML = '';
    
    authorizedStudents.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.used_attempts || student.usedAttempts || 0}</td>
            <td>
                <button class="btn-danger btn-small" onclick="deleteAuthorizedStudent(${index})">حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function addAuthorizedStudent() {
    const studentId = document.getElementById('student-id').value.trim();
    const studentName = document.getElementById('student-name').value.trim();
    
    if (!studentId || !studentName) {
        alert('يرجى إدخال جميع البيانات');
        return;
    }
    
    if (authorizedStudents.some(s => s.id === studentId)) {
        alert('رقم الهوية/الإقامة مسجل مسبقاً');
        return;
    }
    
    const newStudent = {
        id: studentId,
        name: studentName,
        used_attempts: 0
    };
    
    authorizedStudents.push(newStudent);
    await saveAuthorizedStudents();
    await loadAuthorizedStudents();
    
    document.getElementById('student-id').value = '';
    document.getElementById('student-name').value = '';
    
    alert('تم إضافة الطالب بنجاح');
}

async function deleteAuthorizedStudent(index) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        const studentToDelete = authorizedStudents[index];
        
        try {
            const { error } = await supabaseClient
                .from('authorized_students')
                .delete()
                .eq('id', studentToDelete.id);
            
            if (error) throw error;
            
        } catch (error) {
            console.error('Error deleting from Supabase:', error);
        }
        
        authorizedStudents.splice(index, 1);
        await saveAuthorizedStudents();
        await loadAuthorizedStudents();
    }
}

async function saveAuthorizedStudents() {
    try {
        const { error: deleteError } = await supabaseClient
            .from('authorized_students')
            .delete()
            .neq('id', '');
        
        if (deleteError) throw deleteError;
        
        if (authorizedStudents.length > 0) {
            const { error: insertError } = await supabaseClient
                .from('authorized_students')
                .insert(authorizedStudents);
            
            if (insertError) throw insertError;
        }
        
    } catch (error) {
        console.error('Error saving to Supabase, using localStorage:', error);
        localStorage.setItem('authorizedStudents', JSON.stringify(authorizedStudents));
    }
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

window.deleteContent = deleteQuestion;
window.removeReadingQuestion = removeReadingQuestion;
window.deleteAuthorizedStudent = deleteAuthorizedStudent;
