// ==================== 全局变量 ====================
let socket;
let currentUserId;
let currentUsername;
let currentRoom = null;
let currentChatType = null; // 'lobby' 或 'private'
let currentPrivateChatUserId = null;
let currentPrivateChatUsername = null;
let onlineUsers = [];
let friends = [];
let typingTimeout;
let conversations = new Map(); // 存储会话信息

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  currentUserId = parseInt(localStorage.getItem('userId'));
  currentUsername = localStorage.getItem('username');
  
  if (!currentUserId || !currentUsername) {
    window.location.href = '/index.html';
    return;
  }
  
  initTheme();
  initSocket();
  initEventListeners();
  loadFriends();
  loadFriendRequests();
});

// ==================== Socket.IO 初始化 ====================
function initSocket() {
  socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });
  
  socket.on('connect', () => {
    console.log('✓ 已连接到服务器');
    socket.emit('user-join', {
      userId: currentUserId,
      username: currentUsername
    });
  });
  
  socket.on('disconnect', () => {
    console.log('✗ 与服务器断开连接');
  });
  
  socket.on('user-joined', (data) => {
    if (currentRoom === 'lobby') {
      showSystemMessage(`${data.username} 加入了聊天室`);
    }
  });
  
  socket.on('user-left', (data) => {
    if (currentRoom === 'lobby') {
      showSystemMessage(`${data.username} 离开了聊天室`);
    }
  });
  
  socket.on('online-users', (users) => {
    onlineUsers = users;
    updateOnlineUserList();
    document.getElementById('onlineCount').textContent = users.length;
    document.getElementById('chatOnlineCount').textContent = users.length;
  });
  
  socket.on('new-message', (message) => {
    if (currentRoom === message.room) {
      appendMessage(message);
    }
    updateConversationList();
  });
  
  socket.on('new-private-message', (message) => {
    const room = message.room;
    if (currentRoom === room) {
      appendMessage(message);
    } else {
      showNotification(`${message.username} 给你发来了消息`);
    }
    updateConversationList();
  });
  
  socket.on('user-typing', (data) => {
    showTypingIndicator(data.username);
  });
  
  socket.on('friend-request-received', (data) => {
    showNotification(`${data.fromUsername} 想要添加你为好友`);
    loadFriendRequests();
  });
  
  socket.on('friend-request-sent', (data) => {
    showNotification('好友请求已发送');
  });
  
  socket.on('friend-request-error', (data) => {
    alert(data.error);
  });
  
  socket.on('friend-added', (data) => {
    showNotification('添加好友成功');
    loadFriends();
  });
  
  socket.on('friend-deleted', (data) => {
    showNotification('已删除好友');
    loadFriends();
    if (currentPrivateChatUserId === data.friendId) {
      backToHome();
    }
  });
}

// ==================== UI 事件监听 ====================
function initEventListeners() {
  // 会话列表标签切换
  document.querySelectorAll('.conv-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.conv-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.conv-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tabName + 'Tab').classList.add('active');
    });
  });

  // 点击群聊进入
  document.querySelector('.lobby-item').addEventListener('click', () => {
    enterChat('lobby', null, '全员大厅');
  });

  // 返回主页
  document.getElementById('backBtn').addEventListener('click', backToHome);
  
  // 发送消息
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  
  const messageInput = document.getElementById('messageInput');
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    
    clearTimeout(typingTimeout);
    if (currentRoom) {
      socket.emit('typing', { room: currentRoom, username: currentUsername });
    }
    typingTimeout = setTimeout(() => {}, 2000);
  });
  
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  });
  
  // 文件上传
  document.getElementById('fileBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
  
  // 设置按钮
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.add('show');
    document.getElementById('currentUserInfo').textContent = `${currentUsername} (ID: ${currentUserId})`;
  });
  
  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('show');
  });
  
  // 主题切换
  document.querySelectorAll('.btn-theme').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      localStorage.setItem('theme', theme);
      applyTheme(theme);
      document.querySelectorAll('.btn-theme').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // 退出登录
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      window.location.href = '/index.html';
    }
  });
  
  // 删除账号
  document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('show');
    document.getElementById('deleteAccountModal').classList.add('show');
  });
  
  document.getElementById('closeDeleteAccount').addEventListener('click', () => {
    document.getElementById('deleteAccountModal').classList.remove('show');
  });
  
  document.getElementById('cancelDeleteAccount').addEventListener('click', () => {
    document.getElementById('deleteAccountModal').classList.remove('show');
  });
  
  document.getElementById('confirmDeleteAccount').addEventListener('click', deleteAccount);
  
  // 添加好友弹窗
  document.getElementById('closeAddFriend').addEventListener('click', () => {
    document.getElementById('addFriendModal').classList.remove('show');
  });
  
  document.getElementById('cancelAddFriend').addEventListener('click', () => {
    document.getElementById('addFriendModal').classList.remove('show');
  });
  
  document.getElementById('confirmAddFriend').addEventListener('click', confirmAddFriend);
  
  // 点击模态框外部关闭
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
}

