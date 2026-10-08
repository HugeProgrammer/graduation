import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gazbzqgweernopjlciky.supabase.co';
const supabaseAnonKey = 'sb_publishable_amiPZMysjpDv2xqlYTKsmg_-Trtaqgu';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);