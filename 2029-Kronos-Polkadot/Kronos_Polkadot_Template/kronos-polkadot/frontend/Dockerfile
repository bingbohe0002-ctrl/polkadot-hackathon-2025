# 多阶段构建 Dockerfile for Kronos Prediction Frontend

# 阶段 1: 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 设置环境变量
ENV VITE_BACKEND_URL=http://localhost:5000
ENV VITE_WS_PROVIDER=wss://westend-rpc.polkadot.io
ENV VITE_CONTRACT_ADDRESS=""

# 复制依赖文件
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./

# 安装依赖
RUN npm install

# 复制源代码
COPY src/ ./src/
COPY index.html ./

# 创建 public 目录
RUN mkdir -p public

# 构建应用（跳过 TypeScript 类型检查）
RUN npx vite build

# 阶段 2: 生产环境
FROM nginx:alpine AS production

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建 nginx 配置
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    
    # 添加安全头但允许钱包扩展
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # CSP 策略 - 允许钱包扩展工作
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws: http://localhost:* http://127.0.0.1:*; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self';" always;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
