import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { getUserById } from '../lib/supabase_crud';

interface Props {
  userId: string | null;
  onLogout: () => void;
  goSettings: () => void;
}

export default function Home({ userId, onLogout, goSettings }: Props) {
  const [userFullName, setUserFullName] = useState('');

  useEffect(() => {
    if (!userId) return;
    getUserById(userId).then(user => {
      if (user) setUserFullName(`${user.first_name} ${user.last_name}`);
    });
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {userFullName}</Text>
      <TouchableOpacity onPress={goSettings} style={styles.settingsButton}>
        <Text style={styles.settingsText}>Settings ⚙️</Text>
      </TouchableOpacity>
      <Button title="Logout" color="#1DB954" onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", padding: 20 },
  title: { color: "#1DB954", fontSize: 28, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  settingsButton: { marginVertical: 20 },
  settingsText: { color: "#1DB954", fontSize: 18 }
});
