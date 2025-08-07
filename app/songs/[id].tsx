import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Linking,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { isSongLiked, addSongLike, removeSongLike } from '../../lib/liked_songs';
import { Audio } from 'expo-av';
import { AudioDBSong, fetchSongById } from '../../lib/theaudiodb';
import { recordRecentlyListened } from '../../lib/supabase_recently_listened';

export default function SongPlayer() {
    // ----- SUPPORT PLAYLIST from NAV PARAMS -----
    const { id, tracklist } = useLocalSearchParams<{ id: string, tracklist?: string }>(); // NEW

    // Prepare tracklist (playlist of song IDs) if given. Else use [id].
    const [playlist, setPlaylist] = useState<string[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);

    // Song state
    const [song, setSong] = useState<AudioDBSong | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    const [isLiked, setIsLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // --- Extract playlist or fallback ---
    useEffect(() => {
        let list: string[] = [];
        if (tracklist) {
            list = tracklist.split(',').filter(Boolean);
        }
        if (list.length === 0 && id) list = [id as string];
        setPlaylist(list);

        // set currentIdx to the right position in the playlist (in case direct link into middle of playlist)
        let i = list.indexOf(id as string);
        setCurrentIdx(i === -1 ? 0 : i);
    }, [id, tracklist]);

    // --- Fetch user ---
    useEffect(() => {
        async function fetchUserId() {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data?.user) {
                setUserId(null);
            } else {
                setUserId(data.user.id);
            }
        }
        fetchUserId();
    }, []);

    // --- Load song by playlist/currentIdx ---
    useEffect(() => {
        async function loadSong() {
            if (!playlist.length) return;
            setLoading(true);
            try {
                // Unload current sound if present
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }

                const songData = await fetchSongById(playlist[currentIdx]);
                setSong(songData);

                // Auto play song when loaded
                if (songData?.preview && userId) {
                    const { sound } = await Audio.Sound.createAsync(
                        { uri: songData.preview },
                        { shouldPlay: true }
                    );
                    soundRef.current = sound;
                    setIsPlaying(true);

                    await recordRecentlyListened(userId, songData.idTrack);

                    sound.setOnPlaybackStatusUpdate((status) => {
                        if (status.isLoaded && !status.isPlaying) setIsPlaying(false);
                    });
                } else {
                    setIsPlaying(false);
                }
            } catch (err) {
                setSong(null);
            } finally {
                setLoading(false);
            }
        }
        loadSong();

        return () => {
            // Clean up when leaving or changing song
            if (soundRef.current) {
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            setIsPlaying(false);
        };
    }, [playlist, currentIdx, userId]);

    // --- Like status for current song
    useEffect(() => {
        if (!song?.idTrack || !userId) {
            setIsLiked(false);
            return;
        }
        (async () => {
            const liked = await isSongLiked(userId, song.idTrack);
            setIsLiked(liked);
        })();
    }, [song?.idTrack, userId]);

    // --- Like/Unlike button logic --
    const toggleLike = async () => {
        if (!userId || !song) return;
        setLikeLoading(true);
        try {
            if (isLiked) {
                await removeSongLike(userId, song.idTrack);
                setIsLiked(false);
            } else {
                await addSongLike(userId, song.idTrack);
                setIsLiked(true);
            }
        } catch (e) {
            console.error('Like toggle failed:', e);
        } finally {
            setLikeLoading(false);
        }
    };

    // --- Play/Pause toggle
    const onPlayPause = async () => {
        if (!song?.preview || !userId) return;
        try {
            if (!soundRef.current) {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: song.preview },
                    { shouldPlay: true }
                );
                soundRef.current = sound;
                setIsPlaying(true);
                await recordRecentlyListened(userId, song.idTrack);
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && !status.isPlaying) setIsPlaying(false);
                });
            } else {
                if (isPlaying) {
                    await soundRef.current.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await soundRef.current.playAsync();
                    setIsPlaying(true);
                    await recordRecentlyListened(userId, song.idTrack);
                }
            }
        } catch (error) {
            console.error('Audio playback error:', error);
        }
    };

    // --- SKIP LOGIC ---
    const skipPrev = () => {
        if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
        else Alert.alert('This is the first song!');
    };
    const skipNext = () => {
        if (currentIdx < playlist.length - 1) setCurrentIdx(currentIdx + 1);
        else Alert.alert('This is the last song!');
    };

    // --- UI ---

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1DB954" />
            </View>
        );
    }

    if (!song) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Song not found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ paddingHorizontal: 20, alignItems: 'center' }}>
                {song.strTrackThumb ? (
                    <Image source={{ uri: song.strTrackThumb }} style={styles.coverImage} />
                ) : (
                    <View style={styles.noCoverPlaceholder}>
                        <Ionicons name="musical-notes-outline" size={96} color="#888" />
                    </View>
                )}

                <Text style={styles.title}>{song.strTrack}</Text>
                <Text style={styles.artist}>{song.strArtist}</Text>
                <Text style={styles.album}>
                    {song.strAlbum} {song.intYearReleased ? `(${song.intYearReleased})` : ''}
                </Text>

                {/* SKIP + PLAY/PAUSE BUTTON BAR */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 35, marginVertical: 24 }}>
                    <TouchableOpacity
                        onPress={skipPrev}
                        disabled={currentIdx === 0}
                        style={[styles.skipButton, currentIdx === 0 && { opacity: 0.5 }]}
                    >
                        <Ionicons name="play-skip-back" size={52} color={currentIdx === 0 ? '#555' : '#1DB954'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onPlayPause}
                        disabled={!song.preview}
                    >
                        <Ionicons
                            name={isPlaying ? 'pause-circle' : 'play-circle'}
                            size={88}
                            color={song.preview ? '#1DB954' : '#555'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={skipNext}
                        disabled={currentIdx === playlist.length - 1}
                        style={[styles.skipButton, currentIdx === playlist.length - 1 && { opacity: 0.5 }]}
                    >
                        <Ionicons name="play-skip-forward" size={52} color={currentIdx === playlist.length - 1 ? '#555' : '#1DB954'} />
                    </TouchableOpacity>
                </View>

                {/* Like & Download Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40, marginTop: 5 }}>
                    {/* Like Button */}
                    <TouchableOpacity
                        style={{}}
                        onPress={toggleLike}
                        disabled={likeLoading}
                    >
                        <Ionicons
                            name={isLiked ? 'heart' : 'heart-outline'}
                            size={40}
                            color={isLiked ? '#1DB954' : '#aaa'}
                        />
                    </TouchableOpacity>

                    {/* Download Button */}
                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => Linking.openURL('https://www.bensound.com/royalty-free-music?tag[]=ordinary&sort=relevance')}
                    >
                        <Ionicons name="download-outline" size={36} color="#fff" />
                        <Text style={styles.downloadButtonText}>Download Music</Text>
                    </TouchableOpacity>
                </View>

                {!song.preview && (
                    <Text style={styles.noPreviewText}>No audio preview available.</Text>
                )}
            </View>

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
        flex: 1,
        paddingTop: 60,
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
    coverImage: {
        width: 280,
        height: 280,
        borderRadius: 12,
        marginBottom: 30,
    },
    noCoverPlaceholder: {
        width: 280,
        height: 280,
        borderRadius: 12,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    artist: {
        fontSize: 20,
        color: '#aaa',
        marginTop: 6,
        textAlign: 'center',
    },
    album: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
        marginBottom: 30,
        textAlign: 'center',
    },
    noPreviewText: {
        marginTop: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    errorText: {
        color: 'red',
        fontSize: 18,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        backgroundColor: '#1DB954',
        alignSelf: 'center',
    },
    downloadButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 12,
    },
    skipButton: {
        padding: 0,
    },
});
