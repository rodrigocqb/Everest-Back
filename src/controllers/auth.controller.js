import db from "../database/db.js";
import bcrypt from "bcrypt";
import joi from "joi";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { stripHtml } from "string-strip-html";


const createUserSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().required().email(),
  password: joi.string().required(),
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
    name: stripHtml(name).result.trim(),
    email,
    password: bcrypt.hashSync(password, 10),
    date: dayjs().format("MM/DD/YYYY"),
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
  const { password } = req.body;
  const email = req.body.email.toLowerCase();
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
