# Text2Graph 简介

Text2Graph是一个交互式文本可视化工具，使用React前端和Express后端，结合deepseek实现智能分析和可视化。

## 项目结构

```
/
├─ frontend/        # React前端应用
├─ backend/         # Express后端服务器
├─ package.json     # 项目依赖
```

## 快速开始

### 安装依赖

1. 安装根目录依赖:
```bash
npm install
```

2. 安装前端依赖:
```bash
cd frontend
npm install
```

### 配置

在`backend/.env`文件中设置你的OpenAI API密钥:
```
OPENAI_API_KEY=your_api_key_here
```

### 运行项目

1. 启动后端服务器:
```bash
cd backend
node server.mjs
```

2. 在另一个终端窗口启动前端:
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

## 应用场景

- 学生学习
-- 帮助总结知识点、梳理知识脉络
-- 帮助学生拓展相关知识
- 教师教学
-- 辅助教学PPT制作
-- 辅助教学思路的设计

## 技术栈

prompt engineering、embedding
- **前端**: React, Cytoscape.js, Axios
- **后端**: Express, OpenAI API
- **通信**: REST API 