import { useEffect, useRef, useState, useCallback } from "react";
import type { SSEEvent } from "../types";

export function useSSE() {
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
    }

    const source = new EventSource("/api/events");
    sourceRef.current = source;

    source.onopen = () => setConnected(true);

    source.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        setLastEvent(event);
      } catch {
        // ignore malformed
      }
    };

    source.onerror = () => {
      setConnected(false);
      source.close();
      retryRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      sourceRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);

  return { lastEvent, connected };
}
