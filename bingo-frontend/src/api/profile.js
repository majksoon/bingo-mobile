import { authGet, getToken, API_URL } from "./auth";

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
