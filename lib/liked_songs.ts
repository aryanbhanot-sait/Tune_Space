import { supabase } from './supabase';

export async function fetchLikedSongs(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('liked_songs')
    .select('song_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching liked songs:', error);
    return [];
  }
  return data.map((row: { song_id: string }) => row.song_id);
}

export async function isSongLiked(userId: string, songId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('liked_songs')
    .select('id')
    .eq('user_id', userId)
    .eq('song_id', songId)
    .single();

  if (error && error.code === 'PGRST116') return false;
  if (error) {
    console.error('Error checking like status:', error);
    return false;
  }
  return !!data;
}

export async function addSongLike(userId: string, songId: string) {
  const { error } = await supabase.from('liked_songs').insert({ user_id: userId, song_id: songId });
  if (error) throw error;
}

export async function removeSongLike(userId: string, songId: string) {
  const { error } = await supabase
    .from('liked_songs')
    .delete()
    .eq('user_id', userId)
    .eq('song_id', songId);
  if (error) throw error;
}
