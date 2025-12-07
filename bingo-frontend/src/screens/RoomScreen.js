import React, { useState, useEffect } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
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
import * as api from "../api/chat.js";
import * as room_api from "../api/rooms.js";
import { getProfile } from "../api/profile.js";
import { storage } from "../api/auth.js";

const SIZE = 5;

export default function RoomScreen({ route, navigation }) {
  const roomParam = route.params?.room ?? {
    id: "X",
    name: "Pokój",
    players_count: 0,
    max_players: 5,
    category: "Sport",
  };

  const [room] = useState(roomParam);
  const [boardTasksObj, setBoardTasksObj] = useState([]);
  const [uid, setUid] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      user_id: 0,
      username: "System",
      content: "Witaj w pokoju!",
      created_at: "12:00",
    },
  ]);
  const [chatText, setChatText] = useState("");

  // --- stan profilu w tym ekranie ---
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  async function loadTasks() {
    try {
      const baseTasks = await room_api.getTasks(room.id);
      setBoardTasksObj(baseTasks);
    } catch (e) {
      console.log("getTasks error", e);
    }
  }

  function loadMessages() {
    api.getMessages(room.id).then((msgs) => {
      setMessages(msgs);
    });
  }

  // ładowanie UID + auto-refresh planszy i chatu
  useEffect(() => {
    let isMounted = true;

    storage.getItem("uid").then((id) => {
      if (isMounted && id != null) setUid(Number(id));
    });

    loadTasks();
    loadMessages();

    const tasksInterval = setInterval(loadTasks, 2500);
    const chatInterval = setInterval(loadMessages, 2500);

    return () => {
      isMounted = false;
      clearInterval(tasksInterval);
      clearInterval(chatInterval);
    };
  }, [room.id]);

  // --- obsługa kliknięcia kafelka ---

  function toggleCell(index) {
    const task = boardTasksObj[index];
    if (!task) return;

    room_api
      .finishTask(room.id, task.assignment_id)
      .then((data) => {
        loadTasks();

        if (!data.game_finished) return;

        const isMe =
          data.winner_id &&
          uid != null &&
          Number(data.winner_id) === Number(uid);

        if (data.win_type === "bingo") {
          if (isMe) {
            alert(
              `Wygrałeś! Zdobyłeś bingo.\n(Liczba zajętych pól: ${
                data.winner_tiles ?? "?"
              })`
            );
          } else {
            alert(
              `Gra zakończona – ${data.winner_username} zdobył bingo.\n(Liczba zajętych pól: ${
                data.winner_tiles ?? "?"
              })`
            );
          }
        } else if (data.win_type === "most_tiles") {
          if (isMe) {
            alert(
              `Wygrałeś! Miałeś najwięcej pól: ${data.winner_tiles}.`
            );
          } else {
            alert(
              `Gra zakończona – wygrał ${data.winner_username}, który miał najwięcej pól: ${data.winner_tiles}.`
            );
          }
        } else if (data.win_type === "draw") {
          const names = (data.draw_usernames || []).join(", ");
          alert(
            `Gra zakończona remisem.\nNajwięcej pól (${data.draw_tiles}) mieli: ${names}.`
          );
        } else {
          alert("Gra zakończona.");
        }
      })
      .catch((err) => {
        alert(err.message);
      });
  }

  function sendMessage() {
    if (!chatText.trim()) return;

    api.sendMessage(chatText.trim(), room.id).then((data) => {
      setMessages((prev) => [...prev, data]);
      setChatText("");
    });
  }

  // --- MÓJ PROFIL (popup) ---

  async function openProfile() {
    setProfileVisible(true);
    setProfileLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (e) {
      alert("Nie udało się załadować profilu.");
      setProfileVisible(false);
    } finally {
      setProfileLoading(false);
    }
  }

  const winRate =
    profile && profile.games_played > 0
      ? Math.round((profile.games_won / profile.games_played) * 100)
      : 0;

  return (
    <View style={styles.screen}>
      {/* INFO O POKOJU */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium">{room.name}</Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            Pokój #{room.id} • Kategoria:{" "}
            {room.category === "Sport" ? "Sport" : "Nauka"}
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            Uczestnicy: {room.players_count}/5
          </Text>
        </Card.Content>
        <Card.Actions style={styles.infoActions}>
          <Button onPress={openProfile}>Mój profil</Button>
        </Card.Actions>
      </Card>

      {/* PLANSZA BINGO */}
      <Card style={styles.mainCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Plansza Bingo
          </Text>

          <View style={styles.grid}>
            {Array.from({ length: SIZE }).map((_, row) => (
              <View style={styles.row} key={row}>
                {Array.from({ length: SIZE }).map((_, col) => {
                  const index = row * SIZE + col;
                  const task = boardTasksObj[index];
                  const taskLabel = task ? task.description : "Ładowanie...";

                  let textStyle = styles.cellText;
                  let extraStyle = {};

                  if (task && task.finished_by) {
                    textStyle = styles.cellTextActive;

                    if (task.color) {
                      extraStyle = {
                        backgroundColor: task.color,
                        borderColor: task.color,
                      };
                    } else if (
                      uid &&
                      Number(uid) === Number(task.finished_by)
                    ) {
                      extraStyle = styles.cellActive;
                    } else {
                      extraStyle = styles.cellEnemy;
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.cell, extraStyle]}
                      onPress={() => toggleCell(index)}
                    >
                      <Text style={textStyle} numberOfLines={2}>
                        {taskLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button onPress={() => navigation.goBack()}>Wróć</Button>
        </Card.Actions>
      </Card>

      {/* CHAT */}
      <Card style={styles.chatCard}>
        <Card.Title title="Chat pokoju" />
        <Card.Content style={styles.chatContent}>
          <FlatList
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 4 }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  uid && Number(item.user_id) === Number(uid)
                    ? styles.messageBubbleMe
                    : styles.messageBubbleOther,
                ]}
              >
                <Text style={styles.messageAuthor}>
                  {item.username} • {item.created_at}
                </Text>
                <Text style={styles.messageText}>{item.content}</Text>
              </View>
            )}
          />
        </Card.Content>
        <Card.Actions style={styles.chatInputRow}>
          <TextInput
            mode="outlined"
            placeholder="Napisz wiadomość."
            value={chatText}
            onChangeText={setChatText}
            style={styles.chatInput}
          />
          <Button mode="contained" onPress={sendMessage}>
            Wyślij
          </Button>
        </Card.Actions>
      </Card>

      {/* POPUP: MÓJ PROFIL */}
      <Portal>
        <Dialog
          visible={profileVisible}
          onDismiss={() => setProfileVisible(false)}
        >
          <Dialog.Title>Mój profil</Dialog.Title>
          <Dialog.Content>
            {profileLoading && <Text>Ładowanie...</Text>}
            {!profileLoading && profile && (
              <View style={styles.profileContent}>
                <View style={styles.profileHeader}>
                  <Avatar.Text
                    size={56}
                    label={profile.username?.[0]?.toUpperCase() || "?"}
                  />
                  <View style={{ marginLeft: 12 }}>
                    <Text variant="titleMedium">{profile.username}</Text>
                    <Text style={styles.profileEmail}>{profile.email}</Text>
                  </View>
                </View>

                <Divider style={{ marginVertical: 8 }} />

                <Text variant="titleSmall" style={{ marginBottom: 4 }}>
                  Statystyki gracza
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text variant="titleLarge" style={styles.statText}>
                      {profile.games_played}
                    </Text>
                    <Text style={styles.statLabel}>rozegranych gier</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text variant="titleLarge" style={styles.statText}>
                      {profile.games_won}
                    </Text>
                    <Text style={styles.statLabel}>wygrane</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text variant="titleLarge" style={styles.statText}>
                      {winRate}%
                    </Text>
                    <Text style={styles.statLabel}>wsp. wygranych</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBoxWide}>
                    <Text variant="titleLarge" style={styles.statText}>
                      {profile.rooms_created}
                    </Text>
                    <Text style={styles.statLabel}>utworzone pokoje</Text>
                  </View>
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setProfileVisible(false)}>Zamknij</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const CELL_SIZE = 70;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 12,
  },
  infoCard: {
    borderRadius: 16,
    marginBottom: 8,
  },
  infoText: {
    opacity: 0.8,
  },
  infoActions: {
    justifyContent: "flex-end",
    paddingRight: 8,
    paddingBottom: 4,
  },
  mainCard: {
    borderRadius: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  grid: {
    marginVertical: 8,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#64748b",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 4,
  },
  cellActive: {
    backgroundColor: "#22c55e",
    borderColor: "#16a34a",
  },
  cellEnemy: {
    backgroundColor: "#aa1417",
    borderColor: "#aa1417",
  },
  cellText: {
    color: "white",
    fontWeight: "500",
    fontSize: 11,
    textAlign: "center",
  },
  cellTextActive: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  actions: {
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  chatCard: {
    flex: 1,
    borderRadius: 16,
  },
  chatContent: {
    flex: 1,
    maxHeight: 180,
  },
  chatInputRow: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  chatInput: {
    flex: 1,
    marginRight: 8,
  },
  messageBubble: {
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  messageBubbleMe: {
    backgroundColor: "#22c55e33",
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  messageBubbleOther: {
    backgroundColor: "#1e293b",
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  messageAuthor: {
    fontSize: 11,
    opacity: 0.8,
    marginBottom: 2,
    color: "white",
  },
  messageText: {
    fontSize: 14,
    color: "white",
  },

  // profil popup
  profileContent: {
    marginTop: 4,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileEmail: {
    color: "#64748b",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  statBoxWide: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: "center",
    marginTop: 4,
  },
  statText: {
    color: "white",
  },
  statLabel: {
    color: "white",
    opacity: 0.8,
    fontSize: 12,
    textAlign: "center",
  },
});
