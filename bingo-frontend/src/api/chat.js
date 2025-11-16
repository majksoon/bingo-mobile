import { API_URL } from "./auth.js"
import { getToken } from "./auth.js"


export async function sendMessage(content, roomId) {
  const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
     "Authorization": `Bearer ${await getToken()}`,
    },
    body: JSON.stringify({ content })
  });

  switch (res.status) {
    case 201:
      break;
    case 403:
      throw new Error("Brak dostępu")
    case 404:
      throw new Error("Wskazany pokój nie istnieje")
  }
  
  return await res.json();
}

export async function getMessages(roomId) {
  const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
     "Authorization": `Bearer ${await getToken()}`,
    },
  });

  switch (res.status) {
    case 201:
      break;
    case 403:
      throw new Error("Brak dostępu")
    case 404:
      throw new Error("Wskazany pokój nie istnieje")
  }
  
  return await res.json();

}
