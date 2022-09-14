import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI)

try {
    await mongoClient.connect();
    console.log("MongoDB connected");
} catch (error) {
    console.log(error.message);
}
const db = mongoClient.db('everest');

export default db