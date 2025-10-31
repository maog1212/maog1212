// API基础URL
const API_URL = 'http://localhost:3000/api';

// 地图初始化
let map;
let markers = [];
let searchMarker = null;
let searchCircle = null;

// 初始化地图（北京天安门坐标）
function initMap() {
    map = L.map('map').setView([39.9042, 116.4074], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // 点击地图获取坐标
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lon = e.latlng.lng.toFixed(6);
        document.getElementById('signalLat').value = lat;
        document.getElementById('signalLon').value = lon;
    });
}

// 显示消息
function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';

    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// 更新统计数据
function updateStats(totalCount, nearbyCount, radius) {
    document.getElementById('totalSignals').textContent = totalCount || 0;
    document.getElementById('nearbySignals').textContent = nearbyCount || 0;
    if (radius !== undefined) {
        document.getElementById('searchRadius').textContent = radius;
    }
}

// 清除地图标记
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
    }
    if (searchCircle) {
        map.removeLayer(searchCircle);
        searchCircle = null;
    }
}

// 在地图上添加信号标记
function addSignalToMap(signal) {
    const markerColor = getMarkerColor(signal.type);

    const marker = L.circleMarker([signal.latitude, signal.longitude], {
        radius: 8,
        fillColor: markerColor,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(map);

    const popupContent = `
        <div style="min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: ${markerColor};">${signal.name}</h3>
            <p style="margin: 5px 0;"><strong>类型:</strong> ${signal.type}</p>
            <p style="margin: 5px 0;"><strong>强度:</strong> ${signal.strength}%</p>
            <p style="margin: 5px 0;"><strong>位置:</strong> ${signal.latitude.toFixed(6)}, ${signal.longitude.toFixed(6)}</p>
            ${signal.distance !== undefined ? `<p style="margin: 5px 0;"><strong>距离:</strong> ${signal.distance.toFixed(2)} km</p>` : ''}
            ${signal.description ? `<p style="margin: 5px 0;"><strong>描述:</strong> ${signal.description}</p>` : ''}
            <p style="margin: 5px 0; font-size: 0.85em; color: #666;"><strong>时间:</strong> ${new Date(signal.timestamp).toLocaleString('zh-CN')}</p>
        </div>
    `;

    marker.bindPopup(popupContent);
    markers.push(marker);
}

// 根据信号类型返回颜色
function getMarkerColor(type) {
    const colors = {
        'WiFi': '#4285F4',
        '蓝牙': '#34A853',
        'GPS': '#FBBC04',
        '无线电': '#EA4335',
        '其他': '#9E9E9E'
    };
    return colors[type] || colors['其他'];
}

// 添加搜索位置标记
function addSearchMarker(lat, lon, radius) {
    // 添加搜索中心点标记
    searchMarker = L.marker([lat, lon], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    searchMarker.bindPopup(`<strong>搜索中心</strong><br>半径: ${radius} km`).openPopup();

    // 添加搜索范围圆圈
    searchCircle = L.circle([lat, lon], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.1,
        radius: radius * 1000 // 转换为米
    }).addTo(map);

    // 调整地图视图以包含整个搜索区域
    map.fitBounds(searchCircle.getBounds());
}

// 显示信号列表
function displaySignals(signals) {
    const signalsList = document.getElementById('signalsList');

    if (signals.length === 0) {
        signalsList.innerHTML = '<p style="text-align: center; color: #999;">暂无信号数据</p>';
        return;
    }

    signalsList.innerHTML = signals.map(signal => `
        <div class="signal-item">
            <div class="signal-header">
                <span class="signal-name">${signal.name}</span>
                <div>
                    <span class="signal-type">${signal.type}</span>
                    <button class="delete-btn" onclick="deleteSignal(${signal.id})">删除</button>
                </div>
            </div>
            <div class="signal-info">
                <div>📍 位置: ${signal.latitude.toFixed(6)}, ${signal.longitude.toFixed(6)}</div>
                <div>💪 强度: ${signal.strength}%</div>
                ${signal.distance !== undefined ? `<div class="signal-distance">📏 距离: ${signal.distance.toFixed(2)} km</div>` : ''}
                ${signal.description ? `<div>📝 ${signal.description}</div>` : ''}
                <div style="font-size: 0.85em; color: #999; margin-top: 5px;">🕐 ${new Date(signal.timestamp).toLocaleString('zh-CN')}</div>
            </div>
        </div>
    `).join('');
}

// 发送新信号
document.getElementById('sendSignalForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const signalData = {
        name: document.getElementById('signalName').value,
        type: document.getElementById('signalType').value,
        latitude: parseFloat(document.getElementById('signalLat').value),
        longitude: parseFloat(document.getElementById('signalLon').value),
        strength: parseInt(document.getElementById('signalStrength').value),
        description: document.getElementById('signalDescription').value
    };

    try {
        const response = await fetch(`${API_URL}/signals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signalData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('sendMessage', '信号发送成功！', 'success');
            document.getElementById('sendSignalForm').reset();
            document.getElementById('signalStrength').value = 100;
            loadAllSignals();
        } else {
            showMessage('sendMessage', '发送失败: ' + data.error, 'error');
        }
    } catch (error) {
        showMessage('sendMessage', '网络错误: ' + error.message, 'error');
    }
});

// 搜索附近信号
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const lat = parseFloat(document.getElementById('searchLat').value);
    const lon = parseFloat(document.getElementById('searchLon').value);
    const radius = parseFloat(document.getElementById('searchRadiusInput').value);

    try {
        const response = await fetch(`${API_URL}/signals/nearby?latitude=${lat}&longitude=${lon}&radius=${radius}`);
        const data = await response.json();

        if (response.ok) {
            clearMarkers();

            // 添加搜索位置标记和范围圆圈
            addSearchMarker(lat, lon, radius);

            // 添加找到的信号标记
            data.signals.forEach(signal => addSignalToMap(signal));

            displaySignals(data.signals);

            // 更新统计数据
            const totalResponse = await fetch(`${API_URL}/signals`);
            const totalData = await totalResponse.json();
            updateStats(totalData.count, data.count, radius);

            showMessage('searchMessage', `找到 ${data.count} 个附近信号`, 'success');
        } else {
            showMessage('searchMessage', '搜索失败: ' + data.error, 'error');
        }
    } catch (error) {
        showMessage('searchMessage', '网络错误: ' + error.message, 'error');
    }
});

// 加载所有信号
async function loadAllSignals() {
    try {
        const response = await fetch(`${API_URL}/signals`);
        const data = await response.json();

        if (response.ok) {
            clearMarkers();
            data.signals.forEach(signal => addSignalToMap(signal));
            displaySignals(data.signals);
            updateStats(data.count, data.count);

            // 如果有信号，调整地图视图以显示所有标记
            if (markers.length > 0) {
                const group = L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }
    } catch (error) {
        console.error('加载信号失败:', error);
    }
}

// 删除信号
async function deleteSignal(id) {
    if (!confirm('确定要删除这个信号吗？')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signals/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('searchMessage', '信号已删除', 'success');
            loadAllSignals();
        } else {
            const data = await response.json();
            showMessage('searchMessage', '删除失败: ' + data.error, 'error');
        }
    } catch (error) {
        showMessage('searchMessage', '网络错误: ' + error.message, 'error');
    }
}

// 清空所有信号
async function clearAllSignals() {
    if (!confirm('确定要清空所有信号吗？此操作不可恢复！')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signals`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            clearMarkers();
            displaySignals([]);
            updateStats(0, 0);
            showMessage('searchMessage', data.message, 'success');
        } else {
            showMessage('searchMessage', '清空失败: ' + data.error, 'error');
        }
    } catch (error) {
        showMessage('searchMessage', '网络错误: ' + error.message, 'error');
    }
}

// 使用当前位置
function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('signalLat').value = position.coords.latitude.toFixed(6);
                document.getElementById('signalLon').value = position.coords.longitude.toFixed(6);
                map.setView([position.coords.latitude, position.coords.longitude], 15);
                showMessage('sendMessage', '已获取当前位置', 'success');
            },
            (error) => {
                showMessage('sendMessage', '无法获取位置: ' + error.message, 'error');
            }
        );
    } else {
        showMessage('sendMessage', '浏览器不支持地理定位', 'error');
    }
}

// 使用当前位置进行搜索
function useCurrentLocationForSearch() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('searchLat').value = position.coords.latitude.toFixed(6);
                document.getElementById('searchLon').value = position.coords.longitude.toFixed(6);
                map.setView([position.coords.latitude, position.coords.longitude], 15);
                showMessage('searchMessage', '已获取当前位置', 'success');
            },
            (error) => {
                showMessage('searchMessage', '无法获取位置: ' + error.message, 'error');
            }
        );
    } else {
        showMessage('searchMessage', '浏览器不支持地理定位', 'error');
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadAllSignals();
});
