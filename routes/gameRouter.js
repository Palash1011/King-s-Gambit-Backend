import express from "express";
import { startGame, getGameState, updateGameState, assassinAction } from "../controllers/gameController.js";

const router = express.Router();

// Route to start a new game
router.post("/start", startGame);

// Route to get the current game state
router.get("/:gameId/state", getGameState);

// Route to update the game state
router.put("/:gameId/state", updateGameState);

// Route for assassin action
router.post("/:gameId/assassin-action", assassinAction);

export default router;