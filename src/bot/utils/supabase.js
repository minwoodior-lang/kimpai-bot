const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase 환경변수 미설정. 사용자 데이터 저장 기능 비활성화됨.");
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Supabase 사용자 조회 (chat_id로 조회)
const getUserByChatId = async (chatId) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("telegram_users")
      .select("*")
      .eq("telegram_chat_id", chatId)
      .single();
    return error ? null : data;
  } catch (err) {
    console.error("User query error:", err);
    return null;
  }
};

// 사용자 등록 또는 업데이트
const upsertUser = async (chatId, userData) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("telegram_users")
      .upsert({
        telegram_chat_id: chatId,
        ...userData,
        updated_at: new Date().toISOString(),
      });
    return error ? null : data;
  } catch (err) {
    console.error("User upsert error:", err);
    return null;
  }
};

// 사용자 관심종목 추가
const addWatchlist = async (chatId, symbol) => {
  if (!supabase) return null;
  try {
    const user = await getUserByChatId(chatId);
    if (!user) {
      await upsertUser(chatId, { watchlist: [symbol], is_pro: false });
    } else {
      const watchlist = user.watchlist || [];
      if (!watchlist.includes(symbol)) {
        watchlist.push(symbol);
        await upsertUser(chatId, { watchlist });
      }
    }
    return true;
  } catch (err) {
    console.error("Watchlist add error:", err);
    return null;
  }
};

// 사용자 관심종목 제거
const removeWatchlist = async (chatId, symbol) => {
  if (!supabase) return null;
  try {
    const user = await getUserByChatId(chatId);
    if (user && user.watchlist) {
      const watchlist = user.watchlist.filter((s) => s !== symbol);
      await upsertUser(chatId, { watchlist });
    }
    return true;
  } catch (err) {
    console.error("Watchlist remove error:", err);
    return null;
  }
};

// PRO 사용자 목록 조회
const getProUsers = async () => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("telegram_users")
      .select("*")
      .eq("is_pro", true);
    return error ? [] : data || [];
  } catch (err) {
    console.error("Pro users query error:", err);
    return [];
  }
};

module.exports = {
  supabase,
  getUserByChatId,
  upsertUser,
  addWatchlist,
  removeWatchlist,
  getProUsers,
};
