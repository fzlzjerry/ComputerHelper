const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const Store = require('electron-store');
const path = require('node:path');
const os = require('node:os');
const { exec } = require('node:child_process');
const util = require('node:util');
const execPromise = util.promisify(exec);
const fs = require('node:fs').promises;
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let mainWindow;
// 保持对tray对象的全局引用，避免被垃圾回收
let tray = null;

// 创建设置存储实例
const store = new Store({
  name: 'settings', // 存储文件名称
  defaults: {
    shortcuts: {
      toggleNetwork: ''
    },
    startWithSystem: false
  }
});

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // 加载应用的index.html
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 当window被关闭，这个事件会被触发
  mainWindow.on('closed', () => {
    // 取消引用window对象，如果你的应用支持多窗口的话，
    // 通常会把多个window对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    mainWindow = null;
  });
}

// 创建托盘图标
function createTray() {
  try {
    // 创建一个默认的图标
    let icon;
    // 创建一个16x16的空白图标
    icon = nativeImage.createEmpty();
    // 尝试使用应用程序图标
    try {
      const appIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'));
      if (!appIcon.isEmpty()) {
        icon = appIcon.resize({ width: 16, height: 16 });
      }
    } catch (e) {
      console.log('使用默认图标');
    }
    
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
    { 
      label: '显示应用', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      } 
    },
    { 
      label: '断开网络', 
      click: async () => {
        try {
          await toggleNetwork(false);
        } catch (error) {
          console.error('从托盘断开网络失败:', error);
        }
      } 
    },
    { 
      label: '恢复网络', 
      click: async () => {
        try {
          await toggleNetwork(true);
        } catch (error) {
          console.error('从托盘恢复网络失败:', error);
        }
      } 
    },
    { 
      label: '网络修复工具', 
      click: async () => {
        try {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('show-network-repair');
          }
        } catch (error) {
          console.error('从托盘打开网络修复失败:', error);
        }
      } 
    },
    { type: 'separator' },
    { 
      label: '退出', 
      click: () => {
        app.quit();
      } 
    }
  ]);
  tray.setToolTip('网络控制工具');
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标显示/隐藏主窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
  } catch (error) {
    console.error('创建托盘图标失败:', error);
    // 如果创建托盘图标失败，不会阻止应用的启动
  }
}

// 封装网络切换功能，以便在托盘菜单中使用
// 获取macOS网络服务列表
async function getMacNetworkServices() {
  try {
    const { stdout } = await execPromise('networksetup -listallnetworkservices');
    // 过滤掉带星号的禁用服务
    const services = stdout.split('\n')
      .filter(line => line && !line.includes('*'))
      .slice(1); // 跳过第一行说明文字
    return services;
  } catch (error) {
    console.error('获取网络服务列表失败:', error);
    return ['Wi-Fi']; // 默认返回Wi-Fi
  }
}

