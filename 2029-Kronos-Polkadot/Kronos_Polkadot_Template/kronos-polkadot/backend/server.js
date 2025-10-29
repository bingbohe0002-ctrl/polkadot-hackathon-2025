import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import predictRoutes from './routes/predict.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api', predictRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    name: 'Kronos Prediction Backend',
    version: '1.0.0',
    endpoints: {
      predict: '/api/predict?symbol=BTC',
      history: '/api/history?symbol=BTC&days=7',
      health: '/health'
    }
  });
});

// 启动 Python 预测服务
let pythonProcess = null;

function startPythonService() {
  console.log('🚀 Starting Python prediction service...');
  
  pythonProcess = spawn('python', ['predict_service.py'], {
    cwd: process.cwd(),
    env: process.env
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python Service] ${data.toString()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Service Error] ${data.toString()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python service exited with code ${code}`);
    if (code !== 0) {
      console.log('Restarting Python service in 5 seconds...');
      setTimeout(startPythonService, 5000);
    }
  });
}

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Provider: ${process.env.WS_PROVIDER || 'Not configured'}`);
  
  // 启动 Python 服务
  startPythonService();
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down gracefully...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Received SIGTERM, shutting down...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit(0);
});

