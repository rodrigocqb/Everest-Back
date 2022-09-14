import express from "express";
import { listProducts } from "../controllers/products.controller.js";

const router = express.Router();

router.get("/products", listProducts);

export default router;