// ==================== 页面切换 ====================
function enterChat(chatType, userId, name) {
  currentChatType = chatType;
  
  if (chatType === 'lobby') {
    currentRoom = 'lobby';
    currentPrivateChatUserId = null;
    currentPrivateChatUsername = null;
  } else if (chatType === 'private') {
    currentPrivateChatUserId = userId;
    currentPrivateChatUsername = name;
    const userId1 = Math.min(currentUserId, userId);
    const userId2 = Math.max(currentUserId, userId);
    currentRoom = `private-${userId1}-${userId2}`;
    socket.emit('join-private-room', { userId1, userId2 });
  }
  
  document.getElementById('conversationListPage').style.display = 'none';
  document.getElementById('chatContainer').style.display = 'flex';
  document.getElementById('chatTitle').textContent = name;
  
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  
  loadMessages(currentRoom);
}

function backToHome() {
  currentRoom = null;
  currentChatType = null;
  currentPrivateChatUserId = null;
  currentPrivateChatUsername = null;
  
  document.getElementById('conversationListPage').style.display = 'block';
  document.getElementById('chatContainer').style.display = 'none';
  
  updateConversationList();
}

// ==================== 消息功能 ====================
function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  
  if (!content || !currentRoom) return;
  
  if (currentChatType === 'lobby') {
    socket.emit('send-message', {
      userId: currentUserId,
      username: currentUsername,
      content: content,
      type: 'text',
      room: 'lobby'
    });
  } else if (currentChatType === 'private') {
    socket.emit('send-private-message', {
      fromUserId: currentUserId,
      fromUsername: currentUsername,
      toUserId: currentPrivateChatUserId,
      content: content,
      type: 'text'
    });
  }
  
  input.value = '';
  input.style.height = 'auto';
}

function appendMessage(message) {
  const container = document.getElementById('messagesContainer');
  
  const welcome = container.querySelector('.welcome-message');
  if (welcome) {
    welcome.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  
  // 关键修复：正确判断是否是自己发的消息
  const isOwnMessage = (message.userId === currentUserId) || (message.user_id === currentUserId);
  
  if (isOwnMessage) {
    messageDiv.classList.add('own');
  }
  
  // 用户名（不是自己的消息才显示）
  if (!isOwnMessage) {
    const usernameDiv = document.createElement('div');
    usernameDiv.className = 'message-username';
    usernameDiv.textContent = message.username;
    usernameDiv.onclick = () => showAddFriendDialog(message.userId || message.user_id, message.username);
    messageDiv.appendChild(usernameDiv);
  }
  
  // 消息气泡
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'message-bubble';
  
  if (message.type === 'text') {
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = message.content;
    bubbleDiv.appendChild(textDiv);
  } else if (message.type === 'file') {
    const fileData = JSON.parse(message.content);
    const fileDiv = document.createElement('div');
    fileDiv.className = 'message-file';
    
    if (fileData.fileType.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = fileData.fileUrl;
      img.alt = fileData.fileName;
      fileDiv.appendChild(img);
    } else if (fileData.fileType.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = fileData.fileUrl;
      video.controls = true;
      fileDiv.appendChild(video);
    } else {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'file-info';
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'file-name';
      nameDiv.textContent = fileData.fileName;
      
      const sizeDiv = document.createElement('div');
      sizeDiv.textContent = formatFileSize(fileData.fileSize);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = fileData.fileUrl;
      downloadLink.download = fileData.fileName;
      downloadLink.className = 'file-download';
      downloadLink.textContent = '下载文件';
      
      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(sizeDiv);
      infoDiv.appendChild(downloadLink);
      fileDiv.appendChild(infoDiv);
    }
    
    bubbleDiv.appendChild(fileDiv);
  }
  
  messageDiv.appendChild(bubbleDiv);
  
  // 时间
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = formatTime(message.timestamp || message.created_at);
  messageDiv.appendChild(timeDiv);
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function showSystemMessage(text) {
  const container = document.getElementById('messagesContainer');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'system-message';
  messageDiv.textContent = text;
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator(username) {
  const indicator = document.getElementById('typingIndicator');
  indicator.querySelector('span').textContent = username;
  indicator.style.display = 'block';
  
  setTimeout(() => {
    indicator.style.display = 'none';
  }, 2000);
}

async function loadMessages(room) {
  try {
    const response = await fetch(`/api/messages/${room}?limit=50`);
    const data = await response.json();
    
    if (response.ok) {
      data.messages.forEach(message => {
        appendMessage(message);
      });
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  }
}

// ==================== 文件上传 ====================
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const maxSize = 10 * 1024 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('文件大小不能超过10GB');
    return;
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  const progressDiv = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  progressDiv.style.display = 'block';
  
  try {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressFill.style.width = percent + '%';
        progressText.textContent = `上传中... ${Math.round(percent)}%`;
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        
        const fileData = {
          fileUrl: response.fileUrl,
          fileName: response.fileName,
          fileSize: response.fileSize,
          fileType: response.fileType
        };
        
        if (currentChatType === 'lobby') {
          socket.emit('send-message', {
            userId: currentUserId,
            username: currentUsername,
            content: JSON.stringify(fileData),
            type: 'file',
            room: 'lobby'
          });
        } else if (currentChatType === 'private') {
          socket.emit('send-private-message', {
            fromUserId: currentUserId,
            fromUsername: currentUsername,
            toUserId: currentPrivateChatUserId,
            content: JSON.stringify(fileData),
            type: 'file'
          });
        }
        
        progressDiv.style.display = 'none';
        progressFill.style.width = '0%';
        e.target.value = '';
      } else {
        alert('文件上传失败');
        progressDiv.style.display = 'none';
      }
    });
    
    xhr.addEventListener('error', () => {
      alert('文件上传出错');
      progressDiv.style.display = 'none';
    });
    
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
    
  } catch (error) {
    console.error('上传错误:', error);
    alert('文件上传失败');
    progressDiv.style.display = 'none';
  }
}

