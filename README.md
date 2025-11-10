<div align="center">

# Rchat

**A lightweight, real-time chat system**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-blue)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Demo](https://img.shields.io/badge/Demo-rick.quest-orange)](https://rick.quest)

[中文](#chinese) | [English](#english)

</div>

---

<h2 id="chinese">🇨🇳 简体中文</h2>

### 为什么选择 Rchat?

现在聊天软件臃肿，且网络风气差，戾气重。**Rchat 预计在下下个版本加入正引导机制**。

> **在线体验**: 访问 [rick.quest](https://rick.quest) 后点击 Rchat 即可体验官方版本

### 核心特性

- **极速** - 基于 WebSocket,消息延迟 ≈你ping你服务器的延时
- **简约** - 纯原生前端,无框架依赖,资源占用低
- **安全** - bcrypt 密码加密 + 浏览器记忆登录
- **轻量** - 好友系统、群聊、私聊、在线状态、打字提示
- **大文件传输** - 文件上传默认最大上限10g，可自行调整更高上限
- **易用性** - 首次注册登录后浏览器自动记忆,后续秒进

### 技术栈

```
后端:  Node.js + Express + Socket.IO
数据库: SQLite3 (轻量级) / MariaDB (生产环境)
前端:  原生 HTML/CSS/JavaScript (无框架)
加密:  bcrypt
文件:  Multer (支持 10GB+)
```

### 快速开始

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

### 未来愿景

Rchat 不仅是一个聊天工具,更是一份愿景，**构建良币驱逐劣币互联网社区**的尝试:

#### LLM 智能调节
- **察言观色**: LLM 自动识别对话氛围,在合适时机参与
- **话题引导**: 当讨论偏向负面时,LLM 温和地引导至建设性方向
- **情绪缓冲**: 识别潜在冲突,提供理性视角

#### 社区自治系统
- **用户评分机制**: 建设性发言获赞,攻击性言论被踩
- **动态资源分配**: 根据用户评分
- **自驱淘汰**: 让恶意用户的体验卡顿，延时高，而自然离开,而非强制封禁

#### 功能路线图
- [ ] 群主/管理员权限系统
- [ ] 用户自定义主题与布局
- [ ] 命令行客户端版本
- [ ] AI 驱动的内容审核
- [ ] 去中心化架构探索

> ⚠️ AI功能预计会带来较高开发和API成本，下个RAI项目将围绕“多维自适应省成本算法”优化LLM的效率和成本。敬请期待！

### 参与贡献

Rchat 目前只有Rick一人,**急需你的力量**:

- **发现 Bug?** [提交 Issue](https://github.com/Rick-953/Rchat/issues)
- **擅长开发?** 查看 [贡献指南](CONTRIBUTING.md)
- **设计师?** 帮助优化 UI/UX
- **多语言?** 协助翻译文档

### 许可证

MIT License - 自由使用、修改、分发、盈利需邮箱联系。

### 联系方式

- **作者**: Rick和LLM
- **邮箱**: rick080402@gmail.com
- **项目主页**: [github.com/Rick-953/Rchat](https://github.com/Rick-953/Rchat)

---

<h2 id="english">🇺🇸 English</h2>

### Why Rchat?

Modern chat applications are bloated, the overall online atmosphere is negative, with frequent toxic interactions. **Rchat is planning to launch positive guidance mechanisms in upcoming versions**.

> **Live Demo**: Visit [rick.quest](https://rick.quest) and select Rchat for an official demo experience

### Key Features

- **Ultra-fast** – WebSocket-based, message delay ≈ your ping to your server
- **Minimalist** – Pure native frontend, no framework dependency, low resource cost
- **Secure** – bcrypt password encryption + browser auto-login memory
- **Lightweight** – Friends, group chat, private messaging, online status, typing indicator
- **Large File Transfer** – Default max upload is 10GB, can be configured higher
- **Ease of Use** – Browser remembers login after first access, instant entry next time

### Tech Stack

```
Backend: Node.js + Express + Socket.IO
Database: SQLite3 (lightweight) / MariaDB (production)
Frontend: Native HTML/CSS/JavaScript (no frameworks)
Encryption: bcrypt
File Handling: Multer (10GB+ support)
```

### Quick Start

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

### Future Vision

Rchat is not just a chat tool, but an **experiment to build an internet community where good drives out bad**:

#### LLM-Powered Regulation
- **Context Awareness**: LLM detects dialogue atmosphere and intervenes appropriately
- **Topic Steering**: When discussions turn negative, LLM gently guides towards constructive directions
- **Emotional Buffering**: Identifies potential conflicts and provides rational perspectives

#### Community Self-Governance
- **User Scoring System**: Constructive messages get upvoted, offensive ones get downvoted
- **Dynamic Resource Allocation**: High-score users get faster, lower-latency service; normal users get standard resources; low-score users get limited resources
- **Self-Elimination**: Malicious users will experience lag and high latency, leading them to leave on their own, not by forced ban

#### Feature Roadmap
- [ ] Group owner/admin permissions
- [ ] User-customizable themes and layouts
- [ ] Command-line client version
- [ ] AI-driven content moderation
- [ ] Decentralized architecture exploration

> ⚠️ The AI features are expected to require substantial development and API costs. The upcoming RAI project will focus on multi-dimensional adaptive cost-reduction algorithms, optimizing AI efficiency and resource usage. Stay tuned! The Chinese version shall prevail.

### Contributing

Currently Rchat is maintained by Rick alone and **urgently needs your help**:

- **Found a Bug?** [Open an Issue](https://github.com/Rick-953/Rchat/issues)
- **Developer?** See the [Contributing Guide](CONTRIBUTING.md)
- **Designer?** Help improve UI/UX
- **Multilingual?** Assist with documentation translation

### License

MIT License – Free to use, modify, and distribute. For commercial use please contact via email.

### Contact

- **Author**: Rick & LLM
- **Email**: rick080402@gmail.com
- **Project Homepage**: [github.com/Rick-953/Rchat](https://github.com/Rick-953/Rchat)

---

<div align="center">

**⭐ Star this project if you find it useful!**

</div>
