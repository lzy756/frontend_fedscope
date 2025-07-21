<template>
  <div class="metrics-tabs">
    <a-card title="实时指标" size="small">
      <a-tabs v-model:activeKey="activeTab" size="small">
        <a-tab-pane key="loss" tab="损失曲线">
          <div class="chart-container" ref="lossChartRef"></div>
          <div class="chart-controls">
            <a-space>
              <a-checkbox v-model:checked="showFedAvgLoss">FedAvg损失</a-checkbox>
              <a-checkbox v-model:checked="showFedSAKLoss">FedSAK正则损失</a-checkbox>
              <a-button size="small" @click="togglePause">
                {{ isPaused ? '继续' : '暂停' }}
              </a-button>
              <a-button size="small" @click="resetZoom">重置缩放</a-button>
            </a-space>
          </div>
        </a-tab-pane>
        
        <a-tab-pane key="accuracy" tab="准确度图像">
          <div class="chart-container" ref="accuracyChartRef"></div>
          <div class="chart-controls">
            <a-space>
              <a-checkbox v-model:checked="showFedAvgAccuracy">FedAvg准确度</a-checkbox>
              <a-checkbox v-model:checked="showFedSAKAccuracy">FedSAK准确度</a-checkbox>
              <a-button size="small" @click="togglePause">
                {{ isPaused ? '继续' : '暂停' }}
              </a-button>
              <a-button size="small" @click="resetAccuracyZoom">重置缩放</a-button>
            </a-space>
          </div>
        </a-tab-pane>
        
        <a-tab-pane key="convergence" tab="收敛分析">
          <div class="chart-container" ref="convergenceChartRef"></div>
          <div class="convergence-summary">
            <a-row :gutter="16">
              <a-col span="8">
                <a-statistic
                  title="收敛轮次"
                  :value="convergenceStats.convergedAt"
                  suffix="轮"
                />
              </a-col>
              <a-col span="8">
                <a-statistic
                  title="最终损失"
                  :value="convergenceStats.finalLoss"
                  :precision="4"
                />
              </a-col>
              <a-col span="8">
                <a-statistic
                  title="收敛速度"
                  :value="convergenceStats.convergenceRate"
                  suffix="%/轮"
                  :precision="2"
                />
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  experimentData: {
    type: Object,
    default: () => ({})
  },
  currentRound: {
    type: Number,
    default: 0
  },
  isLive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['metricUpdate'])

// 响应式数据
const activeTab = ref('loss')
const isPaused = ref(false)
const showFedAvgLoss = ref(true)
const showFedSAKLoss = ref(true)
const showFedAvgAccuracy = ref(true)
const showFedSAKAccuracy = ref(true)

// 图表引用
const lossChartRef = ref(null)
const accuracyChartRef = ref(null)
const convergenceChartRef = ref(null)

// 图表实例
let lossChart = null
let accuracyChart = null
let convergenceChart = null

// 模拟数据
const metricsData = ref({
  rounds: [],
  fedavgLoss: [],
  fedsakLoss: [],
  fedavgAccuracy: [],
  fedsakAccuracy: []
})

// 收敛统计
const convergenceStats = ref({
  convergedAt: 85,
  finalLoss: 0.1234,
  convergenceRate: 2.34
})