async function toggleNetwork(enable) {
  const platform = process.platform;
  let result = { success: false, message: '不支持的操作系统' };

  try {
    if (platform === 'darwin') {
      // macOS 系统
      const networkServices = await getMacNetworkServices();
      console.log('可用网络服务:', networkServices);
      
      // 只操作主要的网络服务，如Wi-Fi
      const mainServices = networkServices.filter(service => 
        service === 'Wi-Fi' || service.toLowerCase().includes('wi-fi')
      );
      
      // 如果没有找到Wi-Fi，尝试使用第一个网络服务
      const servicesToToggle = mainServices.length > 0 ? 
        mainServices : 
        (networkServices.length > 0 ? [networkServices[0]] : []);
      
      if (enable) {
        // 使用最直接的方式开启网络
        console.log('正在尝试恢复网络连接...');
        
        try {
          // 只运行用户提供的成功的命令，直接不带前缀
          console.log('执行直接的网络命令...');
          
          // 先尝试开启网卡电源
          await execPromise('/usr/sbin/networksetup -setairportpower en0 on');
          console.log('Wi-Fi电源开启命令已执行');
          
          // 等待一秒确保命令生效
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 然后开启网络服务
          await execPromise('/usr/sbin/networksetup -setnetworkserviceenabled "Wi-Fi" on');
          console.log('Wi-Fi网络服务开启命令已执行');
          
          // 等待网络恢复
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          return { success: true, message: '网络恢复命令已执行，请等待几秒钟' };
        } catch (directError) {
          console.error('直接命令失败:', directError);
        }
        
        // 如果直接命令失败，尝试使用脚本
        try {
          const scriptPath = path.join(__dirname, '../scripts/wifi_on.sh');
          console.log(`尝试使用脚本: ${scriptPath}`);
          
          // 确保脚本有执行权限
          await execPromise(`chmod +x "${scriptPath}"`);
          
          // 执行脚本
          const { stdout } = await execPromise(`"${scriptPath}"`);
          console.log('脚本执行输出:', stdout);
          
          return { success: true, message: '网络恢复脚本已执行，请等待几秒钟' };
        } catch (scriptError) {
          console.error('脚本执行失败:', scriptError);
        }
        
        // 如果上述方法都失败，则强调需要用户手动恢复
        return { 
          success: false, 
          message: '自动恢复网络失败，请手动执行以下命令\n1. networksetup -setairportpower en0 on\n2. networksetup -setnetworkserviceenabled "Wi-Fi" on' 
        };
      }
      
      // 关闭网络
      if (!enable) {
        try {
          await execPromise('/usr/sbin/networksetup -setairportpower en0 off');
        } catch (error) {
          console.log('设置Wi-Fi电源失败，可能不是en0接口:', error.message);
        }
        
        // 只禁用主要网络服务
        let disabledAny = false;
        for (const service of servicesToToggle) {
          try {
            await execPromise(`/usr/sbin/networksetup -setnetworkserviceenabled "${service}" off`);
            console.log(`已禁用网络服务: ${service}`);
            disabledAny = true;
          } catch (error) {
            console.log(`禁用网络服务失败 ${service}:`, error.message);
          }
        }
        
        result = { 
          success: disabledAny, 
          message: disabledAny ? '网络已断开' : '断开网络失败，没有可用的网络服务' 
        };
      }
    } else if (platform === 'win32') {
      // Windows 系统
      if (enable) {
        // 开启网络
        await execPromise('netsh interface set interface "Wi-Fi" enable');
        await execPromise('netsh interface set interface "Ethernet" enable');
        result = { success: true, message: '网络已恢复' };
      } else {
        // 关闭网络
        await execPromise('netsh interface set interface "Wi-Fi" disable');
        await execPromise('netsh interface set interface "Ethernet" disable');
        result = { success: true, message: '网络已断开' };
      }
    } else if (platform === 'linux') {
      // Linux 系统
      if (enable) {
        // 开启网络
        await execPromise('nmcli networking on');
        result = { success: true, message: '网络已恢复' };
      } else {
        // 关闭网络
        await execPromise('nmcli networking off');
        result = { success: true, message: '网络已断开' };
      }
    }
  } catch (error) {
    result = { 
      success: false, 
      message: `操作失败: ${error.message}`,
      error: error.toString()
    };
    console.error('网络操作失败:', error);
  }

  return result;
}

