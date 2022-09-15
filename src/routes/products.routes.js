import express from "express";
import { listProducts, addToCart  } from "../controllers/products.controller.js";
import authorizationMiddleware from '../middleware/token-auth.middleware.js';
const router = express.Router();

router.get("/products", listProducts);
router.use(authorizationMiddleware);
router.post("/cart", addToCart);
export default router;