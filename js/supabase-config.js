// إعداد Supabase
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
