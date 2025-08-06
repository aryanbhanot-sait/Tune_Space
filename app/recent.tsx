import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { fetchSongById, AudioDBSong } from '../lib/theaudiodb';
import AnimatedTitle from '../components/animated_title';
import { Ionicons } from '@expo/vector-icons';

export default function RecentlyListenedScreen() {
  const [recentSongs, setRecentSongs] = useState<AudioDBSong[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadRecent = async () => {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('recently_listened')
        .select('song_id')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading recent songs:', error);
        setLoading(false);
        return;
      }
      const ids = data.map((r: { song_id: string }) => r.song_id);
      const songs = await Promise.all(ids.map(id => fetchSongById(id).catch(() => null)));
      setRecentSongs(songs.filter((s): s is AudioDBSong => s !== null));
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
      <AnimatedTitle>🕒 Recently Listened</AnimatedTitle>
      {recentSongs.length === 0 ? (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 30 }}>No recently listened songs found.</Text>
      ) : (
        <FlatList
          data={recentSongs}
          keyExtractor={(item) => item.idTrack}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: `/songs/${item.idTrack}`,
                  params: {
                    tracklist: recentSongs.map((s) => s.idTrack).join(','),
                  },
                })
              }
            >
              <Image
                source={{ uri: item.strTrackThumb || item.strAlbumThumb || 'https://via.placeholder.com/60' }}
                style={styles.thumbnail}
              />
              <View style={styles.info}>
                <Text style={styles.title}>{item.strTrack}</Text>
                <Text style={styles.artist}>{item.strArtist}</Text>
                <Text style={styles.album}>{item.strAlbum || ''}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modern Footer Bar */}
      <View style={styles.footerBar}>
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.fabSelected}
            activeOpacity={1}
          >
            <Ionicons name="time-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fabLabelSelected}>Recent</Text>
        </View>

        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.fabNormal}
            onPress={() => router.replace('/liked')}
          >
            <Ionicons name="heart-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Liked</Text>
        </View>

        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.fabNormal}
            onPress={() => router.replace('/home')}
          >
            <Ionicons name="home-outline" size={30} color="#fff" />

          </TouchableOpacity>
          <Text style={styles.fabLabel}>Home</Text>
        </View>

        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.fabNormal}
            onPress={() => router.replace('/settings')}
          >
            <Ionicons name="settings-outline" size={36} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Settings</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 35,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    marginHorizontal: 16,
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
  album: {
    color: '#bbb',
    fontSize: 13,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  footerBar: {
    position: "absolute",
    bottom: 0,
    paddingBottom: 22,
    right: 25,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 30,
    backgroundColor: "#191c24",
    borderTopWidth: 2,
    borderTopColor: "#23272f",
    paddingTop: 12,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    left: 0,
    width: "100%",
    justifyContent: "center"
  },
  fabNormal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#232c45",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 8,
  },
  fabLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 5,
    textAlign: "center",
  },
  fabSelected: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
    elevation: 9,
    shadowColor: "#59f79b",
    shadowOpacity: 0.55,
    shadowOffset: { width: 1, height: 3 },
    shadowRadius: 12,
    transform: [{ scale: 1.1 }],
    borderWidth: 2,
    borderColor: "#ffd309",
  },
  fabLabelSelected: {
    color: "#ffd309",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
    textShadowColor: "#0005",
    textShadowRadius: 3,
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: "center",
  },
});
