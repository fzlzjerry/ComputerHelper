# ComputerHelper

一个基于Electron的跨平台电脑助手应用，支持macOS和Windows系统。提供系统信息查看和网络控制等功能。

## 功能特点

### 系统信息
- 显示系统信息（操作系统、架构、主机名等）
- 显示CPU详细信息
- 显示内存使用情况

### 网络控制
- 一键断网/恢复网络连接
- 网络状态实时监测
- 网络问题诊断和修复工具
  - 基本网络修复
  - DNS缓存刷新
  - IP地址更新
  - 高级网络修复

### 界面
- 响应式现代化UI设计
- 深色/浅色主题切换
- 流畅的交互动画效果
- 跨平台支持（macOS和Windows）

## 截图

![系统信息界面](./screenshots/system-info.png)
![网络控制界面](./screenshots/network-control.png)

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
ComputerHelper/
├── src/
│   ├── main/        # 主进程代码
│   │   ├── main.js  # 主进程入口
│   │   └── network/ # 网络控制相关功能
│   ├── renderer/    # 渲染进程代码（前端UI）
│   │   ├── index.html  # 主页面
│   │   ├── index.js    # 渲染进程入口
│   │   └── styles.css  # 样式表
│   └── preload/     # 预加载脚本（安全地暴露API）
│       └── preload.js  # 预加载入口
├── package.json     # 项目配置
└── README.md        # 项目说明
```

## 技术栈

- Electron - 跨平台桌面应用框架
- HTML/CSS/JavaScript - 前端界面
- Node.js - 后端功能和系统交互

## 未来计划

- 增加更多系统优化工具
- 添加应用程序管理功能
- 增加系统资源监控
- 添加定时任务功能

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

MIT