// 网络修复功能
async function repairNetwork(repairType) {
  const platform = process.platform;
  let result = { success: false, message: '不支持的操作系统或修复类型' };
  
  console.log(`开始网络修复，平台: ${platform}，修复类型: ${repairType}`);

  try {
    if (platform === 'darwin') {
      // macOS 系统
      switch (repairType) {
        case 'basic':
          // 基本网络修复
          console.log('执行 macOS 基本网络修复');
          await execPromise('networksetup -setairportpower en0 off');
          await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
          await execPromise('networksetup -setairportpower en0 on');
          await execPromise('dscacheutil -flushcache'); // 刷新DNS缓存
          result = { success: true, message: '基本网络修复完成' };
          break;
          
        case 'dns':
          // DNS修复
          console.log('执行 macOS DNS修复');
          await execPromise('dscacheutil -flushcache');
          await execPromise('killall -HUP mDNSResponder');
          result = { success: true, message: 'DNS缓存已刷新' };
          break;
          
        case 'ip':
          // IP修复
          console.log('执行 macOS IP修复');
          try {
            // 获取可用的网络服务
            const networkServices = await getMacNetworkServices();
            console.log('可用网络服务:', networkServices);
            
            let updatedAny = false;
            // 对每个网络服务执行IP更新
            for (const service of networkServices) {
              try {
                // 先关闭网络服务
                await execPromise(`networksetup -setnetworkserviceenabled "${service}" off`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
                
                // 再启用网络服务，这会触发DHCP重新获取IP
                await execPromise(`networksetup -setnetworkserviceenabled "${service}" on`);
                console.log(`已更新网络服务IP: ${service}`);
                updatedAny = true;
              } catch (error) {
                console.log(`更新网络服务IP失败 ${service}:`, error.message);
              }
            }
            
            result = { 
              success: updatedAny, 
              message: updatedAny ? 'IP地址已更新' : 'IP更新失败，没有可用的网络服务' 
            };
          } catch (error) {
            console.error('IP修复失败:', error);
            result = { success: false, message: `IP修复失败: ${error.message}` };
          }
          break;
          
        case 'advanced': {
          // 高级修复
          console.log('执行 macOS 高级网络修复');
          
          // 获取可用的网络服务
          const networkServices = await getMacNetworkServices();
          console.log('可用网络服务:', networkServices);
          
          // 创建动态脚本内容
          let macScript = `
          #!/bin/bash
          echo "正在执行高级网络修复..."
          echo "1. 关闭Wi-Fi..."
          networksetup -setairportpower en0 off 2>/dev/null || echo "Wi-Fi接口可能不是en0"
          sleep 2
          echo "2. 刷新DNS缓存..."
          dscacheutil -flushcache
          killall -HUP mDNSResponder 2>/dev/null || echo "mDNSResponder进程未运行"
          echo "3. 重置网络接口..."
          `;
          
          // 为每个网络服务添加禁用命令
          for (const service of networkServices) {
            macScript += `networksetup -setnetworkserviceenabled "${service}" off || echo "禁用${service}失败"\n`;
          }
          
          macScript += `sleep 2\n`;
          
          // 为每个网络服务添加启用命令
          for (const service of networkServices) {
            macScript += `networksetup -setnetworkserviceenabled "${service}" on || echo "启用${service}失败"\n`;
          }
          
          macScript += `
          echo "4. 重新启用Wi-Fi..."
          networksetup -setairportpower en0 on 2>/dev/null || echo "Wi-Fi接口可能不是en0"
          echo "5. 修复完成"
          `;
          
          const scriptPath = path.join(app.getPath('temp'), 'network_repair.sh');
          await fs.writeFile(scriptPath, macScript);
          await execPromise(`chmod +x "${scriptPath}"`);
          await execPromise(`"${scriptPath}"`);
          
          result = { success: true, message: '高级网络修复完成' };
          break;
        }
      }
    } else if (platform === 'win32') {
      // Windows 系统
      switch (repairType) {
        case 'basic':
          // 基本网络修复
          console.log('执行 Windows 基本网络修复');
          await execPromise('ipconfig /release');
          await execPromise('ipconfig /renew');
          await execPromise('ipconfig /flushdns');
          result = { success: true, message: '基本网络修复完成' };
          break;
          
        case 'dns':
          // DNS修复
          console.log('执行 Windows DNS修复');
          await execPromise('ipconfig /flushdns');
          await execPromise('netsh winsock reset');
          result = { success: true, message: 'DNS缓存已刷新，Winsock已重置' };
          break;
          
        case 'ip':
          // IP修复
          console.log('执行 Windows IP修复');
          await execPromise('ipconfig /release');
          await execPromise('ipconfig /renew');
          result = { success: true, message: 'IP地址已更新' };
          break;
          
        case 'advanced':
          // 高级修复
          console.log('执行 Windows 高级网络修复');
          await execPromise('netsh winsock reset');
          await execPromise('netsh int ip reset');
          await execPromise('ipconfig /release');
          await execPromise('ipconfig /renew');
          await execPromise('ipconfig /flushdns');
          await execPromise('netsh interface set interface "Wi-Fi" disable');
          await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
          await execPromise('netsh interface set interface "Wi-Fi" enable');
          result = { success: true, message: '高级网络修复完成，可能需要重启计算机以应用所有更改' };
          break;
      }
    } else if (platform === 'linux') {
      // Linux 系统
      switch (repairType) {
        case 'basic':
          // 基本网络修复
          console.log('执行 Linux 基本网络修复');
          await execPromise('nmcli networking off');
          await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
          await execPromise('nmcli networking on');
          result = { success: true, message: '基本网络修复完成' };
          break;
          
        case 'dns':
          // DNS修复
          console.log('执行 Linux DNS修复');
          await execPromise('systemd-resolve --flush-caches');
          await execPromise('sudo systemctl restart systemd-resolved.service');
          result = { success: true, message: 'DNS缓存已刷新' };
          break;
          
        case 'ip':
          // IP修复
          console.log('执行 Linux IP修复');
          await execPromise('sudo dhclient -r');
          await execPromise('sudo dhclient');
          result = { success: true, message: 'IP地址已更新' };
          break;
          
        case 'advanced': {
          // 高级修复
          console.log('执行 Linux 高级网络修复');
          // 创建临时脚本文件
          const linuxScript = `
          #!/bin/bash
          echo "正在执行高级网络修复..."
          echo "1. 关闭网络..."
          nmcli networking off
          sleep 2
          echo "2. 重启网络服务..."
          systemctl restart NetworkManager
          echo "3. 刷新DNS缓存..."
          systemd-resolve --flush-caches
          echo "4. 重新启用网络..."
          nmcli networking on
          echo "5. 修复完成"
          `;
          
          const scriptPath = path.join(app.getPath('temp'), 'network_repair.sh');
          await fs.writeFile(scriptPath, linuxScript);
          await execPromise(`chmod +x "${scriptPath}"`);
          await execPromise(`pkexec "${scriptPath}"`);
          
          result = { success: true, message: '高级网络修复完成' };
          break;
        }
      }
    }
  } catch (error) {
    result = { 
      success: false, 
      message: `修复失败: ${error.message}`,
      error: error.toString()
    };
    console.error('网络修复失败:', error);
  }

  return result;
}

// 获取网络诊断信息
async function getNetworkDiagnostics() {
  const platform = process.platform;
  const diagnostics = {
    platform,
    networkInterfaces: os.networkInterfaces(),
    pingResults: {},
    dnsResults: {},
    routeResults: {},
    success: false
  };
  
  try {
    // 测试连接到常用DNS服务器
    try {
      const pingGoogle = await execPromise('ping -c 1 8.8.8.8');
      diagnostics.pingResults['8.8.8.8'] = {
        success: true,
        output: pingGoogle.stdout
      };
    } catch (error) {
      diagnostics.pingResults['8.8.8.8'] = {
        success: false,
        error: error.message
      };
    }
    
    // 测试DNS解析
    try {
      if (platform === 'win32') {
        const dnsResult = await execPromise('nslookup google.com');
        diagnostics.dnsResults['google.com'] = {
          success: true,
          output: dnsResult.stdout
        };
      } else {
        const dnsResult = await execPromise('dig google.com');
        diagnostics.dnsResults['google.com'] = {
          success: true,
          output: dnsResult.stdout
        };
      }
    } catch (error) {
      diagnostics.dnsResults['google.com'] = {
        success: false,
        error: error.message
      };
    }
    
    // 获取路由信息
    try {
      if (platform === 'win32') {
        const routeResult = await execPromise('route print');
        diagnostics.routeResults = {
          success: true,
          output: routeResult.stdout
        };
      } else {
        const routeResult = await execPromise('netstat -rn');
        diagnostics.routeResults = {
          success: true,
          output: routeResult.stdout
        };
      }
    } catch (error) {
      diagnostics.routeResults = {
        success: false,
        error: error.message
      };
    }
    
    diagnostics.success = true;
  } catch (error) {
    diagnostics.error = error.message;
  }
  
  return diagnostics;
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 注册显示窗口的快捷键 (默认为 Alt+Shift+S)
  try {
    globalShortcut.register('Alt+Shift+S', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        console.log('通过全局快捷键显示窗口');
      } else {
        createWindow();
        console.log('通过全局快捷键创建并显示窗口');
      }
    });
    console.log('全局快捷键注册成功');
  } catch (error) {
    console.error('注册全局快捷键失败:', error);
  }
}

