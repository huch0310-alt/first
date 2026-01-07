#!/bin/bash

# 停止脚本出错即退出
set -e

echo "🚀 开始部署生鲜 B2B 系统..."

# 1. 更新系统并安装必要软件
echo "📦 更新系统并安装依赖..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs nginx git

# 安装 PM2
sudo npm install -g pm2

# 2. 准备目录
echo "📂 准备项目目录..."
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

# 3. 拉取代码
if [ -d "/var/www/market" ]; then
    echo "🔄 更新代码..."
    cd /var/www/market
    git pull
else
    echo "📥 克隆代码..."
    git clone https://github.com/huch0310-alt/first.git /var/www/market
    cd /var/www/market
fi

# 4. 安装依赖并构建
echo "🛠️ 安装依赖并构建..."

# 后端
echo "  - 后端..."
cd /var/www/market/server
npm install

# 管理后台 (Client)
echo "  - 管理后台..."
cd /var/www/market/client
npm install
npm run build

# 客户App (Client-Customer)
echo "  - 客户App..."
cd /var/www/market/client-customer
npm install
npm run build

# 员工App (Client-Admin)
echo "  - 员工App..."
cd /var/www/market/client-admin
npm install
npm run build

# 5. 启动后端服务
echo "🚀 启动后端服务..."
cd /var/www/market/server
# 如果已存在则重启，否则启动
pm2 describe market-api > /dev/null 2>&1 && pm2 restart market-api || pm2 start server.js --name market-api
pm2 save
pm2 startup | bash || true # 忽略错误，有时需要手动运行输出的命令

# 6. 配置 Nginx
echo "⚙️ 配置 Nginx..."
cat > /etc/nginx/sites-available/market << 'EOF'
# 管理后台 (端口 80)
server {
    listen 80;
    server_name _;  # 匹配所有 IP/域名

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 前端静态文件
    location / {
        root /var/www/market/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

# 客户 App (端口 81)
server {
    listen 81;
    server_name _;

    location /api {
        proxy_pass http://localhost:3000;
    }

    location / {
        root /var/www/market/client-customer/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

# 员工 App (端口 82)
server {
    listen 82;
    server_name _;

    location /api {
        proxy_pass http://localhost:3000;
    }

    location / {
        root /var/www/market/client-admin/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/market /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试并重启 Nginx
sudo nginx -t
sudo systemctl restart nginx

echo "✅ 部署完成！"
echo "--------------------------------------------------"
echo "请确保阿里云安全组已开放以下端口："
echo "  - 80 (管理后台)"
echo "  - 81 (客户 App)"
echo "  - 82 (员工 App)"
echo "--------------------------------------------------"
