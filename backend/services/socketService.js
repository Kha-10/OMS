let io = null;

const initSocket = (httpServer) => {
  const { Server } = require("socket.io");

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.ORIGIN,
  ];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO };
