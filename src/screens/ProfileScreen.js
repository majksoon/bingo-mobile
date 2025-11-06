import React from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Divider, Text } from "react-native-paper";

export default function ProfileScreen({ navigation }) {
  // TODO: te dane backend łatwo podmieni z API
  const email = "user@example.com";
  const nick = "Gracz123";

  const stats = {
    gamesPlayed: 24,
    gamesWon: 7,
    roomsCreated: 5,
  };

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Avatar + podstawowe dane */}
          <Avatar.Text size={72} label={nick[0].toUpperCase()} />
          <Text variant="headlineSmall" style={styles.nick}>
            {nick}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {email}
          </Text>

          <Divider style={{ marginVertical: 12, alignSelf: "stretch" }} />

          {/* Statystyki */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Statystyki gracza
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text variant="headlineSmall">{stats.gamesPlayed}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                rozegranych gier
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="headlineSmall">{stats.gamesWon}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                wygrane
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="headlineSmall">{winRate}%</Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                winrate
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBoxWide}>
              <Text variant="headlineSmall">{stats.roomsCreated}</Text>
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
              // tutaj backendowiec może podpiąć edycję profilu
            }}
          >
            Edytuj profil (mock)
          </Button>

          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.navigate("Auth")}
          >
            Wyloguj się
          </Button>
        </Card.Content>
      </Card>
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
  statLabel: {
    marginTop: 2,
    opacity: 0.8,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    alignSelf: "stretch",
  },
});
