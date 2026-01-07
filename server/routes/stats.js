const express = require('express');
const router = express.Router();
const { Order, Product, sequelize } = require('../database');
const { Op } = require('sequelize');

router.get('/summary', async (req, res) => {
    try {
        const now = new Date();

        // 本周时间范围（最近7天）
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - 6);
        thisWeekStart.setHours(0, 0, 0, 0);

        // 上周时间范围
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1);

        // 1. 总销售额 (所有订单)
        const totalSales = await Order.sum('total_amount') || 0;

        // 2. 本周销售额
        const thisWeekSales = await Order.sum('total_amount', {
            where: { createdAt: { [Op.gte]: thisWeekStart } }
        }) || 0;

        // 3. 上周销售额
        const lastWeekSales = await Order.sum('total_amount', {
            where: { createdAt: { [Op.between]: [lastWeekStart, lastWeekEnd] } }
        }) || 0;

        // 4. 总订单数
        const totalOrders = await Order.count();

        // 5. 本周订单数
        const thisWeekOrders = await Order.count({
            where: { createdAt: { [Op.gte]: thisWeekStart } }
        });

        // 6. 上周订单数
        const lastWeekOrders = await Order.count({
            where: { createdAt: { [Op.between]: [lastWeekStart, lastWeekEnd] } }
        });

        // 7. 待处理订单
        const pendingOrders = await Order.count({ where: { status: 'pending' } });

        // 8. 上周待处理订单（用于对比）
        const lastWeekPending = await Order.count({
            where: {
                status: 'pending',
                createdAt: { [Op.between]: [lastWeekStart, lastWeekEnd] }
            }
        });

        // 9. 商品总数
        const totalProducts = await Product.count();

        // 计算环比百分比
        const calcChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous * 100).toFixed(1);
        };

        res.json({
            totalSales,
            totalOrders,
            pendingOrders,
            totalProducts,
            salesChange: parseFloat(calcChange(thisWeekSales, lastWeekSales)),
            ordersChange: parseFloat(calcChange(thisWeekOrders, lastWeekOrders)),
            pendingChange: parseFloat(calcChange(pendingOrders, lastWeekPending))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 销售趋势 - 最近7天每天的销售额
router.get('/trend', async (req, res) => {
    try {
        const days = 7;
        const result = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        for (let i = days - 1; i >= 0; i--) {
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - i);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);

            // 获取当天销售额
            const dailySales = await Order.sum('total_amount', {
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            // 格式化日期为 MM/DD
            const dateLabel = `${startDate.getMonth() + 1}/${startDate.getDate()}`;

            result.push({
                date: dateLabel,
                sales: dailySales || 0
            });
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

