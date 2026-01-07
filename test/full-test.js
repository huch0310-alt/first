/**
 * B2B 生鲜系统完整功能测试脚本
 */
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 测试结果记录
const results = {
    passed: [],
    failed: [],
    data: {}
};

// HTTP 请求封装
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }
function pass(test) { results.passed.push(test); log(`✅ ${test}`); }
function fail(test, err) { results.failed.push({ test, err }); log(`❌ ${test}: ${err}`); }

async function runTests() {
    log('========================================');
    log('B2B 生鲜系统完整功能测试');
    log('========================================\n');

    // ==================== 1. 用户管理测试 ====================
    log('📋 1. 用户管理测试');
    log('----------------------------------------');

    // 1.1 创建客户账号
    try {
        const res = await request('POST', '/api/users', {
            name: '测试客户A', role: 'customer', phone: '13800001111',
            address: '北京市朝阳区测试路1号', discount_percentage: 15
        });
        if (res.status === 200 && res.data.id) {
            results.data.customerA = res.data;
            pass('创建客户账号 (测试客户A, 15%折扣)');
        } else {
            fail('创建客户账号', JSON.stringify(res.data));
        }
    } catch (e) { fail('创建客户账号', e.message); }

    // 1.2 创建采购员账号
    try {
        const res = await request('POST', '/api/users', {
            name: '采购员小王', role: 'purchaser', phone: '13900002222'
        });
        if (res.status === 200 && res.data.id) {
            results.data.purchaser = res.data;
            pass('创建采购员账号 (采购员小王)');
        } else {
            fail('创建采购员账号', JSON.stringify(res.data));
        }
    } catch (e) { fail('创建采购员账号', e.message); }

    // 1.3 创建销售员账号
    try {
        const res = await request('POST', '/api/users', {
            name: '销售员小李', role: 'seller', phone: '13900003333'
        });
        if (res.status === 200 && res.data.id) {
            results.data.seller = res.data;
            pass('创建销售员账号 (销售员小李)');
        } else {
            fail('创建销售员账号', JSON.stringify(res.data));
        }
    } catch (e) { fail('创建销售员账号', e.message); }

    // 1.4 获取用户列表
    try {
        const res = await request('GET', '/api/users');
        if (res.status === 200 && Array.isArray(res.data)) {
            results.data.userCount = res.data.length;
            pass(`获取用户列表 (共 ${res.data.length} 个用户)`);
        } else {
            fail('获取用户列表', JSON.stringify(res.data));
        }
    } catch (e) { fail('获取用户列表', e.message); }

    // 1.5 更新用户信息
    try {
        const res = await request('PUT', `/api/users/${results.data.customerA.id}`, {
            discount_percentage: 20
        });
        if (res.status === 200 && res.data.discount_percentage === 20) {
            pass('更新用户折扣率 (15% → 20%)');
        } else {
            fail('更新用户折扣率', JSON.stringify(res.data));
        }
    } catch (e) { fail('更新用户折扣率', e.message); }

    // ==================== 2. 商品管理测试 ====================
    log('\n📦 2. 商品管理测试');
    log('----------------------------------------');

    // 2.1 采购员录入商品
    try {
        const res = await request('POST', '/api/products', {
            name: '新鲜大白菜', purchase_price: 2.5, purchase_quantity: 100,
            stock: 100, description: '山东产地，新鲜直达',
            creator_id: results.data.purchaser?.id || 2
        });
        if (res.status === 200 && res.data.id) {
            results.data.product1 = res.data;
            pass('采购员录入商品 (新鲜大白菜, ¥2.5, 100斤)');
        } else {
            fail('采购员录入商品', JSON.stringify(res.data));
        }
    } catch (e) { fail('采购员录入商品', e.message); }

    // 2.2 录入第二个商品
    try {
        const res = await request('POST', '/api/products', {
            name: '有机西红柿', purchase_price: 5.0, purchase_quantity: 50,
            stock: 50, description: '无农药，有机种植',
            creator_id: results.data.purchaser?.id || 2
        });
        if (res.status === 200 && res.data.id) {
            results.data.product2 = res.data;
            pass('采购员录入商品 (有机西红柿, ¥5.0, 50斤)');
        } else {
            fail('采购员录入商品2', JSON.stringify(res.data));
        }
    } catch (e) { fail('采购员录入商品2', e.message); }

    // 2.3 获取待审核商品
    try {
        const res = await request('GET', '/api/products?status=pending');
        if (res.status === 200 && Array.isArray(res.data)) {
            pass(`获取待审核商品 (共 ${res.data.length} 个)`);
        } else {
            fail('获取待审核商品', JSON.stringify(res.data));
        }
    } catch (e) { fail('获取待审核商品', e.message); }

    // 2.4 销售员审核上架商品
    try {
        const res = await request('PUT', `/api/products/${results.data.product1.id}`, {
            retail_price: 4.5, status: 'active'
        });
        if (res.status === 200 && res.data.status === 'active') {
            pass('销售员审核上架 (大白菜: ¥2.5 → ¥4.5)');
        } else {
            fail('销售员审核上架', JSON.stringify(res.data));
        }
    } catch (e) { fail('销售员审核上架', e.message); }

    // 2.5 上架第二个商品
    try {
        const res = await request('PUT', `/api/products/${results.data.product2.id}`, {
            retail_price: 8.0, status: 'active'
        });
        if (res.status === 200 && res.data.status === 'active') {
            pass('销售员审核上架 (西红柿: ¥5.0 → ¥8.0)');
        } else {
            fail('销售员审核上架2', JSON.stringify(res.data));
        }
    } catch (e) { fail('销售员审核上架2', e.message); }

    // 2.6 获取已上架商品
    try {
        const res = await request('GET', '/api/products?status=active');
        if (res.status === 200 && Array.isArray(res.data)) {
            results.data.activeProducts = res.data.length;
            pass(`获取已上架商品 (共 ${res.data.length} 个)`);
        } else {
            fail('获取已上架商品', JSON.stringify(res.data));
        }
    } catch (e) { fail('获取已上架商品', e.message); }

    // 注意: 库存只能通过下单自动扣减，不能手动调整

    // ==================== 3. 订单管理测试 ====================
    log('\n🛒 3. 订单管理测试');
    log('----------------------------------------');

    // 3.1 客户下单
    try {
        const res = await request('POST', '/api/orders', {
            customer_id: results.data.customerA.id,
            items: [
                { product_id: results.data.product1.id, quantity: 10 },
                { product_id: results.data.product2.id, quantity: 5 }
            ]
        });
        if (res.status === 200 && res.data.id) {
            results.data.order1 = res.data;
            pass(`客户下单成功 (订单号: #${res.data.id}, 金额: ¥${res.data.total_amount})`);
        } else {
            fail('客户下单', JSON.stringify(res.data));
        }
    } catch (e) { fail('客户下单', e.message); }

    // 3.2 获取订单列表
    try {
        const res = await request('GET', '/api/orders');
        if (res.status === 200 && Array.isArray(res.data)) {
            results.data.orderCount = res.data.length;
            pass(`获取订单列表 (共 ${res.data.length} 个订单)`);
        } else {
            fail('获取订单列表', JSON.stringify(res.data));
        }
    } catch (e) { fail('获取订单列表', e.message); }

    // 3.3 确认订单
    try {
        const res = await request('PUT', `/api/orders/${results.data.order1.id}/confirm`);
        if (res.status === 200 && res.data.status === 'confirmed') {
            pass('经理确认订单 (pending → confirmed)');
        } else {
            fail('经理确认订单', JSON.stringify(res.data));
        }
    } catch (e) { fail('经理确认订单', e.message); }

    // 3.4 再下一单测试
    try {
        const res = await request('POST', '/api/orders', {
            customer_id: results.data.customerA.id,
            items: [{ product_id: results.data.product1.id, quantity: 20 }]
        });
        if (res.status === 200 && res.data.id) {
            results.data.order2 = res.data;
            pass(`再次下单成功 (订单号: #${res.data.id})`);
        } else {
            fail('再次下单', JSON.stringify(res.data));
        }
    } catch (e) { fail('再次下单', e.message); }

    // ==================== 4. 统计数据测试 ====================
    log('\n📊 4. 统计数据测试');
    log('----------------------------------------');

    // 4.1 获取统计概览
    try {
        const res = await request('GET', '/api/stats/summary');
        if (res.status === 200) {
            results.data.stats = res.data;
            pass(`获取统计概览 (销售额: ¥${res.data.totalSales}, 订单: ${res.data.totalOrders})`);
        } else {
            fail('获取统计概览', JSON.stringify(res.data));
        }
    } catch (e) { fail('获取统计概览', e.message); }

    // ==================== 5. 删除操作测试 ====================
    log('\n🗑️ 5. 删除操作测试');
    log('----------------------------------------');

    // 5.1 创建临时用户用于删除测试
    try {
        const res = await request('POST', '/api/users', {
            name: '临时用户', role: 'customer', phone: '10000000000'
        });
        if (res.status === 200 && res.data.id) {
            const delRes = await request('DELETE', `/api/users/${res.data.id}`);
            if (delRes.status === 200) {
                pass('删除用户功能测试');
            } else {
                fail('删除用户', JSON.stringify(delRes.data));
            }
        }
    } catch (e) { fail('删除用户测试', e.message); }

    // ==================== 测试报告 ====================
    log('\n========================================');
    log('测试报告');
    log('========================================');
    log(`✅ 通过: ${results.passed.length} 项`);
    log(`❌ 失败: ${results.failed.length} 项`);
    log(`📊 通过率: ${(results.passed.length / (results.passed.length + results.failed.length) * 100).toFixed(1)}%`);

    if (results.failed.length > 0) {
        log('\n失败项目:');
        results.failed.forEach(f => log(`  - ${f.test}: ${f.err}`));
    }

    log('\n测试数据汇总:');
    log(`  - 用户总数: ${results.data.userCount || '-'}`);
    log(`  - 上架商品: ${results.data.activeProducts || '-'}`);
    log(`  - 订单总数: ${results.data.orderCount || '-'}`);
    log(`  - 总销售额: ¥${results.data.stats?.totalSales || 0}`);

    log('\n========================================');
    log('测试完成');
    log('========================================');

    return results;
}

runTests().catch(console.error);
