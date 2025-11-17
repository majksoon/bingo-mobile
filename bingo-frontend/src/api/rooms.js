import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_URL =
  Platform.OS === "web" ? "http://localhost:8000" : "http://10.0.2.2:8000";

const storage = {
  setItem: async (key, value) => {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  getItem: async (key) => {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
};

export async function getToken() {
  return storage.getItem("token");
}


export async function listRooms() {
  const token = await getToken();
  console.log("TOKEN RAW:", JSON.stringify(token));


  const res = await fetch(`${API_URL}/rooms`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || "Failed to fetch rooms");
  }

  return data;
}

export async function createRoom({ name, password, category }) {
  const token = await getToken();

  const res = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      password,
      category,
      max_players: 5,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || "Failed to create room");
  }

  return data;
}

export async function joinRoom(roomId, password) {
  const token = await getToken();

  const res = await fetch(`${API_URL}/rooms/${roomId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || "Failed to join room");
  }

  return data;
}

export async function getTasks(roomId) {
  const token = await getToken();

  const res = await fetch(`${API_URL}/rooms/${roomId}/tasks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json()
}

export async function finishTask(roomId, taskId) {
  const token = await getToken();

  const res = await fetch(`${API_URL}/rooms/${roomId}/tasks/${taskId}/finished`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  
  switch (res.status) {
    case 200:
      break;
    case 403:
      throw new Error("Już ukończono zadanie");
    case 418:
      throw new Error("Gra jest już ukończona");
  }
  return await res.json()
}
