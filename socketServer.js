import { Server } from "socket.io";

// Array to hold connected players
let players = [];

const socketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for development purposes (change to a specific domain in production)
      methods: ["GET", "POST"],
      pingInterval: 10000, // Send a ping every 10 seconds
      pingTimeout: 5000,   // Timeout if no pong is received in 5 seconds
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    // Handle player joining the game
    socket.on("join game", (gameId, username) => {
      if (!gameId || !username) {
        console.error("Game ID or username missing");
        return;
      }

      console.log(`${username} joined game: ${gameId}`);

      // Add player to the player list
      players.push({ socketId: socket.id, username, gameId });

      socket.join(gameId); // Join a specific game room
      io.to(gameId).emit("player joined", `${username} has joined the game.`);

      // Emit the updated player list to all connected clients in the same game
      io.to(gameId).emit("updatePlayers", players.filter(player => player.gameId === gameId));
    });

    // Handle player leaving the game
    socket.on("leave game", (gameId, username) => {
      if (!gameId || !username) {
        console.error("Game ID or username missing");
        return;
      }

      console.log(`${username} left game: ${gameId}`);

      // Remove player from the player list
      players = players.filter(player => player.socketId !== socket.id);

      socket.leave(gameId); // Leave the game room
      io.to(gameId).emit("player left", `${username} has left the game.`);

      // Emit the updated player list to all connected clients in the same game
      io.to(gameId).emit("updatePlayers", players.filter(player => player.gameId === gameId));
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected: " + socket.id);

      // Clean up the player list
      players = players.filter(player => player.socketId !== socket.id);
    });
  });
};

export default socketServer;