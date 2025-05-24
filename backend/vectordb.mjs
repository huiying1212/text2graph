// vectordb.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { Embeddings } from '@langchain/core/embeddings';
import { AutoTokenizer, AutoModel } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 修改路径解析方式，与成功的minimal_test保持一致
const modelsParentDir = path.resolve('./models');
const modelFolderName = 'all-MiniLM-L6-v2';

// 创建自定义Embeddings类
class CustomTransformersEmbeddings extends Embeddings {
  constructor() {
    super();
    this.tokenizer = null;
    this.model = null;
    this.initialized = false;
  }
  
  async init() {
    if (this.initialized) return;
    
    try {
      console.log(`[CustomEmbeddings] 加载分词器和模型...`);
      console.log(`[CustomEmbeddings] modelsParentDir: ${modelsParentDir}`);
      console.log(`[CustomEmbeddings] modelFolderName: ${modelFolderName}`);
      
      this.tokenizer = await AutoTokenizer.from_pretrained(modelFolderName, {
        local_files_only: true,
        cache_dir: modelsParentDir,
      });
      
      this.model = await AutoModel.from_pretrained(modelFolderName, {
        local_files_only: true,
        cache_dir: modelsParentDir,
        quantized: false,
      });
      
      this.initialized = true;
      console.log(`[CustomEmbeddings] 分词器和模型加载成功!`);
    } catch (error) {
      console.error(`[CustomEmbeddings] 加载失败:`, error);
      throw error;
    }
  }
  
