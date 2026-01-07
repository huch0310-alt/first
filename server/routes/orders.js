const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, User, sequelize } = require('../database');

// 1. 客户提交订单
router.post('/', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { customer_id, items } = req.body; // items: [{ product_id, quantity }]

        // 获取客户信息以计算折扣
        const user = await User.findByPk(customer_id);
        if (!user) throw new Error('客户不存在');

        const discountPercentage = user.discount_percentage || 0;
        const discountMultiplier = 1 - (discountPercentage / 100);

        // 先检查所有商品库存
        for (const item of items) {
            const product = await Product.findByPk(item.product_id, { transaction: t, lock: true });
            if (!product) throw new Error(`商品 ID ${item.product_id} 不存在`);
            if (!product.stock || product.stock < item.quantity) {
                throw new Error(`商品 "${product.name}" 库存不足（库存: ${product.stock || 0}，需求: ${item.quantity}）`);
            }
        }

        // 生成订单编号: 日期时间 + 客户ID + 随机数
        // 格式: YYYYMMDDHHMMSS-CXXX-RRRR (例如: 20260106210303-C005-8472)
        const now = new Date();
        const datePart = now.getFullYear().toString()
            + String(now.getMonth() + 1).padStart(2, '0')
            + String(now.getDate()).padStart(2, '0')
            + String(now.getHours()).padStart(2, '0')
            + String(now.getMinutes()).padStart(2, '0')
            + String(now.getSeconds()).padStart(2, '0');
        const customerPart = 'C' + String(customer_id).padStart(3, '0');
        const randomPart = String(Math.floor(1000 + Math.random() * 9000)); // 4位随机数
        const orderNo = `${datePart}-${customerPart}-${randomPart}`;

        // 创建订单主体
        const order = await Order.create({
            order_no: orderNo,
            customer_id,
            status: 'pending',
            applied_discount: discountPercentage
        }, { transaction: t });

        let totalAmount = 0;

        // 处理订单项并扣减库存
        for (const item of items) {
            const product = await Product.findByPk(item.product_id, { transaction: t, lock: true });

            // 记录快照价格 (原价)
            const price = product.retail_price;

            await OrderItem.create({
                order_id: order.id,
                product_id: product.id,
                quantity: item.quantity,
                price_snapshot: price
            }, { transaction: t });

            // 扣减库存
            product.stock -= item.quantity;
            await product.save({ transaction: t });

            totalAmount += price * item.quantity;
        }

        // 计算最终折后总价
        order.total_amount = totalAmount * discountMultiplier;
        await order.save({ transaction: t });

        await t.commit();
        res.json(order);
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
    }
});

// 2. 获取订单列表 (支持筛选)
router.get('/', async (req, res) => {
    try {
        const { customer_id, status, start_date, end_date } = req.query;
        const where = {};

        if (customer_id) where.customer_id = customer_id;
        if (status) where.status = status;

        // 时间筛选 (简化版，实际可能需要处理时区)
        if (start_date && end_date) {
            const { Op } = require('sequelize');
            where.created_at = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }

        const orders = await Order.findAll({
            where,
            include: [
                { model: User, attributes: ['id', 'name', 'phone', 'address'] },
                { model: OrderItem, include: [Product] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. 经理/销售确认订单
router.put('/:id/confirm', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id);
        if (!order) return res.status(404).json({ error: '订单不存在' });

        order.status = 'confirmed';
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
