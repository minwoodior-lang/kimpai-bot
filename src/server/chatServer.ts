import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
  createdAt: number;
}

interface ClientData {
  ws: WebSocket;
  guestId: string;
  nickname: string;
  lastMessageTime: number;
}

const MAX_MESSAGES = 100;
const RATE_LIMIT_MS = 1000;
const MAX_MESSAGE_LENGTH = 300;

let messageHistory: ChatMessage[] = [];
const clients = new Map<WebSocket, ClientData>();

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeMessage(text: string): string {
  return text.trim().substring(0, MAX_MESSAGE_LENGTH);
}

function broadcast(data: unknown) {
  const message = JSON.stringify(data);
  clients.forEach((clientData) => {
    if (clientData.ws.readyState === WebSocket.OPEN) {
      clientData.ws.send(message);
    }
  });
}

function sendToClient(ws: WebSocket, data: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function createChatServer(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[ChatServer] New connection, waiting for hello...");

    ws.once("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "hello" && msg.guestId && msg.nickname) {
          const clientData: ClientData = {
            ws,
            guestId: msg.guestId,
            nickname: msg.nickname.substring(0, 50), // 닉네임 길이 제한
            lastMessageTime: 0,
          };

          clients.set(ws, clientData);
          console.log(
            `[ChatServer] Client connected: ${clientData.nickname} (${clientData.guestId})`
          );

          // 기존 메시지 히스토리 전송
          sendToClient(ws, {
            type: "history",
            items: messageHistory,
          });

          // 이후 메시지는 일반 메시지 핸들러로
          ws.on("message", (data: Buffer) => {
            handleClientMessage(ws, data);
          });
        } else {
          ws.close(1002, "Invalid hello message");
        }
      } catch (err) {
        console.error("[ChatServer] Error parsing hello:", err);
        ws.close(1002, "Invalid message format");
      }
    });

    ws.on("close", () => {
      const clientData = clients.get(ws);
      if (clientData) {
        console.log(
          `[ChatServer] Client disconnected: ${clientData.nickname}`
        );
        clients.delete(ws);
      }
    });

    ws.on("error", (err) => {
      console.error("[ChatServer] WebSocket error:", err);
    });
  });

  console.log("[ChatServer] WebSocket server created on /ws/chat");
}

function handleClientMessage(ws: WebSocket, data: Buffer): void {
  const clientData = clients.get(ws);
  if (!clientData) return;

  try {
    const msg = JSON.parse(data.toString());

    if (msg.type === "chat" && typeof msg.text === "string") {
      const now = Date.now();

      // Rate limiting 확인
      if (now - clientData.lastMessageTime < RATE_LIMIT_MS) {
        sendToClient(ws, {
          type: "system",
          text: "메시지는 1초에 1개만 보낼 수 있습니다.",
        });
        return;
      }

      const sanitized = sanitizeMessage(msg.text);

      if (sanitized.length === 0) {
        sendToClient(ws, {
          type: "system",
          text: "빈 메시지는 보낼 수 없습니다.",
        });
        return;
      }

      clientData.lastMessageTime = now;

      const chatMessage: ChatMessage = {
        id: generateId(),
        nickname: clientData.nickname,
        text: sanitized,
        createdAt: now,
      };

      messageHistory.push(chatMessage);
      if (messageHistory.length > MAX_MESSAGES) {
        messageHistory = messageHistory.slice(-MAX_MESSAGES);
      }

      broadcast({
        type: "chat",
        id: chatMessage.id,
        nickname: chatMessage.nickname,
        text: chatMessage.text,
        createdAt: chatMessage.createdAt,
      });
    }
  } catch (err) {
    console.error("[ChatServer] Error handling message:", err);
  }
}
