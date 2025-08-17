<template>
  <div class="cluster-fedsak-view">
    <!-- 顶部操作栏 -->
    <div class="view-header">
      <div class="header-left">
        <h3>分簇-FedSAK 联邦学习可视化</h3>
        <div class="experiment-info" v-if="experimentInfo">
          <a-tag color="blue">{{ experimentInfo.name }}</a-tag>
          <a-tag :color="getStatusColor(experimentInfo.status)">
            {{ getStatusText(experimentInfo.status) }}
          </a-tag>
        </div>
      </div>

      <div class="header-center">
        <div class="experiment-selector">
          <span class="selector-label">实验选择:</span>
          <a-select
            v-model:value="selectedExperimentId"
            style="width: 300px; margin-left: 12px;"
            placeholder="选择实验"
            @change="onExperimentChange"
          >
            <a-select-option
              v-for="experiment in clusterFedSAKExperiments"
              :key="experiment.id"
              :value="experiment.id"
            >
              {{ experiment.name }}
            </a-select-option>
          </a-select>
        </div>
      </div>
      <div class="header-right">
        <a-space>
          <a-button
            size="small"
            :loading="isConnecting"
            @click="toggleLiveMode"
          >
            <template #icon>
              <WifiOutlined v-if="isLiveMode" />
              <DisconnectOutlined v-else />
            </template>
            {{ isLiveMode ? '实时监控' : '连接实时' }}
          </a-button>
          <a-button
            size="small"
            @click="showSettings = true"
          >
            <template #icon>
              <SettingOutlined />
            </template>
            设置
          </a-button>
          <a-button
            size="small"
            @click="refreshData"
          >
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧区域：拓扑图 + 实时指标 (60%) -->
      <div class="left-section">
        <!-- 拓扑图区域 -->
        <div class="topology-section">
          <ClusterTopologyCard
            :experiment-data="experimentData"
            :current-round="currentRound"
            :is-live="isLiveMode"
            @node-click="handleNodeClick"
            @round-change="handleRoundChange"
          />
        </div>
        
        <!-- 实时指标区域 (左下角) -->
        <div class="metrics-section">
          <MetricsTabs
            :experiment-data="experimentData"
            :current-round="currentRound"
            :is-live="isLiveMode"
            @metric-update="handleMetricUpdate"
          />
        </div>
      </div>

      <!-- 右侧进度面板 (40%) -->
      <div class="progress-section">
        <ProgressPanel
          :experiment-data="experimentData"
          :current-round="currentRound"
          :total-rounds="totalRounds"
          :is-live="isLiveMode"
          :show-replay-controls="!isLiveMode"
          @round-change="handleRoundChange"
          @replay-control="handleReplayControl"
        />
      </div>
    </div>

    <!-- 设置抽屉 -->
    <a-drawer
      v-model:open="showSettings"
      title="可视化设置"
      width="400"
    >
      <div class="settings-content">
        <h4>拓扑图设置</h4>
        <a-form :model="settings" layout="vertical" size="small">
          <a-form-item label="刷新间隔 (秒)">
            <a-input-number 
              v-model:value="settings.refreshInterval"
              :min="1"
              :max="60"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="动画速度">
            <a-slider 
              v-model:value="settings.animationSpeed"
              :min="0.5"
              :max="3"
              :step="0.1"
              :tooltip-formatter="(value) => `${value}x`"
            />
          </a-form-item>
          <a-form-item label="节点大小缩放">
            <a-slider 
              v-model:value="settings.nodeScale"
              :min="0.5"
              :max="2"
              :step="0.1"
              :tooltip-formatter="(value) => `${value}x`"
            />
          </a-form-item>
        </a-form>

        <a-divider />

        <h4>算法参数</h4>
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item label="聚类算法">
            {{ algorithmParams.clusterAlgo }}
          </a-descriptions-item>
          <a-descriptions-item label="簇数 K">
            {{ algorithmParams.numClusters }}
          </a-descriptions-item>
          <a-descriptions-item label="正则化系数 λ">
            {{ algorithmParams.lambdaTrace }}
          </a-descriptions-item>
          <a-descriptions-item label="学习率 η_w">
            {{ algorithmParams.etaW }}
          </a-descriptions-item>
          <a-descriptions-item label="本地轮次 E">
            {{ algorithmParams.localEpochs }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <h4>导出选项</h4>
        <a-space direction="vertical" style="width: 100%">
          <a-button block @click="exportTopologyData">
            <template #icon>
              <DownloadOutlined />
            </template>
            导出拓扑数据
          </a-button>
          <a-button block @click="exportMetricsData">
            <template #icon>
              <DownloadOutlined />
            </template>
            导出指标数据
          </a-button>
          <a-button block @click="exportScreenshot">
            <template #icon>
              <CameraOutlined />
            </template>
            截图保存
          </a-button>
        </a-space>
      </div>
    </a-drawer>

    <!-- WebSocket状态指示器 -->
    <div class="ws-status" v-if="isLiveMode">
      <a-badge 
        :status="wsStatus.connected ? 'processing' : 'error'" 
        :text="`WebSocket: ${wsStatus.message}`"
      />
      <div class="ws-stats">
        延迟: {{ wsStatus.latency }}ms | 消息: {{ wsStatus.messageCount }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  WifiOutlined,
  DisconnectOutlined,
  SettingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CameraOutlined
} from '@ant-design/icons-vue'
import ClusterTopologyCard from '@/components/ClusterTopologyCardCytoscape.vue'
import ProgressPanel from '@/components/ProgressPanel.vue'
import MetricsTabs from '@/components/MetricsTabs.vue'

// 模拟实验数据
const clusterFedSAKExperiments = ref([
  {
    id: 1,
    name: 'CIFAR-10 分簇联邦学习实验',
    algorithm: 'Cluster-FedSAK',
    status: 'running',
    progress: 0,
    participants: 20,
    dataset: 'CIFAR-10',
    learningRate: 0.01,
    duration: 5400000,
    createTime: '2025-01-20 09:30:00',
    description: '使用分簇-FedSAK算法在CIFAR-10数据集上进行图像分类实验，支持客户端异构特征聚类'
  },
  {
    id: 2,
    name: 'MNIST 分簇联邦学习实验',
    algorithm: 'Cluster-FedSAK',
    status: 'completed',
    progress: 100,
    participants: 15,
    dataset: 'MNIST',
    learningRate: 0.01,
    duration: 3600000,
    createTime: '2024-01-15 10:30:00',
    description: '使用分簇-FedSAK算法在MNIST数据集上进行手写数字识别实验'
  },
  {
    id: 3,
    name: 'FEMNIST 分簇联邦学习实验',
    algorithm: 'Cluster-FedSAK',
    status: 'pending',
    progress: 0,
    participants: 25,
    dataset: 'FEMNIST',
    learningRate: 0.005,
    duration: 0,
    createTime: '2024-01-14 14:20:00',
    description: '使用分簇-FedSAK算法在FEMNIST数据集上进行实验'
  }
])

// 响应式数据
const selectedExperimentId = ref(1)
const isLiveMode = ref(false)
const isConnecting = ref(false)
const currentRound = ref(0)
const totalRounds = ref(100)
const showSettings = ref(false)

// 实验信息
const experimentInfo = computed(() => {
  return clusterFedSAKExperiments.value.find(exp => exp.id === selectedExperimentId.value)
})

// 实验数据
const experimentData = ref({
  topology: {},
  metrics: {},
  logs: []
})

// 算法参数
const algorithmParams = reactive({
  clusterAlgo: 'K-means',
  numClusters: 4,
  lambdaTrace: 1e-3,
  etaW: 0.1,
  localEpochs: 5
})

// 设置
const settings = reactive({
  refreshInterval: 5,
  animationSpeed: 1.0,
  nodeScale: 1.0
})

// WebSocket状态
const wsStatus = reactive({
  connected: false,
  message: '未连接',
  latency: 0,
  messageCount: 0
})

let wsConnection = null
let heartbeatInterval = null

// 计算属性
const getStatusColor = (status) => {
  const colorMap = {
    'running': 'processing',
    'completed': 'success',
    'failed': 'error',
    'paused': 'warning'
  }
  return colorMap[status] || 'default'
}

const getStatusText = (status) => {
  const textMap = {
    'running': '运行中',
    'completed': '已完成',
    'failed': '失败',
    'pending': '待启动'
  }
  return textMap[status] || status
}

// WebSocket连接管理
const connectWebSocket = () => {
  if (wsConnection) {
    wsConnection.close()
  }
  
  isConnecting.value = true
  wsStatus.message = '连接中...'
  
  // 模拟WebSocket连接
  setTimeout(() => {
    wsStatus.connected = true
    wsStatus.message = '已连接'
    wsStatus.latency = 45
    isConnecting.value = false
    
    // 模拟数据推送
    startDataSimulation()
    message.success('已连接到实时数据流')
  }, 1500)
}

const disconnectWebSocket = () => {
  if (wsConnection) {
    wsConnection.close()
    wsConnection = null
  }
  
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
  
  wsStatus.connected = false
  wsStatus.message = '已断开'
  wsStatus.messageCount = 0
  
  message.info('已断开实时数据流')
}

// 数据模拟
const startDataSimulation = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
  }
  
  heartbeatInterval = setInterval(() => {
    if (isLiveMode.value && wsStatus.connected) {
      // 模拟接收新数据 - 不在这里更新轮次，由ProgressPanel控制
      wsStatus.messageCount++
      wsStatus.latency = 30 + Math.floor(Math.random() * 30)
      
      // 如果实验完成
      if (currentRound.value >= totalRounds.value) {
        experimentInfo.value.status = 'completed'
        isLiveMode.value = false
        disconnectWebSocket()
        message.success('实验已完成！')
      }
    }
  }, settings.refreshInterval * 1000)
}

