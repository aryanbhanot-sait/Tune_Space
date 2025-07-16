import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AuthInput from '../components/AuthInput';
import SubmitButton from '../components/SubmitButton';
import { supabase } from '../lib/supabase';
import { createUser } from '../lib/supabase_crud';

interface Props {
  onSignIn: () => void;
}

export default function SignUp({ onSignIn }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setErrorMsg('');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setErrorMsg(error?.message ?? 'Could not sign up.');
      setLoading(false);
      return;
    }
    try {
      await createUser({ uuid: data.user.id, first_name: firstName, last_name: lastName, email });
      onSignIn();
    } catch (err: any) {
      setErrorMsg('Error saving user details.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <AuthInput placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <AuthInput placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <AuthInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <AuthInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <SubmitButton title={loading ? "Signing Up..." : "Sign Up"} onPress={handleSignUp} disabled={loading} />
      <TouchableOpacity onPress={onSignIn}>
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", padding: 20 },
  title: { color: "#1DB954", fontSize: 28, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  error: { color: "#D32F2F", textAlign: "center", marginBottom: 10 },
  link: { color: "#1DB954", marginTop: 20, fontSize: 16 },
});
