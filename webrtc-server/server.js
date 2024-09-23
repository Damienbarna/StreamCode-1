const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

const activeStreams = new Map();
const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("start-stream", (userId) => {
    console.log(`User ${userId} started streaming with socket ID ${socket.id}`);
    activeStreams.set(userId, socket.id);
    userSocketMap.set(socket.id, userId);
    socket.join(userId);
    socket.broadcast.emit("stream-started", { userId, socketId: socket.id });
    console.log("Active streams:", Array.from(activeStreams.entries()));
  });

  socket.on("join-stream", (streamerId) => {
    console.log(`User ${socket.id} is trying to join stream of ${streamerId}`);
    console.log("Active streams:", Array.from(activeStreams.entries()));
    const streamerSocketId = activeStreams.get(streamerId);
    if (streamerSocketId) {
      socket.join(streamerId);
      io.to(streamerSocketId).emit("user-joined", socket.id);
      console.log(
        `User ${socket.id} successfully joined stream of ${streamerId} (socket: ${streamerSocketId})`
      );
    } else {
      socket.emit("error", "Stream not found");
      console.log(`Stream ${streamerId} not found for user ${socket.id}`);
    }
  });

  socket.on("signal", (data) => {
    console.log(`Signaling from ${socket.id} to ${data.to}`);
    const targetSocketId = activeStreams.get(data.to) || data.to;
    if (io.sockets.sockets.has(targetSocketId)) {
      io.to(targetSocketId).emit("signal", {
        from: socket.id,
        signal: data.signal,
      });
    } else {
      console.log(`Target socket ${targetSocketId} not found for signaling`);
      socket.emit("error", "Signaling target not found");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const userId = userSocketMap.get(socket.id);
    if (userId) {
      activeStreams.delete(userId);
      userSocketMap.delete(socket.id);
      io.emit("stream-ended", userId);
    }
    socket.broadcast.emit("user-disconnected", socket.id);
    console.log(
      "Active streams after disconnect:",
      Array.from(activeStreams.entries())
    );
  });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