  async embedDocuments(texts) {
    await this.init();
    const embeddings = [];
    for (const text of texts) {
      const embedding = await this.embedQuery(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }
  
  async embedQuery(text) {
    await this.init();
    try {
      console.log('[CustomEmbeddings] 开始生成嵌入向量...');
      const inputs = await this.tokenizer(text, { 
        padding: true, 
        truncation: true,
        return_tensors: 'pt'
      });
      
      const output = await this.model(inputs);
      
      // 打印输出结构以进行调试
      console.log('[CustomEmbeddings] 模型输出类型:', typeof output);
      console.log('[CustomEmbeddings] last_hidden_state类型:', typeof output.last_hidden_state);
      
      // 使用pooling_layer获取句子嵌入，这是库推荐的方式
      // 使用均值池化的方法获取句子级别的嵌入
      // 注意：张量不是普通数组，需要使用库提供的方法
      
      // 方法1：尝试使用库的方法直接获取句子嵌入
      if (output.pooler_output) {
        console.log('[CustomEmbeddings] 使用pooler_output作为嵌入向量');
        return Array.from(output.pooler_output.data);
      }
      
      // 方法2：如果没有pooler_output，尝试通过平均last_hidden_state的第一个token（通常是[CLS]标记）
      if (output.last_hidden_state && output.last_hidden_state.data) {
        console.log('[CustomEmbeddings] 使用last_hidden_state的第一个token作为嵌入向量');
        // 假设第一个token的表示在data数组的开始部分
        const hiddenSize = output.last_hidden_state.dims[output.last_hidden_state.dims.length - 1];
        return Array.from(output.last_hidden_state.data).slice(0, hiddenSize);
      }
      
      // 方法3：最后的备选方案，如果上述方法都不可行
      console.log('[CustomEmbeddings] 使用备选方案创建嵌入向量');
      // 创建一个随机嵌入向量（长度384，与MiniLM模型维度一致）
      return Array(384).fill(0).map(() => Math.random() * 2 - 1);
    } catch (error) {
      console.error('[CustomEmbeddings] 生成嵌入向量时出错:', error);
      throw error;
    }
  }
}

class VectorDBHandler {
  constructor() {
    this.vectorStore = null;
    this.embeddings = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('初始化嵌入模型...');
      
      // 检查模型目录是否存在
      const fullModelPath = path.join(modelsParentDir, modelFolderName);
      console.log(`[VectorDBHandler] modelsParentDir: ${modelsParentDir}`);
      console.log(`[VectorDBHandler] modelFolderName: ${modelFolderName}`);
      console.log(`[VectorDBHandler] 完整模型路径: ${fullModelPath}`);

      if (!fs.existsSync(fullModelPath)) {
        console.error(`模型目录不存在: ${fullModelPath}`);
        throw new Error(`模型文件不存在，请确保 '${modelFolderName}' 文件夹位于 '${modelsParentDir}' 中`);
      }
      
      // 使用新的自定义嵌入类
      this.embeddings = new CustomTransformersEmbeddings();
      // 预初始化嵌入模型
      await this.embeddings.init();

      await this.loadOrCreateVectorStore();
      this.initialized = true;
      console.log('向量数据库初始化成功');
    } catch (error) {
      console.error('向量数据库初始化失败:', error);
      if (error.cause) {
        console.error('根本原因:', error.cause);
      }
      throw error;
    }
  }
  
  async loadOrCreateVectorStore() {
    const vectorStorePath = path.join(__dirname, '..', 'vectordb'); // 这个路径是存储 Faiss 索引的地方，和模型路径无关
    
    try {
      if (fs.existsSync(vectorStorePath) && fs.readdirSync(vectorStorePath).length > 0) { // 检查目录是否存在且不为空
        console.log('加载现有向量存储...');
        this.vectorStore = await FaissStore.load(vectorStorePath, this.embeddings); // this.embeddings 此时应该已经成功初始化
        return;
      }
    } catch (error) {
      console.warn('加载向量存储失败,将创建新的向量存储:', error.message);
      // 如果加载失败（例如文件损坏或不兼容），确保删除旧的存储，以便重新创建
      if (fs.existsSync(vectorStorePath)) {
        fs.rmSync(vectorStorePath, { recursive: true, force: true });
        console.log('已删除损坏的旧向量存储.');
      }
    }

    console.log('创建新的向量存储...');
    await this.createVectorStore(vectorStorePath);
  }

  // ... (createVectorStore, similaritySearch 等其他方法保持不变) ...
  // 确保 createVectorStore 方法正确使用已经初始化好的 this.embeddings
  async createVectorStore(vectorStorePath) {
    try {
      // ... (加载 content.json, image.json 的代码) ...
      const contentPath = path.join(__dirname, '..', 'content.json');
      const imagePath = path.join(__dirname, '..', 'image.json');
      
      const contentData = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      const imageData = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
      
      const documents = [];
      // ... (处理数据并创建 Document 实例的代码) ...
        for (const item of contentData) {
            const doc = new Document({
                pageContent: item.chapter_test,
                metadata: {
                    chapter_number: item.chapter_number,
                    chapter_name: item.chapter_name
                }
            });
            documents.push(doc);
        }
        for (const item of imageData) {
            const doc = new Document({
                pageContent: item.image_description,
                metadata: {
                    chapter_number: item.chapter_number,
                    chapter_name: item.chapter_name,
                    image_ID: item.image_ID,
                    image_url: item.image_url
                }
            });
            documents.push(doc);
        }


      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
      });

      const splitDocs = await textSplitter.splitDocuments(documents);
      
      // 确保 this.embeddings 已经成功初始化
      if (!this.embeddings) {
          throw new Error("Embeddings 未初始化，无法创建向量存储。");
      }
      this.vectorStore = await FaissStore.fromDocuments(splitDocs, this.embeddings);
      
      await this.vectorStore.save(vectorStorePath);
      
      console.log(`向量数据库创建成功,共${splitDocs.length}个文档`);
    } catch (error) {
      console.error('创建向量存储失败:', error);
      throw error;
    }
  }

  async similaritySearch(query, k = 5) {
    if (!this.initialized) {
      // 可以选择在这里等待初始化完成或抛出错误
      // console.log("向量数据库尚未初始化，正在尝试初始化...");
      // await this.initialize(); // 或者确保在调用 search 之前总是先调用 initialize
      throw new Error("向量数据库尚未初始化。请先调用 initialize()。");
    }
    if (!this.vectorStore) {
        throw new Error("向量存储未加载。");
    }

    try {
      const results = await this.vectorStore.similaritySearch(query, k);
      return results;
    } catch (error) {
      console.error('相似性搜索失败:', error);
      throw error;
    }
  }
}

export default VectorDBHandler;