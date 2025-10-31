// API基础URL
const API_URL = window.location.origin + '/api';

// 游戏状态
let gameState = {
    playerId: null,
    player: null,
    currentLocation: null,
    map: null,
    markers: [],
    cases: [],
    signals: [],
    achievements: []
};

// 初始化玩家ID
function initPlayerId() {
    let playerId = localStorage.getItem('playerId');
    if (!playerId) {
        playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('playerId', playerId);
    }
    return playerId;
}

// 初始化游戏
async function initGame() {
    gameState.playerId = initPlayerId();

    // 初始化地图
    initMap();

    // 获取当前位置
    await getCurrentLocation();

    // 初始化玩家
    await initPlayer();

    // 加载数据
    await loadGameData();

    // 设置事件监听器
    setupEventListeners();

    showNotification('欢迎回来，警探！', 'success');
}

// 初始化地图
function initMap() {
    gameState.map = L.map('gameMap', {
        zoomControl: true,
        attributionControl: false,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
    }).setView([39.9042, 116.4074], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        minZoom: 3,
        updateWhenIdle: true,
        keepBuffer: 2
    }).addTo(gameState.map);

    // 地图点击事件
    gameState.map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        showModal('选择操作', `
            <p style="color: var(--text-gray); margin-bottom: 15px;">位置: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        `, [
            { text: '生成案件', class: 'btn-primary', action: () => generateCasesAtLocation(lat, lng) },
            { text: '发送信号', class: 'btn-success', action: () => showSignalForm(lat, lng) },
            { text: '取消', class: 'btn-warning', action: () => closeModal() }
        ]);
    });

    // 修复地图大小（延迟更短）
    setTimeout(() => {
        gameState.map.invalidateSize();
    }, 300);

    // 监听窗口调整
    window.addEventListener('resize', () => {
        setTimeout(() => {
            gameState.map.invalidateSize();
        }, 100);
    });
}

// 获取当前位置
function getCurrentLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    gameState.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    gameState.map.setView([position.coords.latitude, position.coords.longitude], 15);

                    // 添加当前位置标记
                    L.marker([position.coords.latitude, position.coords.longitude], {
                        icon: L.icon({
                            iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" stroke="white" stroke-width="5"/></svg>'),
                            iconSize: [20, 20]
                        })
                    }).addTo(gameState.map).bindPopup('你的位置').openPopup();

                    resolve();
                },
                () => {
                    // 如果获取失败，使用默认位置
                    gameState.currentLocation = { latitude: 39.9042, longitude: 116.4074 };
                    resolve();
                }
            );
        } else {
            gameState.currentLocation = { latitude: 39.9042, longitude: 116.4074 };
            resolve();
        }
    });
}

