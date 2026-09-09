import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경변수가 없으면 null — 앱은 내장 기본 데이터로 동작합니다.
export const supabase = url && key ? createClient(url, key) : null;
