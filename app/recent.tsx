import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { fetchSongById, AudioDBSong } from '../lib/theaudiodb';
import { useRouter } from 'expo-router';

export default function RecentlyListenedScreen() {
  const [recentSongs, setRecentSongs] = useState<AudioDBSong[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadRecent = async () => {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('recently_listened')
        .select('song_id')
        .eq('user_id', userId)
        .order('listened_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading recent songs:', error);
        return;
      }

    interface RecentlyListenedRow {
        song_id: string;
    }

      const ids = data.map((r) => r.song_id);
      const songs = await Promise.all(ids.map((id) => fetchSongById(id)));
      const filtered = songs.filter((s): s is AudioDBSong => s !== null);
      setRecentSongs(filtered);
      setLoading(false);
    };

    loadRecent();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🎧 Recently Listened</Text>
      <FlatList
        data={recentSongs}
        keyExtractor={(item) => item.idTrack}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/songs/${item.idTrack}`)}
          >
            <Image
              source={{ uri: item.strTrackThumb || 'https://via.placeholder.com/60' }}
              style={styles.thumbnail}
            />
            <View style={styles.info}>
              <Text style={styles.title}>{item.strTrack}</Text>
              <Text style={styles.artist}>{item.strArtist}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  artist: {
    color: '#aaa',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});
