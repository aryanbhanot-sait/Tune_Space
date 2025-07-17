import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export default function AuthInput(props: TextInputProps) {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor="#B3B3B3"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#232323",
    color: "#FFFFFF",
    width: '100%',
    marginBottom: 10,
    padding: 12,
    borderRadius: 6,
  },
});