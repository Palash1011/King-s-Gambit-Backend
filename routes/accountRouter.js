import express from "express";
import { getUserDetails } from "../controllers/accountController.js";

const router = express.Router();

router.get("/:userId", getUserDetails);

export default router;