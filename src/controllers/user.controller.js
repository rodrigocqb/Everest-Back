import db from '../database/db.js';
import bcrypt from 'bcrypt';
import joi from 'joi';
import dayjs from 'dayjs';

const createUserSchema = joi.object({
    name: joi.string().required().empty(),
    email: joi.string().required().empty().email(),
    password: joi.string().required().empty()
})

async function createUser(req, res) {
    const validation = createUserSchema.validate(req.body);
    if (validation.error) {
        res.sendStatus(422);
    }
    const { name, password } = req.body;
    const email = req.body.email.toLowerCase()

    const userData = {
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        date: dayjs().format('DD/MM/YYYY')
    };

    try {
        const hasUser = await db.collection('users').findOne({email: email});

        if(hasUser) {
            return res.sendStatus(409)
        };

        await db.collection('users').insertOne(userData);
        res.sendStatus(201);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

export {
    createUser
}