// 事件处理
const toggleLiveMode = () => {
  if (isLiveMode.value) {
    isLiveMode.value = false
    disconnectWebSocket()
  } else {
    isLiveMode.value = true
    connectWebSocket()
  }
}

const refreshData = async () => {
  try {
    message.loading('刷新数据中...', 1)
    // TODO: 调用实际API
    // const data = await fetchExperimentData(props.experimentId)
    // experimentData.value = data
    message.success('数据已刷新')
  } catch (error) {
    message.error('刷新失败：' + error.message)
  }
}

const handleNodeClick = (node) => {
  console.log('节点点击:', node)
}

const handleRoundChange = (round) => {
  console.log(`ProgressPanel 请求轮次变化: ${currentRound.value} -> ${round}`)
  currentRound.value = round
  // TODO: 获取历史快照数据
}

const handleReplayControl = ({ action, round }) => {
  console.log('回放控制:', action, round)
  switch (action) {
    case 'play':
      message.info('开始回放')
      break
    case 'pause':
      message.info('暂停回放')
      break
    case 'stop':
      message.info('停止回放')
      currentRound.value = 0
      break
  }
}

const handleMetricUpdate = (metrics) => {
  console.log('指标更新:', metrics)
}

// 导出功能
const exportTopologyData = () => {
  if (!experimentInfo.value) return
  
  const data = {
    experimentId: experimentInfo.value.id,
    round: currentRound.value,
    topology: experimentData.value.topology,
    timestamp: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `topology_${experimentInfo.value.id}_round_${currentRound.value}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  message.success('拓扑数据已导出')
}

const exportMetricsData = () => {
  if (!experimentInfo.value) return
  
  const data = {
    experimentId: experimentInfo.value.id,
    metrics: experimentData.value.metrics,
    timestamp: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `metrics_${experimentInfo.value.id}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  message.success('指标数据已导出')
}

const exportScreenshot = () => {
  // TODO: 实现截图功能
  message.info('截图功能开发中...')
}

// 实验变更处理
const onExperimentChange = (value) => {
  selectedExperimentId.value = value
  // 重置状态
  currentRound.value = 0
  isLiveMode.value = false
  disconnectWebSocket()
  
  // 如果新实验正在运行，自动连接实时模式
  const experiment = clusterFedSAKExperiments.value.find(exp => exp.id === value)
  if (experiment && experiment.status === 'running') {
    toggleLiveMode()
  }
}

// 生命周期
onMounted(() => {
  // 初始化数据
  currentRound.value = 0 // 从第0轮开始，展示完整的聚类过程
  
  // 如果实验正在运行，自动连接实时模式
  if (experimentInfo.value && experimentInfo.value.status === 'running') {
    toggleLiveMode()
  }
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
.cluster-fedsak-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: visible;
  margin: 0;
  padding: 0;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-left h3 {
  margin: 0 0 8px 0;
  color: #1890ff;
}

.experiment-info {
  display: flex;
  gap: 8px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.experiment-selector {
  display: flex;
  align-items: center;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  align-items: stretch;
  overflow: visible;
  background: #f5f5f5;
}

.left-section {
  flex: 0 0 60%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: visible;
}

.topology-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.progress-section {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  overflow: visible;
  height: auto;
  max-height: none;
}

.metrics-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.settings-content h4 {
  color: #1890ff;
  margin: 16px 0 8px 0;
}

.ws-status {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  z-index: 1000;
}

.ws-stats {
  margin-top: 4px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-section {
    flex: none;
  }
  
  .topology-section {
    flex: none;
  }
  
  .progress-section {
    flex: none;
  }
  
  .metrics-section {
    flex: none;
  }
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    gap: 12px;
  }
  .header-center {
    width: 100%;
    justify-content: center;
  }
  
  .main-content {
    padding: 8px;
    gap: 8px;
    flex-direction: column;
  }
  
  .left-section {
    flex: none;
  }
  
  .topology-section {
    flex: none;
  }
  
  .progress-section {
    flex: none;
  }
  
  .metrics-section {
    flex: none;
  }
}
</style>