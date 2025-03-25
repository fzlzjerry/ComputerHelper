// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 添加淡入动画效果
  document.querySelectorAll('.card').forEach((card, index) => {
    if (!card.classList.contains('hidden')) {
      card.classList.add('fade-in');
      card.style.animationDelay = `${index * 0.1}s`;
    }
  });

  // 获取网络状态
  fetchNetworkStatus();

  // 添加网络控制按钮事件监听
  document.getElementById('toggle-network-btn').addEventListener('click', toggleNetwork);
  
  // 添加最小化窗口按钮事件监听
  document.getElementById('minimize-btn').addEventListener('click', minimizeWindow);
  
  // 添加网络修复按钮事件监听
  document.getElementById('repair-btn').addEventListener('click', showNetworkRepair);
  document.getElementById('close-repair-btn').addEventListener('click', hideNetworkRepair);
  
  // 添加修复卡片事件监听
  addRepairCardListeners();
  
  document.getElementById('run-diagnostics-btn').addEventListener('click', runNetworkDiagnostics);
  
  // 添加主题切换功能
  initializeTheme();
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
  
  // 添加按钮波纹效果
  addRippleEffect();
  
  // 监听从托盘菜单打开网络修复的事件
  document.addEventListener('show-network-repair', () => {
    showNetworkRepair();
  });
  
  // 定时刷新网络状态
  setInterval(fetchNetworkStatus, 5000);
});

// 添加修复卡片事件监听
function addRepairCardListeners() {
  const repairCards = [
    {id: 'basic-repair-btn', type: 'basic'},
    {id: 'dns-repair-btn', type: 'dns'},
    {id: 'ip-repair-btn', type: 'ip'},
    {id: 'advanced-repair-btn', type: 'advanced'}
  ];
  
  repairCards.forEach(card => {
    const element = document.getElementById(card.id);
    if (element) {
      // 添加点击事件
      element.addEventListener('click', () => performNetworkRepair(card.type));
      
      // 添加键盘事件
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          performNetworkRepair(card.type);
        }
      });
      
      // 添加悬停效果动画
      element.addEventListener('mouseenter', addCardHoverEffect);
      element.addEventListener('mouseleave', removeCardHoverEffect);
    }
  });
}

// 卡片悬停效果
function addCardHoverEffect(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  card.style.setProperty('--mouse-x', `${x}px`);
  card.style.setProperty('--mouse-y', `${y}px`);
  card.classList.add('card-hover');
}

// 移除卡片悬停效果
function removeCardHoverEffect(e) {
  e.currentTarget.classList.remove('card-hover');
}

// 初始化主题
function initializeTheme() {
  // 检查本地存储的主题设置
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  } else {
    // 默认使用深色主题
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon('dark');
  }
}

// 切换主题
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // 添加过渡类
  document.documentElement.classList.add('theme-transition');
  
  // 设置主题
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // 更新主题图标
  updateThemeIcon(newTheme);
  
  // 保存设置到本地存储
  localStorage.setItem('theme', newTheme);
  
  // 添加动画效果
  const themeIcon = document.getElementById('theme-icon');
  themeIcon.style.animation = 'rotate 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  
  // 动画结束后移除动画和过渡类
  setTimeout(() => {
    themeIcon.style.animation = 'none';
    document.documentElement.classList.remove('theme-transition');
  }, 500);
}