// 初始化玩家
async function initPlayer() {
    try {
        const response = await fetch(`${API_URL}/player/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: gameState.playerId })
        });

        const data = await response.json();
        if (data.success) {
            gameState.player = data.player;
            updatePlayerUI();
        }
    } catch (error) {
        console.error('初始化玩家失败:', error);
    }
}

// 更新玩家UI
function updatePlayerUI() {
    const player = gameState.player;
    if (!player) return;

    document.getElementById('playerName').textContent = player.name;
    document.getElementById('playerLevel').textContent = `Lv.${player.level}`;
    document.getElementById('playerPoints').textContent = `${player.points} pts`;
    document.getElementById('playerRank').textContent = player.rank;
    document.getElementById('statLevel').textContent = player.level;
    document.getElementById('statCases').textContent = player.casesCompleted;
    document.getElementById('statSignals').textContent = player.signalsTracked;

    // 更新经验条
    const currentLevelExp = (player.level - 1) * 100;
    const nextLevelExp = player.level * 100;
    const currentExp = player.experience - currentLevelExp;
    const expPercentage = (currentExp / 100) * 100;

    document.getElementById('currentExp').textContent = currentExp;
    document.getElementById('nextLevelExp').textContent = 100;
    document.getElementById('expFill').style.width = `${expPercentage}%`;
}

// 加载游戏数据
async function loadGameData() {
    await Promise.all([
        loadCases(),
        loadSignals(),
        loadAchievements()
    ]);
}

// 加载案件
async function loadCases() {
    try {
        let url = `${API_URL}/cases?status=open`;

        if (gameState.currentLocation) {
            url += `&latitude=${gameState.currentLocation.latitude}&longitude=${gameState.currentLocation.longitude}&radius=50`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            gameState.cases = data.cases;
            renderCases();
            updateMapMarkers();
        }
    } catch (error) {
        console.error('加载案件失败:', error);
    }
}

// 加载信号
async function loadSignals() {
    try {
        let url = `${API_URL}/signals`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            gameState.signals = data.signals;
            renderSignals();
        }
    } catch (error) {
        console.error('加载信号失败:', error);
    }
}

// 加载成就
async function loadAchievements() {
    try {
        const response = await fetch(`${API_URL}/player/${gameState.playerId}/achievements`);
        const data = await response.json();

        if (data.success) {
            gameState.achievements = data.achievements;
            renderAchievements();
        }
    } catch (error) {
        console.error('加载成就失败:', error);
    }
}

// 渲染案件列表
function renderCases() {
    const casesList = document.getElementById('casesList');

    if (gameState.cases.length === 0) {
        casesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>暂无案件</p>
                <p style="margin-top: 10px; font-size: 14px;">点击地图生成新案件</p>
            </div>
        `;
        return;
    }

    casesList.innerHTML = gameState.cases.map(c => `
        <div class="case-card">
            <div class="case-header">
                <div class="case-title">
                    <span>${c.icon}</span>
                    <span>${c.type}</span>
                </div>
                <span class="case-severity severity-${c.severity === '高' ? 'high' : c.severity === '中' ? 'medium' : 'low'}">
                    ${c.severity}
                </span>
            </div>
            <div class="case-info">
                📍 距离: ${c.distance ? c.distance.toFixed(2) + ' km' : '未知'}
            </div>
            <div class="case-info">
                💰 奖励: ${c.reward} EXP / ${c.reward} 积分
            </div>
            <div class="case-actions">
                <button class="btn btn-primary" onclick="assignCase(${c.id})">
                    接手案件
                </button>
                <button class="btn btn-success" onclick="completeCase(${c.id})">
                    完成案件
                </button>
            </div>
        </div>
    `).join('');
}

// 渲染信号列表
function renderSignals() {
    const signalsList = document.getElementById('signalsList');

    if (gameState.signals.length === 0) {
        signalsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📡</div>
                <p>暂无信号</p>
                <p style="margin-top: 10px; font-size: 14px;">点击地图发送新信号</p>
            </div>
        `;
        return;
    }

    signalsList.innerHTML = gameState.signals.map(s => `
        <div class="signal-item">
            <div class="signal-header">
                <div class="signal-name">${s.name}</div>
                <div class="signal-type">${s.type}</div>
            </div>
            <div class="case-info">
                📍 位置: ${s.latitude.toFixed(6)}, ${s.longitude.toFixed(6)}
            </div>
            <div class="case-info">
                💪 强度: ${s.strength}%
            </div>
            ${s.description ? `<div class="case-info">📝 ${s.description}</div>` : ''}
            <div class="case-actions">
                <button class="btn btn-primary" onclick="trackSignal(${s.id})">
                    追踪信号
                </button>
            </div>
        </div>
    `).join('');
}

// 渲染成就列表
function renderAchievements() {
    const achievementsList = document.getElementById('achievementsList');

    if (gameState.achievements.length === 0) {
        achievementsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏆</div>
                <p>尚未解锁成就</p>
                <p style="margin-top: 10px; font-size: 14px;">完成案件和追踪信号来解锁成就</p>
            </div>
        `;
        return;
    }

    achievementsList.innerHTML = gameState.achievements.map(a => `
        <div class="achievement-card">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${a.name}</div>
                <div class="achievement-desc">${a.description}</div>
            </div>
            <div class="achievement-points">+${a.points}</div>
        </div>
    `).join('');
}

// 更新地图标记（优化性能）
function updateMapMarkers() {
    // 清除旧标记
    gameState.markers.forEach(marker => gameState.map.removeLayer(marker));
    gameState.markers = [];

    // 批量添加标记，减少重绘
    const markersToAdd = [];

    // 添加案件标记
    gameState.cases.forEach(c => {
        const marker = L.circleMarker([c.latitude, c.longitude], {
            radius: 10,
            fillColor: c.severity === '高' ? '#f44336' : c.severity === '中' ? '#ff9800' : '#4caf50',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });

        marker.bindPopup(`
            <div style="min-width: 150px; color: #333;">
                <h4 style="margin: 0 0 10px 0;">${c.icon} ${c.type}</h4>
                <p style="margin: 5px 0;"><strong>严重程度:</strong> ${c.severity}</p>
                <p style="margin: 5px 0;"><strong>奖励:</strong> ${c.reward} EXP</p>
                ${c.distance ? `<p style="margin: 5px 0;"><strong>距离:</strong> ${c.distance.toFixed(2)} km</p>` : ''}
            </div>
        `);

        markersToAdd.push(marker);
    });

    // 添加信号标记
    gameState.signals.forEach(s => {
        const marker = L.circleMarker([s.latitude, s.longitude], {
            radius: 8,
            fillColor: '#2196f3',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.6
        });

        marker.bindPopup(`
            <div style="min-width: 150px; color: #333;">
                <h4 style="margin: 0 0 10px 0;">📡 ${s.name}</h4>
                <p style="margin: 5px 0;"><strong>类型:</strong> ${s.type}</p>
                <p style="margin: 5px 0;"><strong>强度:</strong> ${s.strength}%</p>
            </div>
        `);

        markersToAdd.push(marker);
    });

    // 批量添加到地图
    markersToAdd.forEach(marker => {
        marker.addTo(gameState.map);
        gameState.markers.push(marker);
    });
}

// 接手案件
async function assignCase(caseId) {
    try {
        const response = await fetch(`${API_URL}/cases/${caseId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: gameState.playerId })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('案件已接手！', 'success');
            await loadCases();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('接手案件失败', 'error');
    }
}

// 完成案件
async function completeCase(caseId) {
    try {
        const response = await fetch(`${API_URL}/cases/${caseId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: gameState.playerId })
        });

        const data = await response.json();

        if (data.success) {
            gameState.player = data.player;
            updatePlayerUI();

            let message = '案件完成！';
            if (data.leveledUp) {
                message += ` 🎉 升级到 ${data.player.level} 级！`;
            }
            if (data.newAchievements && data.newAchievements.length > 0) {
                message += ` 🏆 解锁成就：${data.newAchievements.map(a => a.name).join(', ')}`;
            }

            showNotification(message, 'success');
            await loadCases();
            await loadAchievements();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('完成案件失败', 'error');
    }
}