// 生成模拟数据
const generateMockData = () => {
  const rounds = []
  const fedavgLoss = []
  const fedsakLoss = []
  const fedavgAccuracy = []
  const fedsakAccuracy = []
  
  for (let i = 0; i <= props.currentRound; i++) {
    rounds.push(i)
    
    // FedAvg损失：指数衰减 + 噪声
    const baseLoss = 0.8 * Math.exp(-i / 30) + 0.1
    fedavgLoss.push(baseLoss + (Math.random() - 0.5) * 0.02)
    
    // FedSAK正则损失：更快收敛
    const regLoss = 0.6 * Math.exp(-i / 20) + 0.08
    fedsakLoss.push(regLoss + (Math.random() - 0.5) * 0.015)
    
    // FedAvg准确度：逐渐提升
    const baseAccuracy = Math.min(0.95, 0.2 + (1 - Math.exp(-i / 40)) * 0.7)
    fedavgAccuracy.push(baseAccuracy + (Math.random() - 0.5) * 0.03)
    
    // FedSAK准确度：收敛更快更稳定
    const regAccuracy = Math.min(0.97, 0.3 + (1 - Math.exp(-i / 25)) * 0.65)
    fedsakAccuracy.push(regAccuracy + (Math.random() - 0.5) * 0.02)
  }
  
  metricsData.value.rounds = rounds
  metricsData.value.fedavgLoss = fedavgLoss
  metricsData.value.fedsakLoss = fedsakLoss
  metricsData.value.fedavgAccuracy = fedavgAccuracy
  metricsData.value.fedsakAccuracy = fedsakAccuracy
}

// 初始化损失图表
const initLossChart = () => {
  if (!lossChartRef.value) return
  
  lossChart = echarts.init(lossChartRef.value)
  
  const option = {
    title: {
      text: '训练损失曲线',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      top: 30,
      data: ['FedAvg损失', 'FedSAK正则损失']
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        filterMode: 'filter'
      },
      {
        type: 'slider',
        xAxisIndex: [0],
        filterMode: 'filter'
      }
    ],
    xAxis: {
      type: 'category',
      data: metricsData.value.rounds,
      name: '轮次'
    },
    yAxis: {
      type: 'value',
      name: '损失值',
      scale: true
    },
    series: [
      {
        name: 'FedAvg损失',
        type: 'line',
        data: metricsData.value.fedavgLoss,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#1890ff' },
        markPoint: {
          data: [
            { type: 'min', name: '最小值' }
          ]
        }
      },
      {
        name: 'FedSAK正则损失',
        type: 'line',
        data: metricsData.value.fedsakLoss,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#52c41a' },
        markPoint: {
          data: [
            { type: 'min', name: '最小值' }
          ]
        }
      }
    ]
  }
  
  lossChart.setOption(option)
}

// 初始化准确度图表
const initAccuracyChart = () => {
  if (!accuracyChartRef.value) return
  
  accuracyChart = echarts.init(accuracyChartRef.value)
  
  const option = {
    title: {
      text: '模型准确度比较',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function(params) {
        let result = `轮次 ${params[0].axisValue}<br/>`
        params.forEach(param => {
          const accuracy = (param.value * 100).toFixed(2)
          result += `${param.marker}${param.seriesName}: ${accuracy}%<br/>`
        })
        return result
      }
    },
    legend: {
      top: 30,
      data: ['FedAvg准确度', 'FedSAK准确度']
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        filterMode: 'filter'
      },
      {
        type: 'slider',
        xAxisIndex: [0],
        filterMode: 'filter'
      }
    ],
    xAxis: {
      type: 'category',
      data: metricsData.value.rounds,
      name: '轮次'
    },
    yAxis: {
      type: 'value',
      name: '准确度',
      min: 0,
      max: 1,
      axisLabel: {
        formatter: function(value) {
          return (value * 100).toFixed(0) + '%'
        }
      }
    },
    series: [
      {
        name: 'FedAvg准确度',
        type: 'line',
        data: metricsData.value.fedavgAccuracy,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#1890ff' },
        markPoint: {
          data: [
            { type: 'max', name: '最大值' }
          ]
        }
      },
      {
        name: 'FedSAK准确度',
        type: 'line',
        data: metricsData.value.fedsakAccuracy,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#52c41a' },
        markPoint: {
          data: [
            { type: 'max', name: '最大值' }
          ]
        }
      }
    ]
  }
  
  accuracyChart.setOption(option)
}

