import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web" ? "http://localhost:8000" : "http://10.0.2.2:8000";
// localhost - web, 10.0.2.2 - emulator w Android Studio

export const storage = {
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

export async function register({ email, password, username }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : "Registration failed";
    throw new Error(message);
  }

  //await storage.setItem("token", data.access_token);

  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : "Nieprawidłowy email lub hasło";
    throw new Error(message);
  }

  await storage.setItem("token", String(data.access_token));
  await storage.setItem("uid", data.id);

  return data;
}

export async function getToken() {
  return storage.getItem("token");
}

export async function authGet(path) {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}
