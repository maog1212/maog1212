# 📡 信号定位搜索系统

一个简单但功能完整的信号接收、定位和搜索系统，支持实时地图显示和基于地理位置的信号搜索。

## ✨ 功能特性

- 📤 **发送信号**: 创建新的信号记录，包含名称、类型、位置、强度等信息
- 🔍 **位置搜索**: 基于地理坐标搜索指定半径内的所有信号
- 🗺️ **地图显示**: 使用 Leaflet 地图实时显示信号位置
- 📊 **统计面板**: 实时显示总信号数、附近信号数等统计信息
- 📍 **GPS定位**: 支持使用浏览器获取当前位置
- 🎯 **距离计算**: 自动计算信号到搜索点的距离（使用 Haversine 公式）
- 🎨 **类型分类**: 支持多种信号类型（WiFi、蓝牙、GPS、无线电等）
- 🗑️ **信号管理**: 可删除单个信号或清空所有信号

## 🏗️ 技术栈

### 后端
- **Node.js** - 运行时环境
- **Express** - Web 框架
- **CORS** - 跨域资源共享

### 前端
- **HTML5** - 页面结构
- **CSS3** - 样式设计（渐变、动画、响应式布局）
- **JavaScript (ES6+)** - 交互逻辑
- **Leaflet** - 地图库

## 📦 安装

### 前置要求
- Node.js (v14 或更高版本)
- npm 或 yarn

### 安装步骤

1. 克隆仓库
```bash
git clone <repository-url>
cd maog1212
```

2. 安装依赖
```bash
npm install
```

## 🚀 运行

### 启动服务器
```bash
npm start
```

### 开发模式（带自动重启）
```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动

## 📖 API 文档

### 1. 创建新信号
**POST** `/api/signals`

请求体:
```json
{
  "name": "WiFi热点A",
  "type": "WiFi",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "strength": 85,
  "description": "这是一个测试信号"
}
```

响应:
```json
{
  "success": true,
  "message": "信号已接收",
  "signal": {
    "id": 1,
    "name": "WiFi热点A",
    "type": "WiFi",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "strength": 85,
    "description": "这是一个测试信号",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. 获取所有信号
**GET** `/api/signals`

响应:
```json
{
  "success": true,
  "count": 5,
  "signals": [...]
}
```

### 3. 搜索附近信号
**GET** `/api/signals/nearby?latitude=39.9042&longitude=116.4074&radius=10`

参数:
- `latitude` (必需): 搜索中心纬度
- `longitude` (必需): 搜索中心经度
- `radius` (可选): 搜索半径（公里），默认 10km

响应:
```json
{
  "success": true,
  "searchLocation": {
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "radius": 10,
  "count": 3,
  "signals": [
    {
      "id": 1,
      "name": "WiFi热点A",
      "distance": 2.45,
      ...
    }
  ]
}
```

### 4. 获取特定信号
**GET** `/api/signals/:id`

### 5. 删除信号
**DELETE** `/api/signals/:id`

### 6. 按类型过滤信号
**GET** `/api/signals/type/:type`

### 7. 清空所有信号
**DELETE** `/api/signals`

## 🎮 使用说明

### 发送信号
1. 在左侧"发送新信号"表单中填写信号信息
2. 可以手动输入坐标，或点击"使用当前位置"按钮
3. 也可以直接点击地图选择位置
4. 点击"发送信号"按钮提交

### 搜索信号
1. 在右侧"搜索附近信号"表单中输入搜索位置和半径
2. 点击"搜索附近信号"开始搜索
3. 地图会显示搜索范围（红色圆圈）和找到的信号
4. 点击"显示所有信号"查看所有信号

### 地图操作
- 点击地图标记查看信号详情
- 缩放和拖动地图浏览不同区域
- 不同颜色的标记代表不同类型的信号：
  - 🔵 蓝色 - WiFi
  - 🟢 绿色 - 蓝牙
  - 🟡 黄色 - GPS
  - 🔴 红色 - 无线电
  - ⚫ 灰色 - 其他

## 📂 项目结构

```
maog1212/
├── server.js           # Express 服务器
├── package.json        # 项目配置和依赖
├── README.md          # 项目文档
└── public/            # 静态文件目录
    ├── index.html     # 前端页面
    └── app.js         # 前端逻辑
```

## 🔧 配置

### 修改端口
在 `server.js` 中修改:
```javascript
const PORT = process.env.PORT || 3000;
```

或使用环境变量:
```bash
PORT=8080 npm start
```

### 修改默认地图位置
在 `public/app.js` 的 `initMap()` 函数中修改:
```javascript
map = L.map('map').setView([纬度, 经度], 缩放级别);
```

## 🚧 未来改进

- [ ] 添加数据库支持（MongoDB/PostgreSQL）
- [ ] 添加用户认证系统
- [ ] 实现信号实时更新（WebSocket）
- [ ] 添加信号强度热力图
- [ ] 支持信号历史记录和趋势分析
- [ ] 添加信号类型自定义
- [ ] 导出数据为 CSV/JSON
- [ ] 移动端优化
- [ ] 多语言支持

## 📝 注意事项

- 当前版本使用内存存储，重启服务器后数据会丢失
- 生产环境建议使用数据库存储数据
- 使用浏览器地理定位需要 HTTPS 或 localhost
- OpenStreetMap 地图需要网络连接

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
