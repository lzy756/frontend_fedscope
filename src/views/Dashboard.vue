<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <a-row :gutter="[16, 16]" class="dashboard-stats">
      <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <a-card class="stat-card">
          <a-statistic
            title="活跃实验"
            :value="statsData.activeExperiments"
            :value-style="{ color: '#1890ff' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <a-card class="stat-card">
          <a-statistic
            title="在线参与方"
            :value="statsData.onlineParticipants"
            :value-style="{ color: '#52c41a' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <a-card class="stat-card">
          <a-statistic
            title="训练轮次"
            :value="statsData.trainingRounds"
            :value-style="{ color: '#722ed1' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <a-card class="stat-card">
          <a-statistic
            title="模型准确率"
            :value="statsData.modelAccuracy"
            suffix="%"
            :precision="2"
            :value-style="{ color: '#fa8c16' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 训练进度和实时监控 -->
    <a-row :gutter="[16, 16]" class="dashboard-charts">
      <a-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <a-card title="训练进度监控" class="chart-card progress-card">
          <div class="progress-section">
            <div class="progress-item">
              <div class="progress-label">
                <span>总体进度</span>
                <span class="progress-value">{{ trainingProgress.overall }}%</span>
              </div>
              <a-progress 
                :percent="trainingProgress.overall" 
                :stroke-color="getProgressColor(trainingProgress.overall)"
              />
            </div>
            <div class="progress-item">
              <div class="progress-label">
                <span>当前轮次</span>
                <span class="progress-value">{{ trainingProgress.currentRound }}%</span>
              </div>
              <a-progress 
                :percent="trainingProgress.currentRound" 
                :stroke-color="getProgressColor(trainingProgress.currentRound)"
                status="active"
              />
            </div>
            <div class="progress-item">
              <div class="progress-label">
                <span>数据聚合</span>
                <span class="progress-value">{{ trainingProgress.aggregation }}%</span>
              </div>
              <a-progress 
                :percent="trainingProgress.aggregation" 
                :stroke-color="getProgressColor(trainingProgress.aggregation)"
              />
            </div>
          </div>
          
          <!-- 训练状态 -->
          <a-divider />
          <div class="training-status">
            <a-tag :color="getStatusColor(currentStatus)" class="status-tag">
              {{ getStatusText(currentStatus) }}
            </a-tag>
            <span class="status-time">开始时间: {{ formatTime(startTime) }}</span>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <a-card title="模型性能趋势" class="chart-card performance-card">
          <div class="chart-container">
            <Line :data="chartData" :options="chartOptions" style="height: 300px; width: 100%;" />
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 参与方状态和最近活动 -->
    <a-row :gutter="[16, 16]" class="dashboard-tables">
      <a-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <a-card title="参与方状态" class="table-card">
          <a-table 
            :columns="participantColumns" 
            :data-source="participantData" 
            :pagination="false"
            size="small"
            :scroll="{ x: 'max-content' }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-badge 
                  :status="record.status === 'online' ? 'processing' : 'default'"
                  :text="record.status === 'online' ? '在线' : '离线'"
                />
              </template>
              <template v-if="column.key === 'lastUpdate'">
                <span>{{ formatTime(record.lastUpdate) }}</span>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <a-card title="最近活动" class="table-card activity-card">
          <a-timeline class="activity-timeline">
            <a-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :color="getActivityColor(activity.type)"
            >
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ formatTime(activity.time) }}</div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>

    <!-- 快速操作区 -->
    <a-row :gutter="16" class="dashboard-actions">
      <a-col :span="24">
        <a-card title="快速操作" class="action-card">
          <a-space size="large" wrap>
            <a-button type="primary" size="large" @click="startNewExperiment">
              创建新实验
            </a-button>
            <a-button type="default" size="large" @click="viewExperiments">
              查看所有实验
            </a-button>
            <a-button type="default" size="large" @click="manageModels">
              模型管理
            </a-button>
            <a-button type="default" size="large" @click="systemSettings">
              系统设置
            </a-button>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const data = ref([])
