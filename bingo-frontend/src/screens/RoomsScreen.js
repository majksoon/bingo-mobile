import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import {
  Button,
  Card,
  FAB,
  Portal,
  Dialog,
  Text,
  TextInput,
  RadioButton,
  ActivityIndicator,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { listRooms, createRoom, joinRoom } from "../api/rooms";

export default function RoomsScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // dialog tworzenia pokoju
  const [createVisible, setCreateVisible] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [roomCategory, setRoomCategory] = useState("Nauka");
  const [creating, setCreating] = useState(false);

  // dialog dołączania (przy pokojach z hasłem)
  const [joinVisible, setJoinVisible] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(null);
  const [joining, setJoining] = useState(false);

  // ====== ŁADOWANIE POKOI ======

  const loadRooms = useCallback(async () => {
    try {
      setError(null);
      const data = await listRooms();
      setRooms(data);
    } catch (e) {
      console.log("listRooms error", e);
      setError(e.message || "Nie udało się pobrać pokoi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // auto-refresh gdy ekran jest w focusie
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const tick = async () => {
        if (!active) return;
        await loadRooms();
      };

      // pierwszy strzał po wejściu na ekran
      tick();

      // co ~3 sekundy odświeżaj listę dla każdego użytkownika osobno
      const id = setInterval(tick, 3000);

      return () => {
        active = false;
        clearInterval(id);
      };
    }, [loadRooms])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms();
  }, [loadRooms]);

  // ====== TWORZENIE POKOJU ======

  async function handleCreateRoom() {
    if (!roomName.trim()) {
      alert("Podaj nazwę pokoju");
      return;
    }

    setCreating(true);
    try {
      await createRoom({
        name: roomName.trim(),
        password: roomPassword.trim() || null,
        category: roomCategory, // "Nauka" albo "Sport"
      });

      setCreateVisible(false);
      setRoomName("");
      setRoomPassword("");

      // po utworzeniu odśwież listę
      await loadRooms();
    } catch (e) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  }

  // ====== DOŁĄCZANIE DO POKOJU ======

  async function doJoinRoom(room, passwordOrNull) {
    setJoining(true);
    setJoiningRoom(room);
    try {
      // używamy odpowiedzi z backendu (świeży players_count itd.)
      const joinedRoom = await joinRoom(room.id, passwordOrNull);
      setJoinVisible(false);
      setJoinPassword("");

      // po udanym join → przejście do RoomScreen z AKTUALNYM roomem
      navigation.navigate("Room", { room: joinedRoom });
    } catch (e) {
      alert(e.message);
    } finally {
      setJoining(false);
    }
  }

  function handleOpenRoom(room) {
    if (room.has_password) {
      // trzeba zapytać o hasło
      setJoiningRoom(room);
      setJoinPassword("");
      setJoinVisible(true);
    } else {
      // pokój bez hasła – od razu join
      doJoinRoom(room, null);
    }
  }

  // ====== RENDER POZYCJI LISTY ======

  function renderRoom({ item }) {
    return (
      <Card
        style={styles.roomCard}
        onPress={() => handleOpenRoom(item)}
      >
        <Card.Title title={item.name} />
        <Card.Content>
          <Text>
            Kategoria: {item.category === "Sport" ? "Sport" : "Nauka"}
          </Text>
          <Text>
            Gracze: {item.players_count}/{item.max_players}
          </Text>
          {item.has_password && (
            <Text style={styles.lockText}>Pokój z hasłem</Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => handleOpenRoom(item)}>
            Wejdź
          </Button>
        </Card.Actions>
      </Card>
    );
  }

  // ====== UI ======

  if (loading && rooms.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Ładowanie pokoi.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <FlatList
        data={rooms}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRoom}
        contentContainerStyle={
          rooms.length === 0 ? styles.emptyContainer : { paddingBottom: 80 }
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>
              Brak pokoi. Utwórz pierwszy!
            </Text>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* FAB do tworzenia pokoju */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setCreateVisible(true)}
        label="Nowy pokój"
      />

      {/* Dialog tworzenia pokoju */}
      <Portal>
        <Dialog
          visible={createVisible}
          onDismiss={() => !creating && setCreateVisible(false)}
        >
          <Dialog.Title>Nowy pokój</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nazwa pokoju"
              value={roomName}
              onChangeText={setRoomName}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Hasło (opcjonalne)"
              value={roomPassword}
              onChangeText={setRoomPassword}
              secureTextEntry
              style={{ marginBottom: 8 }}
            />
            <Text style={{ marginBottom: 4 }}>Kategoria</Text>
            <RadioButton.Group
              onValueChange={setRoomCategory}
              value={roomCategory}
            >
              <View style={styles.radioRow}>
                <RadioButton value="Nauka" />
                <Text style={styles.radioLabel}>Nauka</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="Sport" />
                <Text style={styles.radioLabel}>Sport</Text>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => !creating && setCreateVisible(false)}
            >
              Anuluj
            </Button>
            <Button onPress={handleCreateRoom} loading={creating}>
              Utwórz
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog dołączania do pokoju z hasłem */}
      <Portal>
        <Dialog
          visible={joinVisible}
          onDismiss={() => !joining && setJoinVisible(false)}
        >
          <Dialog.Title>
            {joiningRoom ? `Dołącz do: ${joiningRoom.name}` : "Dołącz do pokoju"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Hasło pokoju"
              value={joinPassword}
              onChangeText={setJoinPassword}
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => !joining && setJoinVisible(false)}
            >
              Anuluj
            </Button>
            <Button
              loading={joining}
              onPress={() =>
                joiningRoom && doJoinRoom(joiningRoom, joinPassword.trim())
              }
            >
              Dołącz
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 12,
  },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  roomCard: {
    marginBottom: 8,
    borderRadius: 16,
  },
  lockText: {
    marginTop: 4,
    color: "#f97316",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyText: {
    color: "#e5e7eb",
  },
  errorText: {
    color: "#f97316",
    marginBottom: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioLabel: {
    color: "white",
  },
});
