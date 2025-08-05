import { supabase } from './supabase';
import type { AudioDBSong } from './theaudiodb';

import { fetchSongById } from './theaudiodb'; // Your external API fetching function

export async function fetchRecentlyListenedSongs(userId: string): Promise<AudioDBSong[]> {
  const { data: recentData, error: recentError } = await supabase
    .from('recently_listened')
    .select('song_id')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(10);

  if (recentError || !recentData) {
    console.error('Error fetching recently listened:', recentError);
    return [];
  }

  if (recentData.length === 0) return [];

  const songIds = recentData.map(row => row.song_id);

  const songsPromises = songIds.map(id =>
    fetchSongById(id).catch(error => {
      console.error(`Failed to fetch song data for id ${id}:`, error);
      return null;
    })
  );

  const songs = await Promise.all(songsPromises);

  return songs.filter((song): song is AudioDBSong => song !== null);
}


export async function recordRecentlyListened(userId: string, songId: string) {
    const { data: existing, error } = await supabase
        .from('recently_listened')
        .select('*')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .limit(1);

    if (error) {
        console.error(error);
        return false;
    }

    if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
            .from('recently_listened')
            .update({ played_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('song_id', songId);

        if (updateError) {
            console.error(updateError);
            return false;
        }
    } else {
        const { error: insertError } = await supabase
            .from('recently_listened')
            .insert([{ user_id: userId, song_id: songId, played_at: new Date().toISOString() }]);

        if (insertError) {
            console.error(insertError);
            return false;
        }
    }

    return true;
}