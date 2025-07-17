import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AuthInput from '../components/AuthInput';
import SubmitButton from '../components/SubmitButton';
import { supabase } from '../lib/supabase';
import { getUserById } from '../lib/supabase_crud';
import { router, Link } from 'expo-router';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    setErrorMsg('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setErrorMsg(error?.message ?? 'Unable to log in');
      return;
    }
    try {
      await getUserById(data.user.id);
      router.replace('/home');
    } catch {
      setErrorMsg('User does not exist in the database.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TuneSpace</Text>
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <AuthInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <AuthInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <SubmitButton title="Sign In" onPress={handleSignIn} />
      <Link href="/signup">
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", padding: 20 },
  title: { color: "#1DB954", fontSize: 28, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  error: { color: "#D32F2F", textAlign: "center", marginBottom: 10 },
  link: { color: "#1DB954", marginTop: 20, fontSize: 16 },
});
