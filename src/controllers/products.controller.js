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

async function addToCart(req, res) {
    const { productId } = req.body;
    if(!productId) {
        return sendStatus(422);
    }
    const userId = res.locals.user._id;
    const product = {
        userId,
        productId
    }
    try {
        const hasProduct = await db.collection('cart').findOne({userId: userId})
        if(hasProduct){
            return res.sendStatus(409)
        }
        await db.collection('cart').insertOne(product)
        res.sendStatus(200)
    } catch (error) {
        res
        .status(500)
        .send(error.message)

    }
}

export { listProducts, addToCart }