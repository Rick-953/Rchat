# Rchat 完整部署与运维指南

本指南适用于 **Debian 12 / Ubuntu 20.04+** 系统。

## 目录

- [一、系统环境要求](#一系统环境要求)
- [二、服务器部署步骤](#二服务器部署步骤)
- [三、生产环境部署（PM2）](#三生产环境部署pm2)
- [四、Nginx 反向代理配置](#囚nginx-反向代理配置)
- [五、运维管理操作](#五运维管理操作)
- [六、安全加固建议](#六安全加固建议)
- [七、常见问题排查](#七常见问题排查)

---

## 一、系统环境要求

### 1.1 硬件要求

- **CPU**: 1核心及以上
- **内存**: 512MB 及以上（建议 1GB+）
- **硬盘**: 至少 5GB 可用空间

### 1.2 软件要求

- **操作系统**: Debian 12 / Ubuntu 20.04+ / Ubuntu 22.04+
- **Node.js**: v16.x 或更高版本
- **npm**: v8.x 或更高版本

---

## 二、服务器部署步骤

### 2.1 安装 Node.js 和 npm

#### 方法一：使用 NodeSource 官方源（推荐）

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git

# 添加 Node.js 20.x LTS 源
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js 和 npm
sudo apt install -y nodejs

# 验证安装
node -v   # 应显示 v20.x.x
npm -v    # 应显示 10.x.x
```

#### 方法二：使用 nvm 管理多版本（可选）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc

# 安装 Node.js LTS
nvm install --lts
nvm use --lts
```

### 2.2 创建项目目录并上传代码

```bash
# 创建项目根目录
sudo mkdir -p /opt/rchat
sudo chown $USER:$USER /opt/rchat
cd /opt/rchat

# 创建必要的子目录
mkdir -p public/js public/css public/uploads
```

#### 文件结构

```
/opt/rchat/
├── server.js           # 后端服务器主文件
├── package.json        # 依赖配置
├── database.db         # SQLite数据库(自动生成)
└── public/
    ├── index.html      # 登录/注册页面
    ├── chat.html       # 聊天主界面
    ├── js/
    │   ├── login.js    # 登录逻辑
    │   └── chat.js     # 聊天逻辑
    ├── css/
    │   └── style.css   # 样式文件
    └── uploads/        # 文件上传目录
```

### 2.3 创建 package.json 并安装依赖

```bash
cd /opt/rchat

# 创建 package.json 文件
cat > package.json << 'EOF'
{
  "name": "rchat",
  "version": "1.0.0",
  "description": "轻量级实时聊天系统",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": ["chat", "realtime", "websocket"],
  "author": "Rick",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "sqlite3": "^5.1.6",
    "bcrypt": "^5.1.1",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# 安装所有依赖
npm install
```

**依赖说明**:
- `express`: Web 框架
- `socket.io`: WebSocket 实时通信
- `sqlite3`: SQLite 数据库驱动
- `bcrypt`: 密码加密
- `multer`: 文件上传处理
- `uuid`: 生成唯一文件名

### 2.4 配置防火墙和端口

Rchat 默认监听 **7242** 端口。

#### 如果使用 ufw 防火墙

```bash
sudo ufw allow 7242/tcp
sudo ufw reload
```

#### 如果使用 iptables

```bash
sudo iptables -I INPUT -p tcp --dport 7242 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

#### 修改端口（可选）

编辑 `server.js` 文件中的 PORT 变量：

```javascript
const PORT = 7242; // 改为你想要的端口
```

### 2.5 首次启动测试

```bash
cd /opt/rchat
node server.js
```

**成功输出示例**:

```
✓ 数据库连接成功
✓ 数据库表初始化完成
╭────────────────────────╮
│ 🚀 Rchat 服务器启动成功！ │
├────────────────────────┤
│ 访问: http://localhost:7242 │
│ 端口: 7242                  │
╰────────────────────────╯
```

**浏览器访问测试**: `http://你的服务器IP:7242`

按 `Ctrl + C` 停止服务器。

---

## 三、生产环境部署（PM2）

### 3.1 安装 PM2 进程管理器

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 -v
```

### 3.2 使用 PM2 启动服务

```bash
cd /opt/rchat

# 启动服务（cluster模式）
pm2 start server.js --name rchat -i 2

# 或者单实例启动（小型服务器）
pm2 start server.js --name rchat
```

**参数说明**:
- `--name rchat`: 进程名称
- `-i 2`: 启动2个实例（根据CPU核心数调整）

### 3.3 PM2 常用管理命令

```bash
pm2 list              # 查看进程状态
pm2 logs rchat        # 查看实时日志
pm2 logs rchat --err  # 查看错误日志
pm2 restart rchat     # 重启服务
pm2 stop rchat        # 停止服务
pm2 delete rchat      # 删除进程
pm2 reload rchat      # 重载服务（0秒停机时间）
pm2 monit             # 查看进程监控面板
```

### 3.4 配置开机自启动

```bash
# 生成启动脚本
pm2 startup

# 执行输出的命令（示例）
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your_user --hp /home/your_user

# 保存当前 PM2 进程列表
pm2 save

# 验证自启动配置
systemctl status pm2-$USER
```

---

## 四、Nginx 反向代理配置

使用 Nginx 可实现域名访问、HTTPS、负载均衡。

### 4.1 安装 Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 4.2 配置 Rchat 站点

```bash
sudo nano /etc/nginx/sites-available/rchat
```

**HTTP 配置**:

```nginx
server {
    listen 80;
    server_name chat.yourdomain.com;  # 替换为你的域名或IP

    location / {
        proxy_pass http://127.0.0.1:7242;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO WebSocket 支持
    location /socket.io/ {
        proxy_pass http://127.0.0.1:7242;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket 超时设置
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # 文件上传大小限制(10GB)
    client_max_body_size 10240M;
}
```

**启用站点**:

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/rchat /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 4.3 配置 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 自动配置 SSL 证书
sudo certbot --nginx -d chat.yourdomain.com

# 证书自动续期测试
sudo certbot renew --dry-run
```

**HTTPS 完整配置示例**:

```nginx
server {
    listen 443 ssl http2;
    server_name chat.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/chat.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:7242;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:7242;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    client_max_body_size 10240M;
}

# HTTP 跳转 HTTPS
server {
    listen 80;
    server_name chat.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

---

## 五、运维管理操作

### 5.1 重置用户密码

创建密码重置脚本 `reset-password.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const readline = require('readline');

const db = new sqlite3.Database('./database.db');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('输入要重置密码的用户名: ', (username) => {
    rl.question('输入新密码(至少6位): ', async (newPassword) => {
        if (newPassword.length < 6) {
            console.log('❌ 密码长度至少6个字符');
            rl.close();
            db.close();
            return;
        }

        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err || !user) {
                console.log(`❌ 用户 ${username} 不存在`);
                rl.close();
                db.close();
                return;
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET password = ? WHERE username = ?', 
                [hashedPassword, username], 
                (err) => {
                    if (err) {
                        console.error('❌ 更新密码失败:', err);
                    } else {
                        console.log(`✅ 用户 ${username} 的密码已成功重置`);
                    }
                    rl.close();
                    db.close();
                }
            );
        });
    });
});
```

**使用**:

```bash
node reset-password.js
```

### 5.2 数据库备份与恢复

#### 每日自动备份

创建备份脚本 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/rchat/backups"
DB_FILE="/opt/rchat/database.db"
UPLOAD_DIR="/opt/rchat/public/uploads"

mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 备份数据库
cp $DB_FILE "$BACKUP_DIR/database_$TIMESTAMP.db"

# 打包上传文件
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C /opt/rchat/public uploads/

# 保留最近7天的备份
find $BACKUP_DIR -name "database_*.db" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "✅ 备份完成: $TIMESTAMP"
```

**设置定时任务**（每天凌晨3点备份）:

```bash
chmod +x /opt/rchat/backup.sh
crontab -e

# 添加以下行
0 3 * * * /opt/rchat/backup.sh >> /opt/rchat/backup.log 2>&1
```

#### 恢复备份

```bash
pm2 stop rchat
cp /opt/rchat/backups/database_20250109.db /opt/rchat/database.db
tar -xzf /opt/rchat/backups/uploads_20250109.tar.gz -C /opt/rchat/public/
pm2 restart rchat
```

### 5.3 日志管理

```bash
# 实时日志
pm2 logs rchat

# 仅查看错误日志
pm2 logs rchat --err

# 清空日志
pm2 flush
```

**日志文件位置**:
- `~/.pm2/logs/rchat-out.log` - 标准输出
- `~/.pm2/logs/rchat-error.log` - 错误日志

### 5.4 性能监控

```bash
pm2 monit                          # 查看进程资源占用
sudo netstat -tulnp | grep 7242    # 查看端口占用
sudo ss -tn | grep :7242 | wc -l   # 查看连接数
```

---

## 六、安全加固建议

### 6.1 配置文件权限

```bash
chmod 600 /opt/rchat/database.db
chmod 755 /opt/rchat/public/uploads
```

### 6.2 配置防火墙（ufw）

```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status
```

### 6.3 限制上传文件类型

在 `server.js` 中添加:

```javascript
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const forbiddenExts = ['.exe', '.sh', '.bat', '.cmd', '.msi'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (forbiddenExts.includes(ext)) {
            return cb(new Error('不允许上传此类文件'));
        }
        cb(null, true);
    }
});
```

### 6.4 定期更新依赖

```bash
cd /opt/rchat
npm outdated      # 检查过期依赖
npm audit fix     # 安全更新
pm2 restart rchat # 重启服务
```

---

## 七、常见问题排查

### 7.1 服务启动失败

```bash
# 查看错误日志
pm2 logs rchat --err

# 端口被占用?
sudo lsof -i :7242
sudo kill -9 <PID>

# 依赖缺失?
npm install
```

### 7.2 WebSocket 连接失败

**检查项**:
1. 防火墙是否开放端口
2. Nginx 配置是否正确（特别是 Upgrade 头）
3. 浏览器控制台是否有 CORS 错误

**解决方案**: 在 `server.js` 添加 CORS 配置

```javascript
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
```

### 7.3 文件上传失败

```bash
# 检查磁盘空间
df -h

# 检查目录权限
ls -ld /opt/rchat/public/uploads

# 修复权限
chmod 755 /opt/rchat/public/uploads
```

### 7.4 数据库锁定错误

**症状**: database is locked

**原因**: SQLite 不支持高并发写入

**解决方案**:

```bash
pm2 restart rchat
```

如果频繁发生,考虑升级到 PostgreSQL/MySQL。

---

## 总结

### 核心运维命令速查

| 操作 | 命令 |
|------|------|
| 启动服务 | `pm2 start rchat` |
| 停止服务 | `pm2 stop rchat` |
| 重启服务 | `pm2 restart rchat` |
| 查看日志 | `pm2 logs rchat` |
| 查看状态 | `pm2 list` |
| 数据库备份 | `cp database.db database_backup.db` |
| 重置密码 | `node reset-password.js` |
| 清理日志 | `pm2 flush` |

### 监控检查清单

- [ ] 每日检查服务状态 (`pm2 list`)
- [ ] 每周检查磁盘空间 (`df -h`)
- [ ] 每月更新依赖 (`npm audit fix`)
- [ ] 每季度备份测试

---

**手册版本**: v1.0  
**适用系统**: Debian 12 / Ubuntu 20.04+  
**最后更新**: 2025-11-10  
**技术支持**: rick080402@gmail.com