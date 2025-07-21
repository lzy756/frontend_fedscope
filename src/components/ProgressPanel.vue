<template>
  <div class="progress-panel">
    <a-card title="训练进度" size="small">
      <!-- 轮次进度 -->
      <div class="progress-section">
        <div class="progress-title">
          <span>训练轮次</span>
          <span class="progress-text">{{ currentRound }} / {{ totalRounds }}</span>
        </div>
        <a-progress 
          :percent="roundProgress" 
          :show-info="false"
          stroke-color="#1890ff"
        />
      </div>

      <!-- 统计信息 -->
      <a-row :gutter="[8, 8]" class="stats-row">
        <a-col span="12">
          <a-statistic
            title="在线客户端"
            :value="onlineClients"
            :value-style="{ color: '#52c41a', fontSize: '18px' }"
          />
        </a-col>
        <a-col span="12">
          <a-statistic
            title="簇数量"
            :value="clusterCount"
            :value-style="{ color: '#1890ff', fontSize: '18px' }"
          />
        </a-col>
      </a-row>

      <!-- 阶段指示器 -->
      <div class="phase-indicator">
        <div class="phase-title">当前阶段</div>
        <a-steps 
          :current="currentPhase" 
          size="small" 
          direction="vertical"
          :items="phaseSteps"
        />
      </div>

      <!-- 实时状态 -->
      <div class="status-section">
        <a-badge :status="experimentStatus.status" :text="experimentStatus.text" />
        <div class="status-detail">
          {{ experimentStatus.detail }}
        </div>
      </div>

      <!-- 历史回放控制 -->
      <div class="replay-controls" v-if="showReplayControls">
        <a-divider size="small">历史回放</a-divider>
        <div class="replay-slider">
          <a-slider
            v-model:value="replayRound"
            :min="0"
            :max="totalRounds"
            :tooltip-formatter="(value) => `轮次 ${value}`"
            @change="onReplayRoundChange"
          />
        </div>
        <div class="replay-buttons">
          <a-button-group size="small">
            <a-button @click="playReplay" :disabled="isPlaying">
              <template #icon>
                <PlayCircleOutlined />
              </template>
            </a-button>
            <a-button @click="pauseReplay" :disabled="!isPlaying">
              <template #icon>
                <PauseCircleOutlined />
              </template>
            </a-button>
            <a-button @click="stopReplay">
              <template #icon>
                <StopOutlined />
              </template>
            </a-button>
          </a-button-group>
        </div>
      </div>
    </a-card>

    <!-- 簇状态卡片 -->
    <a-card title="簇状态" size="small" class="cluster-status-card">
      <div class="cluster-list">
        <div 
          v-for="cluster in clusterStatus" 
          :key="cluster.id"
          class="cluster-item"
          :class="{ active: cluster.active }"
        >
          <div class="cluster-header">
            <div class="cluster-name">
              <div 
                class="cluster-color" 
                :style="{ backgroundColor: cluster.color }"
              ></div>
              {{ cluster.name }}
            </div>
            <div class="cluster-stats">
              {{ cluster.onlineClients }}/{{ cluster.totalClients }}
            </div>
          </div>
          <div class="cluster-progress">
            <a-progress 
              :percent="cluster.progress" 
              :show-info="false"
              :stroke-color="cluster.color"
              size="small"
            />
          </div>
          <div class="cluster-metrics">
            <span class="metric">
              <small>损失: {{ cluster.avgLoss?.toFixed(4) || '-' }}</small>
            </span>
            <span class="metric">
              <small>样本: {{ cluster.totalSamples || 0 }}</small>
            </span>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StopOutlined 
} from '@ant-design/icons-vue'

