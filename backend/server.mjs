// server.mjs
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import DeepSeekHandler from './deepseek_handler.mjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// 兼容ESM下的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化DeepSeek处理程序
const deepseekHandler = new DeepSeekHandler(process.env.DEEPSEEK_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// 设置 multer 用于文件上传
const upload = multer({
  dest: path.join(__dirname, 'uploads')
});

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

// 知识梳理路由
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

// 知识拓展路由
app.post('/extend', async (req, res) => {
  const { message } = req.body;
  
  // 基本验证：检查消息是否为空
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: '消息不能为空' });
  }

  try {
    // 使用DeepSeek处理程序处理用户的知识拓展请求
    const result = await deepseekHandler.processExtensionQuery(message);
    
    // 将数据发送回前端
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '发生了一个错误。', message: error.message });
  }
});

// 节点拓展路由（使用prompt3）
app.post('/node-extend', async (req, res) => {
  const { nodeKeyword } = req.body;
  
  // 基本验证：检查关键词是否为空
  if (!nodeKeyword || typeof nodeKeyword !== 'string' || nodeKeyword.trim() === '') {
    return res.status(400).json({ error: '节点关键词不能为空' });
  }

  try {
    // 使用DeepSeek处理程序处理节点拓展请求
    const result = await deepseekHandler.processNodeExtensionQuery(nodeKeyword);
    
    // 将数据发送回前端
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '发生了一个错误。', message: error.message });
  }
});

// ============ 新增: 文件上传路由 ============
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未检测到上传文件' });
    }

    const { path: filePath, originalname } = req.file;

    console.log(`收到上传文件: ${originalname}, 保存路径: ${filePath}`);

    // 调用向量数据库处理上传文件
    await deepseekHandler.vectorDBHandler.addUploadedFile(filePath, originalname);

    res.json({ message: '文件上传并向量化成功', filename: originalname });
  } catch (error) {
    console.error('文件上传处理出错:', error);
    res.status(500).json({ error: '文件上传或向量化失败', message: error.message });
  }
});
// ============ 文件上传路由结束 ============

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
