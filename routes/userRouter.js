import express from "express";
import { signup, signing, deleteUser, updateStats, playerStats } from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signing", signing);
router.delete("/delete/:userId", deleteUser);
router.post("/updateStats", updateStats);
router.get("/playerStats", playerStats);


export default router;