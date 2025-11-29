import { supabase } from './supabaseClient';

export async function ensureUserProfile(userId: string, email: string): Promise<void> {
  const { error } = await supabase.from('users').upsert({
    id: userId,
    email,
    plan: 'free',
  });

  if (error) {
    console.error('Error upserting user profile:', error);
  }
}
