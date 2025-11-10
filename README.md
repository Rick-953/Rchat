<div align="center">

# 🚀 Rchat

**A lightweight, real-time chat system that respects simplicity**  
**一个尊重简洁的轻量级实时聊天系统**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-blue)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Demo](https://img.shields.io/badge/Demo-rick.quest-orange)](https://rick.quest)

[中文](#简体中文) | [English](#english)

</div>

---

<h2 id="简体中文">🇨🇳 简体中文</h2>

### 💡 为什么选择 Rchat?

现代聊天软件已经变得过于臃肿——几百MB的安装包、复杂的界面、无尽的功能堆砌。**Rchat 回归即时通讯的本质**:轻量、快速、专注于沟通本身。

> 💬 **在线体验**: 访问 [rick.quest](https://rick.quest) 点击 Rchat 即可体验官方版本

### ✨ 核心特性

- ⚡ **极速响应** - 基于 WebSocket,消息延迟 <50ms
- 🪶 **轻量设计** - 纯原生前端,无框架依赖,资源占用低
- 🔐 **安全可靠** - bcrypt 密码加密 + 浏览器记忆登录
- 👥 **完整社交** - 好友系统、群聊、私聊、在线状态、打字提示
- 📁 **大文件传输** - 支持最大 10GB 文件上传
- 🎯 **零摩擦体验** - 首次登录后浏览器自动记忆,后续秒进

### 🛠️ 技术栈

```
后端:  Node.js + Express + Socket.IO
数据库: SQLite3 (轻量级) / MariaDB (生产环境)
前端:  原生 HTML/CSS/JavaScript (无框架)
加密:  bcrypt
文件:  Multer (支持 10GB+)
```

### 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/Rick-953/Rchat.git
cd Rchat

# 2. 安装依赖
npm install

# 3. 启动服务
node server.js
# 访问 http://localhost:7242
```

**生产环境部署?** 查看 **[完整部署指南 →](DEPLOYMENT.md)**

### 🌟 未来愿景

Rchat 不仅是一个聊天工具,更是一个**构建正向互联网社区**的实验:

#### 🤖 AI 智能调节
- **察言观色**: AI 自动识别对话氛围,在合适时机参与
- **话题引导**: 当讨论偏向负面时,AI 温和地引导至建设性方向
- **情绪缓冲**: 识别潜在冲突,提供理性视角

#### 🎖️ 社区自治系统
- **用户评分机制**: 建设性发言获赞,攻击性言论被踩
- **动态资源分配**: 高评分用户享受更流畅体验,低评分用户逐渐受限
- **自然淘汰**: 让恶意用户因体验下降而自然离开,而非强制封禁

#### 🔧 功能路线图
- [ ] 群主/管理员权限系统
- [ ] 用户自定义主题与布局
- [ ] 命令行客户端版本
- [ ] AI 驱动的内容审核
- [ ] 去中心化架构探索

### 🤝 参与贡献

Rchat 是个人项目,**急需你的力量**:

- 🐛 **发现 Bug?** [提交 Issue](https://github.com/Rick-953/Rchat/issues)
- 💻 **擅长开发?** 查看 [贡献指南](CONTRIBUTING.md)
- 🎨 **设计师?** 帮助优化 UI/UX
- 🌐 **多语言?** 协助翻译文档

### 📄 许可证

MIT License - 自由使用、修改、分发

### 📧 联系方式

- **作者**: Rick
- **邮箱**: rick080402@gmail.com
- **项目主页**: [github.com/Rick-953/Rchat](https://github.com/Rick-953/Rchat)

---

<h2 id="english">🇺🇸 English</h2>

### 💡 Why Rchat?

Modern chat applications have become bloated—hundreds of MBs, cluttered interfaces, endless feature creep. **Rchat returns to the essence of instant messaging**: lightweight, fast, and focused on communication.

> 💬 **Live Demo**: Visit [rick.quest](https://rick.quest) and click Rchat to try the official instance

### ✨ Key Features

- ⚡ **Lightning Fast** - WebSocket-based with <50ms message latency
- 🪶 **Minimalist Design** - Vanilla frontend, no framework overhead
- 🔐 **Secure** - bcrypt password encryption + persistent browser login
- 👥 **Full Social** - Friends system, group/private chat, online status, typing indicators
- 📁 **Large Files** - Upload up to 10GB files
- 🎯 **Zero Friction** - Auto-login after first registration

### 🛠️ Tech Stack

```
Backend:  Node.js + Express + Socket.IO
Database: SQLite3 (lightweight) / MariaDB (production)
Frontend: Vanilla HTML/CSS/JavaScript (no frameworks)
Security: bcrypt
Files:    Multer (10GB+ support)
```

### 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Rick-953/Rchat.git
cd Rchat

# 2. Install dependencies
npm install

# 3. Start the server
node server.js
# Visit http://localhost:7242
```

**Production deployment?** See the **[Full Deployment Guide →](DEPLOYMENT_EN.md)**

### 🌟 Future Vision

Rchat is more than a chat tool—it's an **experiment in building positive online communities**:

#### 🤖 AI-Driven Moderation
- **Context Awareness**: AI monitors conversation tone and intervenes appropriately
- **Topic Steering**: Gently guides discussions away from toxicity
- **Conflict Resolution**: Provides rational perspectives during heated debates

#### 🎖️ Community Self-Governance
- **User Scoring**: Constructive users earn upvotes, toxic behavior gets downvoted
- **Dynamic Resource Allocation**: High-score users get better performance, low-score users experience degradation
- **Natural Attrition**: Bad actors leave voluntarily due to poor experience, not forced bans

#### 🔧 Roadmap
- [ ] Group admin/moderator system
- [ ] User-customizable themes and layouts
- [ ] CLI client version
- [ ] AI-powered content moderation
- [ ] Decentralization exploration

### 🤝 Contributing

Rchat is a solo project and **needs your help**:

- 🐛 **Found a bug?** [Open an Issue](https://github.com/Rick-953/Rchat/issues)
- 💻 **Developer?** Check the [Contributing Guide](CONTRIBUTING.md)
- 🎨 **Designer?** Help improve UI/UX
- 🌐 **Multilingual?** Assist with translations

### 📄 License

MIT License - Free to use, modify, and distribute

### 📧 Contact

- **Author**: Rick
- **Email**: rick080402@gmail.com
- **Project**: [github.com/Rick-953/Rchat](https://github.com/Rick-953/Rchat)

---

<div align="center">

**⭐ Star this project if you find it useful!**

</div>