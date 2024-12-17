import express from "express";
import { signup, signing, deleteUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signing", signing);
router.delete("/delete/:userId", deleteUser);

export default router;