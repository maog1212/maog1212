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

// 游戏数据存储
let players = {};
let cases = [];
let caseIdCounter = 1;
let missions = [];
let missionIdCounter = 1;
let achievements = [
  { id: 1, name: '新手警探', description: '完成第一个案件', icon: '🎖️', points: 100 },
  { id: 2, name: '信号追踪者', description: '追踪10个信号', icon: '📡', points: 200 },
  { id: 3, name: '精英警探', description: '完成10个案件', icon: '⭐', points: 500 },
  { id: 4, name: '神探', description: '完成50个案件', icon: '👮', points: 1000 },
  { id: 5, name: '信号大师', description: '追踪50个信号', icon: '🎯', points: 1000 }
];

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

// 游戏辅助函数
function createPlayer(playerId) {
  if (!players[playerId]) {
    players[playerId] = {
      id: playerId,
      name: `警探${playerId.substring(0, 6)}`,
      rank: '见习警探',
      level: 1,
      experience: 0,
      points: 0,
      casesCompleted: 0,
      signalsTracked: 0,
      unlockedAchievements: [],
      joinDate: new Date().toISOString()
    };
  }
  return players[playerId];
}

function checkAchievements(player) {
  const newAchievements = [];

  achievements.forEach(achievement => {
    if (!player.unlockedAchievements.includes(achievement.id)) {
      let unlock = false;

      if (achievement.id === 1 && player.casesCompleted >= 1) unlock = true;
      if (achievement.id === 2 && player.signalsTracked >= 10) unlock = true;
      if (achievement.id === 3 && player.casesCompleted >= 10) unlock = true;
      if (achievement.id === 4 && player.casesCompleted >= 50) unlock = true;
      if (achievement.id === 5 && player.signalsTracked >= 50) unlock = true;

      if (unlock) {
        player.unlockedAchievements.push(achievement.id);
        player.points += achievement.points;
        newAchievements.push(achievement);
      }
    }
  });

  return newAchievements;
}

function updatePlayerLevel(player) {
  const oldLevel = player.level;
  player.level = Math.floor(player.experience / 100) + 1;

  // 更新警衔
  if (player.level >= 20) player.rank = '总警监';
  else if (player.level >= 15) player.rank = '高级警督';
  else if (player.level >= 10) player.rank = '警督';
  else if (player.level >= 7) player.rank = '警司';
  else if (player.level >= 5) player.rank = '警长';
  else if (player.level >= 3) player.rank = '警探';
  else player.rank = '见习警探';

  return player.level > oldLevel;
}

function generateRandomCase(latitude, longitude) {
  const caseTypes = [
    { type: '失踪人口', severity: '高', reward: 150, icon: '🔍' },
    { type: '盗窃案', severity: '中', reward: 100, icon: '💼' },
    { type: '欺诈案', severity: '中', reward: 120, icon: '📱' },
    { type: '抢劫案', severity: '高', reward: 180, icon: '⚠️' },
    { type: '可疑活动', severity: '低', reward: 80, icon: '👁️' }
  ];

  const caseType = caseTypes[Math.floor(Math.random() * caseTypes.length)];
  const distance = (Math.random() * 2 - 1) * 0.05; // ±5公里随机偏移

  return {
    id: caseIdCounter++,
    ...caseType,
    latitude: latitude + distance,
    longitude: longitude + distance,
    status: 'open',
    createdAt: new Date().toISOString(),
    assignedTo: null,
    completedBy: null
  };
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

// ========== 游戏 API ==========

// 玩家相关
app.post('/api/player/init', (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ error: '缺少玩家ID' });
    }

    const player = createPlayer(playerId);
    res.json({ success: true, player });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

