import db from "../database/db.js";
import bcrypt from "bcrypt";
import joi from "joi";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";

const createUserSchema = joi.object({
  name: joi.string().required().empty(),
  email: joi.string().required().empty().email(),
  password: joi.string().required().empty(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

async function createUser(req, res) {
  const validation = createUserSchema.validate(req.body);
  if (validation.error) {
    res.sendStatus(422);
    return;
  }
  const { name, password } = req.body;
  const email = req.body.email.toLowerCase();

  const userData = {
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    date: dayjs().format("DD/MM/YYYY"),
  };

  try {
    const hasUser = await db.collection("users").findOne({ email: email });

    if (hasUser) {
      return res.sendStatus(409);
    }

    await db.collection("users").insertOne(userData);
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function login(req, res) {
  const validation = loginSchema.validate(req.body);
  if (validation.error) {
    res.sendStatus(422);
  }
  const { email, password } = req.body;
  try {
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(404).send({ error: "Check user and password inputs" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).send({ error: "Check user and password inputs" });
    }
    const token = uuid();
    await db.collection("sessions").insertOne({ userId: user._id, token });
    res.status(200).send({ name: user.name, date: user.date, token });
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export { createUser, login };
