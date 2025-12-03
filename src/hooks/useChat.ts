import { useState, useEffect, useCallback, useRef } from "react";
import { getOrCreateGuestId, getOrCreateNickname } from "@/lib/guestChat";

export interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
  createdAt: number;
}

export interface SystemMessage {
  type: "system";
  text: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const guestId = getOrCreateGuestId();
    const nickname = getOrCreateNickname();

    // WebSocket URL 결정 (wss:// or ws://)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    console.log("[useChat] Connecting to:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[useChat] Connected");
      setIsConnected(true);

      // hello 메시지 전송
      ws.send(
        JSON.stringify({
          type: "hello",
          guestId,
          nickname,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "history") {
          // 초기 메시지 히스토리
          setMessages(data.items || []);
        } else if (data.type === "chat") {
          // 새로운 메시지
          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              nickname: data.nickname,
              text: data.text,
              createdAt: data.createdAt,
            },
          ]);
        } else if (data.type === "system") {
          // 시스템 메시지
          setSystemMessage(data.text);
          setTimeout(() => setSystemMessage(null), 3000);
        }
      } catch (err) {
        console.error("[useChat] Error parsing message:", err);
      }
    };

    ws.onclose = () => {
      console.log("[useChat] Disconnected");
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("[useChat] WebSocket error:", err);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setSystemMessage("연결 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        text,
      })
    );
  }, []);

  return {
    messages,
    systemMessage,
    isConnected,
    sendMessage,
  };
}
