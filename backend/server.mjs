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

// 在服务启动时初始化向量数据库
(async () => {
  try {
    console.log("正在初始化向量数据库...");
    await deepseekHandler.initializeVectorDB();
    console.log("向量数据库初始化成功");
  } catch (error) {
    console.error("向量数据库初始化失败:", error);
  }
})();

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
