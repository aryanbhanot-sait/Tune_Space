import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { isSongLiked, addSongLike, removeSongLike } from '../../lib/liked_songs';
import { Audio } from 'expo-av';
import { AudioDBSong, fetchSongById } from '../../lib/theaudiodb';
import { recordRecentlyListened } from '../../lib/supabase_recently_listened';


export default function SongPlayer() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [song, setSong] = useState<AudioDBSong | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    const [isLiked, setIsLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    const [userId, setUserId] = useState<string | null>(null);

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

    useEffect(() => {
        async function loadSong() {
            if (!id) return;
            setLoading(true);
            try {
                const songData = await fetchSongById(id);
                setSong(songData);
            } catch (err) {
                console.error('Failed to fetch song:', err);
                setSong(null);
            } finally {
                setLoading(false);
            }
        }
        loadSong();

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            setIsPlaying(false);
        };
    }, [id]);

    useEffect(() => {
        if (!id || !userId) {
            setIsLiked(false);
            return;
        }
        (async () => {
            const liked = await isSongLiked(userId, id);
            setIsLiked(liked);
        })();
    }, [id, userId]);

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

                // Record recently listened here
                await recordRecentlyListened(userId, song.idTrack);

                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && !status.isPlaying) {
                        setIsPlaying(false);
                    }
                });
            } else {
                if (isPlaying) {
                    await soundRef.current.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await soundRef.current.playAsync();
                    setIsPlaying(true);

                    // Record recently listened here
                    await recordRecentlyListened(userId, song.idTrack);
                }
            }
        } catch (error) {
            console.error('Audio playback error:', error);
        }

        try {
            if (!soundRef.current) {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: song.preview },
                    { shouldPlay: true }
                );
                soundRef.current = sound;
                setIsPlaying(true);
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && !status.isPlaying) {
                        setIsPlaying(false);
                    }
                });
            } else {
                if (isPlaying) {
                    await soundRef.current.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await soundRef.current.playAsync();
                    setIsPlaying(true);
                }
            }
        } catch (error) {
            console.error('Audio playback error:', error);
        }
    };

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

                <TouchableOpacity
                    style={styles.playPauseButton}
                    onPress={onPlayPause}
                    disabled={!song.preview}
                >
                    <Ionicons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={88}
                        color={song.preview ? '#1DB954' : '#555'}
                    />
                </TouchableOpacity>

                {/* Like Button */}
                <TouchableOpacity
                    style={{ marginTop: 24 }}
                    onPress={toggleLike}
                    disabled={likeLoading}
                >
                    <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={40}
                        color={isLiked ? '#1DB954' : '#aaa'}
                    />
                </TouchableOpacity>

                {!song.preview && (
                    <Text style={styles.noPreviewText}>No audio preview available.</Text>
                )}
            </View>

            {/* Modern Footer Bar with Home and Settings */}
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
    playPauseButton: {
        marginTop: 10,
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
});