// 更新主题图标
function updateThemeIcon(theme) {
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  
  if (theme === 'dark') {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

// 最小化窗口
function minimizeWindow() {
  window.electronAPI.minimizeWindow();
}

// 存储快捷键设置
const shortcutSettings = {
  toggleNetwork: '',
  startWithSystem: false
};

// 当前正在记录的快捷键输入框
let currentRecordingInput = null;

// 从主进程加载快捷键设置
async function loadShortcutSettings() {
  try {
    const result = await window.electronAPI.loadSettings();
    if (result.success && result.settings) {
      // 更新快捷键设置
      if (result.settings.shortcuts) {
        shortcutSettings.toggleNetwork = result.settings.shortcuts.toggleNetwork || '';
      }
      shortcutSettings.startWithSystem = result.settings.startWithSystem || false;
      
      // 更新UI
      updateShortcutInputs();
    }
  } catch (e) {
    console.error('加载设置失败:', e);
  }
}

// 更新设置输入框的显示值
function updateShortcutInputs() {
  const toggleNetworkInput = document.getElementById('toggle-network-shortcut');
  const startWithSystemCheckbox = document.getElementById('start-with-system');
  
  if (toggleNetworkInput) {
    toggleNetworkInput.value = shortcutSettings.toggleNetwork || '';
  }
  
  if (startWithSystemCheckbox) {
    startWithSystemCheckbox.checked = shortcutSettings.startWithSystem || false;
  }
}

// 保存快捷键设置
async function saveSettings() {
  // 禁用保存按钮，防止重复点击
  const saveButton = document.getElementById('save-settings');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = '保存中...';
  }
  
  try {
    // 准备设置对象
    const settings = {
      shortcuts: {
        toggleNetwork: shortcutSettings.toggleNetwork,
      },
      startWithSystem: shortcutSettings.startWithSystem,
    };
    
    // 发送设置到主进程
    const result = await window.electronAPI.saveSettings(settings);
    if (result.success) {
      console.log('设置保存成功');
      alert('设置已保存');
      closeSettings();
    } else {
      console.error('设置保存失败:', result.message);
      alert(`设置保存失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('保存设置时出错:', error);
    alert('保存设置失败，请查看控制台日志');
  } finally {
    // 恢复保存按钮状态
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = '保存设置';
    }
  }
}

// 关闭设置面板
function closeSettings() {
  const settingsSection = document.getElementById('settings-section');
  if (settingsSection) {
    settingsSection.classList.add('hidden');
  }
}

// 初始化快捷键输入
function initShortcutInputs() {
  const toggleNetworkInput = document.getElementById('toggle-network-shortcut');
  const clearNetworkBtn = document.getElementById('clear-network-shortcut');
  
  // 添加点击事件监听器
  if (toggleNetworkInput) {
    toggleNetworkInput.addEventListener('click', function() {
      startRecordingShortcut(this);
    });
  }
  
  // 添加清除按钮事件
  if (clearNetworkBtn) {
    clearNetworkBtn.addEventListener('click', () => {
      if (toggleNetworkInput) {
        toggleNetworkInput.value = '';
        shortcutSettings.toggleNetwork = '';
      }
    });
  }
}

// 开始记录快捷键
function startRecordingShortcut(inputElement) {
  // 如果有其他输入框正在记录，停止它
  if (currentRecordingInput && currentRecordingInput !== inputElement) {
    currentRecordingInput.classList.remove('recording');
  }
  
  // 设置当前输入框为记录状态
  currentRecordingInput = inputElement;
  inputElement.classList.add('recording');
  inputElement.value = '请按下快捷键...';
  
  // 添加一次性键盘事件监听器
  const recordShortcut = (e) => {
    e.preventDefault();
    
    // 忽略单独的修饰键
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return;
    }
    
    // 构建快捷键字符串
    const shortcut = [];
    if (e.ctrlKey) shortcut.push('Ctrl');
    if (e.altKey) shortcut.push('Alt');
    if (e.shiftKey) shortcut.push('Shift');
    if (e.metaKey) shortcut.push('Meta');
    
    // 添加实际按键
    shortcut.push(e.key);
    
    // 设置输入框值
    inputElement.value = shortcut.join('+');
    inputElement.classList.remove('recording');
    
    // 保存快捷键到设置
    if (inputElement.id === 'toggle-network-shortcut') {
      shortcutSettings.toggleNetwork = shortcut.join('+');
    }
    
    // 移除事件监听器
    window.removeEventListener('keydown', recordShortcut);
    currentRecordingInput = null;
  };
  
  // 添加事件监听器
  window.addEventListener('keydown', recordShortcut);
}

// 格式化CPU时间
function formatTime(ms) {
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  
  if (hours >= 1) {
    return `${hours.toFixed(2)}小时`;
  }
  if (minutes >= 1) {
    return `${minutes.toFixed(2)}分钟`;
  }
  return `${seconds.toFixed(2)}秒`;
}

// 获取网络状态
async function fetchNetworkStatus() {
  try {
    const statusDot = document.getElementById('network-status-dot');
    const statusText = document.getElementById('network-status-text');
    const toggleButton = document.getElementById('toggle-network-btn');
    
    // 显示加载中状态
    statusDot.className = 'status-dot';
    statusText.textContent = '正在检测网络状态...';
    
    const status = await window.electronAPI.getNetworkStatus();
    
    if (status.connected) {
      // 网络已连接
      statusDot.className = 'status-dot connected';
      statusText.textContent = status.message || '网络已连接';
      toggleButton.querySelector('span').textContent = '断开网络';
      toggleButton.className = 'button button-danger';
      
      // 添加连接状态的动画
      statusDot.animate([
        { boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2), 0 0 20px rgba(34, 197, 94, 0.4)' },
        { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0.1), 0 0 30px rgba(34, 197, 94, 0.3)' },
        { boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2), 0 0 20px rgba(34, 197, 94, 0.4)' }
      ], {
        duration: 2000,
        iterations: Infinity
      });
    } else {
      // 网络已断开
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = status.message || '网络已断开';
      toggleButton.querySelector('span').textContent = '恢复网络';
      toggleButton.className = 'button button-success';
      
      // 添加断开状态的动画
      statusDot.animate([
        { boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.4)' },
        { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0.1), 0 0 30px rgba(239, 68, 68, 0.3)' },
        { boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.4)' }
      ], {
        duration: 2000,
        iterations: Infinity
      });
    }
    
    return status.connected;
  } catch (error) {
    console.error('获取网络状态失败:', error);
    const statusDot = document.getElementById('network-status-dot');
    const statusText = document.getElementById('network-status-text');
    
    statusDot.className = 'status-dot';
    statusText.textContent = `获取网络状态失败: ${error.message || error}`;
    return false;
  }
}

// 切换网络状态
async function toggleNetwork() {
  try {
    const statusDot = document.getElementById('network-status-dot');
    const statusText = document.getElementById('network-status-text');
    const toggleButton = document.getElementById('toggle-network-btn');
    
    // 获取当前网络状态
    const isConnected = await fetchNetworkStatus();
    
    // 显示加载中状态
    statusDot.className = 'status-dot pulse';
    statusText.textContent = isConnected ? '正在断开网络...' : '正在恢复网络...';
    toggleButton.disabled = true;
    
    // 添加加载动画
    addButtonLoadingState(toggleButton);
    
    // 调用切换网络状态API
    const result = await window.electronAPI.toggleNetwork(!isConnected);
    
    // 更新UI
    toggleButton.disabled = false;
    removeButtonLoadingState(toggleButton);
    await fetchNetworkStatus();
    
    // 显示操作结果
    if (!result.success) {
      statusText.textContent = result.message || '操作失败';
      
      // 显示错误提示
      showToast(result.message || '操作失败', 'error');
    } else {
      // 显示成功提示
      showToast(isConnected ? '网络已断开' : '网络已恢复', 'success');
    }
  } catch (error) {
    console.error('切换网络状态失败:', error);
    const statusText = document.getElementById('network-status-text');
    statusText.textContent = `切换网络状态失败: ${error.message || error}`;
    document.getElementById('toggle-network-btn').disabled = false;
    removeButtonLoadingState(document.getElementById('toggle-network-btn'));
    
    // 显示错误提示
    showToast(`切换网络状态失败: ${error.message || error}`, 'error');
  }
}

// 添加按钮加载状态
function addButtonLoadingState(button) {
  const originalContent = button.innerHTML;
  button.setAttribute('data-original-content', originalContent);
  
  const spinner = document.createElement('div');
  spinner.className = 'button-spinner';
  
  const text = button.querySelector('span');
  if (text) {
    text.textContent = '处理中...';
  }
  
  button.prepend(spinner);
  button.classList.add('button-loading');
}

// 移除按钮加载状态
function removeButtonLoadingState(button) {
  const originalContent = button.getAttribute('data-original-content');
  if (originalContent) {
    button.innerHTML = originalContent;
  }
  
  button.classList.remove('button-loading');
}

// 显示网络修复界面
function showNetworkRepair() {
  // 显示网络修复界面
  const repairSection = document.getElementById('network-repair-section');
  if (repairSection) {
    repairSection.classList.remove('hidden');
    
    // 添加动画效果
    setTimeout(() => {
      repairSection.classList.add('fade-in');
    }, 10);
  }
  
  // 确保修复状态、结果和诊断都是隐藏的
  hideRepairStatus();
  hideRepairResult();
  hideDiagnostics();
}

// 隐藏网络修复界面
function hideNetworkRepair() {
  const repairSection = document.getElementById('network-repair-section');
  if (repairSection) {
    // 添加淡出动画
    repairSection.classList.remove('fade-in');
    repairSection.classList.add('fade-out');
    
    // 动画结束后隐藏
    setTimeout(() => {
      repairSection.classList.add('hidden');
      repairSection.classList.remove('fade-out');
    }, 300);
  }
}

// 显示修复状态
function showRepairStatus(message) {
  const statusSection = document.getElementById('repair-status');
  const statusMessage = document.getElementById('repair-status-message');
  
  if (statusSection && statusMessage) {
    statusMessage.textContent = message || '正在执行修复...';
    statusSection.classList.remove('hidden');
    
    // 添加淡入动画
    statusSection.classList.add('fade-in');
  }
}

// 隐藏修复状态
function hideRepairStatus() {
  const statusSection = document.getElementById('repair-status');
  if (statusSection) {
    statusSection.classList.remove('fade-in');
    statusSection.classList.add('hidden');
  }
}

// 显示修复结果
function showRepairResult(success, message) {
  const resultSection = document.getElementById('repair-result');
  const resultMessage = document.getElementById('repair-result-message');
  
  if (resultSection && resultMessage) {
    resultMessage.textContent = message || (success ? '修复成功' : '修复失败');
    resultMessage.className = success ? 'result-success' : 'result-error';
    resultSection.classList.remove('hidden');
    
    // 添加淡入动画
    resultSection.classList.add('fade-in');
    
    // 显示提示
    showToast(message || (success ? '修复成功' : '修复失败'), success ? 'success' : 'error');
  }
}

// 隐藏修复结果
function hideRepairResult() {
  const resultSection = document.getElementById('repair-result');
  if (resultSection) {
    resultSection.classList.remove('fade-in');
    resultSection.classList.add('hidden');
  }
}

// 显示诊断结果
function showDiagnostics() {
  const diagnosticsSection = document.getElementById('diagnostics-section');
  if (diagnosticsSection) {
    diagnosticsSection.classList.remove('hidden');
    
    // 添加淡入动画
    diagnosticsSection.classList.add('fade-in');
  }
}

// 隐藏诊断结果
function hideDiagnostics() {
  const diagnosticsSection = document.getElementById('diagnostics-section');
  if (diagnosticsSection) {
    diagnosticsSection.classList.remove('fade-in');
    diagnosticsSection.classList.add('hidden');
  }
}

// 执行网络修复
async function performNetworkRepair(repairType) {
  try {
    // 添加视觉反馈
    const repairCard = document.getElementById(`${repairType}-repair-btn`);
    if (repairCard) {
      repairCard.classList.add('card-active');
    }
    
    // 隐藏之前的结果
    hideRepairResult();
    hideDiagnostics();
    
    // 显示修复状态
    let statusMessage = '正在执行修复...';
    switch (repairType) {
      case 'basic':
        statusMessage = '正在执行基本网络修复...';
        break;
      case 'dns':
        statusMessage = '正在刷新DNS缓存...';
        break;
      case 'ip':
        statusMessage = '正在更新IP地址...';
        break;
      case 'advanced':
        statusMessage = '正在执行高级网络修复...';
        break;
    }
    showRepairStatus(statusMessage);
    
    // 调用修复API
    const result = await window.electronAPI.repairNetwork(repairType);
    
    // 隐藏修复状态
    hideRepairStatus();
    
    // 显示修复结果
    showRepairResult(result.success, result.message);
    
    // 重新获取网络状态
    await fetchNetworkStatus();
  } catch (error) {
    console.error('网络修复失败:', error);
    hideRepairStatus();
    showRepairResult(false, `修复失败: ${error.message || '未知错误'}`);
  } finally {
    // 移除活跃状态
    const repairCard = document.getElementById(`${repairType}-repair-btn`);
    if (repairCard) {
      setTimeout(() => {
        repairCard.classList.remove('card-active');
      }, 500);
    }
  }
}

// 添加按钮波纹效果
function addRippleEffect() {
  const buttons = document.querySelectorAll('.button');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // 已经有加载状态或禁用的按钮不添加波纹效果
      if (button.classList.contains('button-loading') || button.disabled) {
        return;
      }
      
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600); // 与CSS动画时长一致
    });
  });
}

// 运行网络诊断
async function runNetworkDiagnostics() {
  try {
    // 添加按钮加载状态
    const diagnosticsButton = document.getElementById('run-diagnostics-btn');
    addButtonLoadingState(diagnosticsButton);
    
    // 显示诊断状态
    showRepairStatus('正在运行网络诊断...');
    
    // 隐藏之前的结果
    hideRepairResult();
    
    // 调用诊断API
    const diagnostics = await window.electronAPI.getNetworkDiagnostics();
    
    // 隐藏诊断状态
    hideRepairStatus();
    
    // 格式化诊断结果
    const diagnosticsOutput = document.getElementById('diagnostics-output');
    if (diagnosticsOutput) {
      let output = '';
      
      // 平台信息
      output += `操作系统: ${diagnostics.platform}\n\n`;
      
      // 网络接口信息
      output += '网络接口:\n';
      for (const [name, interfaces] of Object.entries(diagnostics.networkInterfaces)) {
        output += `  ${name}:\n`;
        for (const iface of interfaces) {
          output += `    - 地址: ${iface.address}\n`;
          output += `      类型: ${iface.family}\n`;
          output += `      MAC: ${iface.mac}\n`;
          output += `      内部: ${iface.internal ? '是' : '否'}\n`;
        }
      }
      output += '\n';
      
      // Ping 测试结果
      output += 'Ping 测试:\n';
      for (const [host, result] of Object.entries(diagnostics.pingResults)) {
        output += `  ${host}: ${result.success ? '成功' : '失败'}\n`;
        if (result.success) {
          output += `    ${result.output.split('\n').slice(0, 3).join('\n    ')}\n`;
        } else {
          output += `    错误: ${result.error}\n`;
        }
      }
      output += '\n';
      
      // DNS 测试结果
      output += 'DNS 测试:\n';
      for (const [host, result] of Object.entries(diagnostics.dnsResults)) {
        output += `  ${host}: ${result.success ? '成功' : '失败'}\n`;
        if (result.success) {
          const dnsOutput = result.output.split('\n').slice(0, 5);
          output += `    ${dnsOutput.join('\n    ')}\n`;
        } else {
          output += `    错误: ${result.error}\n`;
        }
      }
      output += '\n';
      
      // 路由信息
      output += '路由信息:\n';
      if (diagnostics.routeResults.success) {
        const routeOutput = diagnostics.routeResults.output.split('\n').slice(0, 10);
        output += `  ${routeOutput.join('\n  ')}\n`;
      } else {
        output += `  错误: ${diagnostics.routeResults.error}\n`;
      }
      
      diagnosticsOutput.textContent = output;
    }
    
    // 显示诊断结果
    showDiagnostics();
    
    // 移除按钮加载状态
    removeButtonLoadingState(diagnosticsButton);
    
  } catch (error) {
    console.error('网络诊断失败:', error);
    hideRepairStatus();
    showRepairResult(false, `诊断失败: ${error.message || '未知错误'}`);
    
    // 移除按钮加载状态
    removeButtonLoadingState(document.getElementById('run-diagnostics-btn'));
  }
}

// 显示提示信息
function showToast(message, type = 'info') {
  // 检查是否已存在toast容器
  let toastContainer = document.querySelector('.toast-container');
  
  // 如果不存在，创建一个
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // 添加到容器
  toastContainer.appendChild(toast);
  
  // 添加动画
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 设置自动关闭
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    // 动画结束后移除元素
    setTimeout(() => {
      toastContainer.removeChild(toast);
      
      // 如果没有更多的toast，移除容器
      if (toastContainer.children.length === 0) {
        document.body.removeChild(toastContainer);
      }
    }, 300);
  }, 3000);
}
