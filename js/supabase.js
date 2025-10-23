// تكوين Supabase - المفاتيح الخاصة بك
const SUPABASE_URL = 'https://npeclyitjxznhgclfhxe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZWNseWl0anh6bmhnY2xmaHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUzNjksImV4cCI6MjA3Njc0MTM2OX0.Xan7k9rJuzny0AE2Fq7ZCq4S9rsnHmp3T1QcLqbJ2Yc';

// تهيئة عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// دوال للتعامل مع Supabase
class SupabaseService {
    
    // === إدارة الأسئلة ===
    
    // جلب جميع الأسئلة
    async getQuestions() {
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        }