// deepseek_handler.mjs
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import VectorDBHandler from './vectordb.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeepSeekHandler {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.deepseek.com';
    this.systemPrompt = '';
    this.vectorDBHandler = new VectorDBHandler();
    this.loadSystemPrompt();
  }

  // 加载系统提示词
  loadSystemPrompt() {
    try {
      const promptPath = path.join(__dirname, '..', 'prompt.txt');
      this.systemPrompt = fs.readFileSync(promptPath, 'utf8');
      console.log('系统提示词加载成功');
    } catch (error) {
      console.error('加载系统提示词失败:', error);
      this.systemPrompt = 'You are an assistant that generates structured JSON for visualizing input text.';
    }
  }

  // 初始化向量数据库
  async initializeVectorDB() {
    await this.vectorDBHandler.initialize();
  }

  // 构建带上下文的提示词
  async buildContextPrompt(userInput) {
    // 确保向量数据库已初始化
    if (!this.vectorDBHandler.initialized) {
      await this.initializeVectorDB();
    }

    // 使用向量相似性搜索获取相关文档
    const searchResults = await this.vectorDBHandler.similaritySearch(userInput, 10);
    
    // 分离图片和内容数据
    const imageData = [];
    const contentData = [];
    
    // 处理内容搜索结果
    for (const doc of searchResults.contentResults) {
      // 将内容添加到章节数据中，如果该章节已存在则合并
      const existingChapter = contentData.find(item => 
        item.chapter_number === doc.metadata.chapter_number
      );
      
      if (existingChapter) {
        // 如果已存在该章节，则添加内容
        if (!existingChapter.chapter_test.includes(doc.pageContent)) {
          existingChapter.chapter_test += '\n' + doc.pageContent;
        }
      } else {
        // 如果不存在该章节，则创建新的
        contentData.push({
          chapter_number: doc.metadata.chapter_number,
          chapter_name: doc.metadata.chapter_name,
          chapter_test: doc.pageContent
        });
      }
    }
    
    // 处理图片搜索结果
    for (const doc of searchResults.imageResults) {
      imageData.push({
        chapter_number: doc.metadata.chapter_number,
        chapter_name: doc.metadata.chapter_name,
        image_ID: doc.metadata.image_ID,
        image_url: doc.metadata.image_url,
        image_description: doc.pageContent
      });
    }

    // 构建提示词
    const contextPrompt = `
以下是与您查询相关的参考数据:

## 图片数据:
${JSON.stringify(imageData, null, 2)}

## 内容数据摘要:
${JSON.stringify(contentData, null, 2)}

用户输入: ${userInput}

根据提供的信息，按照要求的JSON格式生成输出。
`;

    return contextPrompt;
  }

  // 调用DeepSeek API
  async processQuery(userInput) {
    try {
      // 构建提示词
      const userMessage = await this.buildContextPrompt(userInput);

      // 打印构建好的提示词
      console.log('===== 构建的提示词开始 =====');
      console.log(userMessage);
      console.log('===== 构建的提示词结束 =====');

      // 调用DeepSeek API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('DeepSeek API错误:', errorData);
        throw new Error(`DeepSeek API错误: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const assistantReply = result.choices[0].message.content;

      console.log('获取到DeepSeek响应');
      console.log('===== DeepSeek响应内容开始 =====');
      console.log(assistantReply);
      console.log('===== DeepSeek响应内容结束 =====');

      // 尝试解析JSON
      let data;
      try {
        // 清理可能存在的markdown格式
        const cleanReply = assistantReply.replace(/```json|```/g, '').trim();
        data = JSON.parse(cleanReply);
        return { reply: assistantReply, data };
      } catch (error) {
        console.error('JSON解析错误:', error);
        throw new Error('无法解析响应为JSON');
      }
    } catch (error) {
      console.error('处理查询时出错:', error);
      throw error;
    }
  }
}

export default DeepSeekHandler; 