// 追踪信号
async function trackSignal(signalId) {
    const signal = gameState.signals.find(s => s.id === signalId);
    if (!signal) return;

    // 更新玩家追踪计数
    gameState.player.signalsTracked++;
    updatePlayerUI();

    // 聚焦到信号位置
    gameState.map.setView([signal.latitude, signal.longitude], 16);

    showNotification(`正在追踪信号: ${signal.name}`, 'success');
}

// 在指定位置生成案件
async function generateCasesAtLocation(lat, lng) {
    try {
        const response = await fetch(`${API_URL}/cases/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                count: 3
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`生成了 ${data.count} 个新案件`, 'success');
            await loadCases();
            closeModal();
        }
    } catch (error) {
        showNotification('生成案件失败', 'error');
    }
}

// 显示信号表单
function showSignalForm(lat, lng) {
    const formHtml = `
        <div style="text-align: left;">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">信号名称</label>
                <input type="text" id="signalName" placeholder="WiFi热点A" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: white;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">信号类型</label>
                <select id="signalType" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: white;">
                    <option value="WiFi">WiFi</option>
                    <option value="蓝牙">蓝牙</option>
                    <option value="GPS">GPS</option>
                    <option value="无线电">无线电</option>
                    <option value="其他">其他</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">信号强度</label>
                <input type="range" id="signalStrength" min="0" max="100" value="100" style="width: 100%;">
                <span id="strengthValue" style="color: var(--accent);">100%</span>
            </div>
        </div>
    `;

    showModal('发送新信号', formHtml, [
        { text: '发送', class: 'btn-success', action: () => sendSignal(lat, lng) },
        { text: '取消', class: 'btn-warning', action: () => closeModal() }
    ]);

    // 添加滑块事件监听
    document.getElementById('signalStrength').addEventListener('input', (e) => {
        document.getElementById('strengthValue').textContent = e.target.value + '%';
    });
}

// 发送信号
async function sendSignal(lat, lng) {
    const name = document.getElementById('signalName').value;
    const type = document.getElementById('signalType').value;
    const strength = parseInt(document.getElementById('signalStrength').value);

    if (!name) {
        showNotification('请输入信号名称', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                type,
                latitude: lat,
                longitude: lng,
                strength
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('信号发送成功！', 'success');
            await loadSignals();
            updateMapMarkers();
            closeModal();
        }
    } catch (error) {
        showNotification('发送信号失败', 'error');
    }
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 显示模态框
function showModal(title, body, actions = []) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;

    const actionsHtml = actions.map(action =>
        `<button class="btn ${action.class}" onclick="modalAction_${actions.indexOf(action)}">${action.text}</button>`
    ).join('');

    document.getElementById('modalActions').innerHTML = actionsHtml;

    // 绑定动作
    actions.forEach((action, index) => {
        window[`modalAction_${index}`] = action.action;
    });

    // 重新生成按钮
    const actionsContainer = document.getElementById('modalActions');
    actionsContainer.innerHTML = '';
    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `btn ${action.class}`;
        btn.textContent = action.text;
        btn.onclick = action.action;
        actionsContainer.appendChild(btn);
    });

    document.getElementById('modal').classList.add('show');
}

// 关闭模态框
function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// 设置事件监听器
function setupEventListeners() {
    // 标签页切换
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });

    // 底部导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const view = item.dataset.view;
            // 这里可以添加不同视图的逻辑
        });
    });

    // 浮动按钮
    document.getElementById('fabBtn').addEventListener('click', () => {
        if (gameState.currentLocation) {
            showModal('快速操作', '', [
                { text: '生成案件', class: 'btn-primary', action: () => generateCasesAtLocation(gameState.currentLocation.latitude, gameState.currentLocation.longitude) },
                { text: '发送信号', class: 'btn-success', action: () => showSignalForm(gameState.currentLocation.latitude, gameState.currentLocation.longitude) },
                { text: '刷新数据', class: 'btn-warning', action: () => { loadGameData(); closeModal(); } },
                { text: '取消', class: 'btn-warning', action: () => closeModal() }
            ]);
        }
    });

    // 模态框外部点击关闭
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            closeModal();
        }
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initGame();

    // 防止意外的页面刷新
    let lastTouchY = 0;
    const el = document.body;

    el.addEventListener('touchstart', (e) => {
        lastTouchY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const touchYDelta = touchY - lastTouchY;
        lastTouchY = touchY;

        // 阻止下拉刷新
        if (el.scrollTop === 0 && touchYDelta > 0) {
            e.preventDefault();
        }
    }, { passive: false });
});

// 页面可见性改变时的优化
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时可以暂停某些操作
        console.log('页面隐藏');
    } else {
        // 页面显示时刷新地图
        if (gameState.map) {
            setTimeout(() => {
                gameState.map.invalidateSize();
            }, 100);
        }
    }
});
