// deepseek_handler.mjs
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeepSeekHandler {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.deepseek.com';
    this.imageData = null;
    this.contentData = null;
    this.systemPrompt = '';
    this.loadDataFiles();
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

  // 加载数据文件
  loadDataFiles() {
    try {
      const imagePath = path.join(__dirname, '..', 'image.json');
      const contentPath = path.join(__dirname, '..', 'content.json');
      
      this.imageData = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
      this.contentData = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      
      console.log('数据文件加载成功');
    } catch (error) {
      console.error('加载数据文件失败:', error);
      throw new Error('无法加载数据文件');
    }
  }

  // 构建带上下文的提示词
  buildContextPrompt(userInput) {
    // 为了避免token过多，我们只发送部分内容数据
    // 实际应用中可以根据用户输入进行相关性匹配
    const imageContext = this.imageData.slice(0, 20);
    
    // 为每个内容章节提供摘要
    const contentSummary = this.contentData.map(item => {
      return {
        chapter_number: item.chapter_number,
        chapter_name: item.chapter_name,
        summary: item.chapter_test.substring(0, 500) + '...' // 只取前500个字符
      };
    });

    // 构建提示词
    const contextPrompt = `
以下是可用的参考数据:

## 图片数据示例:
${JSON.stringify(imageContext, null, 2)}

## 内容数据摘要:
${JSON.stringify(contentSummary, null, 2)}

用户输入: ${userInput}

根据提供的信息，按照要求的JSON格式生成输出。
`;

    return contextPrompt;
  }

  // 调用DeepSeek API
  async processQuery(userInput) {
    try {
      // 构建提示词
      const userMessage = this.buildContextPrompt(userInput);

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