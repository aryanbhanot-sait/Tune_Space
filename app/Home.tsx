import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import supabase from '../lib/supabase';
import { getUserById } from '../lib/supabase_crud';
import { router, Link } from 'expo-router';

export default function HomePage() {
  const [userFullName, setUserFullName] = useState('');

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) {
        router.replace('/');
        return;
      }
      getUserById(session.user.id).then(user => {
        if (user && isMounted) setUserFullName(`${user.first_name} ${user.last_name}`);
      });
    });
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {userFullName}</Text>
      <Link href="/settings">
        <Text style={styles.settingsText}>Settings ⚙️</Text>
      </Link>
      <Button title="Logout" color="#1DB954" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", padding: 20 },
  title: { color: "#1DB954", fontSize: 28, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  settingsText: { color: "#1DB954", fontSize: 18, marginVertical: 20 }
});
