const express = require('express');
const router = express.Router();
const { Product, User } = require('../database');

// 1. 采购员上传商品
router.post('/', async (req, res) => {
    try {
        const { name, purchase_price, purchase_quantity, stock, description, image_url, creator_id } = req.body;
        const product = await Product.create({
            name,
            purchase_price,
            purchase_quantity: purchase_quantity || 1,
            stock: stock || purchase_quantity || 1, // 默认库存等于采购数量
            description,
            image_url,
            creator_id,
            status: 'pending' // 默认待审核
        });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 获取商品列表 (支持状态筛选)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status) where.status = status;

        const products = await Product.findAll({
            where,
            include: [{ model: User, attributes: ['name'] }] // 包含上传者信息
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. 销售员审核/修改商品 (定价、上架) - 库存不能手动调整
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { retail_price, status } = req.body;

        const product = await Product.findByPk(id);
        if (!product) return res.status(404).json({ error: '商品不存在' });

        if (retail_price !== undefined) product.retail_price = retail_price;
        if (status !== undefined) product.status = status;
        // 注意: stock 不能手动调整，只能通过下单自动扣减

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. 删除商品（采购员撤销未审核的商品）
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) return res.status(404).json({ error: '商品不存在' });

        // 只能删除待审核状态的商品
        if (product.status !== 'pending') {
            return res.status(400).json({ error: '只能撤销待审核的商品' });
        }

        await product.destroy();
        res.json({ message: '商品已撤销' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
