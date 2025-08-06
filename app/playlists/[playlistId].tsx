import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Adjust as needed
import { fetchPlaylistById, updatePlaylist, Playlist } from '../../lib/supabase_playlists';
import AnimatedTitle from '../../components/animated_title';
import { searchSongsFromApi, fetchSongById, AudioDBSong } from '../../lib/theaudiodb'; // Adjust paths

export default function PlaylistDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // States
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // For detailed song info display inside the playlist
  const [songsDetails, setSongsDetails] = useState<AudioDBSong[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Search state for adding songs
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AudioDBSong[]>([]);
  const [searching, setSearching] = useState(false);

  // Get logged-in user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  // Extract playlistId from URL params
  useEffect(() => {
    if (params.playlistId) {
      setPlaylistId(params.playlistId as string);
    } else {
      Alert.alert('Invalid playlist ID');
      router.replace('/playlists');
    }
  }, [params.playlistId, router]);

  // Fetch playlist data
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

  // Load detailed song metadata for playlist songs whenever playlist changes
  useEffect(() => {
    const songs = playlist?.songs || [];
    if (songs.length === 0) {
      setSongsDetails([]);
      return;
    }
    setDetailsLoading(true);
    Promise.all(
      songs.map((s: any) =>
        fetchSongById(s.id).catch(() => null)
      )
    ).then(results => {
      setSongsDetails(results.filter((s): s is AudioDBSong => s !== null));
      setDetailsLoading(false);
    });
  }, [playlist]);

  // Remove song from playlist confirmation
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

  // Remove song handler
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

  // Song search handler
  const searchSongs = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const alreadyAddedIds = (playlist?.songs || []).map((s: any) => s.id);
    try {
      const results = await searchSongsFromApi(query);
      setSearchResults(
        (results || []).filter((song: AudioDBSong) => !alreadyAddedIds.includes(song.idTrack))
      );
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  // Add selected song from search to the playlist
  const addSongToPlaylist = async (song: AudioDBSong) => {
    if (!playlist) return;
    const updatedSongs = [...(playlist.songs || []), { id: song.idTrack }];
    setSaving(true);
    try {
      const success = await updatePlaylist(playlist.id, { songs: updatedSongs });
      if (!success) throw new Error('Failed to update playlist');
      setPlaylist(prev => prev ? { ...prev, songs: updatedSongs } : null);
      setSearchResults([]);
      setSearchQuery('');
    } catch {
      Alert.alert('Could not add the song, please try again.');
    } finally {
      setSaving(false);
    }
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

      {/* Header */}
      <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
        <AnimatedTitle>{playlist.name}</AnimatedTitle>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between',
            gap: 10,
            position: 'relative',
            top: -40,
            paddingHorizontal: 10,
          }}
        >
            {playlist.description ? <Text style={styles.description}>{playlist.description}</Text> : null}
            <Text style={styles.meta}>
              Created on {createdDate} · {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </Text>
        </View>
      </View>

      {/* Search Songs to Add */}
      <View style={{ marginBottom: 18, paddingHorizontal: 20 }}>
        <TextInput
          placeholder="Search for a song to add"
          placeholderTextColor="#888"
          style={{
            backgroundColor: '#23272f',
            borderRadius: 10,
            padding: 10,
            color: '#fff',
            marginBottom: 6,
          }}
          value={searchQuery}
          onChangeText={searchSongs}
          editable={!saving}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searching && <ActivityIndicator size="small" color="#1DB954" style={{ marginTop: 5 }} />}

        {searchResults.length > 0 && (
          <FlatList
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            data={searchResults}
            keyExtractor={item => item.idTrack}
            style={{
              maxHeight: 300,
              borderRadius: 8,
              backgroundColor: '#23272f',
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.songCard}
                onPress={() => addSongToPlaylist(item)}
                disabled={saving}
              >
                <Image
                  source={{ uri: item.strTrackThumb || item.strAlbumThumb || 'https://via.placeholder.com/60' }}
                  style={styles.songArt}
                />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{item.strTrack}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{item.strArtist}</Text>
                  {item.strAlbum ? <Text style={styles.songAlbum} numberOfLines={1}>{item.strAlbum}</Text> : null}
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {!searching && searchQuery && searchResults.length === 0 && (
          <Text style={{ color: '#888', marginTop: 8, paddingLeft: 4 }}>
            No songs found matching your query.
          </Text>
        )}
      </View>

      {/* Playlist Songs List */}
      {detailsLoading ? (
        <ActivityIndicator size="small" color="#1DB954" />
      ) : songsDetails.length === 0 ? (
        <Text style={styles.noSongsText}>No songs in this playlist yet.</Text>
      ) : (
        <FlatList
          data={songsDetails}
          keyExtractor={(item) => item.idTrack}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                onPress={() =>
                  router.push({
                    pathname: `/songs/${item.idTrack}`,
                    params: { tracklist: songsDetails.map(s => s.idTrack).join(',') },
                  })
                }
                disabled={saving}
              >
                <Image
                  source={{ uri: item.strTrackThumb || item.strAlbumThumb || 'https://via.placeholder.com/60' }}
                  style={styles.thumbnail}
                />
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={1}>{item.strTrack || 'Unknown Title'}</Text>
                  <Text style={styles.artist} numberOfLines={1}>{item.strArtist || 'Unknown Artist'}</Text>
                  <Text style={styles.album} numberOfLines={1}>{item.strAlbum || ''}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => confirmRemoveSong(index)}
                style={styles.removeButton}
                disabled={saving}
              >
                <Ionicons name="close-circle" size={24} color="#d9534f" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Footer Bar */}
      <View style={styles.footerBar}>
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.fabNormal}
            onPress={() => router.replace('/recent')}
          >
            <Ionicons name="time-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Recent</Text>
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
    backgroundColor: '#121212',
    flexGrow: 1,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  artist: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  album: {
    color: '#bbb',
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSongsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#1DB954',
    alignSelf: 'center',
    width: 130,
  },
  addSongsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
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
  // Search result song cards styles reused from prior
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f3a',
  },
  songArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  songArtist: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  songAlbum: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },
});
