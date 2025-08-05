import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchLikedSongs } from '../lib/liked_songs';
import { fetchSongById, AudioDBSong } from '../lib/theaudiodb';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import AnimatedTitle from '../components/animated_title';

export default function LikedSongsScreen() {
  const [likedSongs, setLikedSongs] = useState<AudioDBSong[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadLiked = async () => {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return;

      const songIds = await fetchLikedSongs(userId);
      const songs = await Promise.all(songIds.map(id => fetchSongById(id)));
      const filtered = songs.filter((s): s is AudioDBSong => s !== null);
      setLikedSongs(filtered);
      setLoading(false);
    };

    loadLiked();
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
      <AnimatedTitle>❤️ Liked Songs</AnimatedTitle>
      <FlatList
        data={likedSongs}
        keyExtractor={(item) => item.idTrack}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
            router.push({
                pathname: `/songs/${item.idTrack}`,
                params: {
                tracklist: likedSongs.map((s) => s.idTrack).join(','),
                },
                        })
                    }

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

      {/* Modern Footer Bar with Home and Settings */}
      <View style={styles.footerBar}>
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.fabSelected}
            activeOpacity={1}
          >
            <Ionicons name="heart-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fabLabelSelected}>Liked</Text>
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
    paddingHorizontal: 16,
    paddingTop: 35,
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
  footerBar: {
    position: "absolute",
    bottom: 0,
    paddingBottom: 22,
    right: 25,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 30,
    backgroundColor: "#191c24", // same or similar to your main bg
    borderTopWidth: 2, // or 1 for more subtle
    borderTopColor: "#23272f", // slightly lighter than bg for gentle effect
    paddingTop: 12,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    // If you want it to stretch (optional):
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
    width: 66, // 110% of 60
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
    transform: [{ scale: 1.1 }], // scale up 110%
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