// 初始化收敛分析图表
const initConvergenceChart = () => {
  if (!convergenceChartRef.value) return
  
  convergenceChart = echarts.init(convergenceChartRef.value)
  
  // 计算收敛分析数据
  const convergenceData = []
  const gradientData = []
  const lossData = metricsData.value.fedavgLoss
  
  for (let i = 1; i < lossData.length; i++) {
    const improvement = Math.abs(lossData[i-1] - lossData[i]) / lossData[i-1] * 100
    convergenceData.push(improvement)
    gradientData.push(lossData[i-1] - lossData[i])
  }
  
  const option = {
    title: {
      text: '收敛分析',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      top: 30,
      data: ['损失改善率(%)', '损失梯度']
    },
    xAxis: {
      type: 'category',
      data: metricsData.value.rounds.slice(1),
      name: '轮次'
    },
    yAxis: [
      {
        type: 'value',
        name: '改善率(%)',
        position: 'left'
      },
      {
        type: 'value',
        name: '梯度',
        position: 'right'
      }
    ],
    series: [
      {
        name: '损失改善率(%)',
        type: 'bar',
        data: convergenceData,
        itemStyle: { color: '#1890ff' },
        yAxisIndex: 0
      },
      {
        name: '损失梯度',
        type: 'line',
        data: gradientData,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#52c41a' },
        yAxisIndex: 1
      }
    ]
  }
  
  convergenceChart.setOption(option)
}

// 控制方法
const togglePause = () => {
  isPaused.value = !isPaused.value
  // TODO: 实现暂停逻辑
}

const resetZoom = () => {
  lossChart?.dispatchAction({
    type: 'dataZoom',
    start: 0,
    end: 100
  })
}

const resetAccuracyZoom = () => {
  accuracyChart?.dispatchAction({
    type: 'dataZoom',
    start: 0,
    end: 100
  })
}

// 更新所有图表
const updateAllCharts = () => {
  generateMockData()
  
  if (lossChart) {
    lossChart.setOption({
      xAxis: { data: metricsData.value.rounds },
      series: [
        { data: showFedAvgLoss.value ? metricsData.value.fedavgLoss : [] },
        { data: showFedSAKLoss.value ? metricsData.value.fedsakLoss : [] }
      ]
    })
  }
  
  if (accuracyChart) {
    accuracyChart.setOption({
      xAxis: { data: metricsData.value.rounds },
      series: [
        { data: showFedAvgAccuracy.value ? metricsData.value.fedavgAccuracy : [] },
        { data: showFedSAKAccuracy.value ? metricsData.value.fedsakAccuracy : [] }
      ]
    })
  }
  
  if (convergenceChart) {
    initConvergenceChart()
  }
}

// 监听器
watch(() => props.currentRound, () => {
  if (!isPaused.value) {
    updateAllCharts()
  }
})

watch([showFedAvgLoss, showFedSAKLoss], () => {
  if (lossChart) {
    lossChart.setOption({
      series: [
        { data: showFedAvgLoss.value ? metricsData.value.fedavgLoss : [] },
        { data: showFedSAKLoss.value ? metricsData.value.fedsakLoss : [] }
      ]
    })
  }
})

watch([showFedAvgAccuracy, showFedSAKAccuracy], () => {
  if (accuracyChart) {
    accuracyChart.setOption({
      series: [
        { data: showFedAvgAccuracy.value ? metricsData.value.fedavgAccuracy : [] },
        { data: showFedSAKAccuracy.value ? metricsData.value.fedsakAccuracy : [] }
      ]
    })
  }
})

// 生命周期
onMounted(async () => {
  await nextTick()
  generateMockData()
  initLossChart()
  initAccuracyChart()
  initConvergenceChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    lossChart?.resize()
    accuracyChart?.resize()
    convergenceChart?.resize()
  })
})
</script>

<style scoped>
.metrics-tabs {
  overflow: visible;
  position: relative;
  box-sizing: border-box;
}

.chart-container {
  height: 250px;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  overflow: visible;
  position: relative;
}

.chart-controls {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.convergence-summary {
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

:deep(.ant-tabs-content) {
  height: auto;
}

:deep(.ant-tabs-tabpane) {
  height: auto;
}
</style>
