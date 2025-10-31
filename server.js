const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 信号数据存储（内存存储，实际应用中应使用数据库）
let signals = [];
let signalIdCounter = 1;

// 计算两点之间的距离（使用Haversine公式，单位：公里）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// API路由

// 1. 发送信号（创建新信号）
app.post('/api/signals', (req, res) => {
  try {
    const { name, type, latitude, longitude, strength, description } = req.body;

    // 验证必需字段
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: '缺少必需字段：name, latitude, longitude'
      });
    }

    const signal = {
      id: signalIdCounter++,
      name,
      type: type || 'unknown',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      strength: strength || 100,
      description: description || '',
      timestamp: new Date().toISOString()
    };

    signals.push(signal);

    res.status(201).json({
      success: true,
      message: '信号已接收',
      signal
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 2. 获取所有信号
app.get('/api/signals', (req, res) => {
  try {
    res.json({
      success: true,
      count: signals.length,
      signals
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 3. 根据位置搜索附近的信号
app.get('/api/signals/nearby', (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: '缺少必需参数：latitude, longitude'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const searchRadius = radius ? parseFloat(radius) : 10; // 默认10公里

    // 查找范围内的信号
    const nearbySignals = signals
      .map(signal => ({
        ...signal,
        distance: calculateDistance(lat, lon, signal.latitude, signal.longitude)
      }))
      .filter(signal => signal.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance); // 按距离排序

    res.json({
      success: true,
      searchLocation: { latitude: lat, longitude: lon },
      radius: searchRadius,
      count: nearbySignals.length,
      signals: nearbySignals
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 4. 根据ID获取特定信号
app.get('/api/signals/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const signal = signals.find(s => s.id === id);

    if (!signal) {
      return res.status(404).json({ error: '信号未找到' });
    }

    res.json({
      success: true,
      signal
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 5. 删除信号
app.delete('/api/signals/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = signals.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: '信号未找到' });
    }

    const deletedSignal = signals.splice(index, 1)[0];

    res.json({
      success: true,
      message: '信号已删除',
      signal: deletedSignal
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 6. 根据类型过滤信号
app.get('/api/signals/type/:type', (req, res) => {
  try {
    const type = req.params.type;
    const filteredSignals = signals.filter(s => s.type === type);

    res.json({
      success: true,
      type,
      count: filteredSignals.length,
      signals: filteredSignals
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 7. 清空所有信号
app.delete('/api/signals', (req, res) => {
  try {
    const count = signals.length;
    signals = [];
    signalIdCounter = 1;

    res.json({
      success: true,
      message: `已清空 ${count} 个信号`
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 提供前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 信号定位系统已启动`);
  console.log(`📡 服务器运行在: http://localhost:${PORT}`);
  console.log(`📍 API端点:`);
  console.log(`   POST   /api/signals          - 发送新信号`);
  console.log(`   GET    /api/signals          - 获取所有信号`);
  console.log(`   GET    /api/signals/nearby   - 搜索附近的信号`);
  console.log(`   GET    /api/signals/:id      - 获取特定信号`);
  console.log(`   DELETE /api/signals/:id      - 删除特定信号`);
  console.log(`   GET    /api/signals/type/:type - 按类型过滤信号`);
  console.log(`   DELETE /api/signals          - 清空所有信号`);
});
