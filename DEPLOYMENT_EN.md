# Rchat Deployment & Operations Guide

This guide is for **Debian 12 / Ubuntu 20.04+** systems.

## Table of Contents

- [1. System Requirements](#1-system-requirements)
- [2. Server Deployment Steps](#2-server-deployment-steps)
- [3. Production Setup (PM2)](#3-production-setup-pm2)
- [4. Nginx Reverse Proxy](#4-nginx-reverse-proxy)
- [5. Operations & Maintenance](#5-operations--maintenance)
- [6. Security Hardening](#6-security-hardening)
- [7. Troubleshooting](#7-troubleshooting)

---

## 1. System Requirements

### 1.1 Hardware Requirements

- **CPU**: 1 core or more
- **Memory**: 512MB minimum (1GB+ recommended)
- **Disk**: At least 5GB available

### 1.2 Software Requirements

- **OS**: Debian 12 / Ubuntu 20.04+ / Ubuntu 22.04+
- **Node.js**: v16.x or above
- **npm**: v8.x or above

---

## 2. Server Deployment Steps

### 2.1 Install Node.js and npm

#### Method 1: NodeSource Official Repository (Recommended)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # Should show v20.x.x
npm -v    # Should show 10.x.x
```

#### Method 2: Use nvm (Multi-version Management)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

### 2.2 Create Project Directory & Upload Code

```bash
sudo mkdir -p /opt/rchat
sudo chown $USER:$USER /opt/rchat
cd /opt/rchat
mkdir -p public/js public/css public/uploads
```

#### File Structure

```
/opt/rchat/
├── server.js           # Main server file
├── package.json        # Dependencies & config
├── database.db         # SQLite DB (auto-generated)
└── public/
    ├── index.html      # Login/register page
    ├── chat.html       # Main chat UI
    ├── js/
    │   ├── login.js    # Login logic
    │   └── chat.js     # Chat logic
    ├── css/
    │   └── style.css   # Stylesheet
    └── uploads/        # Upload directory
```

### 2.3 Create package.json & Install Dependencies

```bash
cd /opt/rchat
cat > package.json << 'EOF'
{
  "name": "rchat",
  "version": "1.0.0",
  "description": "Lightweight realtime chat system",
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
npm install
```

**Dependencies Overview:**
- `express`: Web framework
- `socket.io`: WebSocket
- `sqlite3`: Database driver
- `bcrypt`: Password hashing
- `multer`: File uploads
- `uuid`: Unique filename generation

### 2.4 Firewall & Port Setup

Default listen port is **7242**.

#### UFW Firewall

```bash
sudo ufw allow 7242/tcp
sudo ufw reload
```

#### iptables

```bash
sudo iptables -I INPUT -p tcp --dport 7242 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

#### Change Port (Optional)

Edit `PORT` variable in `server.js`:

```javascript
const PORT = 7242; // Change as needed
```

### 2.5 First Startup Test

```bash
cd /opt/rchat
node server.js
```
_Sample output:_

```
✓ Database connected
✓ DB tables initialized
╭──────────────────────────╮
│ 🚀 Rchat server started! │
├──────────────────────────┤
│ Visit: http://localhost:7242 │
│ Port: 7242                  │
╰──────────────────────────╯
```

Visit: `http://<your-server-IP>:7242`

Stop: `Ctrl + C`

---

## 3. Production Setup (PM2)

### 3.1 Install PM2 Process Manager

```bash
sudo npm install -g pm2
pm2 -v
```

### 3.2 Launch Service with PM2

```bash
cd /opt/rchat
pm2 start server.js --name rchat -i 2     # Cluster mode
pm2 start server.js --name rchat          # Single instance
```

**Args:**
- `--name rchat`: Process name
- `-i 2`: Start 2 instances (adjust for CPU cores)

### 3.3 PM2 Basic Management

```bash
pm2 list              # Status list
pm2 logs rchat        # Live logs
pm2 logs rchat --err  # Error logs
pm2 restart rchat     # Restart
pm2 stop rchat        # Stop
pm2 delete rchat      # Delete process
pm2 reload rchat      # Zero-downtime reload
pm2 monit             # Advanced monitoring
```

### 3.4 PM2 Autostart

```bash
pm2 startup
# Follow the command output (copy & run)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your_user --hp /home/your_user
pm2 save
systemctl status pm2-$USER
```

---

## 4. Nginx Reverse Proxy

Use Nginx for domain, HTTPS, or load-balancing.

### 4.1 Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 4.2 Configure Rchat Site

```bash
sudo nano /etc/nginx/sites-available/rchat
```

**Sample config:**

```nginx
server {
    listen 80;
    server_name chat.yourdomain.com;  # Replace with your domain or IP

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

    location /socket.io/ {
        proxy_pass http://127.0.0.1:7242;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    client_max_body_size 10240M;  # 10GB
}
```

**Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/rchat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.3 HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d chat.yourdomain.com
sudo certbot renew --dry-run
```

**Complete HTTPS sample:**

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

server {
    listen 80;
    server_name chat.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

---

## 5. Operations & Maintenance

### 5.1 Reset User Password

Create `reset-password.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const readline = require('readline');
const db = new sqlite3.Database('./database.db');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Username to reset password: ', username => {
    rl.question('New password (min 6 chars): ', async newPassword => {
        if (newPassword.length < 6) {
            console.log('❌ Password length must be >= 6');
            rl.close();
            db.close();
            return;
        }
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err || !user) {
                console.log(`❌ User ${username} not found`);
                rl.close();
                db.close();
                return;
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username], err => {
                if (err) {
                    console.error('❌ Error updating password:', err);
                } else {
                    console.log(`✅ Password for user ${username} updated`);
                }
                rl.close();
                db.close();
            });
        });
    });
});
```

Run:

```bash
node reset-password.js
```

### 5.2 DB Backup & Restore

#### Daily Auto-backup

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/rchat/backups"
DB_FILE="/opt/rchat/database.db"
UPLOAD_DIR="/opt/rchat/public/uploads"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cp $DB_FILE "$BACKUP_DIR/database_$TIMESTAMP.db"
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C /opt/rchat/public uploads/
find $BACKUP_DIR -name "database_*.db" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
echo "✅ Backup done: $TIMESTAMP"
```

Set cron (daily 3am):

```bash
chmod +x /opt/rchat/backup.sh
crontab -e
# Add:
0 3 * * * /opt/rchat/backup.sh >> /opt/rchat/backup.log 2>&1
```

#### Restore

```bash
pm2 stop rchat
cp /opt/rchat/backups/database_20250109.db /opt/rchat/database.db
tar -xzf /opt/rchat/backups/uploads_20250109.tar.gz -C /opt/rchat/public/
pm2 restart rchat
```

### 5.3 Log Management

```bash
pm2 logs rchat
pm2 logs rchat --err
pm2 flush
```

Logs:
- `~/.pm2/logs/rchat-out.log`: Output
- `~/.pm2/logs/rchat-error.log`: Error

### 5.4 Performance Monitoring

```bash
pm2 monit
sudo netstat -tulnp | grep 7242
sudo ss -tn | grep :7242 | wc -l
```

---

## 6. Security Hardening

### 6.1 File Permissions

```bash
chmod 600 /opt/rchat/database.db
chmod 755 /opt/rchat/public/uploads
```

### 6.2 UFW Rules

```bash
sudo ufw enable
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw status
```

### 6.3 Restrict Upload File Types

In `server.js`:

```javascript
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const forbiddenExts = ['.exe', '.sh', '.bat', '.cmd', '.msi'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (forbiddenExts.includes(ext)) {
            return cb(new Error('Disallowed file type'));
        }
        cb(null, true);
    }
});
```

### 6.4 Update Dependencies Regularly

```bash
cd /opt/rchat
npm outdated
npm audit fix
pm2 restart rchat
```

---

## 7. Troubleshooting

### 7.1 Service Failed to Start

```bash
pm2 logs rchat --err
sudo lsof -i :7242       # Check port
sudo kill -9 <PID>
npm install              # Fix missing deps
```

### 7.2 WebSocket Connection Fails

Checklist:
1. Firewall allows port
2. Nginx config (check Upgrade header)
3. Browser console for CORS errors

**Solution:** Add CORS config to `server.js`:

```javascript
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
```

### 7.3 File Upload Fails

```bash
df -h                      # Disk space
ls -ld /opt/rchat/public/uploads      # Directory permission
chmod 755 /opt/rchat/public/uploads   # Fix
```

### 7.4 Database Locked Error

Symptoms: `database is locked`
Reason: SQLite cannot handle high concurrency writes.

**Solution:**
```bash
pm2 restart rchat
```
If frequent, consider upgrading to PostgreSQL/MySQL.

---

## Summary

### Core Ops Cheat Sheet

| Operation         | Command                       |
|------------------|-------------------------------|
| Start service    | `pm2 start rchat`             |
| Stop service     | `pm2 stop rchat`              |
| Restart service  | `pm2 restart rchat`           |
| View logs        | `pm2 logs rchat`              |
| Status list      | `pm2 list`                    |
| DB backup        | `cp database.db database_backup.db` |
| Reset password   | `node reset-password.js`      |
| Flush logs       | `pm2 flush`                   |

### Operational Checklist

- [ ] Daily check service status (`pm2 list`)
- [ ] Weekly check disk space (`df -h`)
- [ ] Monthly dependencies update (`npm audit fix`)
- [ ] Quarterly backup recovery test

---

**Guide Version**: v1.0
**Supported OS**: Debian 12 / Ubuntu 20.04+
**Last Updated**: 2025-11-10
**Support**: rick080402@gmail.com
