# Computer Helper

一个基于Electron的跨平台桌面应用，提供网络控制和系统工具功能，支持macOS和Windows系统。

## 功能特点

- 网络控制：快速断开和恢复网络连接
- 应用管理：隐藏和恢复其他应用程序
- 全局快捷键：支持自定义快捷键操作
- 系统集成：支持开机自启动和托盘模式
- 跨平台支持：macOS和Windows
- 现代化UI界面：简洁易用的用户界面

## 开发环境设置

### 前提条件

- Node.js (推荐v16+)
- pnpm 或 yarn

### 安装依赖

使用pnpm:

```bash
pnpm install
```

或使用yarn:

```bash
yarn
```

### 开发模式运行

使用pnpm:

```bash
pnpm dev
```

或使用yarn:

```bash
yarn dev
```

### 构建应用

构建所有平台:

```bash
pnpm build
```

仅构建macOS版本:

```bash
pnpm build:mac
```

仅构建Windows版本:

```bash
pnpm build:win
```

## 项目结构

```
.
├── .gitignore         # Git 忽略文件配置
├── index.html         # 主 HTML 文件 (可能是旧的或占位符)
├── index.js           # 主 JavaScript 文件 (可能是旧的或占位符)
├── LICENSE            # 项目许可证文件
├── package.json       # 项目依赖和脚本配置
├── pnpm-lock.yaml     # pnpm 依赖锁定文件
├── README.md          # 项目说明文档 (当前文件)
├── styles.css         # 主 CSS 文件 (可能是旧的或占位符)
├── src/               # 源代码目录
│   ├── assets/        # 图标和静态资源
│   │   ├── icon.png
│   │   ├── icon.svg
│   │   ├── tray-icon.png
│   │   └── tray-icon.svg
│   ├── main/          # Electron 主进程代码
│   │   └── main.js      # 主进程入口文件
│   ├── preload/       # Electron 预加载脚本
│   │   └── preload.js   # 用于主进程和渲染进程通信
│   ├── renderer/      # Electron 渲染进程代码 (Web 页面)
│   │   ├── index.html   # 渲染进程 HTML 页面
│   │   ├── index.js     # 渲染进程 JavaScript
│   │   └── styles.css   # 渲染进程 CSS 样式
│   └── scripts/       # 辅助脚本 (如 AppleScript, Shell)
│       ├── hide_app.scpt
│       ├── restore_app.scpt
│       ├── restore_network.scpt
│       ├── restore_network.sh
│       └── wifi_on.sh
```

## 技术栈

- Electron - 跨平台桌面应用框架
- HTML/CSS/JavaScript - 前端界面
- Node.js - 后端功能

## 许可证

MIT
