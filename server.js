import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import userRouter from "./routes/userRouter.js";
import accountRouter from "./routes/accountRouter.js";
import gameRouter from "./routes/gameRouter.js";
import socketServer from "./socketServer.js"; 

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Create an HTTP server
const server = http.createServer(app);

// Initialize socket server
socketServer(server);

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/users", userRouter); // User-related routes (signup, signing, delete)
app.use("/api/account", accountRouter); // Account-related routes (fetch user details)
app.use("/api/games", gameRouter); // Game-related routes

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to KingGambit");
});

// Start the server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
