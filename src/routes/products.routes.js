import express from "express";
import {
  listProducts,
  addToCart,
  listCartProducts,
  removeCartProduct,
  completeOrder,
  createProduct,
  listOrders,
  addToList,
  deleteListItem,
  listWishlist
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
router.get("/order", listOrders);
router.post("/wishlist/:productId", addToList);
router.delete("/wishlist/:productId", deleteListItem);
router.get("/wishlist", listWishlist);
export default router;
