import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getUserById, updateUser, deleteUser } from '../lib/supabase_crud';
import { supabase } from '../lib/supabase';

interface Props {
  userId: string | null;
  onBack: () => void;
  onSignOut: () => void;
}

export default function Settings({ userId, onBack, onSignOut }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!userId) return;
    getUserById(userId).then(user => {
      if (user) {
        setFirstName(user.first_name);
        setLastName(user.last_name);
        setEmail(user.email);
      }
    });
  }, [userId]);

  const handleUpdate = async () => {
    setMsg('');
    try {
      await updateUser(userId as string, { first_name: firstName, last_name: lastName, email });
      setMsg('Account info updated!');
    } catch (err: any) {
      setMsg('Update failed.');
    }
  };

  const handleDelete = async () => {
    setMsg('');
    Alert.alert('Are you sure?', 'This will delete your account forever!', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteUser(userId as string);
          await supabase.auth.signOut();
          onSignOut();
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Settings</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" />
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize='none' />
      <Button title="Update Info" color="#1DB954" onPress={handleUpdate} />
      <Button title="Delete Account" color="#D32F2F" onPress={handleDelete} />
      <Button title="Back" onPress={onBack} />
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", padding: 20 },
  title: { color: "#1DB954", fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { backgroundColor: "#232323", color: "#fff", width: '100%', marginBottom: 12, padding: 12, borderRadius: 6 },
  msg: { color: "#FFFFFF", textAlign: "center", marginVertical: 12 }
});
