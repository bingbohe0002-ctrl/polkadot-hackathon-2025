# 使用 Debian 基础镜像（支持 PyTorch）
FROM python:3.11-slim

WORKDIR /app

# 安装 Node.js 18
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 复制并安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制模型文件和 Python 服务
COPY model/ ./model/
COPY predict_service.py .

# 安装 Node.js 依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY server.js .
COPY routes/ ./routes/

# 创建非 root 用户
RUN useradd -m -u 1001 nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# 暴露端口
EXPOSE 5000 5001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

# 启动应用
CMD ["node", "server.js"]
