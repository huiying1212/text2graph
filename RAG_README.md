# Text2Graph RAG实现

## 项目变更
本项目已从原来的构建上下文传递本地知识库的方式转换为使用RAG（检索增强生成）方法。主要变更包括：

1. 使用all-MiniLM-L6-v2作为嵌入模型（需放置于models目录下）
2. 使用FAISS作为向量数据库
3. 根据用户查询从知识库中检索最相关内容，而不是直接传递整个知识库

## 安装步骤

### 1. 准备嵌入模型
首先，确保将all-MiniLM-L6-v2模型文件夹下载并放置于项目根目录的models文件夹中：
```bash
mkdir -p models
# 下载模型到models/all-MiniLM-L6-v2目录
```

### 2. 安装依赖

安装根目录依赖:
```bash
npm install
```

安装前端依赖:
```bash
cd frontend
npm install
```

### 3. 配置环境变量

复制示例环境变量文件：
```bash
cp backend/.env.example backend/.env
```

然后编辑`backend/.env`文件，设置你的DeepSeek API密钥：
```
DEEPSEEK_API_KEY=your_api_key_here
```

### 4. 启动服务

启动后端服务器（首次启动时会建立向量数据库，可能需要一些时间）:
```bash
cd backend
node server.mjs
```

在另一个终端窗口启动前端:
```bash
cd frontend
npm start
```

前端应用将在 [http://localhost:3000](http://localhost:3000) 运行，
后端服务器将在 [http://localhost:5000](http://localhost:5000) 运行。

## 项目结构
```
/
├─ frontend/        # React前端应用
├─ backend/         # Express后端服务器
│  ├─ server.mjs    # 服务器入口
│  ├─ deepseek_handler.mjs # LLM处理逻辑
│  └─ vectordb.mjs  # 向量数据库处理逻辑
├─ models/          # 嵌入模型目录
│  └─ all-MiniLM-L6-v2/ # 嵌入模型文件
├─ vectordb/        # 生成的向量数据库文件夹
├─ content.json     # 内容知识库
├─ image.json       # 图片知识库
└─ package.json     # 项目依赖
```

## 实现细节

### 向量数据库实现
项目使用FAISS向量数据库通过嵌入模型对知识库进行了编码与索引。当用户发送查询时，系统会：

1. 将用户查询转换为向量
2. 在向量数据库中查找最相关的内容
3. 将这些相关内容作为上下文发送给LLM
4. 生成回复并返回给用户

这种方法比直接传递整个知识库更高效，可以提供更相关的上下文信息，使大模型的回答更加准确。

### 使用的技术
- **嵌入模型**: all-MiniLM-L6-v2（通过@xenova/transformers加载）
- **向量数据库**: FAISS（通过langchain集成）
- **文本分割**: RecursiveCharacterTextSplitter
- **后端框架**: Express.js
- **前端框架**: React

## 未来改进
- 增加对知识库的实时更新功能
- 优化嵌入模型和文本分割参数
- 添加用户反馈机制，以改进检索质量 