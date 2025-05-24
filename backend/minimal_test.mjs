// minimal_test.mjs
import fs from 'fs'; // 确保导入了 fs 模块
import { AutoTokenizer, AutoModel } from '@xenova/transformers';
import path from 'path';

const modelsParentDir = path.resolve('./models');
const modelFolderName = 'all-MiniLM-L6-v2';

async function runTest() {
  try {
    console.log(`[Test] modelsParentDir (作为 cacheDir 传递): "${modelsParentDir}"`);
    console.log(`[Test] modelFolderName (作为 modelName 传递): "${modelFolderName}"`);
    
    const expectedTokenizerPath = path.join(modelsParentDir, modelFolderName, 'tokenizer.json');
    console.log(`[Test] 期望的 tokenizer.json 路径: "${expectedTokenizerPath}"`);
    if (!fs.existsSync(expectedTokenizerPath)) {
        console.warn(`[Test] 警告: 期望的 tokenizer 文件 ${expectedTokenizerPath} 不存在!`);
    }

    console.log('[Test] 尝试加载分词器...');
    const tokenizer = await AutoTokenizer.from_pretrained(modelFolderName, {
      local_files_only: true,
      cache_dir: modelsParentDir,
    });
    console.log('[Test] 分词器加载成功!');

    console.log('[Test] 尝试加载模型...');
    const model = await AutoModel.from_pretrained(modelFolderName, {
      local_files_only: true,
      cache_dir: modelsParentDir,
      quantized: false, // <--- 非常重要：添加这一行来禁用量化并避免加载ONNX
    });
    console.log('[Test] 模型加载成功!');

  } catch (error) {
    console.error('[Test] 加载失败:', error);
  }
}

runTest();