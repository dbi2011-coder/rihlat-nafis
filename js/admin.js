async function initAdmin() {
    console.log('🚀 بدء تهيئة واجهة المسؤول...');
    
    // التحقق من اتصال Supabase أولاً
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
        console.log('⚠️ استخدام localStorage فقط - لا يوجد اتصال بـ Supabase');
        showAlert('جاري استخدام التخزين المحلي - لا يوجد اتصال بقاعدة البيانات السحابية', 'warning');
    }
    
    try {
        await loadQuestions();
        await loadReports();
        await loadSettings();
        await loadAuthorizedStudents();
        setupEventListeners();
        
        console.log('✅ واجهة المسؤول جاهزة');
    } catch (error) {
        console.error('❌ خطأ في تهيئة واجهة المسؤول:', error);
        showAlert('حدث خطأ في تحميل البيانات', 'error');
    }
}
