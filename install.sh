#!/bin/bash
# 生鲜 B2B 系统一键部署脚本 v2.0
# 使用方法: curl -sSL https://raw.githubusercontent.com/huch0310-alt/first/main/install.sh | bash

set -e
echo "═══════════════════════════════════════════════════════════════"
echo "              🥬 生鲜 B2B 系统一键部署 v2.0"
echo "═══════════════════════════════════════════════════════════════"

# 检测系统
if [ -f /etc/debian_version ]; then
    PKG_MANAGER="apt-get"
    PKG_UPDATE="apt-get update"
elif [ -f /etc/redhat-release ]; then
    PKG_MANAGER="yum"
    PKG_UPDATE="yum update -y"
else
    echo "❌ 不支持的操作系统，请使用 Ubuntu/Debian 或 CentOS"
    exit 1
fi

echo "📦 [1/6] 安装系统依赖..."
$PKG_UPDATE > /dev/null 2>&1
$PKG_MANAGER install -y curl git nginx > /dev/null 2>&1

echo "📦 [2/6] 安装 Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    $PKG_MANAGER install -y nodejs > /dev/null 2>&1
fi
npm install -g pm2 > /dev/null 2>&1

echo "📥 [3/6] 下载代码..."
rm -rf /var/www/market
mkdir -p /var/www
git clone --depth 1 https://github.com/huch0310-alt/first.git /var/www/market > /dev/null 2>&1
cd /var/www/market

echo "🔧 [4/6] 安装依赖并构建前端..."
# 后端
cd /var/www/market/server && npm install --production > /dev/null 2>&1
# 管理后台
cd /var/www/market/client && npm install > /dev/null 2>&1 && npm run build > /dev/null 2>&1
# 客户App
cd /var/www/market/client-customer && npm install > /dev/null 2>&1 && npm run build > /dev/null 2>&1
# 员工App
cd /var/www/market/client-admin && npm install > /dev/null 2>&1 && npm run build > /dev/null 2>&1

echo "🚀 [5/6] 启动后端服务..."
cd /var/www/market/server
pm2 delete market-api 2>/dev/null || true
pm2 start server.js --name market-api
pm2 save > /dev/null 2>&1
pm2 startup 2>/dev/null || true

echo "⚙️ [6/6] 配置 Nginx..."
cat > /etc/nginx/sites-available/market << 'NGINX_CONF'
# 管理后台 (端口 80)
server {
    listen 80;
    server_name _;
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        root /var/www/market/client/dist;
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
        try_files $uri $uri/ /index.html;
    }
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/market /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1 && systemctl restart nginx

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "              ✅ 部署完成！"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  📊 管理后台: http://$SERVER_IP"
echo "  🛒 客户 App: http://$SERVER_IP:81"
echo "  👷 员工 App: http://$SERVER_IP:82"
echo ""
echo "  🔐 超级管理员: superadmin / 123456"
echo ""
echo "  ⚠️  请确保阿里云安全组已开放端口: 80, 81, 82"
echo "═══════════════════════════════════════════════════════════════"
