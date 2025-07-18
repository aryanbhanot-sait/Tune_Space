import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { signIn, signUp, getSession } from "../lib/supabase_auth";
import { useRouter } from "expo-router";
import AnimatedTitle from "../components/animated_title";

const SupabaseAuth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignIn, setIsSignIn] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await getSession();
                if (session) {
                    setSession(session);
                    router.push("/");
                }
            } catch (err) {
                console.error("Error checking session:", err);
            }
        };

        if (!session) {
            checkSession();
        }
    }, [session]);

    const handleAuth = async () => {
        if (!email || !password) {
            setError("Please enter both email and password");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isSignIn) {
                await signIn(email, password);
                setIsAuthenticated(true);
                router.push("/home");
            } else {
                await signUp(email, password);
                setIsAuthenticated(true);
                router.push("/");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>

            <AnimatedTitle>Tune Space</AnimatedTitle>
            <AnimatedTitle>{isSignIn ? "Sign In" : "Sign Up"}</AnimatedTitle>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#6a6a6a"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#6a6a6a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleAuth}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.buttonText}>
                        {isSignIn ? "Sign In" : "Sign Up"}
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setIsSignIn(!isSignIn)}
                style={styles.switchModeButton}
            >
                <Text style={styles.switchModeText}>
                    {isSignIn
                        ? "Don't have an account? Sign Up"
                        : "Already have an account? Sign In"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: "#121212",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 32,
        textAlign: "center",
        letterSpacing: 1,
    },
    input: {
        height: 50,
        borderWidth: 0,
        borderRadius: 30,
        marginBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: "#272727ff",
        color: "#6a6a6a",
        fontSize: 16,
    },
    button: {
        backgroundColor: "#1db954",
        height: 50,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#1db954",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 18,
        letterSpacing: 1,
    },
    errorText: {
        color: "#ff4c4c",
        marginBottom: 15,
        textAlign: "center",
        fontWeight: "bold",
    },
    switchModeButton: {
        marginTop: 24,
        alignItems: "center",
    },
    switchModeText: {
        color: "#b3b3b3",
        fontSize: 15,
        fontWeight: "500",
    },
});


export default SupabaseAuth;