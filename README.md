# B2B 生鲜管理系统

一个完整的 B2B 生鲜批发市场管理系统，支持采购、销售、客户订单全流程管理。

## 快速开始

### 启动服务

```bash
# 1. 启动后端 (端口 3000)
cd server && node server.js

# 2. 启动管理后台 (端口 5173)
cd client && npm run dev

# 3. 启动客户端 APP (端口 5174)
cd client-customer && npm run dev

# 4. 启动员工端 APP (端口 5175)
cd client-admin && npm run dev
```

### 默认账户

| 账号 | 密码 | 角色 | 访问地址 |
|------|------|------|----------|
| admin | 123456 | 经理 | http://localhost:5173 |
| purchaser | 123456 | 采购员 | http://localhost:5175 |
| seller | 123456 | 销售员 | http://localhost:5175 |
| customer1 | 123456 | 客户 | http://localhost:5174 |
| vip | 123456 | VIP客户 | http://localhost:5174 |

## 系统架构

```
├── server/          # 后端 (Node.js + Express + SQLite)
├── client/          # 管理后台 (React + Vite)
├── client-customer/ # 客户端 APP (React + Vite)
└── client-admin/    # 员工端 APP (React + Vite)
```

## 主要功能

- **用户管理**：经理/采购员/销售员/客户角色
- **商品管理**：采购录入 → 审核定价 → 上架销售
- **订单管理**：购物车下单 → 库存扣减 → 订单确认
- **账单打印**：对账单生成、订单详情打印
- **VIP 折扣**：客户自动折扣计算

## 详细文档

请查看 [DEPLOY.md](./DEPLOY.md) 获取完整部署说明。
