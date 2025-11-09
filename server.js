const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  maxHttpBufferSize: 10 * 1024 * 1024 * 1024, // 10GB
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = 7242;
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 中间件配置
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// 配置文件上传（10GB限制）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
  fileFilter: (req, file, cb) => {
    // 允许所有文件类型
    cb(null, true);
  }
});

// 初始化SQLite数据库
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('✓ 数据库连接成功');
    initDatabase();
  }
});

// 创建数据库表
function initDatabase() {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 消息表
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    room TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 好友关系表
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    UNIQUE(user_id, friend_id)
  )`);

  // 好友请求表
  db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  )`);

  console.log('✓ 数据库表初始化完成');
}

// 在线用户管理
const onlineUsers = new Map(); // socketId -> {userId, username}

// ==================== API路由 ====================

// 用户注册
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度必须在3-20个字符之间' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6个字符' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, hashedPassword], 
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: '用户名已存在' });
          }
          return res.status(500).json({ error: '注册失败' });
        }
        res.json({ 
          success: true, 
          userId: this.lastID,
          username: username 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    res.json({ 
      success: true, 
      userId: user.id,
      username: user.username
    });
  });
});

// 删除账号
app.post('/api/delete-account', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: '用户ID不能为空' });
  }

  db.serialize(() => {
    db.run('DELETE FROM messages WHERE user_id = ?', [userId]);
    db.run('DELETE FROM friends WHERE user_id = ? OR friend_id = ?', [userId, userId]);
    db.run('DELETE FROM friend_requests WHERE from_user_id = ? OR to_user_id = ?', [userId, userId]);
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: '删除账号失败' });
      }
      res.json({ success: true });
    });
  });
});

// 文件上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件上传' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    success: true, 
    fileUrl: fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype
  });
});

// 获取历史消息
app.get('/api/messages/:room', (req, res) => {
  const { room } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    `SELECT m.*, u.username FROM messages m 
     JOIN users u ON m.user_id = u.id 
     WHERE m.room = ? 
     ORDER BY m.created_at DESC 
     LIMIT ? OFFSET ?`,
    [room, limit, offset],
    (err, messages) => {
      if (err) {
        return res.status(500).json({ error: '获取消息失败' });
      }
      res.json({ messages: messages.reverse() });
    }
  );
});

// 获取好友列表
app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;

  db.all(
    `SELECT u.id, u.username FROM users u
     INNER JOIN friends f ON (f.friend_id = u.id AND f.user_id = ?)
     ORDER BY u.username`,
    [userId],
    (err, friends) => {
      if (err) {
        return res.status(500).json({ error: '获取好友列表失败' });
      }
      res.json({ friends });
    }
  );
});

// 获取好友请求
app.get('/api/friend-requests/:userId', (req, res) => {
  const { userId } = req.params;

  db.all(
    `SELECT fr.*, u.username as from_username 
     FROM friend_requests fr
     JOIN users u ON fr.from_user_id = u.id
     WHERE fr.to_user_id = ? AND fr.status = 'pending'
     ORDER BY fr.created_at DESC`,
    [userId],
    (err, requests) => {
      if (err) {
        return res.status(500).json({ error: '获取好友请求失败' });
      }
      res.json({ requests });
    }
  );
});

// ==================== Socket.IO 事件处理 ====================

