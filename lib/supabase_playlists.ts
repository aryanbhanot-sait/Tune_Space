import { supabase } from './supabase';

export interface Playlist {
  id: string;
  name: string;
  cover: string | null;
  numberOfSongs: number;
}

export async function fetchUserPlaylists(userId: string): Promise<Playlist[]> {
  if (!userId) return [];
  // Example: Adjust "playlists" and field names to match your Supabase table
  const { data, error } = await supabase
    .from('playlists')
    .select('id, name, cover, songs')
    .eq('user_id', userId);

  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map((playlist: any) => ({
    id: playlist.id,
    name: playlist.name,
    cover: playlist.cover, // or default/placeholder if null
    numberOfSongs: playlist.songs ? playlist.songs.length : 0,
  }));
}
