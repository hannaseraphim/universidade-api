// src/config/socket.ts
import { Server as SocketIOServer } from "socket.io";

export function setupSocket(server: any) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    // professor se identifica e entra numa "sala" própria
    socket.on("teacher:join", (teacherId: number) => {
      const roomName = `teacher-${teacherId}`;
      socket.join(roomName);
      console.log(`Professor ${teacherId} entrou na sala ${roomName}`);
    });

    socket.on("disconnect", () => {
      console.log("Cliente saiu:", socket.id);
    });
  });

  console.log("WebSocket connected");
  return io; // devolve o io para ser usado em controllers/services
}
