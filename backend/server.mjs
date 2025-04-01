// server.mjs
import dotenv from 'dotenv';
import OpenAI from 'openai';
import express from 'express';
import cors from 'cors';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// const assistantId = 'asst_Zim6IJi5s5qRQhewWMjiqjuM';
const assistantId = 'asst_YpyxHD5eDY3bmbUqJhDSV0Ij';

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

// 优化的等待助手运行完成的函数
async function waitForRunCompletion(threadId, runId, maxRetries = 30) {
  let run;
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      run = await openai.beta.threads.runs.retrieve(threadId, runId);
      
      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return run;
      }
      
      // 使用指数退避策略，随着尝试次数增加等待时间
      const waitTime = Math.min(1000 * Math.pow(1.5, attempts), 10000); // 最多等待10秒
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempts++;
    } catch (error) {
      console.error(`Error retrieving run (attempt ${attempts}):`, error);
      // 如果是网络或API错误，使用更长的等待时间
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      if (attempts >= maxRetries) {
        throw new Error('达到最大重试次数，无法完成运行');
      }
    }
  }
  
  throw new Error('请求超时，助手未能完成运行');
}

// 应用请求限制中间件
app.use('/chat', requestLimiter);

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  
  // 基本验证：检查消息是否为空
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: '消息不能为空' });
  }

  try {
    // 创建一个新的对话线程
    const thread = await openai.beta.threads.create();

    // 将用户的消息添加到线程中
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
    });

    // 运行助手
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // 等待运行完成
    const completedRun = await waitForRunCompletion(thread.id, run.id);

    if (completedRun.status === 'completed') {
      // 获取消息列表
      const messages = await openai.beta.threads.messages.list(completedRun.thread_id);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      
      if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
        return res.status(500).json({ error: '助手回复为空' });
      }
      
      const assistantReply = assistantMessage.content[0].text.value;

      // 在解析之前记录助手的回复
      console.log('Assistant Reply:', assistantReply);

      let data;
      try {
        // 解析助手的回复为JSON
        data = JSON.parse(assistantReply);
      } catch (parseError) {
        console.error('JSON Parsing Error:', parseError);
        return res.status(500).json({ error: '助手回复的格式无效，无法解析为JSON。' });
      }

      // 将数据发送回前端
      res.json({ reply: assistantReply, data });
    } else {
      // 运行失败，获取错误详情
      console.error('Run failed. Error details:', completedRun.error);
      res.status(500).json({ error: '助手运行失败。', details: completedRun.error });
    }
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
