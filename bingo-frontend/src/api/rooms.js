import { API_URL, getToken } from "./auth.js";

export async function listRooms() {
  const token = await getToken();
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

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("Nie jesteś członkiem tego pokoju");
    }
    throw new Error(data?.detail || "Nie udało się pobrać zadań");
  }

  return data;
}

export async function finishTask(roomId, taskId) {
  const token = await getToken();

  const res = await fetch(
    `${API_URL}/rooms/${roomId}/tasks/${taskId}/finished`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json().catch(() => ({}));

  if (res.status === 403) {
    throw new Error("Już ukończono to zadanie");
  }
  if (res.status === 418) {
    throw new Error("Gra jest już ukończona");
  }

  if (!res.ok) {
    throw new Error(data?.detail || "Nie udało się ukończyć zadania");
  }

  return data;
}