const chartData = ref({
  labels: ['第1轮', '第2轮', '第3轮', '第4轮', '第5轮'],
  datasets: [{
    label: '模型准确率',
    data: [0.72, 0.78, 0.85, 0.89, 0.92],
    borderColor: 'rgb(24, 144, 255)',
    backgroundColor: 'rgba(24, 144, 255, 0.1)',
    borderWidth: 3,
    pointBackgroundColor: 'rgb(24, 144, 255)',
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 6,
    pointHoverRadius: 8,
    fill: true,
    tension: 0.4
  }]
})

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    title: {
      display: false
    },
    legend: {
      display: true,
      position: 'top',
      labels: {
        font: {
          size: 12,
          weight: 'bold'
        },
        padding: 20,
        boxWidth: 12, // 色块更小
        borderWidth: 2 // 色块边框更细
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(24, 144, 255, 0.8)',
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        title: function(context){
          return `第${context[0].parsed.x}轮`
        },
        label: function(context) {
          return `准确率: ${(context.parsed.y * 100).toFixed(2)}%`
        }
      }
    }
  },
  scales: {
    x: {
      type: 'linear',
      display: true,
      title: {
        display: true,
        text: '训练轮次',
        color: '#666',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      ticks:{
        callback: function(value){
          return `第${value}轮`
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: '准确率',
        color: '#666',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      min: 0,
      max: 1,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        callback: function(value) {
          return (value * 100).toFixed(0) + '%'
        }
      }
    }
  }
})

onMounted(async () => {
  try {
    // 读取第一个数据集 (FedSAK)
    const res1 = await fetch('/eval_results_fedsak_lda.log')
    const text1 = await res1.text()
    const lines1 = text1.split('\n')
    const parsedData1 = []
    
    lines1.forEach((line) => {
      if (line.trim()) {
        try {
          const fixedLine = line.replace(/'/g, '"')
          const json = JSON.parse(fixedLine)
          parsedData1.push(json)
        } catch (error) {
          console.error('JSON解析错误:', error)
        }
      }
    })

    // 读取第二个数据集 (FedProx)
    const res2 = await fetch('/eval_results_fedprox_lda_1.log')
    const text2 = await res2.text()
    const lines2 = text2.split('\n')
    const parsedData2 = []
    
    lines2.forEach((line) => {
      if (line.trim()) {
        try {
          const fixedLine = line.replace(/'/g, '"')
          const json = JSON.parse(fixedLine)
          if (json.Role && json.Role.startsWith('Server') && json.Round <= 49) {
            parsedData2.push(json)
          }
        } catch (error) {
          console.error('JSON解析错误:', error)
        }
      }
    })
    
    data.value = [...parsedData1, ...parsedData2]

    // 准备图表数据
    const datasets = []
    
    // 第一个数据集 (FedSAK)
    if (parsedData1.length > 0) {
      const data1 = parsedData1.map(item => ({
        x: item.Round,
        y: item.Results_weighted_avg?.test_correct/100
      }))
      datasets.push({
        label: 'FedSAK',
        data: data1,
        borderColor: 'rgb(24, 144, 255)',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        borderWidth: 2, // 直接在数据集里设置折线宽度
        pointBackgroundColor: 'rgb(24, 144, 255)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1, // 直接在数据集里设置点边框宽度
        pointRadius: 4, // 直接在数据集里设置点大小
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      })
    }
    
    // 第二个数据集 (FedProx)
    if (parsedData2.length > 0) {
      const data2 = parsedData2.map(item => ({
        x: item.Round,
        y: item.Results_weighted_avg?.test_correct/100
      }))
      datasets.push({
        label: 'FedProx',
        data: data2,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      })
    }

    // 合并所有轮次标签
    const allRounds = new Set()
    if (parsedData1.length > 0) {
      parsedData1.forEach(item => allRounds.add(`第${item.round || item.Round}轮`))
    }
    if (parsedData2.length > 0) {
      parsedData2.forEach(item => allRounds.add(`第${item.Round}轮`))
    }
    const sortedRounds = Array.from(allRounds).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0])
      const numB = parseInt(b.match(/\d+/)[0])
      return numA - numB
    })

    chartData.value = {
      // labels: sortedRounds,
      datasets: datasets
    }

    // 启用图例
    chartOptions.value.plugins.legend = {
      display: true,
      position: 'top',
      labels: {
        font: {
          size: 12
        },
        padding: 20
      }
    }

  } catch (error) {
    console.error('加载数据失败:', error)
  }
})
// 响应式数据
const statsData = ref({
  activeExperiments: 8,
  onlineParticipants: 24,
  trainingRounds: 156,
  modelAccuracy: 94.32
})

