import db from '../database/db.js';

async function listProducts(req, res) {
    try {
       const catalog = await db.collection('products').find({}).toArray();
       res
       .status(200)
       .send(catalog)
    } catch (error) {
        return res
        .send(error.message)
        .status(404);
    }
}

export {listProducts}