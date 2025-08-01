import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';    // Adjust your supabase client import path
import { fetchPlaylistById, updatePlaylist, Playlist } from '../../lib/supabase_playlists'; // Your fetch/update logic
import AnimatedTitle from '../../components/animated_title';

export default function PlaylistDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Correctly obtain playlistId from route params
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);



  // Get logged-in user ID from supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        // Handle unauthenticated user
        router.replace('/login');
      }
    });
  }, [router]);

  // Extract playlistId from params
  useEffect(() => {
    if (params.playlistId) {
      setPlaylistId(params.playlistId as string);
    } else {
      Alert.alert('Invalid playlist ID');
      router.replace('/playlists');
    }
  }, [params.playlistId, router]);

  // Fetch playlist when userId and playlistId are ready
  useEffect(() => {
    if (!userId || !playlistId) return;
    async function loadPlaylist() {
      setLoading(true);
      try {
        const p = await fetchPlaylistById(userId as string, playlistId as string);
        if (!p) {
          Alert.alert('Playlist not found or access denied');
          router.replace('/playlists');
          return;
        }
        setPlaylist(p);
      } catch (error) {
        console.error('Failed to fetch playlist', error);
        Alert.alert('Error loading playlist');
      } finally {
        setLoading(false);
      }
    }

    loadPlaylist();
  }, [userId, playlistId, router]);

  // Remove song from playlist
  const confirmRemoveSong = (index: number) => {
    Alert.alert(
      'Remove Song',
      'Are you sure you want to remove this song from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeSong(index) },
      ]
    );
  };

  const removeSong = async (index: number) => {
    if (!playlist) return;

    setSaving(true);
    try {
      const updatedSongs = [...(playlist.songs || [])];
      updatedSongs.splice(index, 1);

      const success = await updatePlaylist(playlist.id, { songs: updatedSongs });
      if (!success) throw new Error('Failed to update playlist');

      setPlaylist(prev => (prev ? { ...prev, songs: updatedSongs } : null));
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to remove the song. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Navigate to add songs page (implement that page as needed)
  const goToAddSongs = () => {
    if (!playlistId) return;
    router.push(`/playlists/${playlistId}/add-songs`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#fff' }}>Playlist not found.</Text>
      </View>
    );
  }

  const songs = playlist.songs || [];
  const createdDate = new Date(playlist.created_at).toLocaleDateString();

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedTitle>{playlist.name}</AnimatedTitle>
          {playlist.description ? <Text style={styles.description}>{playlist.description}</Text> : null}
          <Text style={styles.meta}>
            Created on {createdDate} · {songs.length} {songs.length === 1 ? 'song' : 'songs'}
          </Text>
        </View>

        {/* Songs List */}
        {songs.length === 0 ? (
          <Text style={styles.noSongsText}>No songs in this playlist yet.</Text>
        ) : (
          <View style={styles.songsContainer}>
            {songs.map((song, idx) => (
              <View key={idx} style={styles.songButton}>
                <Text numberOfLines={1} style={styles.songText}>{song.title || 'Untitled'}</Text>
                <TouchableOpacity onPress={() => confirmRemoveSong(idx)} style={styles.removeButton} disabled={saving}>
                  <Ionicons name="close-circle" size={24} color="#d9534f" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add Songs Button */}
        <TouchableOpacity style={styles.addSongsBtn} onPress={goToAddSongs} disabled={saving}>
          <Ionicons name="add-circle" size={28} color="#1DB954" />
          <Text style={styles.addSongsText}>Add More Songs</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Modern Footer Bar with Home and Settings */}
      <View style={styles.footerBar}>
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
    backgroundColor: '#121212',
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    marginBottom: 20,
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
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  description: {
    color: '#aaa',
    fontSize: 14,
  },
  meta: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  noSongsText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 40,
  },
  songsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  songButton: {
    flexDirection: 'row',
    backgroundColor: '#23272f',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    margin: 5,
    minWidth: 120,
    maxWidth: '48%',
    elevation: 3,
  },
  songText: {
    color: '#fff',
    flexShrink: 1,
    marginRight: 10,
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSongsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#1DB954',
    alignSelf: 'center',
    width: '60%',
  },
  addSongsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
  },
});
