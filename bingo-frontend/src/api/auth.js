import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web" ? "http://localhost:8000" : "http://10.0.2.2:8000";

// WSPÓLNY STORAGE:
// - na webie: sessionStorage (osobny token na każdą kartę/przeglądarkę)
// - na emulatorze/telefonie: SecureStore
export const storage = {
  setItem: async (key, value) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      // per-tab, nie współdzielone między kartami
      window.sessionStorage.setItem(key, value);
    } else {
      // natywne RN: SecureStore (AsyncStorage jako fallback)
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {
        await AsyncStorage.setItem(key, value);
      }
    }
  },
  getItem: async (key) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return window.sessionStorage.getItem(key);
    } else {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return await AsyncStorage.getItem(key);
      }
    }
  },
  removeItem: async (key) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.sessionStorage.removeItem(key);
    } else {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        await AsyncStorage.removeItem(key);
      }
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
      typeof data?.detail === "string" ? data.detail : "Registration failed";
    throw new Error(message);
  }

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
  await storage.setItem("uid", String(data.id));

  return data;
}

export async function logout() {
  await storage.removeItem("token");
  await storage.removeItem("uid");
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

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message =
      typeof data?.detail === "string" ? data.detail : "Request failed";
    throw new Error(message);
  }

  return data;
}
