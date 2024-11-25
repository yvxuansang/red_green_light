// 错误捕捉
window.onerror = function (message, source, lineno, colno, error) {
    console.log("Error occurred: ", message, " at ", lineno, ":", colno);
};

let simulationInterval;  // 全局变量，用于保存定时器
let trafficData = [];  // 存储车流量数据
let greenLightDuration = 5000;  // 默认绿灯时间为5秒
let redLightDuration = 5000;    // 默认红灯时间为5秒
let yellowLightDuration = 3000;
const trafficDisplay = document.getElementById('traffic-display');
let isSimulating = false;  //跟踪模拟状态
let lightChangeInterval; // 用于保存红绿灯定时器的 ID
let socket;
let currentDuration; // 用于存储当前灯光的持续时间
let carInterval;// 全局变量，用于保存小车生成的定时器
let currentStatus;
const cars = document.querySelectorAll('.car');
function startSimulation() {
    console.log("Simulation started");
    isSimulating = true; //正在模拟
    currentStatus = 'red'; // 确保初始状态为红灯

    // 车流模拟定时器
    simulationInterval = setInterval(() => {
        const currentTraffic = Math.floor(Math.random() * 100);
        trafficDisplay.innerText = `当前车流量: ${currentTraffic}`;
        trafficData.push({time: new Date(), value: currentTraffic});
        // 根据车流量调整红绿灯时间
        if (currentTraffic > 80) {
            greenLightDuration = 10000;
            redLightDuration = 6000;
        } else if (currentTraffic > 50) {
            greenLightDuration = 7000;
            redLightDuration = 5000;
        } else {
            greenLightDuration = 5000;
            redLightDuration = 5000;
        }

        createCar();
    }, 1000);

    // 随机时间间隔生成小车
    carInterval = setInterval(() => {
        createCar();
    }, Math.random() * 2000 + 1000); // 随机时间间隔（1到3秒）

    cars.forEach(car => car.style.animationPlayState = 'running');
    changeLight();
}

// 红绿灯切换
function changeLight() {   // 红->绿->黄->红
    // 计算当前状态的持续时间
    currentDuration = currentStatus === 'green' ? greenLightDuration :
                      (currentStatus === 'yellow' ? yellowLightDuration : redLightDuration);

    console.log(`Current Status: ${currentStatus}, Duration: ${currentDuration}`); // 打印调试信息
    // 更新灯光状态
    updateLightStatus(); // 立即更新状态
    // 在持续时间结束后切换灯光
    lightChangeInterval = setTimeout(() => {
        if (currentStatus === 'red') {
            currentStatus = 'green';  // 红变绿
        } else if (currentStatus === 'green') {
            currentStatus = 'yellow';  // 绿变黄
        } else {
            currentStatus = 'red';  // 黄变红
        }
        changeLight(); // 递归调用以继续灯光切换
    }, currentDuration);
}
// 更新灯光状态
function updateLightStatus() {
    const data = {
        id: 'crossroad-1',
        status: {
            red: currentStatus === 'red',
            yellow: currentStatus === 'yellow',
            green: currentStatus === 'green'
        }
    };
    console.log('Sending change_light event:', data);  // 调试用
    socket.emit('change_light', data);
}

// 停止模拟
function stopSimulation() {
    isSimulating = false;  // 设置为不再模拟状态
    clearTimeout(lightChangeInterval); // 停止红绿灯的定时器
    clearInterval(simulationInterval); // 停止车流量模拟
    clearInterval(carInterval); // 停止小车生成的定时器

    cars.forEach(car => car.style.animationPlayState = 'paused');

    setTimeout(function(){
       alert("模拟已暂停");
    }, 0);
    console.log("stop success");
}

const road = document.getElementById('road');
// 创建小车的函数
function createCar() {
    const car = document.createElement('div');
    car.className = 'car';

    const colors = ['blue', 'red', 'green', 'yellow'];
    const colorIndex = Math.floor(Math.random() * colors.length);
    car.style.backgroundColor = colors[colorIndex];
    // 随机选择一个车道
    const laneIndex = Math.floor(Math.random() * document.querySelectorAll('.lane').length);
    const lane = document.querySelectorAll('.lane')[laneIndex];

    car.style.bottom = lane.offsetTop + 'px'; // 设置小车在选定车道的底部位置
    car.style.left = '0px'; // 从左侧开始
    road.appendChild(car); // 先添加到道路上

    car.style.animation = 'drive 5s linear forwards'; // 小车移动动画

    car.addEventListener('animationend', () => {
        car.remove(); // 移除小车元素
    });
}


// 绑定到 window 对象
window.startSimulation = startSimulation;
window.stopSimulation = stopSimulation;

// DOMContentLoaded 回调
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded loaded successfully!");
    socket = io.connect('http://' + document.domain + ':' + location.port);
    const trafficDisplay = document.getElementById('traffic-display');
    const road = document.getElementById('road');
    console.log('Traffic Display:', trafficDisplay);
    console.log('Road Element:', road);
    // Socket 事件监听
    socket.on('light_status_update', data => {
        console.log('Received light status update:', data);  // 调试用
        const crossroad = document.getElementById(data.id);
        crossroad.querySelector('#red-light').style.backgroundColor = data.status.red ? 'red' : 'gray';
        crossroad.querySelector('#yellow-light').style.backgroundColor = data.status.yellow ? 'yellow' : 'gray';
        crossroad.querySelector('#green-light').style.backgroundColor = data.status.green ? 'green' : 'gray';
        document.getElementById('current-status').innerText = '当前状态: ' + (data.status.red ? '红灯' : data.status.yellow ? '黄灯' : '绿灯');
        // 更新历史数据展示
        const trafficHistory = document.getElementById('history-list');
        const historyItem = document.createElement('li');
        historyItem.innerText = `路口: ${data.id}, 
                                 状态: ${data.status.red ? '红灯' : data.status.yellow ? '黄灯' : '绿灯'}, 
                                 持续时间: ${currentDuration / 1000}秒,
                                 时间: ${new Date().toLocaleString()}`;
        trafficHistory.appendChild(historyItem);
    });
});
