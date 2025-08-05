import { supabase } from './supabase';
import type { AudioDBSong } from './theaudiodb';

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

    const { data: songs, error: songsError } = await supabase
        .from('tracks')
        .select('*')
        .in('id', songIds);

    if (songsError || !songs) {
        console.error('Error fetching songs:', songsError);
        return [];
    }

    return songs as AudioDBSong[];  // Cast if appropriate
}