// 注册自定义全局快捷键 - 设置显示窗口快捷键
function registerCustomShortcuts(shortcut) {
  if (!shortcut || shortcut.trim() === '') return false;
  
  // 保存快捷键设置
  const shortcuts = store.get('shortcuts') || {};
  shortcuts.showWindow = shortcut;
  store.set('shortcuts', shortcuts);
  
  try {    
    // 注册新的快捷键
    globalShortcut.register(shortcut, () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        console.log(`通过自定义快捷键 ${shortcut} 显示窗口`);
      } else {
        createWindow();
        console.log(`通过自定义快捷键 ${shortcut} 创建并显示窗口`);
      }
    });
    console.log(`自定义快捷键 ${shortcut} 注册成功`);
    return true;
  } catch (error) {
    console.error(`注册自定义快捷键 ${shortcut} 失败:`, error);
    return false;
  }
}

// 当Electron完成初始化并准备创建浏览器窗口的时候
// 这个方法会被调用。部分API在ready事件触发后才能使用。
app.whenReady().then(() => {
  // 从存储中加载设置
  const startWithSystem = store.get('startWithSystem');
  
  // 设置自启动
  app.setLoginItemSettings({
    openAtLogin: startWithSystem
  });
  createWindow();
  createTray();
  registerGlobalShortcuts();
  registerAllShortcuts();

  app.on('activate', () => {
    // 在macOS上，当点击dock图标并且没有其他窗口打开的时候，
    // 通常在应用程序中重新创建一个窗口。
    if (mainWindow === null) createWindow();
  });
});

