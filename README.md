# Computer Helper 电脑助手

<div align="center">

![Version](https://img.shields.io/badge/version-0.0.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey)
![Electron](https://img.shields.io/badge/electron-28.1.0-blue)

**一个基于Electron的跨平台桌面应用，提供网络控制和系统工具功能**  
**A cross-platform desktop application based on Electron, providing network control and system utilities**

[中文](#项目简介) | [English](#introduction)

<!-- 这里推荐放置应用截图或演示GIF -->
<!-- Recommended to place app screenshots or demo GIFs here -->

</div>

## 项目简介

Computer Helper 是一款简洁高效的桌面工具软件，旨在提高用户日常电脑操作的效率。通过快捷键和简单的界面操作，用户可以快速控制网络连接、管理应用程序、以及执行其他系统任务，无需深入操作系统复杂的设置界面。

### 功能特点

- **网络控制** - 一键快速断开和恢复网络连接
- **应用管理** - 轻松隐藏和恢复其他应用程序
- **全局快捷键** - 支持自定义快捷键，实现快速操作
- **系统集成** - 支持开机自启动和托盘模式运行
- **跨平台兼容** - 同时支持 macOS 和 Windows 系统
- **现代化界面** - 简洁直观的用户界面设计

## 安装与设置

### 系统要求

- macOS 或 Windows 操作系统
- 互联网连接（仅用于安装）

### 下载安装

从[发布页面](https://github.com/yourusername/ComputerHelper/releases)下载最新版本的安装包：

- macOS: 下载 `.dmg` 文件，打开并拖动应用到应用程序文件夹
- Windows: 下载 `.exe` 安装程序并运行

### 从源码构建

#### 前提条件

- Node.js (推荐 v16+)
- pnpm (推荐) 或 yarn

#### 步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/ComputerHelper.git
cd ComputerHelper
```

2. 安装依赖

```bash
pnpm install
# 或
yarn
```

3. 开发模式运行

```bash
pnpm dev
# 或
yarn dev
```

4. 构建应用

```bash
# 构建所有平台
pnpm build

# 仅构建 macOS 版本
pnpm build:mac

# 仅构建 Windows 版本
pnpm build:win
```

## 使用示例

### 网络控制

```javascript
// 在渲染进程中控制网络
document.getElementById('toggleNetwork').addEventListener('click', () => {
  window.electronAPI.toggleNetwork();
});

// 或使用快捷键（默认配置）
// macOS: Command+Shift+N
// Windows: Ctrl+Shift+N
```

### 应用隐藏

```javascript
// 隐藏指定应用
document.getElementById('hideApp').addEventListener('click', () => {
  const appName = document.getElementById('appNameInput').value;
  window.electronAPI.hideApplication(appName);
});

// 恢复隐藏的应用
document.getElementById('restoreApps').addEventListener('click', () => {
  window.electronAPI.restoreApplications();
});
```

## 项目结构

```
.
├── src/               # 源代码目录
│   ├── assets/        # 图标和静态资源
│   ├── main/          # Electron 主进程代码
│   ├── preload/       # Electron 预加载脚本
│   ├── renderer/      # 渲染进程代码 (Web 页面)
│   └── scripts/       # 辅助脚本 (AppleScript, Shell)
├── package.json       # 项目依赖和脚本配置
├── LICENSE            # MIT 许可证
└── README.md          # 项目文档
```

## 技术栈

- **[Electron](https://www.electronjs.org/)** - 跨平台桌面应用框架
- **HTML/CSS/JavaScript** - 前端界面开发
- **[Node.js](https://nodejs.org/)** - 后端功能实现
- **[electron-store](https://github.com/sindresorhus/electron-store)** - 应用配置存储

## 贡献指南

欢迎对本项目做出贡献！以下是参与方式：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件

---

## Introduction

Computer Helper is a concise and efficient desktop utility software designed to improve users' daily computer operation efficiency. Through hotkeys and simple interface operations, users can quickly control network connections, manage applications, and perform other system tasks without navigating through complex operating system settings.

### Features

- **Network Control** - Quickly disconnect and restore network connections with one click
- **Application Management** - Easily hide and restore other applications
- **Global Hotkeys** - Support for custom hotkeys for quick operations
- **System Integration** - Support for startup launch and tray mode operation
- **Cross-Platform Compatibility** - Support for both macOS and Windows systems
- **Modern Interface** - Clean and intuitive user interface design

## Installation & Setup

### System Requirements

- macOS or Windows operating system
- Internet connection (for installation only)

### Download & Install

Download the latest version from the [releases page](https://github.com/yourusername/ComputerHelper/releases):

- macOS: Download the `.dmg` file, open it and drag the app to your Applications folder
- Windows: Download the `.exe` installer and run it

### Build from Source

#### Prerequisites

- Node.js (v16+ recommended)
- pnpm (recommended) or yarn

#### Steps

1. Clone the repository

```bash
git clone https://github.com/yourusername/ComputerHelper.git
cd ComputerHelper
```

2. Install dependencies

```bash
pnpm install
# or
yarn
```

3. Run in development mode

```bash
pnpm dev
# or
yarn dev
```

4. Build the application

```bash
# Build for all platforms
pnpm build

# Build for macOS only
pnpm build:mac

# Build for Windows only
pnpm build:win
```

## Usage Examples

### Network Control

```javascript
// Control network in renderer process
document.getElementById('toggleNetwork').addEventListener('click', () => {
  window.electronAPI.toggleNetwork();
});

// Or use hotkeys (default configuration)
// macOS: Command+Shift+N
// Windows: Ctrl+Shift+N
```

### Application Management

```javascript
// Hide specific application
document.getElementById('hideApp').addEventListener('click', () => {
  const appName = document.getElementById('appNameInput').value;
  window.electronAPI.hideApplication(appName);
});

// Restore hidden applications
document.getElementById('restoreApps').addEventListener('click', () => {
  window.electronAPI.restoreApplications();
});
```

## Project Structure

```
.
├── src/               # Source code directory
│   ├── assets/        # Icons and static resources
│   ├── main/          # Electron main process code
│   ├── preload/       # Electron preload scripts
│   ├── renderer/      # Renderer process code (Web pages)
│   └── scripts/       # Helper scripts (AppleScript, Shell)
├── package.json       # Project dependencies and script configuration
├── LICENSE            # MIT License
└── README.md          # Project documentation
```

## Technology Stack

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop application framework
- **HTML/CSS/JavaScript** - Frontend interface development
- **[Node.js](https://nodejs.org/)** - Backend functionality implementation
- **[electron-store](https://github.com/sindresorhus/electron-store)** - Application configuration storage

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
