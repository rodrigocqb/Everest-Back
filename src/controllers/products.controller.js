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

const paymentDataSchema = joi.object({
  cardNumber: joi
    .string()
    .pattern(/^[0-9]{16}$/)
    .required(),
  expirationDate: joi
    .string()
    .pattern(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/)
    .required(),
  name: joi.string().required(),
  securityCode: joi.number().min(100).max(999).required(),
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
  const productId = req.params.productId;
  const userId = res.locals.user._id;
  if (!productId) {
    return res.sendStatus(422);
  }
  try {
    const cartItem = await db.collection("cart").findOne({ userId, productId });
    const productData = await db.collection("products").findOne({
      _id: ObjectId(productId),
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
        .updateOne({ _id: cartItem._id }, { $set: { quantity: quantity - 1 } });
      await db
        .collection("products")
        .updateOne(
          { _id: ObjectId(productId) },
          { $set: { units: productData.units + 1 } }
        );
      return res.sendStatus(200);
    }
    await db.collection("cart").deleteOne({ _id: cartItem._id });
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
  const address = {
    street: req.body.street,
    number: req.body.number,
    zipCode: req.body.zipCode,
    city: req.body.city,
    state: req.body.state,
  };
  const paymentData = {
    cardNumber: req.body.cardNumber,
    expirationDate: req.body.expirationDate,
    name: req.body.name,
    securityCode: req.body.securityCode,
  };
  const validation = addressSchema.validate(address, { abortEarly: false });
  const validation2 = paymentDataSchema.validate(paymentData, {
    abortEarly: false,
  });
  if (validation.error) {
    const errors = validation.error.details.map((value) => value.message);
    return res.status(422).send(errors);
  }
  if (validation2.error) {
    const errors = validation2.error.details.map((value) => value.message);
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
      paymentData,
      date: dayjs().format("MM/DD/YYYY"),
    });
    await db.collection("cart").deleteMany({ userId: user._id });
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function listOrders(req, res) {
  const user = res.locals.user;

  try {
    const ordersHistory = await db
      .collection("orders")
      .find({ userId: user._id })
      .toArray();
    delete ordersHistory.userId;
    res.status(200).send(ordersHistory);
  } catch (error) {
    res.sendStatus(401);
  }
}
async function addToList(req, res) {
  const user = res.locals.user;
  const productId = req.params.productId;
  let price, image, name;
  try {
    const product = await db
      .collection("products")
      .findOne({ _id: ObjectId(productId) });
    price = product.name;
    image = product.image;
    name = product.name;
  } catch (error) {
    return res.sendStatus(500);
  }

  const item = {
    userId: user._id,
    productId,
    price,
    image,
    name,
    date: dayjs().format("MM/DD/YYYY"),
  };

  try {
    const hasItem = await db
      .collection("wishlist")
      .findOne({ userId: user._id, productId });
    if (hasItem) {
      return res.sendStatus(409);
    }
    await db.collection("wishlist").insertOne({ item });
    res.sendStatus(201);
  } catch (error) {
    res.status(422).send(error.message);
  }
}

async function deleteListItem(req, res) {
  const itemId = req.params.itemId;
  try {
    await db.collection("wishlist").deleteOne({ _Id: ObjectId(itemId) });
    res.sendStatus(200);
  } catch (error) {
    res.status(404).send(error.message);
  }
}

async function listWishlist(req, res) {
  const user = res.locals.user;
  try {
    const items = await db
      .collection("wishlist")
      .find({ userId: user._id })
      .toArray();
    res.status(200).send(items);
  } catch (error) {
    res.status(422).send(error.message);
  }
}

export {
  listProducts,
  addToCart,
  listCartProducts,
  removeCartProduct,
  completeOrder,
  createProduct,
  listOrders,
  addToList,
  deleteListItem,
  listWishlist,
};
