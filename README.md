# Text2Graph 简介

**Text2Graph** 是一款基于LLM的交互式文本可视化工具，它可以对用户输入的文本信息进行处理，提取其中的关键词及其关系，将原始文本智能解析为结构化的知识图谱。用户可以通过直观的图形界面理解信息之间的关系，从而加深对复杂文本的理解，提升学习过程中的趣味性、提高学习效率。

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
└─ package.json     # 项目依赖
```

## 快速开始

### 1. 准备嵌入模型
首先，确保将all-MiniLM-L6-v2模型文件夹下载并放置于项目根目录的models文件夹中。

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

添加`backend/.env`文件，设置你的DeepSeek API密钥：
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

## 功能特点

- 交互式知识图谱可视化
- 动态图形布局与用户交互
- 实时对话界面
- 智能RAG检索增强生成，提供更精确的回答

## 应用场景

- 学生学习
-- 帮助总结知识点、梳理知识脉络
-- 帮助学生拓展相关知识
- 教师教学
-- 辅助教学PPT制作
-- 辅助教学思路的设计

## 实现细节

### 向量数据库实现
项目使用FAISS向量数据库通过嵌入模型对知识库进行了编码与索引。当用户发送查询时，系统会：

1. 将用户查询转换为向量
2. 在向量数据库中查找最相关的内容
3. 将这些相关内容作为上下文发送给LLM
4. 生成回复并返回给用户


## 技术栈

- **嵌入模型**: all-MiniLM-L6-v2（通过@xenova/transformers加载）
- **向量数据库**: FAISS（通过langchain集成）
- **文本分割**: RecursiveCharacterTextSplitter
- **前端**: React, Cytoscape.js, Axios
- **后端**: Express, DeepSeek API
- **通信**: REST API

