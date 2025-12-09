const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("⚠️ Supabase 환경변수 미설정. 사용자 데이터 저장 기능 비활성화됨.");
}

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function upsertTelegramUserFromCtx(ctx, source = "direct_dm") {
  if (!supabase || !ctx || !ctx.chat || !ctx.from) {
    return;
  }

  const chatType = ctx.chat.type;
  if (chatType !== "private") {
    console.log(`⏭️ 채널/그룹 메시지 무시 (type: ${chatType})`);
    return;
  }

  const chatId = ctx.chat.id;
  const username = ctx.from.username || null;
  const firstName = ctx.from.first_name || null;
  const lastName = ctx.from.last_name || null;

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', chatId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ User fetch error:', fetchError);
    }

    const now = new Date().toISOString();

    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: username,
          first_name: firstName,
          last_name: lastName,
          last_active: now,
        })
        .eq('user_id', chatId);

      if (updateError) {
        console.error('❌ Failed to update user:', updateError);
      } else {
        console.log('✅ users update success:', chatId, username);
      }
    } else {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          user_id: chatId,
          username: username,
          first_name: firstName,
          last_name: lastName,
          join_at: now,
          joined_from: source,
          last_active: now,
          is_pro: false,
          watchlist: [],
        });

      if (insertError) {
        console.error('❌ Failed to insert user:', insertError);
      } else {
        console.log('✅ users insert success:', chatId, username, source);
      }
    }
  } catch (err) {
    console.error('❌ Exception while upserting user:', err);
  }
}

async function upsertTelegramUserLegacy(ctx) {
  if (!supabase || !ctx || !ctx.chat || !ctx.from) {
    return;
  }

  const chatId = ctx.chat.id;
  const username = ctx.from.username || null;

  try {
    const { error } = await supabase
      .from('telegram_users')
      .upsert(
        {
          telegram_chat_id: chatId,
          telegram_username: username,
        },
        { onConflict: 'telegram_chat_id' }
      );

    if (error) {
      console.error('❌ Failed to upsert telegram user:', error);
    } else {
      console.log('✅ telegram_users upsert success:', chatId, username);
    }
  } catch (err) {
    console.error('❌ Exception while upserting telegram user:', err);
  }
}

const getUserByChatId = async (chatId) => {
  if (!supabase) return null;
  try {
    let { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", chatId)
      .single();

    if (error && error.code === 'PGRST116') {
      const legacy = await supabase
        .from("telegram_users")
        .select("*")
        .eq("telegram_chat_id", chatId)
        .single();
      
      if (!legacy.error && legacy.data) {
        return {
          user_id: legacy.data.telegram_chat_id,
          username: legacy.data.telegram_username,
          is_pro: legacy.data.is_pro || false,
          watchlist: legacy.data.watchlist || [],
        };
      }
    }

    return error ? null : data;
  } catch (err) {
    console.error("User query error:", err);
    return null;
  }
};

const upsertUser = async (chatId, userData) => {
  if (!supabase) return null;
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("users")
      .upsert({
        user_id: chatId,
        ...userData,
        last_active: now,
      }, { onConflict: 'user_id' });
    return error ? null : data;
  } catch (err) {
    console.error("User upsert error:", err);
    return null;
  }
};

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

const getProUsers = async () => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_pro", true);
    
    if (error) {
      const legacy = await supabase
        .from("telegram_users")
        .select("*")
        .eq("is_pro", true);
      
      if (!legacy.error && legacy.data) {
        return legacy.data.map(u => ({
          user_id: u.telegram_chat_id,
          telegram_chat_id: u.telegram_chat_id,
          username: u.telegram_username,
          is_pro: u.is_pro,
          watchlist: u.watchlist || [],
        }));
      }
      return [];
    }

    return data.map(u => ({
      ...u,
      telegram_chat_id: u.user_id,
    })) || [];
  } catch (err) {
    console.error("Pro users query error:", err);
    return [];
  }
};

module.exports = {
  supabase,
  upsertTelegramUserFromCtx,
  upsertTelegramUserLegacy,
  getUserByChatId,
  upsertUser,
  addWatchlist,
  removeWatchlist,
  getProUsers,
};
