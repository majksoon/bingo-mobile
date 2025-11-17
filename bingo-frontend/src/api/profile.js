import { Platform } from "react-native";
import { authGet, getToken } from "./auth";

const API_URL =
  Platform.OS === "web" ? "http://localhost:8000" : "http://10.0.2.2:8000";

export async function getProfile() {
  return authGet("/profile/me");
}

export async function updateProfile(data) {
  const token = await getToken();

  const res = await fetch(`${API_URL}/profile/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.detail || "Failed to update profile");
  }

  return json;
}
