import db from "../database/db.js";
import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import joi from "joi";

const addressSchema = joi.object({
  street: joi.string().required(),
  number: joi.number().required(),
  zipCode: joi.number().required(),
  city: joi.string().required(),
  state: joi.string().required(),
});

async function listProducts(req, res) {
  try {
    const catalog = await db.collection("products").find({}).toArray();
    res.status(200).send(catalog);
  } catch (error) {
    res.send(error.message).status(404);
  }
}

async function addToCart(req, res) {
  const { productId } = req.body;
  if (!productId) {
    return sendStatus(422);
  }
  const userId = res.locals.user._id;
  const product = {
    userId,
    productId,
  };
  try {
    const hasProduct = await db.collection("cart").findOne({ userId: userId });
    if (hasProduct) {
      return res.sendStatus(409);
    }
    await db.collection("cart").insertOne(product);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function listCartProducts(req, res) {
  const userId = res.locals.user._id;
  try {
    const productsList = await db.collection("cart").find({ userId }).toArray();
    if (!productsList) {
      return res.sendStatus(404);
    }
    res.status(200).send(productsList);
  } catch (error) {
    res.status(422).send(error.message);
  }
}

async function removeCartProduct(req, res) {
  const cartItemId = req.body.cartItemId;
  if (!cartItemId) {
    return res.sendStatus(422);
  }
  try {
    await db.collection("cart").deleteOne({ _id: ObjectId(cartItemId) });
    res.sendStatus(200);
  } catch (error) {
    res.status(404).send(error.message);
  }
}

async function completeOrder(req, res) {
  const user = res.locals.user;
  const address = req.body;
  const validation = addressSchema.validate(address, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((value) => value.message);
    return res.status(422).send(errors);
  }
  try {
    const products = await db
      .collection("cart")
      .find({ userId: user._id })
      .toArray();
    if (!products) {
      return res.status(422).send({ error: "Your cart is empty" });
    }
    await db.collection("orders").insertOne({
      userId: user._id,
      products,
      address,
      date: dayjs().format("DD/MM/YYYY"),
    });
    await db.collection("cart").deleteMany({ userId: user._id });
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export {
  listProducts,
  addToCart,
  listCartProducts,
  removeCartProduct,
  completeOrder,
};
