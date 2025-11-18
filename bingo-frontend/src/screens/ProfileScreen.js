import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { getProfile, updateProfile } from "../api/profile";

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  async function loadProfile() {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch {
      alert("Nie udało się załadować profilu.");
    } finally {
      setLoading(false);
    }
  }

  async function saveUsername() {
    try {
      const updated = await updateProfile({ username: newUsername });
      setProfile(updated);
      setEditVisible(false);
    } catch (err) {
      alert(err.message);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) return <Text>Ładowanie...</Text>;

  const winRate =
    profile.games_played > 0
      ? Math.round((profile.games_won / profile.games_played) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Avatar + podstawowe dane */}
          <Avatar.Text size={72} label={profile.username?.[0]?.toUpperCase() || "?"} />
          <Text variant="headlineSmall" style={styles.nick}>
            {profile.username}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {profile.email}
          </Text>

          <Divider style={{ marginVertical: 12, alignSelf: "stretch" }} />

          {/* Statystyki */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Statystyki gracza
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text variant="headlineSmall" style={styles.statText}>{profile.games_played}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                rozegranych gier
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="headlineSmall" style={styles.statText}>{profile.games_won}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                wygrane
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="headlineSmall" style={styles.statText}>{winRate}%</Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                wsp. wygranych
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBoxWide}>
              <Text variant="headlineSmall" style={styles.statText}>{profile.rooms_created}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                utworzone pokoje
              </Text>
            </View>
          </View>

          <Divider style={{ marginVertical: 12, alignSelf: "stretch" }} />

          {/* Przyciski akcji */}
          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => {
              setNewUsername(profile.username || "");
              setEditVisible(true);
            }}
          >
            Edytuj profil
          </Button>

          <Button
            mode="contained"
            style={styles.button}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Auth" }],
              });
            }}
          >
            Wyloguj się
          </Button>
        </Card.Content>
      </Card>

      {/* Edycja nicku */}
      <Portal>
        <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)}>
          <Dialog.Title>Edytuj nazwę użykownika</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nazwa"
              value={newUsername}
              onChangeText={setNewUsername}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditVisible(false)}>Anuluj</Button>
            <Button onPress={saveUsername}>Zapisz</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
  },
  content: {
    alignItems: "center",
    paddingVertical: 16,
  },
  nick: {
    marginTop: 12,
  },
  email: {
    marginBottom: 8,
    color: "#64748b",
  },
  sectionTitle: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignSelf: "stretch",
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    alignItems: "center",
  },
  statBoxWide: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    alignItems: "center",
  },
  statText: {
    color: "white",
  },
  statLabel: {
    marginTop: 2,
    opacity: 0.8,
    textAlign: "center",
    color: "white",
  },
  button: {
    marginTop: 8,
    alignSelf: "stretch",
  },
});
