import { supabase } from './supabase';
import { validate as validateUUID } from 'uuid';

export async function fetchLikedSongs(userId: string): Promise<string[]> {
  if (!validateUUID(userId)) {
    console.error('fetchLikedSongs: invalid UUID userId:', userId);
    return [];
  }

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
  if (!validateUUID(userId)) {
    console.error('isSongLiked: invalid UUID userId:', userId);
    return false;
  }
  if (!validateUUID(songId)) {
    console.error('isSongLiked: invalid UUID songId:', songId);
    return false;
  }

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
  if (!validateUUID(userId)) {
    throw new Error('addSongLike: invalid UUID userId: ' + userId);
  }
  if (!validateUUID(songId)) {
    throw new Error('addSongLike: invalid UUID songId: ' + songId);
  }

  const { error } = await supabase.from('liked_songs').insert({ user_id: userId, song_id: songId });
  if (error) throw error;
}

export async function removeSongLike(userId: string, songId: string) {
  if (!validateUUID(userId)) {
    throw new Error('removeSongLike: invalid UUID userId: ' + userId);
  }
  if (!validateUUID(songId)) {
    throw new Error('removeSongLike: invalid UUID songId: ' + songId);
  }

  const { error } = await supabase
    .from('liked_songs')
    .delete()
    .eq('user_id', userId)
    .eq('song_id', songId);

  if (error) throw error;
}
