import { Server as SocketIOServer } from "socket.io";

export function setupSocket(server: any) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("teacher:join", (teacherId: number, name: string) => {
      const roomName = `teacher-${teacherId}`;
      socket.join(roomName);
      console.log(`${name} conectado ao socket`);
    });
  });

  console.log("WebSocket connected");
  return io;
}
