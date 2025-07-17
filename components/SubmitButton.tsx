import React from 'react';
import { Button, View } from 'react-native';

interface Props {
    title: string;
    onPress: () => void;
    disabled?: boolean;
}

export default function SubmitButton({ title, onPress, disabled }: Props) {
    return (
        <View style={{ width: '100%', marginBottom: 10 }}>
            <Button title={title} onPress={onPress} color="#1DB954" disabled={disabled} />
        </View>
    );
}