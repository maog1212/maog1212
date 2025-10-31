# 👮 警探追踪 - 警察模拟器游戏

一个融合信号追踪系统的沉浸式警察模拟器游戏，专为移动端（特别是iPhone）优化。在这个游戏中，你将扮演一名警探，通过追踪信号、侦破案件来提升等级和解锁成就。

## ✨ 核心功能

### 🎮 游戏系统
- **👮 警探角色**: 可自定义的警探角色，包含等级、警衔、经验值和积分系统
- **📋 案件系统**: 多种案件类型（失踪人口、盗窃、欺诈、抢劫、可疑活动）
- **🏆 成就系统**: 5+ 个可解锁成就，完成特定任务获得奖励
- **📊 等级系统**: 从"见习警探"到"总警监"的完整晋升体系
- **🎯 任务奖励**: 完成案件获得经验值和积分奖励

### 📡 信号追踪系统
- **发送信号**: 在地图上创建各类信号（WiFi、蓝牙、GPS、无线电等）
- **追踪信号**: 实时追踪和定位信号源
- **信号管理**: 查看、搜索和管理所有信号
- **距离计算**: 自动计算到信号的距离（Haversine公式）

### 🗺️ 地图功能
- **实时地图**: 使用Leaflet显示交互式地图
- **GPS定位**: 自动获取当前位置
- **案件标记**: 不同颜色标记不同严重程度的案件
- **信号标记**: 在地图上显示所有信号位置
- **点击交互**: 点击地图生成案件或发送信号

### 📱 移动端优化
- **响应式设计**: 完美适配iPhone及各种屏幕尺寸
- **触摸优化**: 针对触摸操作优化的UI组件
- **手势支持**: 支持滑动、缩放等手势操作
- **iOS适配**: 完整支持iOS安全区域和状态栏
- **PWA支持**: 可添加到主屏幕，离线使用

## 🏗️ 技术栈

### 后端
- **Node.js** - 运行时环境
- **Express** - RESTful API框架
- **内存存储** - 快速数据访问（可扩展为数据库）

### 前端
- **HTML5** - 语义化结构
- **CSS3** - 现代化样式（渐变、动画、Flexbox/Grid）
- **JavaScript (ES6+)** - 异步编程、模块化
- **Leaflet** - 地图可视化
- **Service Worker** - PWA离线支持

### 移动端
- **Viewport设置** - 禁止缩放，优化移动体验
- **iOS元标签** - 全屏模式、状态栏样式
- **触摸事件** - 优化的触摸反馈
- **安全区域** - 适配iPhone刘海和底部手势条

## 📦 安装

### 前置要求
- Node.js v14+
- npm 或 yarn

### 安装步骤

```bash
# 1. 克隆仓库
git clone <repository-url>
cd maog1212

# 2. 安装依赖
npm install

# 3. 启动服务器
npm start
```

服务器将在 `http://localhost:3000` 启动

## 🚀 使用指南

### 访问游戏
- **桌面端**: `http://localhost:3000/game`
- **移动端**: 在手机浏览器访问相同地址

### 添加到iPhone主屏幕
1. 在Safari中打开游戏
2. 点击分享按钮（⬆️）
3. 选择"添加到主屏幕"
4. 点击"添加"

### 游戏玩法

#### 开始游戏
1. 首次打开自动创建警探角色
2. 允许位置权限以获得最佳体验
3. 查看当前位置附近的案件

#### 处理案件
1. 在"案件"标签页查看可用案件
2. 点击"接手案件"开始调查
3. 到达案件位置后点击"完成案件"
4. 获得经验值、积分和成就奖励

#### 追踪信号
1. 切换到"信号"标签页
2. 查看地图上的信号标记
3. 点击"追踪信号"定位信号源
4. 追踪信号增加经验值

#### 生成案件
1. 点击地图任意位置
2. 选择"生成案件"
3. 系统自动生成3个随机案件

#### 发送信号
1. 点击地图选择位置
2. 选择"发送信号"
3. 填写信号信息并提交

## 📖 API 文档

### 信号 API

#### 创建信号
```http
POST /api/signals
Content-Type: application/json

{
  "name": "WiFi热点A",
  "type": "WiFi",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "strength": 85
}
```

#### 获取所有信号
```http
GET /api/signals
```

