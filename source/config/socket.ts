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

    socket.emit("notificacao", {
      mensagem: "Conectado ao WebSocket!",
    });

    socket.on("disconnect", () => {
      console.log("Cliente saiu:", socket.id);
    });
  });

  console.log("WebSocket connected");
  return io; // devolve o io para ser usado em controllers/services
}