const props = defineProps({
  experimentData: {
    type: Object,
    default: () => ({})
  },
  currentRound: {
    type: Number,
    default: 0
  },
  totalRounds: {
    type: Number,
    default: 100
  },
  isLive: {
    type: Boolean,
    default: false
  },
  showReplayControls: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['roundChange', 'replayControl'])

// 响应式数据
const replayRound = ref(props.currentRound)
const isPlaying = ref(false)
const currentPhase = ref(0)

// 计算属性
const roundProgress = computed(() => {
  if (props.totalRounds === 0) return 0
  return Math.round((props.currentRound / props.totalRounds) * 100)
})

const onlineClients = computed(() => {
  // 模拟数据
  return 17
})

const clusterCount = computed(() => {
  return clusterStatus.value.length
})

const experimentStatus = computed(() => {
  if (props.isLive) {
    switch (currentPhase.value) {
      case 0:
        return {
          status: 'processing',
          text: '模型下发中',
          detail: '正在将全局模型分发到各个簇代理...'
        }
      case 1:
        return {
          status: 'processing',
          text: '本地训练中',
          detail: '客户端正在执行本地SGD训练...'
        }
      case 2:
        return {
          status: 'processing',
          text: '簇内聚合中',
          detail: '簇代理正在执行FedAvg聚合...'
        }
      case 3:
        return {
          status: 'processing',
          text: '簇间聚合中',
          detail: 'FedSAK聚合器正在执行轨迹范数正则化...'
        }
      default:
        return {
          status: 'success',
          text: '运行中',
          detail: `轮次 ${props.currentRound} 完成`
        }
    }
  } else {
    return {
      status: 'default',
      text: '已完成',
      detail: '实验已完成，可查看历史数据'
    }
  }
})

// 阶段步骤
const phaseSteps = ref([
  { title: '模型下发', description: 'θ̃ᵢ⁽ᵗ⁾ → 代理 → 客户端' },
  { title: '本地训练', description: '客户端执行E个epoch' },
  { title: '簇内聚合', description: 'FedAvg: θᵢ⁽ᵗ⁺¹⁾' },
  { title: '簇间聚合', description: 'FedSAK: 轨迹范数正则化' }
])

// 模拟簇状态数据
const clusterStatus = ref([
  {
    id: 1,
    name: '簇 1',
    color: '#1890ff',
    onlineClients: 6,
    totalClients: 8,
    progress: 75,
    avgLoss: 0.2456,
    totalSamples: 8500,
    active: true
  },
  {
    id: 2,
    name: '簇 2',
    color: '#52c41a',
    onlineClients: 5,
    totalClients: 7,
    progress: 82,
    avgLoss: 0.2134,
    totalSamples: 7200,
    active: true
  },
  {
    id: 3,
    name: '簇 3',
    color: '#fa8c16',
    onlineClients: 6,
    totalClients: 6,
    progress: 68,
    avgLoss: 0.1987,
    totalSamples: 6800,
    active: true
  },
  {
    id: 4,
    name: '簇 4',
    color: '#722ed1',
    onlineClients: 0,
    totalClients: 4,
    progress: 0,
    avgLoss: null,
    totalSamples: 0,
    active: false
  }
])

// 模拟阶段切换
let phaseTimer = null
const simulatePhaseProgress = () => {
  if (!props.isLive) return
  
  if (phaseTimer) {
    clearInterval(phaseTimer)
  }
  
  phaseTimer = setInterval(() => {
    currentPhase.value = (currentPhase.value + 1) % 4
    
    // 更新簇状态
    clusterStatus.value.forEach(cluster => {
      if (cluster.active) {
        cluster.progress = Math.min(100, cluster.progress + Math.random() * 10)
        cluster.avgLoss = Math.max(0.1, cluster.avgLoss * (0.98 + Math.random() * 0.02))
      }
    })
  }, 3000)
}

// 回放控制方法
const onReplayRoundChange = (value) => {
  emit('roundChange', value)
}

const playReplay = () => {
  isPlaying.value = true
  emit('replayControl', { action: 'play', round: replayRound.value })
}

const pauseReplay = () => {
  isPlaying.value = false
  emit('replayControl', { action: 'pause' })
}

const stopReplay = () => {
  isPlaying.value = false
  replayRound.value = 0
  emit('replayControl', { action: 'stop' })
}

// 监听器
watch(() => props.isLive, (newVal) => {
  if (newVal) {
    simulatePhaseProgress()
  } else if (phaseTimer) {
    clearInterval(phaseTimer)
    phaseTimer = null
  }
}, { immediate: true })

watch(() => props.currentRound, (newVal) => {
  replayRound.value = newVal
})
</script>

<style scoped>
.progress-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-weight: bold;
  color: #1890ff;
}

.stats-row {
  margin: 16px 0;
}

.phase-indicator {
  margin: 16px 0;
}

.phase-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.status-section {
  margin: 16px 0;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.status-detail {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.replay-controls {
  margin-top: 16px;
}

.replay-slider {
  margin: 8px 0;
}

.replay-buttons {
  display: flex;
  justify-content: center;
}

.cluster-status-card {
  flex: 0 0 auto;
}

.cluster-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cluster-item {
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s;
}

.cluster-item.active {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.cluster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cluster-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.cluster-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.cluster-stats {
  font-size: 12px;
  color: #666;
}

.cluster-progress {
  margin: 8px 0;
}

.cluster-metrics {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric {
  color: #666;
}
</style>