// 当全部窗口关闭时退出
app.on('window-all-closed', () => {
  // 在macOS上，除非用户用Cmd + Q确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') app.quit();
});

// 当应用退出前注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 注册所有快捷键
function registerAllShortcuts() {
  try {
    // 先注销所有已注册的快捷键
    globalShortcut.unregisterAll();
    
    // 从存储中获取当前设置的快捷键
    const shortcuts = store.get('shortcuts', {});
    
    // 显示窗口的快捷键（如果设置了）
    if (shortcuts.showWindow && shortcuts.showWindow.trim() !== '') {
      try {
        globalShortcut.register(shortcuts.showWindow, () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        });
        console.log(`成功注册显示窗口快捷键: ${shortcuts.showWindow}`);
      } catch (e) {
        console.error(`无法注册显示窗口快捷键 ${shortcuts.showWindow}:`, e);
      }
    }

    // 断网快捷键（如果设置了）
    if (shortcuts.toggleNetwork && shortcuts.toggleNetwork.trim() !== '') {
      try {
        globalShortcut.register(shortcuts.toggleNetwork, async () => {
          // 检查当前网络状态
          const statusResult = await getNetworkStatus();
          if (statusResult.connected) {
            // 如果网络已连接，则断开
            await toggleNetwork(false);
          } else {
            // 如果网络已断开，则恢复
            await toggleNetwork(true);
          }
        });
        console.log(`成功注册断网快捷键: ${shortcuts.toggleNetwork}`);
      } catch (e) {
        console.error(`无法注册断网快捷键 ${shortcuts.toggleNetwork}:`, e);
      }
    }
  } catch (error) {
    console.error('注册自定义快捷键失败:', error);
  }
}

// 添加窗口隐藏事件处理，改为隐藏窗口而不是关闭
ipcMain.handle('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
    return { success: true };
  }
  return { success: false, message: '窗口不存在' };
});

// 设置开机自启动
ipcMain.handle('set-auto-launch', (event, enable) => {
  try {
    // 保存设置
    store.set('startWithSystem', enable);
    
    // 应用设置
    if (!isDev) { // 开发模式下不设置自启动
      app.setLoginItemSettings({
        openAtLogin: enable,
        path: process.execPath
      });
    }
    return { success: true, message: enable ? '已设置开机自启动' : '已取消开机自启动' };
  } catch (error) {
    console.error('设置自启动失败:', error);
    return { success: false, message: '设置失败', error: error.toString() };
  }
});