const trainingProgress = ref({
  overall: 78,
  currentRound: 45,
  aggregation: 89
})

const currentStatus = ref('training') // training, idle, error
const startTime = ref(new Date(Date.now() - 2 * 60 * 60 * 1000)) // 2小时前

// 参与方数据
const participantColumns = [
  { title: '参与方ID', dataIndex: 'id', key: 'id' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '数据量', dataIndex: 'dataSize', key: 'dataSize' },
  { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate' }
]

const participantData = ref([
  {
    key: '1',
    id: 'Client_001',
    status: 'online',
    dataSize: '2.3K',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    key: '2',
    id: 'Client_002',
    status: 'online',
    dataSize: '1.8K',
    lastUpdate: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    key: '3',
    id: 'Client_003',
    status: 'offline',
    dataSize: '3.1K',
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    key: '4',
    id: 'Client_004',
    status: 'online',
    dataSize: '2.7K',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000)
  }
])

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    type: 'success',
    title: '实验 FL_EXP_001 训练完成',
    time: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: 2,
    type: 'info',
    title: '新参与方 Client_005 加入',
    time: new Date(Date.now() - 25 * 60 * 1000)
  },
  {
    id: 3,
    type: 'warning',
    title: 'Client_003 连接超时',
    time: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 4,
    type: 'info',
    title: '开始新的训练轮次 #157',
    time: new Date(Date.now() - 45 * 60 * 1000)
  }
])

// 定时器
let timer = null