#### 搜索附近信号
```http
GET /api/signals/nearby?latitude=39.9042&longitude=116.4074&radius=10
```

### 游戏 API

#### 初始化玩家
```http
POST /api/player/init
Content-Type: application/json

{
  "playerId": "player_xxx"
}
```

#### 获取玩家信息
```http
GET /api/player/:playerId
```

#### 获取案件列表
```http
GET /api/cases?status=open&latitude=39.9042&longitude=116.4074&radius=50
```

#### 生成案件
```http
POST /api/cases/generate
Content-Type: application/json

{
  "latitude": 39.9042,
  "longitude": 116.4074,
  "count": 5
}
```

#### 接手案件
```http
POST /api/cases/:caseId/assign
Content-Type: application/json

{
  "playerId": "player_xxx"
}
```

#### 完成案件
```http
POST /api/cases/:caseId/complete
Content-Type: application/json

{
  "playerId": "player_xxx"
}
```

#### 获取成就
```http
GET /api/achievements
GET /api/player/:playerId/achievements
```

#### 排行榜
```http
GET /api/leaderboard?type=points
```

## 📂 项目结构

```
maog1212/
├── server.js                 # Express服务器 + 游戏API
├── package.json             # 项目配置
├── README.md               # 项目文档
└── public/                 # 静态资源
    ├── index.html          # 信号系统界面
    ├── app.js              # 信号系统逻辑
    ├── game.html           # 游戏界面（移动端优化）
    ├── game.js             # 游戏逻辑
    ├── manifest.json       # PWA清单
    └── service-worker.js   # Service Worker
```

## 🎨 游戏特色

### 警衔系统
- 见习警探 (Lv.1-2)
- 警探 (Lv.3-4)
- 警长 (Lv.5-6)
- 警司 (Lv.7-9)
- 警督 (Lv.10-14)
- 高级警督 (Lv.15-19)
- 总警监 (Lv.20+)

### 案件类型
- 🔍 **失踪人口** - 高优先级，180积分
- ⚠️ **抢劫案** - 高优先级，180积分
- 📱 **欺诈案** - 中等优先级，120积分
- 💼 **盗窃案** - 中等优先级，100积分
- 👁️ **可疑活动** - 低优先级，80积分

### 成就系统
- 🎖️ **新手警探** - 完成第一个案件 (100分)
- 📡 **信号追踪者** - 追踪10个信号 (200分)
- ⭐ **精英警探** - 完成10个案件 (500分)
- 👮 **神探** - 完成50个案件 (1000分)
- 🎯 **信号大师** - 追踪50个信号 (1000分)

## 🔧 配置

### 修改服务器端口
```javascript
// server.js
const PORT = process.env.PORT || 3000;
```

### 修改默认地图中心
```javascript
// public/game.js
gameState.map = L.map('gameMap').setView([纬度, 经度], 缩放级别);
```

## 📱 移动端特性

### iOS优化
- ✅ 支持安全区域（刘海屏）
- ✅ 全屏模式（隐藏Safari工具栏）
- ✅ 状态栏样式自定义
- ✅ 禁止下拉刷新干扰
- ✅ 优化触摸反馈
- ✅ 适配横竖屏

### PWA功能
- ✅ 离线使用
- ✅ 添加到主屏幕
- ✅ 应用图标和启动画面
- ✅ 后台同步（可扩展）
- ✅ 推送通知（可扩展）

## 🚧 未来规划

- [ ] 数据库持久化（MongoDB/PostgreSQL）
- [ ] 用户账户系统
- [ ] 多人在线功能
- [ ] 实时对战模式
- [ ] 更多案件类型
- [ ] 装备系统
- [ ] 技能树
- [ ] 每日任务
- [ ] 排行榜竞争
- [ ] 社交功能

## 📝 注意事项

### 开发环境
- 当前使用内存存储，重启后数据丢失
- 建议在生产环境使用数据库

### 浏览器支持
- 推荐：Safari (iOS)、Chrome (Android)
- GPS定位需要HTTPS或localhost
- Service Worker需要HTTPS

### 性能优化
- 地图标记过多时可能影响性能
- 建议限制同时显示的案件数量
- 定期清理过期数据

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

---

**祝你玩得开心，成为顶尖警探！** 👮‍♂️🎮
