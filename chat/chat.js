const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Message = require("../api-crud-StreamCode/src/models/Message");

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

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join_chat", (message) => {
    console.log("à rejoint", message, "id :", socket.id);
  });

  socket.on("send_message", async (message) => {
    console.log(message);
    io.emit("receive_message", message);

    try {
      await Message.create({
        userId: socket.id,
        content: message.content,
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du message :", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
