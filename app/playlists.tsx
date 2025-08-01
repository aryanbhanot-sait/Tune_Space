import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { fetchUserPlaylists, createPlaylist, updatePlaylist, deletePlaylist, Playlist } from "../lib/supabase_playlists";
import { supabase } from "../lib/supabase";
import AnimatedTitle from "../components/animated_title";

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);


  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [isPublicInput, setIsPublicInput] = useState(false);
  const [saving, setSaving] = useState(false);


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

  async function loadPlaylists() {
    if (!userId) return;
    setLoading(true);
    try {
      const pls = await fetchUserPlaylists(userId);
      setPlaylists(pls);
    } catch (e) {
      console.error("Failed loading playlists", e);
      Alert.alert("Error", "Failed to load playlists. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaylists();
  }, [userId]);

  function openCreateModal() {
    setEditingPlaylist(null);
    setNameInput("");
    setDescInput("");
    setIsPublicInput(false);
    setModalVisible(true);
  }

  function openEditModal(playlist: Playlist) {
    setEditingPlaylist(playlist);
    setNameInput(playlist.name);
    setDescInput(playlist.description || "");
    setIsPublicInput(playlist.is_public);
    setModalVisible(true);
  }

  async function savePlaylist() {
    if (!nameInput.trim()) {
      Alert.alert("Validation", "Playlist name cannot be empty.");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User not logged in.");
      return;
    }
    setSaving(true);
    try {
      if (editingPlaylist) {
        // Update existing playlist
        const success = await updatePlaylist(editingPlaylist.id, {
          name: nameInput,
          description: descInput,
          is_public: isPublicInput,
        });
        if (!success) throw new Error("Failed to update playlist");
      } else {
        // Create new playlist
        const newPlaylist = await createPlaylist(userId, nameInput, descInput, isPublicInput);
        if (!newPlaylist) throw new Error("Failed to create playlist");
      }
      setModalVisible(false);
      await loadPlaylists();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save playlist. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(playlist: Playlist) {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete the playlist "${playlist.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(playlist.id),
        },
      ]
    );
  }

  async function handleDelete(playlistId: string) {
    setSaving(true);
    try {
      const success = await deletePlaylist(playlistId);
      if (!success) throw new Error("Failed to delete playlist");
      await loadPlaylists();
      Alert.alert("Deleted", "Playlist was deleted successfully.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete playlist.");
    } finally {
      setSaving(false);
    }
  }

  function renderPlaylistItem({ item }: { item: Playlist }) {
  return (
    <TouchableOpacity
      style={styles.playlistCard}
      activeOpacity={0.7}
      onPress={() => {
        if (!userId) {
          Alert.alert("Please log in to view playlists.");
          return;
        }
       router.push(`/playlists/${item.id}`);
      }}
    >
      {item.songs && item.songs.length > 0 && item.songs[0].albumCover ? (
        <Image source={{ uri: item.songs[0].albumCover }} style={styles.coverImage} />
      ) : (
        <View style={styles.noCoverPlaceholder}>
          <Ionicons name="musical-notes-outline" size={36} color="#888" />
        </View>
      )}
      <Text style={styles.playlistName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.playlistDesc} numberOfLines={1}>
        {item.description || "No description"}
      </Text>
      <View style={styles.playlistActions}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={styles.actionButton}
        >
          <Ionicons name="pencil-outline" size={18} color="#1DB954" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => confirmDelete(item)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={18} color="#d9534f" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}


  if (!userId) {
    return (
      <View style={styles.centeredView}>
        <Text style={styles.infoText}>Please log in to view your playlists.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AnimatedTitle>Your Playlists</AnimatedTitle>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add-circle-outline" size={36} color="#1DB954" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#1DB954" style={{ marginTop: 20 }} />
      ) : playlists.length === 0 ? (
        <View style={styles.centeredView}>
          <Text style={styles.infoText}>You don't have any playlists yet.</Text>
          <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 7 }} />
            <Text style={styles.createBtnText}>Create one now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={renderPlaylistItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadPlaylists();
            setRefreshing(false);
          }}
          showsVerticalScrollIndicator={false}
          numColumns={2}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <View style={styles.modalBackDrop}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingPlaylist ? "Edit Playlist" : "New Playlist"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Playlist Name *"
              placeholderTextColor={"#888"}
              value={nameInput}
              onChangeText={setNameInput}
              editable={!saving}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              placeholderTextColor={"#888"}
              value={descInput}
              onChangeText={setDescInput}
              editable={!saving}
              multiline
            />

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                onPress={() => setIsPublicInput((prev) => !prev)}
                style={styles.checkbox}
                disabled={saving}
              >
                {isPublicInput && (
                  <Ionicons name="checkmark" size={16} color="#1DB954" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Make this playlist public</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => !saving && setModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: "#888" }]}
                disabled={saving}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={savePlaylist}
                style={[styles.modalButton, { backgroundColor: "#1DB954" }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {editingPlaylist ? "Save" : "Create"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

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

// -- Styles --
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  addButton: {
    padding: 4,
    marginBottom: 40,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  infoText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 16,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  playlistCard: {
    backgroundColor: "#23272f",
    borderRadius: 15,
    padding: 12,
    margin: 8,
    width: "45%",
    alignItems: "center",
    elevation: 3,
  },
  coverImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
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
  playlistName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  playlistDesc: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
  playlistActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
  },
  modalBackDrop: {
    flex: 1,
    backgroundColor: "#000000cc",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#23272f",
    borderRadius: 15,
    padding: 20,
    maxWidth: 400,
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#fff",
    marginBottom: 15,
    backgroundColor: "#121212",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    height: 22,
    width: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#888",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#191c24",
  },
  checkboxLabel: {
    color: "#ccc",
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 15,
    marginHorizontal: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
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
