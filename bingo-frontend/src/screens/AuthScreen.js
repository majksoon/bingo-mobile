import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { login, register } from "../api/auth";

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState("login"); // 👈 zwykły JS, bez <"login" | "register">
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const title = mode === "login" ? "Logowanie" : "Rejestracja";

  async function handleSubmit() {
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password, username: email.split("@")[0] });
        await login({ email, password });
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "Rooms" }],
      });

    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.logoWrapper}>
        <Text style={styles.logoText}>BINGO</Text>
        <Text style={styles.logoSub}>Online</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.cardTitle}>
            {title}
          </Text>

          <TextInput
            label="E-mail"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput
            label="Hasło"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.mainButton}
          >
            {title}
          </Button>

          <Button
            mode="text"
            onPress={() =>
              setMode((m) => (m === "login" ? "register" : "login"))
            }
          >
            {mode === "login"
              ? "Nie masz konta? Zarejestruj się"
              : "Masz już konto? Zaloguj się"}
          </Button>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    color: "white",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 4,
  },
  logoSub: {
    color: "#38bdf8",
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
  },
  cardTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
  },
  mainButton: {
    marginTop: 8,
    marginBottom: 4,
  },
});
