import { supabase } from './supabase'; // Assuming you have a Supabase client setup

// Function to check if a user has liked a song
export async function isSongLiked(userId: string, songId: string): Promise<boolean> {
  if (!userId || !songId) return false;
  const { data, error } = await supabase
    .from('liked_songs')
    .select('id')
    .eq('user_id', userId)
    .eq('song_id', songId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the code for "no rows found"
    console.error('Error checking if song is liked:', error);
    return false;
  }
  return !!data;
}

// Function to like a song
export async function likeSong(userId: string, songId: string) {
  if (!userId || !songId) return;
  const { error } = await supabase
    .from('liked_songs')
    .insert([{ user_id: userId, song_id: songId }]);

  if (error) {
    console.error('Error liking song:', error);
  }
}

// Function to unlike a song
export async function unlikeSong(userId: string, songId: string) {
  if (!userId || !songId) return;
  const { error } = await supabase
    .from('liked_songs')
    .delete()
    .eq('user_id', userId)
    .eq('song_id', songId);

  if (error) {
    console.error('Error unliking song:', error);
  }
}

// Function to get all liked songs for a user
export async function fetchLikedSongs(userId: string): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('liked_songs')
    .select('song_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching liked songs:', error);
    return [];
  }
  return data.map(item => item.song_id);
}