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
import { useLocalSearchParams } from 'expo-router';
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
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
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
