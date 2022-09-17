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

const productSchema = joi.object({
  name: joi.string().required(),
  price: joi.number().required(),
  image: joi.string().uri().required(),
  description: joi.string().required(),
  categories: joi.array().items(joi.string().required()).required(),
  units: joi.number().required(),
  shipping: joi.number().required(),
  sizes: joi.array().items(joi.string()),
});

async function createProduct(req, res) {
  const validation = productSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((value) => value.message);
    return res.status(422).send(errors);
  }
  try {
    await db.collection("products").insertOne(req.body);
    res.sendStatus(201);
  } catch (error) {
    res.send(error.message).status(500);
  }
}

async function listProducts(req, res) {
  try {
    const catalog = await db.collection("products").find({}).toArray();
    res.status(200).send(catalog);
  } catch (error) {
    res.send(error.message).status(404);
  }
}

async function addToCart(req, res) {
  const { productId } = req.params;
  if (!productId) {
    return sendStatus(422);
  }
  const userId = res.locals.user._id;
  const product = {
    userId,
    productId,
    quantity: 1,
  };
  try {
    const hasProduct = await db
      .collection("cart")
      .findOne({ userId, productId });
    const productData = await db.collection("products").findOne({
      _id: ObjectId(productId),
    });
    if (!productData) {
      return res.sendStatus(404);
    }
    if (productData.units <= 0) {
      return res
        .status(404)
        .send({ error: "There are no more units available" });
    }
    if (hasProduct) {
      const quantity = hasProduct.quantity;
      await db
        .collection("cart")
        .updateOne(
          { userId, productId },
          { $set: { quantity: quantity + 1, units: productData.units - 1 } }
        );
      await db
        .collection("products")
        .updateOne(
          { _id: ObjectId(productId) },
          { $set: { units: productData.units - 1 } }
        );
      return res.sendStatus(200);
    }
    await db.collection("cart").insertOne({
      ...product,
      name: productData.name,
      price: productData.price,
      image: productData.image,
      shipping: productData.shipping,
      units: productData.units - 1,
    });
    await db
      .collection("products")
      .updateOne(
        { _id: ObjectId(productId) },
        { $set: { units: productData.units - 1 } }
      );
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
  const cartItemId = req.params.cartItemId;
  console.log(cartItemId);
  if (!cartItemId) {
    return res.sendStatus(422);
  }
  try {
    const cartItem = await db
      .collection("cart")
      .findOne({ _id: ObjectId(cartItemId) });
    const productData = await db.collection("products").findOne({
      _id: ObjectId(cartItem.productId),
    });
    if (!productData) {
      return res.sendStatus(404);
    }
    const quantity = cartItem.quantity;
    if (quantity <= 0) {
      return res.sendStatus(422);
    }
    if (quantity > 1) {
      await db
        .collection("cart")
        .updateOne(
          { _id: ObjectId(cartItemId) },
          { $set: { quantity: quantity - 1 } }
        );
      await db
        .collection("products")
        .updateOne(
          { _id: ObjectId(productId) },
          { $set: { units: productData.units + 1 } }
        );
      return res.sendStatus(200);
    }
    await db.collection("cart").deleteOne({ _id: ObjectId(cartItemId) });
    await db
      .collection("products")
      .updateOne(
        { _id: ObjectId(productId) },
        { $set: { units: productData.units + 1 } }
      );
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
      date: dayjs().format("MM/DD/YYYY"),
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
  createProduct,
};
