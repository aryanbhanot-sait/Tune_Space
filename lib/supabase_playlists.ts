import { supabase } from './supabase';

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  cover?: string | null;
  songs: any[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchUserPlaylists(userId: string): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user playlists:', error);
    return [];
  }

  return data || [];
}

export async function createPlaylist(
  userId: string,
  name: string,
  description?: string,
  cover?: string,
  isPublic: boolean = false
): Promise<Playlist | null> {
  const newPlaylist = {
    user_id: userId,
    name,
    description: description || null,
    cover: cover || null,
    songs: [],
    is_public: isPublic,
  };

  const { data, error } = await supabase.from('playlists').insert(newPlaylist).select().single();

  if (error) {
    console.error('Error creating playlist:', error);
    return null;
  }

  return data;
}

export async function updatePlaylist(
  playlistId: string,
  updates: Partial<Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId);

  if (error) {
    console.error('Error updating playlist:', error);
    return false;
  }

  return true;
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  if (error) {
    console.error('Error deleting playlist:', error);
    return false;
  }

  return true;
}