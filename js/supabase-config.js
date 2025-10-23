// إعداد Supabase لمشروع رحلة نفيس
const SUPABASE_URL = 'https://npeclyiitjxznhgclfhxe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZWNseWl0anh6bmhnY2xmaHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUzNjksImV4cCI6MjA3Njc0MTM2OX0.Xan7k9rJuzny0AE2Fq7ZCq4S9rsnHmp3T1QcLqbJ2Yc';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// دالة للتحقق من اتصال Supabase
async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient.from('questions').select('*').limit(1);
        return !error;
    } catch (error) {
        console.error('Supabase connection error:', error);
        return false;
    }
}
