import { ObjectId } from "mongodb";
import db from '../database/db.js'

async function validateToken(req, res, next) {

    const authorization = req.headers.authorization;
    const token = authorization?.replace('Bearer ', '');
console.log(authorization)
    if (!authorization) {
        return res.sendStatus(401);
    }

    try {
        const userSession = await db.collection('sessions').findOne({ token: token });
        if (!userSession) {
            return res.sendStatus(401);
        }
        const user = await getUserData(userSession.userId)
        
        if (!user) {
            return res.sendStatus(401)
        }

        res.locals.user = user;
        res.locals.token = token;

console.log('foi')
        next();

    } catch (error) {
        return res.sendStatus(404)
    }
}

async function getUserData(userId) {
    const userData = await db.collection('users').findOne({ _id: ObjectId (userId) })
    return userData
}

export default validateToken