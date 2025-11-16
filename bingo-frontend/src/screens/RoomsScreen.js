import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  FAB,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { createRoom, joinRoom, listRooms } from "../api/rooms";
														  
					   
   
			
							
			   
		   
						
					  
	
   
			
					
			   
		   
						
					  
	
   
			
						 
			   
		   
					  
					  
	
  

export default function RoomsScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);

  // dialog tworzenia pokoju
  const [createVisible, setCreateVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [newRoomCategory, setNewRoomCategory] = useState("sport");

  // dialog dołączania (hasło)
  const [joinVisible, setJoinVisible] = useState(false);
  const [roomToJoin, setRoomToJoin] = useState(null);
  const [joinPassword, setJoinPassword] = useState("");

  async function loadRooms() {
    try {
      const data = await listRooms();
      setRooms(data);
    } catch (err) {
      alert(err.message || "Failed to load rooms");
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  // Dołączanie
  function askForPassword(room) {
    setRoomToJoin(room);
    setJoinPassword("");
    setJoinVisible(true);
  }

  async function confirmJoin() {
    if (!roomToJoin) return;

    try {
      const joined = await joinRoom(roomToJoin.id, joinPassword);
			 
	 

      setJoinVisible(false);
      
      navigation.navigate("Room", { room: joined });
    } catch (err) {
      alert(err.message);
    }

											   
																		   
					  
																 
	  

						  

													  
													   
													   
  }

  function openCreateDialog() {
    setNewRoomName("");
    setNewRoomPassword("");
    setNewRoomCategory("sport");
    setCreateVisible(true);
  }

  async function createRoomHandler() {
    if (!newRoomName.trim()) {
      alert("Podaj nazwę pokoju");
      return;
    }
    if (!newRoomPassword.trim()) {
      alert("Ustaw hasło do pokoju");
      return;
    }

    try {
      await createRoom({
        name: newRoomName.trim(),
									 
			 
        password: newRoomPassword.trim(),
        category: newRoomCategory,
      });

      setCreateVisible(false);
      loadRooms(); // odświeża listę
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Pokoje Bingo
      </Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => askForPassword(item)}>
            <Card.Title
              title={item.name}
              subtitle={`${item.players}/${item.max_players} uczestników • ${
                item.category === "sport" ? "Sport" : "Nauka"
              }`}
              left={(props) => <Avatar.Icon {...props} icon="lock" />}
            />
            <Card.Actions>
              <Button onPress={() => askForPassword(item)}>Dołącz</Button>
            </Card.Actions>
          </Card>
        )}
      />

      {/* FAB – tworzenie pokoju */}
      <FAB
        icon="plus"
        style={styles.fab}
        label="Nowy pokój"
        onPress={openCreateDialog}
      />

      {/* Przycisk profil */}
      <Button
        mode="text"
        onPress={() => navigation.navigate("Profile")}
        style={styles.profileButton}
      >
        Profil
      </Button>

      {/* Dialog tworzenia pokoju */}
      <Portal>
        <Dialog visible={createVisible} onDismiss={() => setCreateVisible(false)}>
          <Dialog.Title>Nowy pokój</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nazwa pokoju"
              value={newRoomName}
              onChangeText={setNewRoomName}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Hasło (wymagane)"
              value={newRoomPassword}
              onChangeText={setNewRoomPassword}
              secureTextEntry
              style={{ marginBottom: 8 }}
            />
            <Text style={{ marginBottom: 4, opacity: 0.8 }}>
              Kategoria pokoju:
            </Text>
            <View style={styles.categoryRow}>
              <Button
                mode={newRoomCategory === "sport" ? "contained" : "outlined"}
                onPress={() => setNewRoomCategory("sport")}
                style={styles.categoryButton}
              >
                Sport
              </Button>
              <Button
                mode={newRoomCategory === "nauka" ? "contained" : "outlined"}
                onPress={() => setNewRoomCategory("nauka")}
                style={styles.categoryButton}
              >
                Nauka
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateVisible(false)}>Anuluj</Button>
            <Button onPress={createRoomHandler}>Utwórz</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog wpisania hasła przy dołączaniu */}
      <Portal>
        <Dialog visible={joinVisible} onDismiss={() => setJoinVisible(false)}>
          <Dialog.Title>Podaj hasło do pokoju</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Hasło"
              value={joinPassword}
              onChangeText={setJoinPassword}
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setJoinVisible(false)}>Anuluj</Button>
            <Button onPress={confirmJoin}>Dołącz</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#020617",
  },
  title: {
    color: "white",
    marginBottom: 12,
  },
  list: {
    paddingBottom: 96,
  },
  card: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 72,
  },
  profileButton: {
    position: "absolute",
    left: 16,
    bottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  categoryButton: {
    flex: 1,
  },
});