app.get('/api/player/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const player = players[playerId];

    if (!player) {
      return res.status(404).json({ error: '玩家未找到' });
    }

    res.json({ success: true, player });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

app.put('/api/player/:playerId/name', (req, res) => {
  try {
    const { playerId } = req.params;
    const { name } = req.body;

    if (!players[playerId]) {
      return res.status(404).json({ error: '玩家未找到' });
    }

    players[playerId].name = name;
    res.json({ success: true, player: players[playerId] });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 案件相关
app.get('/api/cases', (req, res) => {
  try {
    const { status, latitude, longitude, radius } = req.query;

    let filteredCases = cases;

    if (status) {
      filteredCases = filteredCases.filter(c => c.status === status);
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const searchRadius = radius ? parseFloat(radius) : 10;

      filteredCases = filteredCases
        .map(c => ({
          ...c,
          distance: calculateDistance(lat, lon, c.latitude, c.longitude)
        }))
        .filter(c => c.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance);
    }

    res.json({ success: true, count: filteredCases.length, cases: filteredCases });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

app.post('/api/cases/generate', (req, res) => {
  try {
    const { latitude, longitude, count } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: '缺少位置信息' });
    }

    const numCases = count || 5;
    const newCases = [];

    for (let i = 0; i < numCases; i++) {
      const newCase = generateRandomCase(latitude, longitude);
      cases.push(newCase);
      newCases.push(newCase);
    }

    res.json({ success: true, count: newCases.length, cases: newCases });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

app.post('/api/cases/:caseId/assign', (req, res) => {
  try {
    const { caseId } = req.params;
    const { playerId } = req.body;

    const caseItem = cases.find(c => c.id === parseInt(caseId));

    if (!caseItem) {
      return res.status(404).json({ error: '案件未找到' });
    }

    if (caseItem.status !== 'open') {
      return res.status(400).json({ error: '案件已被分配或完成' });
    }

    const player = createPlayer(playerId);
    caseItem.status = 'assigned';
    caseItem.assignedTo = playerId;

    res.json({ success: true, case: caseItem, player });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

app.post('/api/cases/:caseId/complete', (req, res) => {
  try {
    const { caseId } = req.params;
    const { playerId } = req.body;

    const caseItem = cases.find(c => c.id === parseInt(caseId));

    if (!caseItem) {
      return res.status(404).json({ error: '案件未找到' });
    }

    if (caseItem.status === 'completed') {
      return res.status(400).json({ error: '案件已完成' });
    }

    const player = createPlayer(playerId);

    caseItem.status = 'completed';
    caseItem.completedBy = playerId;
    caseItem.completedAt = new Date().toISOString();

    // 更新玩家数据
    player.casesCompleted++;
    player.experience += caseItem.reward;
    player.points += caseItem.reward;

    const leveledUp = updatePlayerLevel(player);
    const newAchievements = checkAchievements(player);

    res.json({
      success: true,
      case: caseItem,
      player,
      leveledUp,
      newAchievements
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 成就相关
app.get('/api/achievements', (req, res) => {
  try {
    res.json({ success: true, achievements });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

app.get('/api/player/:playerId/achievements', (req, res) => {
  try {
    const { playerId } = req.params;
    const player = players[playerId];

    if (!player) {
      return res.status(404).json({ error: '玩家未找到' });
    }

    const unlockedAchievements = achievements.filter(a =>
      player.unlockedAchievements.includes(a.id)
    );

    res.json({
      success: true,
      unlockedCount: unlockedAchievements.length,
      totalCount: achievements.length,
      achievements: unlockedAchievements
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 排行榜
app.get('/api/leaderboard', (req, res) => {
  try {
    const { type } = req.query; // points, level, cases

    let sortedPlayers = Object.values(players);

    if (type === 'level') {
      sortedPlayers.sort((a, b) => b.level - a.level || b.experience - a.experience);
    } else if (type === 'cases') {
      sortedPlayers.sort((a, b) => b.casesCompleted - a.casesCompleted);
    } else {
      sortedPlayers.sort((a, b) => b.points - a.points);
    }

    res.json({
      success: true,
      leaderboard: sortedPlayers.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误：' + error.message });
  }
});

// 提供前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
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
