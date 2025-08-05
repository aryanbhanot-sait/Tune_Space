import { supabase } from './supabase';
import type { AudioDBSong } from './theaudiodb';

export async function fetchRecentlyListenedSongs(userId: string): Promise<AudioDBSong[]> {
    const { data, error } = await supabase
        .from('recently_listened')
        .select('song_id')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(10);

    if (error || !data) {
        console.error(error);
        return [];
    }

    // Now fetch songs details by IDs
    const songIds = data.map(row => row.song_id);

    const { data: songs, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .in('id', songIds);

    if (songsError || !songs) {
        console.error(songsError);
        return [];
    }

    return songs;
}