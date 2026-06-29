import { useEffect, useState } from "react";

const CLIENT_ID_KEY = "watchtower_client_id";

export function getOrCreateClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function useClientId(): string {
  const [clientId, setClientId] = useState<string>("");
  useEffect(() => {
    setClientId(getOrCreateClientId());
  }, []);
  return clientId;
}
