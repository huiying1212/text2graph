# DesignClass 前端应用

这个项目是DesignClass的前端部分，一个基于React的交互式应用，用于可视化设计相关信息。

## 功能特点

- 基于用户输入动态生成知识图谱可视化
- 实时聊天界面与知识交互
- 使用Cytoscape.js实现高级图形渲染

## 项目结构

```
frontend/
├─ public/          # 静态资源文件
├─ src/             # 源代码
│  ├─ App.js        # 主应用组件
│  ├─ CanvasBoard.js # 图形渲染组件
│  ├─ ChatWindow.js # 聊天窗口组件
│  ├─ InputArea.js  # 用户输入组件
│  ├─ App.css       # 应用样式
│  └─ index.css     # 全局样式
```

## 安装运行

首先安装依赖：

```bash
npm install
```

然后运行开发服务器：

```bash
npm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行。

## 构建部署

构建生产版本：

```bash
npm run build
```

生成的文件将保存在 `build` 文件夹中，可以部署到任何静态文件服务器。

## 与后端通信

前端通过 HTTP 请求与运行在 [http://localhost:5000](http://localhost:5000) 的后端服务器通信。
确保在运行前端之前，后端服务器已经启动。

## 技术栈

- React
- Cytoscape.js (图形可视化)
- Axios (HTTP 请求)

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