// ==================== 好友功能 ====================
async function loadFriends() {
  try {
    const response = await fetch(`/api/friends/${currentUserId}`);
    const data = await response.json();
    
    if (response.ok) {
      friends = data.friends;
      updateFriendList();
      updateConversationList();
    }
  } catch (error) {
    console.error('加载好友列表失败:', error);
  }
}

function updateFriendList() {
  const friendList = document.getElementById('friendList');
  const emptyState = document.getElementById('emptyFriends');
  
  friendList.innerHTML = '';
  
  if (friends.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  friends.forEach(friend => {
    const item = document.createElement('div');
    item.className = 'user-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'user-name';
    nameSpan.textContent = friend.username;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-friend-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`确定要删除好友 ${friend.username} 吗？`)) {
        socket.emit('delete-friend', {
          userId: currentUserId,
          friendId: friend.id
        });
      }
    };
    
    item.appendChild(nameSpan);
    item.appendChild(deleteBtn);
    
    item.onclick = () => {
      enterChat('private', friend.id, friend.username);
    };
    
    friendList.appendChild(item);
  });
}

async function loadFriendRequests() {
  try {
    const response = await fetch(`/api/friend-requests/${currentUserId}`);
    const data = await response.json();
    
    if (response.ok) {
      updateFriendRequestList(data.requests);
    }
  } catch (error) {
    console.error('加载好友请求失败:', error);
  }
}

