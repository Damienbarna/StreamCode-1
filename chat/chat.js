const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Message = require("../api-crud-StreamCode/src/models/Message");
const cors = require("cors");

const app = express();
app.use(cors());
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
  console.log("Un utilisateur connecté :", socket.id);

  // Rejoindre une salle spécifique
  socket.on("join_chat", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} a rejoint la salle ${roomId}`);
  });

  // Envoyer un message à une salle spécifique
  socket.on("send_message", async (data) => {
    const { roomId, message } = data;
    console.log(`Message de ${socket.id} à la salle ${roomId} :`, message);

    // Émettre le message uniquement à la salle spécifiée
    io.to(roomId).emit("receive_message", message);

    // Enregistrer le message dans la base de données si nécessaire
    try {
      await Message.create({
        roomId: roomId,
        content: message.content,
        userId: message.userId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du message :", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté :", socket.id);
  });
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Serveur de chat en cours d'exécution sur le port ${PORT}`);
});
