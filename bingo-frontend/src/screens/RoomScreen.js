import React, { useState, useEffect } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import * as api from "../api/chat.js"
import {storage} from "../api/auth.js"

const SIZE = 5;

// zadania zależne od kategorii – krótkie teksty, żeby mieściły się w kafelkach
const TASKS_BY_CATEGORY = {
  sport: [
    "10 przysiadów",
    "5 pompek",
    "30s bieg w miejscu",
    "10 brzuszków",
    "30s plank",
    "Dotknij palców stóp",
    "Skok w dal z miejsca",
    "5 pajacyków",
    "Wejście po schodach",
  ],
  nauka: [
    "Nowe słówko EN",
    "Przeczytaj definicję",
    "1 proste zad. z matmy",
    "Powtórz wzór",
    "Przeczytaj 1 akapit",
    "Napisz krótką notatkę",
    "Przepisz zdanie EN",
    "Przejrzyj notatki",
    "Zadanie z fizyki",
  ],
};

export default function RoomScreen({ route, navigation }) {
  // pokój przekazany z RoomsScreen
  const room = route.params?.room ?? {
    id: "X",
    name: "Pokój",
    players: 0,
    max: 5,
    category: "sport",
  };


  // wybór zestawu zadań
  const categoryKey =
    room.category === "nauka" || room.category === "sport"
      ? room.category
      : "sport";
  const baseTasks = TASKS_BY_CATEGORY[categoryKey] || TASKS_BY_CATEGORY.sport;

  // tworzymy 25 pól z zadaniami (jak mniej zadań, to się powtarzają)
  const boardTasks = Array.from({ length: SIZE * SIZE }, (_, i) => {
    return baseTasks[i % baseTasks.length];
  });

  const [selected, setSelected] = useState(new Set());

  const [uid, setUid] = useState(Number);

  // chat
  const [messages, setMessages] = useState([
    { id: "1", user_id: 0, username: "System", content: "Witaj w pokoju!", created_at: "12:00" },
  ]);
  const [chatText, setChatText] = useState("");

  function toggleCell(index) {
    setSelected((prev) => {
      const set = new Set(prev);
      set.has(index) ? set.delete(index) : set.add(index);
      return set;
    });
  }

  function loadMessages() {
    api.getMessages(room.id).then((messages) => {
      setMessages(messages);
    })

  }

  useEffect(() => {
    storage.getItem("uid").then((id) => {setUid(id)});
    loadMessages();
    const int = setInterval(loadMessages, 10000)
    return () => {clearInterval(int)}
  }, [])

  function sendMessage() {
    if (!chatText.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log(room.id)
    api.sendMessage(chatText.trim(), room.id).then((data) => {
      setMessages((prev) => [...prev, data]);
      setChatText("");
    })
  }

  return (
    <View style={styles.screen}>
      {/* Panel info o pokoju */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium">{room.name}</Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            Pokój #{room.id} • Kategoria:{" "}
            {room.category === "sport" ? "Sport" : "Nauka"}
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            Uczestnicy: {room.players}/{room.max}
          </Text>
        </Card.Content>
      </Card>

      {/* Główna karta – plansza + przyciski */}
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
                  const taskLabel = boardTasks[index];
                  const isActive = selected.has(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.cell, isActive && styles.cellActive]}
                      onPress={() => toggleCell(index)}
                    >
                      <Text
                        style={
                          isActive ? styles.cellTextActive : styles.cellText
                        }
                        numberOfLines={2}
                      >
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
          <Button mode="contained" onPress={() => {}}>
            Zgłoś Bingo
          </Button>
        </Card.Actions>
      </Card>

      {/* Chat pokoju */}
      <Card style={styles.chatCard}>
        <Card.Title title="Chat pokoju" />
        <Card.Content style={styles.chatContent}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 4 }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.user_id == uid
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
            placeholder="Napisz wiadomość..."
            value={chatText}
            onChangeText={setChatText}
            style={styles.chatInput}
          />
          <Button mode="contained" onPress={sendMessage}>
            Wyślij
          </Button>
        </Card.Actions>
      </Card>
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
  },
  messageText: {
    fontSize: 14,
    color: "white",
  },
});
