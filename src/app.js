import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/product.routes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(authRoutes);
app.use(productsRoutes);
app.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT)
);
