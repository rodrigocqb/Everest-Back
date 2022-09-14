import express from "express";
import { createUser, login } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/sign-up", createUser);
router.post("/login", login);

export default router;