io.on('connection', (socket) => {
  console.log(`✓ 新连接: ${socket.id}`);

  // 用户加入
  socket.on('user-join', (userData) => {
    const { userId, username } = userData;
    
    onlineUsers.set(socket.id, { userId, username });
    socket.userId = userId;
    socket.username = username;
    
    // 加入全员群
    socket.join('lobby');
    
    // 通知所有人
    io.to('lobby').emit('user-joined', {
      username,
      userId,
      onlineCount: onlineUsers.size
    });

    // 发送在线用户列表
    const userList = Array.from(onlineUsers.values());
    io.to('lobby').emit('online-users', userList);

    console.log(`✓ ${username} 加入聊天室，当前在线 ${onlineUsers.size} 人`);
  });

  // 发送群聊消息
  socket.on('send-message', (data) => {
    const { userId, username, content, type, room } = data;

    // 保存消息到数据库
    db.run(
      'INSERT INTO messages (user_id, username, content, type, room) VALUES (?, ?, ?, ?, ?)',
      [userId, username, content, type || 'text', room || 'lobby'],
      function(err) {
        if (err) {
          console.error('保存消息失败:', err);
          return;
        }

        const message = {
          id: this.lastID,
          userId,
          username,
          content,
          type: type || 'text',
          room: room || 'lobby',
          timestamp: new Date().toISOString()
        };

        // 广播消息
        io.to(room || 'lobby').emit('new-message', message);
      }
    );
  });

  // 发送私聊消息
  socket.on('send-private-message', (data) => {
    const { fromUserId, fromUsername, toUserId, content, type } = data;
    const room = `private-${Math.min(fromUserId, toUserId)}-${Math.max(fromUserId, toUserId)}`;

    // 保存私聊消息
    db.run(
      'INSERT INTO messages (user_id, username, content, type, room) VALUES (?, ?, ?, ?, ?)',
      [fromUserId, fromUsername, content, type || 'text', room],
      function(err) {
        if (err) {
          console.error('保存私聊消息失败:', err);
          return;
        }

        const message = {
          id: this.lastID,
          userId: fromUserId,
          username: fromUsername,
          content,
          type: type || 'text',
          room,
          timestamp: new Date().toISOString()
        };

        // 发给发送者和接收者
        socket.emit('new-private-message', message);
        
        // 找到接收者的socket并发送
        for (let [socketId, user] of onlineUsers) {
          if (user.userId === toUserId) {
            io.to(socketId).emit('new-private-message', message);
            break;
          }
        }
      }
    );
  });

  // 加入私聊房间
  socket.on('join-private-room', (data) => {
    const { userId1, userId2 } = data;
    const room = `private-${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}`;
    socket.join(room);
  });

  // 发送好友请求
  socket.on('send-friend-request', (data) => {
    const { fromUserId, fromUsername, toUserId, toUsername } = data;

    // 检查是否已经是好友
    db.get(
      'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [fromUserId, toUserId, toUserId, fromUserId],
      (err, friend) => {
        if (friend) {
          socket.emit('friend-request-error', { error: '你们已经是好友了' });
          return;
        }

        // 检查是否已发送请求
        db.get(
          'SELECT * FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = "pending"',
          [fromUserId, toUserId],
          (err, request) => {
            if (request) {
              socket.emit('friend-request-error', { error: '已发送过好友请求，请等待对方回应' });
              return;
            }

            // 创建好友请求
            db.run(
              'INSERT INTO friend_requests (from_user_id, to_user_id, status) VALUES (?, ?, "pending")',
              [fromUserId, toUserId],
              function(err) {
                if (err) {
                  socket.emit('friend-request-error', { error: '发送好友请求失败' });
                  return;
                }

                const requestData = {
                  id: this.lastID,
                  fromUserId,
                  fromUsername,
                  toUserId,
                  toUsername
                };

                // 通知发送者
                socket.emit('friend-request-sent', requestData);

                // 通知接收者（如果在线）
                for (let [socketId, user] of onlineUsers) {
                  if (user.userId === toUserId) {
                    io.to(socketId).emit('friend-request-received', requestData);
                    break;
                  }
                }
              }
            );
          }
        );
      }
    );
  });

  // 接受好友请求
  socket.on('accept-friend-request', (data) => {
    const { requestId, fromUserId, toUserId } = data;

    db.serialize(() => {
      // 更新请求状态
      db.run('UPDATE friend_requests SET status = "accepted" WHERE id = ?', [requestId]);

      // 添加双向好友关系
      db.run('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [fromUserId, toUserId]);
      db.run('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [toUserId, fromUserId], (err) => {
        if (err) {
          console.error('添加好友失败:', err);
          return;
        }

        // 通知双方
        socket.emit('friend-added', { friendId: fromUserId });
        
        for (let [socketId, user] of onlineUsers) {
          if (user.userId === fromUserId) {
            io.to(socketId).emit('friend-added', { friendId: toUserId });
            break;
          }
        }
      });
    });
  });

  // 拒绝好友请求
  socket.on('reject-friend-request', (data) => {
    const { requestId } = data;
    
    db.run('UPDATE friend_requests SET status = "rejected" WHERE id = ?', [requestId], (err) => {
      if (err) {
        console.error('拒绝好友请求失败:', err);
        return;
      }
      socket.emit('friend-request-rejected', { requestId });
    });
  });

  // 删除好友
  socket.on('delete-friend', (data) => {
    const { userId, friendId } = data;

    db.run(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId],
      (err) => {
        if (err) {
          console.error('删除好友失败:', err);
          return;
        }

        socket.emit('friend-deleted', { friendId });
        
        // 通知对方
        for (let [socketId, user] of onlineUsers) {
          if (user.userId === friendId) {
            io.to(socketId).emit('friend-deleted', { friendId: userId });
            break;
          }
        }
      }
    );
  });

  // 正在输入
  socket.on('typing', (data) => {
    const { room, username } = data;
    socket.to(room).emit('user-typing', { username });
  });

  // 断开连接
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      
      io.to('lobby').emit('user-left', {
        username: user.username,
        userId: user.userId,
        onlineCount: onlineUsers.size
      });

      // 更新在线用户列表
      const userList = Array.from(onlineUsers.values());
      io.to('lobby').emit('online-users', userList);

      console.log(`✗ ${user.username} 离开聊天室，当前在线 ${onlineUsers.size} 人`);
    }
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 Rchat 服务器启动成功！          ║
╟───────────────────────────────────────╢
║   访问地址: http://localhost:${PORT}   ║
║   端口号: ${PORT}                       ║
║   数据库: SQLite (database.db)       ║
║   文件上传限制: 10GB                 ║
╚═══════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err);
    } else {
      console.log('✓ 数据库已关闭');
    }
    process.exit(0);
  });
});
