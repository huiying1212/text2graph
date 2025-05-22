// server.mjs
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import DeepSeekHandler from './deepseek_handler.mjs';

dotenv.config();

// 初始化DeepSeek处理程序
const deepseekHandler = new DeepSeekHandler(process.env.DEEPSEEK_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// 简单的请求限制中间件
const requestLimiter = (req, res, next) => {
  // 从请求中获取IP地址
  const ip = req.ip || req.connection.remoteAddress;
  
  // 检查IP地址是否在黑名单中
  if (ipBlacklist.has(ip)) {
    return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
  }
  
  // 记录请求时间戳
  if (!requestCounts[ip]) {
    requestCounts[ip] = [];
  }
  
  const now = Date.now();
  // 只保留最近1分钟的请求记录
  requestCounts[ip] = requestCounts[ip].filter(time => now - time < 60000);
  // 添加当前请求时间戳
  requestCounts[ip].push(now);
  
  // 如果1分钟内请求超过10次，将IP加入黑名单
  if (requestCounts[ip].length > 10) {
    ipBlacklist.add(ip);
    // 10分钟后从黑名单中移除
    setTimeout(() => {
      ipBlacklist.delete(ip);
    }, 600000);
    
    return res.status(429).json({ error: '请求过于频繁，请10分钟后再试' });
  }
  
  next();
};

// 请求计数和IP黑名单
const requestCounts = {};
const ipBlacklist = new Set();

// 应用请求限制中间件
app.use('/chat', requestLimiter);

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  
  // 基本验证：检查消息是否为空
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: '消息不能为空' });
  }

  try {
    // 使用DeepSeek处理程序处理用户输入
    const result = await deepseekHandler.processQuery(message);
    
    // 将数据发送回前端
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '发生了一个错误。', message: error.message });
  }
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
