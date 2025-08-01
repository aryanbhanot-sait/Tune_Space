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
import { Audio } from 'expo-av';
import { AudioDBSong, fetchSongById } from '../../lib/theaudiodb';

export default function SongPlayer() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [song, setSong] = useState<AudioDBSong | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    // Fetch song details by id when id changes
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
            // cleanup on unmount
            if (soundRef.current) {
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            setIsPlaying(false);
        };
    }, [id]);

    // Play or pause audio preview
    const onPlayPause = async () => {
        if (!song?.preview) return;

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
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
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

                {!song.preview && (
                    <Text style={styles.noPreviewText}>No audio preview available.</Text>
                )}
            </View>

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
        flex: 1,
        backgroundColor: "#121212",
        paddingTop: 60,

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
