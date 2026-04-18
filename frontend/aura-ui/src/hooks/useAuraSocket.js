// src/hooks/useAuraSocket.js
import { useEffect, useRef, useState } from "react";

export function useAuraSocket(url, onMessage) {
  const [status, setStatus] = useState("disconnected");
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const onMessageRef = useRef(onMessage);

  // Keep the latest onMessage without causing reconnects
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;

      // Guard against duplicate connections
      const ws = wsRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      console.log("[WS] Connecting to", url);
      setStatus("connecting");
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!mountedRef.current) return;
        console.log("[WS] Connected");
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (onMessageRef.current) onMessageRef.current(data);
        } catch (e) {
          console.error("[WS] Parse error:", e);
        }
      };

      socket.onerror = (err) => {
        console.error("[WS] Error:", err);
      };

      socket.onclose = () => {
        if (!mountedRef.current) return;
        console.log("[WS] Disconnected");
        setStatus("disconnected");
        wsRef.current = null;

        // Exponential backoff reconnect
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`[WS] Reconnecting in ${delay}ms...`);

        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      };
    };

    connect();

    return () => {
      console.log("[WS] Cleanup");
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [url]);

  const send = (message) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn("[WS] Cannot send; not connected");
    }
  };

  return { status, send };
}
