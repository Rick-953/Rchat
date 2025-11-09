// 标签切换
const tabButtons = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    tabButtons.forEach(b => b.classList.remove('active'));
    authForms.forEach(f => f.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
    
    // 清除错误信息
    document.querySelectorAll('.error-message').forEach(err => {
      err.classList.remove('show');
      err.textContent = '';
    });
  });
});

// 显示错误信息
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.classList.add('show');
  
  setTimeout(() => {
    errorElement.classList.remove('show');
  }, 5000);
}

// 注册表单提交
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  
  // 表单验证
  if (username.length < 3 || username.length > 20) {
    showError('registerError', '用户名长度必须在3-20个字符之间');
    return;
  }
  
  if (password.length < 6) {
    showError('registerError', '密码长度至少6个字符');
    return;
  }
  
  if (password !== confirmPassword) {
    showError('registerError', '两次输入的密码不一致');
    return;
  }
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 注册成功，保存用户信息并跳转
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      window.location.href = '/chat.html';
    } else {
      showError('registerError', data.error || '注册失败');
    }
  } catch (error) {
    showError('registerError', '网络错误，请稍后重试');
    console.error('注册错误:', error);
  }
});

// 登录表单提交
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!username || !password) {
    showError('loginError', '请输入用户名和密码');
    return;
  }
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 登录成功，保存用户信息并跳转
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      window.location.href = '/chat.html';
    } else {
      showError('loginError', data.error || '登录失败');
    }
  } catch (error) {
    showError('loginError', '网络错误，请稍后重试');
    console.error('登录错误:', error);
  }
});

// 检查是否已登录
if (localStorage.getItem('userId')) {
  window.location.href = '/chat.html';
}

// 主题初始化
function initTheme() {
  const theme = localStorage.getItem('theme') || 'auto';
  applyTheme(theme);
}

function applyTheme(theme) {
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const theme = localStorage.getItem('theme') || 'auto';
  if (theme === 'auto') {
    applyTheme('auto');
  }
});

initTheme();
