import express from "express";
import { listProducts, addToCart, listCartProducts, removeCartProduct  } from "../controllers/products.controller.js";
import authorizationMiddleware from '../middleware/token-auth.middleware.js';
const router = express.Router();

router.get("/products", listProducts);
router.use(authorizationMiddleware);
router.post("/cart", addToCart);
router.get("/cart", listCartProducts)
router.delete("/cart", removeCartProduct)
export default router;