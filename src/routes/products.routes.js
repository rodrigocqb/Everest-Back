import express from "express";
import {
  listProducts,
  addToCart,
  listCartProducts,
  removeCartProduct,
  completeOrder,
  createProduct,
  getOrders
} from "../controllers/products.controller.js";
import authorizationMiddleware from "../middleware/token-auth.middleware.js";
const router = express.Router();

router.get("/products", listProducts);
router.post("/products", createProduct);

router.use(authorizationMiddleware);

router.post("/cart/:productId", addToCart);
router.get("/cart", listCartProducts);
router.delete("/cart/:productId", removeCartProduct);
router.post("/order", completeOrder);
router.get("/order", getOrders);
export default router;
