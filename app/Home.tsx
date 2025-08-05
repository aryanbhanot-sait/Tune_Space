import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { getUserById } from '../lib/supabase_crud';
import { router } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import AnimatedTitle from '../components/animated_title';
import { fetchTrendingSongs, AudioDBSong } from '../lib/theaudiodb';
import { fetchUserPlaylists } from '../lib/supabase_playlists';
import { fetchRecentlyListenedSongs } from '../lib/supabase_recently_listened';



export default function HomePage() {
  const [userFullName, setUserFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [trending, setTrending] = useState<AudioDBSong[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [recentlyListened, setRecentlyListened] = useState<AudioDBSong[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [loadingRecentlyListened, setLoadingRecentlyListened] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);


  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) {
        router.replace('/');
        return;
      }
      setUserId(session.user.id);
      getUserById(session.user.id).then(user => {
        if (user && isMounted) setUserFullName(`${user.first_name} ${user.last_name}`);
      });
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    fetchTrendingSongs(12).then(songs => {
      setTrending(songs);
      setLoadingTrending(false);
    });
  }, []);

  useEffect(() => {
    if (trending.length > 0) {
      const mappedSongs = trending.map(song => ({
        id: song.idTrack,
        title: song.strTrack || '',
        artist: song.strArtist || '',
        album: song.strAlbum || '',
      }));
      setAllSongs(mappedSongs);
    }
  }, [trending]);

  useEffect(() => {
    if (!userId) return;
    setLoadingRecentlyListened(true);
    fetchRecentlyListenedSongs(userId).then(songs => {
      setRecentlyListened(songs);
      setLoadingRecentlyListened(false);
    }).catch(() => {
      setRecentlyListened([]);
      setLoadingRecentlyListened(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchUserPlaylists(userId).then((pls: any[]) => {
      setPlaylists(pls);
      setLoadingPlaylists(false);
    });
  }, [userId]);

  const goToPlaylist = (playlistId: string) => {
    router.push(`/playlists/${playlistId}`);
  };
  const goToCreatePlaylist = () => {
    router.push('/playlists');
  };

  const goToSong = (songId: string) => {
    router.push(`/songs/${songId}`);
  };

  const searchMusic = (query: string) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }
    const lowerq = query.toLowerCase();
    const filtered = allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerq) ||
        song.artist.toLowerCase().includes(lowerq) ||
        song.album?.toLowerCase().includes(lowerq)
    );
    setSearchResults(filtered);
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <AnimatedTitle>{`Hi, ${userFullName}`}</AnimatedTitle>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by song, artist, or album…"
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchMusic(text);
        }}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {/* (Optional) Show Results Dropdown */}
      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/songs/${item.id}`)}
              style={styles.resultItemTouchable}
            >
              <Text style={styles.resultItem}>
                {item.title} - {item.artist} {item.album ? `(${item.album})` : ''}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.resultsList}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        />
      )}

      <ScrollView
        style={{ width: "100%", flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="flame-outline" size={22} color="#FFD700" /> Trending Songs
          </Text>
          {loadingTrending ? (
            <ActivityIndicator size="small" color="#1DB954" style={{ marginTop: 10 }} />
          ) : (
            <FlatList
              data={trending}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.idTrack}
              contentContainerStyle={{ gap: 18, paddingVertical: 5, paddingLeft: 2 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.songCard}
                  onPress={() => goToSong(item.idTrack)}
                >
                  <Image
                    source={{ uri: item.strTrackThumb || item.strAlbumThumb || undefined }}
                    style={styles.songArt}
                  />
                  <Text style={styles.songTitle} numberOfLines={1}>{item.strTrack}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{item.strArtist}</Text>
                  <Text style={styles.songAlbum} numberOfLines={1}>
                    {item.strAlbum} {item.intYearReleased ? `(${item.intYearReleased})` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time-outline" size={22} color="#1DB954" /> Recently Listened
          </Text>
          {loadingRecentlyListened ? (
            <ActivityIndicator size="small" color="#1DB954" style={{ marginTop: 10 }} />
          ) : (
            <FlatList
              data={recentlyListened}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.idTrack}
              contentContainerStyle={{ gap: 18, paddingVertical: 5, paddingLeft: 2 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.songCard}
                  onPress={() => goToSong(item.idTrack)}
                >
                  <Image
                    source={{ uri: item.strTrackThumb || item.strAlbumThumb || undefined }}
                    style={styles.songArt}
                  />
                  <Text style={styles.songTitle} numberOfLines={1}>{item.strTrack}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{item.strArtist}</Text>
                  <Text style={styles.songAlbum} numberOfLines={1}>
                    {item.strAlbum} {item.intYearReleased ? `(${item.intYearReleased})` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <View style={styles.section} >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle} onPress={goToCreatePlaylist} >
              <Ionicons name="musical-notes-outline" size={22} color="#1DB954" onPress={goToCreatePlaylist} /> Your Playlists
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={goToCreatePlaylist}>
              <Ionicons name="add-circle-outline" size={36} color="#1DB954" />
            </TouchableOpacity>
          </View>
          {loadingPlaylists ? (
            <ActivityIndicator size="small" color="#1DB954" style={{ marginTop: 10 }} />
          ) : playlists.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 8 }}>
              <Text style={styles.noPlaylistText}>You don't have any playlists yet.</Text>
              <TouchableOpacity style={styles.createBtn} onPress={goToCreatePlaylist}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 7 }} />
                <Text style={styles.createBtnText}>Create one now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={playlists}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              contentContainerStyle={{ gap: 18, paddingVertical: 5, paddingLeft: 2 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistCard}
                  onPress={() => goToPlaylist(item.id)}
                >
                  {item.songs && item.songs.length > 0 && item.songs[0].albumCover ? (
                    <Image source={{ uri: item.songs[0].albumCover }} style={styles.playlistArt} />
                  ) : (
                    <View style={styles.noCoverPlaceholder}>
                      <Ionicons name="musical-notes-outline" size={36} color="#888" />
                    </View>
                  )}
                  <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.playlistSub}>
                    {item.songs ? item.songs.length : 0} {item.songs && item.songs.length === 1 ? 'song' : 'songs'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

      </ScrollView>

      {/* Modern Footer Bar with Home and Settings */}
      <View style={styles.footerBar}>
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
            style={styles.fabSelected}
            activeOpacity={1}
          >
            <Ionicons name="home-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fabLabelSelected}>Home</Text>
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
    </View >
  );
};

const CARD_SIZE = 110;
const PLAYLIST_CARD_SIZE = 115;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  noCoverPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#191c24",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#191c24',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    borderColor: '#444',
    borderWidth: 1,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  resultItem: {
    padding: 10,
    color: '#fff'
  },
  resultsList: {
    maxHeight: 180,
    backgroundColor: '#23272f',
    marginHorizontal: 16,
    borderRadius: 10
  },
  top: {
    width: "100%",
    paddingTop: 30,
    height: 140,
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 48,
    textAlign: "center",
    width: "90%",
  },
  section: {
    marginTop: 12,
    marginBottom: 18,
    marginHorizontal: 20,
  },
  sectionTitle: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 19,
    marginBottom: 8,
    marginLeft: 5,
    letterSpacing: 0.3
  },
  noPlaylistText: {
    color: "#dadada",
    fontSize: 15,
    marginBottom: 4,
    fontStyle: "italic",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 6,
    elevation: 2
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  songCard: {
    alignItems: "center",
    width: CARD_SIZE,
    marginRight: 2,
    backgroundColor: "#23272f",
    borderRadius: 17,
    padding: 11,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 7,
  },
  songArt: {
    width: 68,
    height: 68,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#101010",
  },
  songTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 2,
    marginBottom: 1,
    maxWidth: 92,
  },
  songArtist: {
    color: "#AAD9B7",
    fontWeight: "400",
    fontSize: 12,
    marginBottom: 1,
    maxWidth: 92,
  },
  songAlbum: {
    color: "#CCC",
    fontWeight: "400",
    fontSize: 11,
    marginBottom: 1,
    maxWidth: 92,
  },
  addButton: {
    padding: 4,
  },
  playlistCard: {
    alignItems: "center",
    width: PLAYLIST_CARD_SIZE,
    marginRight: 2,
    backgroundColor: "#23272f",
    borderRadius: 17,
    padding: 13,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 7,
  },
  playlistArt: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#171717",
    marginBottom: 6,
  },
  playlistName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 2,
    marginBottom: 1,
    maxWidth: 94,
  },
  playlistSub: {
    color: "#B3B3B3",
    fontSize: 11,
    marginBottom: 1,
    maxWidth: 94,
  },
  resultItemTouchable: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  footerFabContainer: {
    position: "absolute",
    bottom: 38,
    right: 32,
    alignItems: "center",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
    elevation: 7,
    shadowColor: "#1DB954",
    shadowOpacity: 0.35,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 8,
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