function updateFriendRequestList(requests) {
  const requestList = document.getElementById('requestList');
  const emptyState = document.getElementById('emptyRequests');
  const badge = document.getElementById('requestBadge');
  
  requestList.innerHTML = '';
  
  if (requests.length === 0) {
    emptyState.style.display = 'block';
    badge.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  badge.style.display = 'inline';
  badge.textContent = requests.length;
  
  requests.forEach(request => {
    const item = document.createElement('div');
    item.className = 'request-item';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'request-info';
    
    const fromDiv = document.createElement('div');
    fromDiv.className = 'request-from';
    fromDiv.textContent = `${request.from_username} 请求添加你为好友`;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'request-time';
    timeDiv.textContent = formatTime(request.created_at);
    
    infoDiv.appendChild(fromDiv);
    infoDiv.appendChild(timeDiv);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'request-actions';
    
    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'btn-accept';
    acceptBtn.textContent = '接受';
    acceptBtn.onclick = () => {
      socket.emit('accept-friend-request', {
        requestId: request.id,
        fromUserId: request.from_user_id,
        toUserId: currentUserId
      });
      item.remove();
      loadFriendRequests();
    };
    
    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn-reject';
    rejectBtn.textContent = '拒绝';
    rejectBtn.onclick = () => {
      socket.emit('reject-friend-request', {
        requestId: request.id
      });
      item.remove();
      loadFriendRequests();
    };
    
    actionsDiv.appendChild(acceptBtn);
    actionsDiv.appendChild(rejectBtn);
    
    item.appendChild(infoDiv);
    item.appendChild(actionsDiv);
    
    requestList.appendChild(item);
  });
}

function showAddFriendDialog(userId, username) {
  if (userId === currentUserId) {
    return;
  }
  
  const isFriend = friends.some(f => f.id === userId);
  if (isFriend) {
    alert('你们已经是好友了');
    return;
  }
  
  document.getElementById('friendNameToAdd').textContent = username;
  document.getElementById('addFriendModal').classList.add('show');
  document.getElementById('addFriendModal').dataset.userId = userId;
  document.getElementById('addFriendModal').dataset.username = username;
}

function confirmAddFriend() {
  const modal = document.getElementById('addFriendModal');
  const toUserId = parseInt(modal.dataset.userId);
  const toUsername = modal.dataset.username;
  
  socket.emit('send-friend-request', {
    fromUserId: currentUserId,
    fromUsername: currentUsername,
    toUserId: toUserId,
    toUsername: toUsername
  });
  
  modal.classList.remove('show');
}

// ==================== 会话列表更新 ====================
function updateConversationList() {
  const container = document.getElementById('privateConversations');
  container.innerHTML = '';
  
  friends.forEach(friend => {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.onclick = () => enterChat('private', friend.id, friend.username);
    
    const avatar = document.createElement('div');
    avatar.className = 'conv-avatar';
    avatar.textContent = friend.username.charAt(0).toUpperCase();
    
    const info = document.createElement('div');
    info.className = 'conv-info';
    
    const name = document.createElement('div');
    name.className = 'conv-name';
    name.textContent = friend.username;
    
    const lastMsg = document.createElement('div');
    lastMsg.className = 'conv-last-msg';
    lastMsg.textContent = '点击开始聊天...';
    
    info.appendChild(name);
    info.appendChild(lastMsg);
    
    const time = document.createElement('div');
    time.className = 'conv-time';
    
    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(time);
    
    container.appendChild(item);
  });
}

// ==================== 在线用户列表 ====================
function updateOnlineUserList() {
  const userList = document.getElementById('onlineUserList');
  userList.innerHTML = '';
  
  onlineUsers.forEach(user => {
    const item = document.createElement('div');
    item.className = 'user-item';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'user-name';
    nameDiv.textContent = user.username;
    
    if (user.userId === currentUserId) {
      nameDiv.textContent += ' (我)';
    }
    
    item.appendChild(nameDiv);
    
    if (user.userId !== currentUserId) {
      item.onclick = () => showAddFriendDialog(user.userId, user.username);
    }
    
    userList.appendChild(item);
  });
}

// ==================== 账号删除 ====================
async function deleteAccount() {
  try {
    const response = await fetch('/api/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUserId })
    });
    
    if (response.ok) {
      alert('账号已删除');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      window.location.href = '/index.html';
    } else {
      alert('删除账号失败');
    }
  } catch (error) {
    console.error('删除账号错误:', error);
    alert('删除账号失败');
  }
}

// ==================== 主题系统 ====================
function initTheme() {
  const theme = localStorage.getItem('theme') || 'auto';
  applyTheme(theme);
  
  document.querySelectorAll('.btn-theme').forEach(btn => {
    if (btn.dataset.theme === theme) {
      btn.classList.add('active');
    }
  });
}

function applyTheme(theme) {
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const theme = localStorage.getItem('theme') || 'auto';
  if (theme === 'auto') {
    applyTheme('auto');
  }
});

// ==================== 工具函数 ====================
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  else return (bytes / 1073741824).toFixed(2) + ' GB';
}

function showNotification(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Rchat', { body: message });
  }
}

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
// ==================== 移动端视口高度修复 ====================
function setAppHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}

// 页面加载时设置
setAppHeight();

// 窗口大小改变时更新（防抖）
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    setAppHeight();
  }, 100);
});

// 方向改变时更新
window.addEventListener('orientationchange', () => {
  setTimeout(setAppHeight, 100);
});

// 可见性改变时更新（从后台切回）
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setAppHeight();
  }
});
