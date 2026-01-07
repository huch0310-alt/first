# B2B 生鲜系统部署指南

## 系统架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (反向代理)  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ 管理后台   │  │ 客户端 App │  │ 员工端 App │
    │   :5173    │  │   :5174    │  │   :5175    │
    └────────────┘  └────────────┘  └────────────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                    ┌────────────┐
                    │ 后端 API   │
                    │   :3000    │
                    └────────────┘
                           │
                           ▼
                    ┌────────────┐
                    │  SQLite    │
                    └────────────┘
```

---

## 本地开发

### 1. 启动后端
```bash
cd server
npm install
npm run dev
```

### 2. 启动管理后台
```bash
cd client
npm install
npm run dev
```

### 3. 启动客户端 App
```bash
cd client-customer
npm install
npm run dev
```

### 4. 启动员工端 App
```bash
cd client-admin
npm install
npm run dev
```

---

## Docker 部署

### Dockerfile - 后端
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Dockerfile - 前端
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data

  admin:
    build:
      context: ./client
    ports:
      - "5173:80"

  customer:
    build:
      context: ./client-customer
    ports:
      - "5174:80"

  staff:
    build:
      context: ./client-admin
    ports:
      - "5175:80"
```

---

## 访问地址

| 应用 | 本地地址 | 说明 |
|------|---------|------|
| 后端 API | http://localhost:3000 | Express 服务器 |
| 管理后台 | http://localhost:5173 | 经理使用 (桌面端) |
| 客户端 | http://localhost:5174 | 客户下单 (移动端) |
| 员工端 | http://localhost:5175 | 采购/销售 (移动端) |

> **注意**: 如果端口被占用，就检查代码找出具体原因，记住每次都要先重启服务