// 保存设置
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    // 保存设置到存储
    store.set('shortcuts', settings.shortcuts);
    store.set('startWithSystem', settings.startWithSystem);
    
    // 应用设置
    if (!isDev) { // 开发模式下不设置自启动
      app.setLoginItemSettings({
        openAtLogin: settings.startWithSystem,
        path: process.execPath
      });
    }
    
    // 注册快捷键
    registerAllShortcuts();
    
    return { success: true, message: '设置已保存' };
  } catch (error) {
    console.error('保存设置失败:', error);
    return { success: false, message: '保存设置失败', error: error.toString() };
  }
});

// 加载设置
ipcMain.handle('load-settings', async () => {
  try {
    // 从存储中加载设置
    const settings = {
      shortcuts: store.get('shortcuts'),
      startWithSystem: store.get('startWithSystem')
    };
    
    return { success: true, settings };
  } catch (error) {
    console.error('加载设置失败:', error);
    return { success: false, message: '加载设置失败', error: error.toString() };
  }
});

// 在这个文件中，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用require导入。

// 获取系统信息的IPC处理器
ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    cpus: os.cpus(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    userInfo: os.userInfo(),
  };
});

// 断网功能的IPC处理器
ipcMain.handle('toggle-network', async (event, enable) => {
  // 使用封装好的toggleNetwork函数
  return await toggleNetwork(enable);
});

// 获取网络状态的IPC处理器
ipcMain.handle('get-network-status', async () => {
  const platform = process.platform;
  let result = { connected: false, message: '不支持的操作系统' };

  console.log('正在获取网络状态，平台:', platform);
  
  try {
    if (platform === 'darwin') {
      // macOS 系统
      try {
        console.log('执行 macOS 网络状态检查命令');
        const { stdout } = await execPromise('networksetup -getairportpower en0');
        console.log('macOS 网络状态输出:', stdout);
        result.connected = stdout.includes('On');
        result.message = result.connected ? '网络已连接' : '网络已断开';
      } catch (macError) {
        console.error('macOS 网络检查失败，尝试备用方法:', macError);
        // 备用方法：检查是否可以 ping 通 DNS 服务器
        try {
          await execPromise('ping -c 1 -W 1 8.8.8.8');
          result.connected = true;
          result.message = '网络已连接 (备用检测)';
        } catch (pingError) {
          result.connected = false;
          result.message = '网络已断开 (备用检测)';
        }
      }
    } else if (platform === 'win32') {
      // Windows 系统
      console.log('执行 Windows 网络状态检查命令');
      const { stdout } = await execPromise('netsh interface show interface');
      console.log('Windows 网络状态输出:', stdout);
      result.connected = stdout.includes('Connected');
      result.message = result.connected ? '网络已连接' : '网络已断开';
    } else if (platform === 'linux') {
      // Linux 系统
      console.log('执行 Linux 网络状态检查命令');
      const { stdout } = await execPromise('nmcli networking');
      console.log('Linux 网络状态输出:', stdout);
      result.connected = stdout.trim() === 'enabled';
      result.message = result.connected ? '网络已连接' : '网络已断开';
    }
  } catch (error) {
    console.error('获取网络状态失败 (详细):', error);
    result = { 
      connected: false, 
      message: `获取网络状态失败: ${error.message}`,
      error: error.toString()
    };
  }

  console.log('返回网络状态结果:', result);
  return result;
});

// 网络修复功能的IPC处理器
ipcMain.handle('repair-network', async (event, repairType) => {
  console.log(`收到网络修复请求，类型: ${repairType}`);
  return await repairNetwork(repairType);
});

// 网络诊断功能的IPC处理器
ipcMain.handle('get-network-diagnostics', async () => {
  console.log('收到网络诊断请求');
  return await getNetworkDiagnostics();
});

// 最小化窗口的IPC处理器
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
    return { success: true };
  }
  return { success: false, message: '窗口不存在' };
});