// 生命周期
onMounted(() => {
  // 模拟实时数据更新
  timer = setInterval(() => {
    updateStats()
    updateProgress()
  }, 5000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// 方法
const getProgressColor = (percent) => {
  if (percent >= 80) return '#52c41a'
  if (percent >= 60) return '#1890ff'
  if (percent >= 40) return '#faad14'
  return '#f5222d'
}

const getStatusColor = (status) => {
  const colors = {
    training: 'processing',
    idle: 'default',
    error: 'error'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    training: '训练中',
    idle: '空闲',
    error: '错误'
  }
  return texts[status] || '未知'
}

const getActivityColor = (type) => {
  const colors = {
    success: 'green',
    info: 'blue',
    warning: 'orange',
    error: 'red'
  }
  return colors[type] || 'blue'
}

const formatTime = (time) => {
  const now = new Date()
  const diff = now - time
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const updateStats = () => {
  // 模拟数据变化
  statsData.value.onlineParticipants = Math.floor(Math.random() * 5) + 20
  statsData.value.modelAccuracy = 94 + Math.random() * 2
}

const updateProgress = () => {
  // 模拟进度更新
  if (trainingProgress.value.overall < 100) {
    trainingProgress.value.overall += Math.floor(Math.random() * 3)
    trainingProgress.value.currentRound = Math.floor(Math.random() * 100)
    trainingProgress.value.aggregation = Math.floor(Math.random() * 100)
  }
}

// 快速操作方法
const startNewExperiment = () => {
  console.log('创建新实验')
  // 这里可以路由到实验创建页面
}

const viewExperiments = () => {
  console.log('查看所有实验')
  // 这里可以路由到实验列表页面
}

const manageModels = () => {
  console.log('模型管理')
  // 这里可以路由到模型管理页面
}

const systemSettings = () => {
  console.log('系统设置')
  // 这里可以路由到系统设置页面
}
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.dashboard-stats {
  margin-bottom: 24px;
}

.dashboard-charts {
  margin-bottom: 24px;
}

.dashboard-tables {
  margin-bottom: 24px;
}

.dashboard-actions {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.chart-card,
.table-card,
.action-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.progress-card {
  min-height: 400px;
}

.performance-card {
  min-height: 400px;
}

.activity-card {
  min-height: 400px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  color: #999;
  font-size: 16px;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-item {
  margin-bottom: 24px;
}

.progress-item:last-child {
  margin-bottom: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.progress-value {
  font-weight: 600;
  color: #1890ff;
}

.training-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.status-tag {
  font-size: 14px;
  padding: 4px 12px;
}

.status-time {
  color: #8c8c8c;
  font-size: 12px;
}

.activity-timeline {
  padding-top: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.activity-timeline::-webkit-scrollbar {
  width: 4px;
}

.activity-timeline::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.activity-timeline::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.activity-timeline::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.activity-content {
  padding-left: 8px;
}

.activity-title {
  font-size: 14px;
  margin-bottom: 4px;
  font-weight: 500;
  line-height: 1.4;
}

.activity-time {
  font-size: 12px;
  color: #8c8c8c;
}

/* Ant Design 表格响应式优化 */
:deep(.ant-table-wrapper) {
  overflow-x: auto;
}

:deep(.ant-table) {
  min-width: 100%;
}

:deep(.ant-card-body) {
  padding: 16px;
}

/* 修改快速操作区块样式，确保按钮簇在小屏幕下不会溢出 */
.dashboard-actions {
  margin-bottom: 24px;
}

.action-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  padding: 16px;
}

:deep(.ant-space) {
  flex-wrap: wrap; /* 确保按钮簇在小屏幕下换行 */
  justify-content: center; /* 居中对齐按钮 */
}

@media (max-width: 768px) {
  .action-card {
    padding: 12px; /* 减小内边距以适应小屏幕 */
  }

  :deep(.ant-space-item) {
    margin-bottom: 8px; /* 增加按钮之间的间距 */
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dashboard {
    padding: 16px;
  }
  
  .stat-card {
    height: 100px;
  }
  
  .progress-card,
  .performance-card,
  .activity-card {
    min-height: 350px;
  }
}

@media (max-width: 992px) {
  .chart-placeholder {
    height: 250px;
    font-size: 14px;
  }
  
  .progress-card,
  .performance-card,
  .activity-card {
    min-height: auto;
    margin-bottom: 16px;
  }
  
  .training-status {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .activity-timeline {
    max-height: 250px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }
  
  .stat-card {
    height: 90px;
    margin-bottom: 12px;
  }
  
  .chart-placeholder {
    height: 200px;
  }
  
  .progress-item {
    margin-bottom: 16px;
  }
  
  .activity-timeline {
    max-height: 200px;
  }
  
  :deep(.ant-card-body) {
    padding: 12px;
  }
}

@media (max-width: 576px) {
  .dashboard {
    padding: 8px;
  }
  
  .stat-card {
    height: 80px;
  }
  
  .progress-label {
    font-size: 12px;
  }
  
  .activity-title {
    font-size: 12px;
  }
  
  .activity-time {
    font-size: 11px;
  }
}

/* 确保容器不会溢出 */
.ant-row {
  margin-left: -8px !important;
  margin-right: -8px !important;
  width: calc(100% + 16px) !important;
}

.ant-col {
  padding-left: 8px;
  padding-right: 8px;
}

/* 修复可能的溢出问题 */
* {
  box-sizing: border-box;
}

/* 确保所有卡片容器正确 */
:deep(.ant-card) {
  width: 100%;
  height: 100%;
}

:deep(.ant-row) {
  width: 100%;
}
</style>
