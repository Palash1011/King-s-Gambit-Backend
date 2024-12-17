import express from "express";
import { startGame, getGameState, updateGameState } from "../controllers/gameController.js";

const router = express.Router();

// Route to start a new game
router.post("/start", startGame);

// Route to get the current game state
router.get("/:gameId/state", getGameState);

// Route to update the game state
router.put("/:gameId/state", updateGameState);

export default router;