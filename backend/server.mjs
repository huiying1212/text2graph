// server.mjs
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import DeepSeekHandler from './deepseek_handler.mjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // Added for file system operations
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'; // PDF解析库

dotenv.config();

// 兼容ESM下的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDF文本提取函数
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    // 将Buffer转换为Uint8Array
    const uint8Array = new Uint8Array(dataBuffer);
    const pdfDocument = await pdfjs.getDocument({ data: uint8Array }).promise;
    const numPages = pdfDocument.numPages;
    let fullText = '';

    // 提取所有页面的文本
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('PDF文本提取失败:', error);
    throw new Error(`PDF解析失败: ${error.message}`);
  }
}

// 初始化DeepSeek处理程序
const deepseekHandler = new DeepSeekHandler(process.env.DEEPSEEK_API_KEY);

const app = express();
app.use(cors());
// 增加请求体大小限制，支持大文件上传
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 设置 multer 用于 reference 文件上传（左侧首页）
const referenceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'reference'));
  },
  filename: function (req, file, cb) {
    // 检查是否与重要文件冲突
    const protectedFiles = ['content.json', 'image.json'];
    let filename = file.originalname;
    
    if (protectedFiles.includes(filename)) {
      // 如果文件名冲突，添加时间戳前缀
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `uploaded-${timestamp}-${filename}`;
    }
    
    cb(null, filename);
  }
});

// 设置 multer 用于用户输入文件上传（右侧输入框）
const inputStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    // 确保uploads目录存在
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 为用户输入文件生成唯一的文件名，保留原始文件扩展名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${ext}`;
    cb(null, filename);
  }
});

const referenceUpload = multer({ 
  storage: referenceStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

const inputUpload = multer({ 
  storage: inputStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
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

// ============ 文件上传路由（左侧首页reference文件） ============
app.post('/upload', referenceUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未检测到上传文件' });
    }

    const { path: filePath, originalname, filename } = req.file;

    console.log(`收到reference文件上传: ${originalname}`);
    console.log(`保存到reference目录: ${filename}`);
    console.log(`完整路径: ${filePath}`);

    // 调用向量数据库处理上传文件
    await deepseekHandler.vectorDBHandler.addUploadedFile(filePath, filename);

    res.json({ 
      message: '文件上传并向量化成功', 
      originalName: originalname,
      savedAs: filename,
      location: 'backend/reference/'
    });
  } catch (error) {
    console.error('Reference文件上传处理出错:', error);
    res.status(500).json({ error: '文件上传或向量化失败', message: error.message });
  }
});

// ============ 新增: 用户输入文件上传路由（右侧输入框） ============
app.post('/upload-input', inputUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未检测到上传文件' });
    }

    const { path: filePath, originalname, filename } = req.file;

    console.log(`收到用户输入文件上传: ${originalname}`);
    console.log(`保存到uploads目录: ${filename}`);
    console.log(`完整路径: ${filePath}`);

    let fileContent = '';
    const fileExtension = path.extname(originalname).toLowerCase();

    try {
      // 根据文件类型进行不同的处理
      if (fileExtension === '.pdf') {
        // 处理PDF文件
        console.log('正在解析PDF文件...');
        fileContent = await extractTextFromPDF(filePath);
        console.log(`PDF解析完成，提取了 ${fileContent.length} 个字符`);
      } else if (['.txt', '.md', '.json', '.js', '.py', '.html', '.css'].includes(fileExtension)) {
        // 处理文本文件
        console.log('正在读取文本文件...');
        fileContent = fs.readFileSync(filePath, 'utf8');
      } else {
        // 不支持的文件类型，尝试作为文本读取
        console.log('尝试作为文本文件读取...');
        fileContent = fs.readFileSync(filePath, 'utf8');
      }

      // 检查文件内容是否为空
      if (!fileContent || fileContent.trim() === '') {
        return res.status(400).json({ error: '文件内容为空或无法解析' });
      }

      res.json({ 
        message: '文件上传成功', 
        originalName: originalname,
        savedAs: filename,
        location: 'backend/uploads/',
        content: fileContent,
        fileType: fileExtension,
        contentLength: fileContent.length
      });

    } catch (parseError) {
      console.error('文件解析错误:', parseError);
      return res.status(400).json({ 
        error: '文件解析失败', 
        message: `不支持的文件格式或文件损坏: ${fileExtension}`,
        details: parseError.message 
      });
    }

  } catch (error) {
    console.error('用户输入文件上传处理出错:', error);
    res.status(500).json({ error: '文件上传失败', message: error.message });
  }
});
// ============ 用户输入文件上传路由结束 ============

// ============ 新增: 获取已向量化文件信息路由 ============
app.get('/vectorized-files', async (req, res) => {
  try {
    const referenceDir = path.join(__dirname, 'reference');
    const vectorizedFiles = [];

    // 读取reference目录下的所有文件
    if (fs.existsSync(referenceDir)) {
      const files = fs.readdirSync(referenceDir);
      
      for (const file of files) {
        const filePath = path.join(referenceDir, file);
        const stats = fs.statSync(filePath);
        
        // 过滤掉目录，只处理文件
        if (stats.isFile()) {
          const fileInfo = {
            filename: file,
            size: stats.size,
            uploadTime: stats.mtime,
            isSystemFile: ['content.json', 'image.json'].includes(file),
            type: file.endsWith('.json') ? 'json' : 
                  file.endsWith('.txt') ? 'text' : 
                  file.endsWith('.pdf') ? 'pdf' :
                  file.endsWith('.doc') || file.endsWith('.docx') ? 'word' : 'other'
          };
          vectorizedFiles.push(fileInfo);
        }
      }
    }

    // 按上传时间倒序排列
    vectorizedFiles.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

    res.json({
      success: true,
      files: vectorizedFiles,
      total: vectorizedFiles.length
    });
  } catch (error) {
    console.error('获取向量化文件信息失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取向量化文件信息失败', 
      message: error.message 
    });
  }
});
// ============ 获取已向量化文件信息路由结束 ============

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
