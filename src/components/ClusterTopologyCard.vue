<template>
  <div class="cluster-topology-card">
    <a-card title="分簇联邦学习拓扑图" :loading="loading">
      <template #extra>
        <a-space>
          <a-button 
            size="small" 
            @click="showFormulaModal"
            title="查看公式详情"
          >
            <template #icon>∑</template>
            公式
          </a-button>
          <a-button 
            size="small" 
            :disabled="!canReplay"
            @click="toggleReplay"
          >
            <template #icon>
              <PlayCircleOutlined v-if="!isReplaying" />
              <PauseCircleOutlined v-else />
            </template>
            {{ isReplaying ? '暂停' : '回放' }}
          </a-button>
          <a-button size="small" @click="resetView">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
        </a-space>
      </template>
      
      <div class="topology-container" ref="topologyRef"></div>
      
      <!-- 图例 -->
      <div class="topology-legend">
        <div class="legend-item">
          <div class="legend-color aggregator"></div>
          <span>FedSAK聚合器 (L3)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color proxy"></div>
          <span>簇代理 (L2)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color client-online"></div>
          <span>在线客户端 (L0)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color client-offline"></div>
          <span>离线客户端 (L0)</span>
        </div>
        <div class="legend-item">
          <div class="legend-line agg-proxy"></div>
          <span>聚合器连接</span>
        </div>
        <div class="legend-item">
          <div class="legend-line full-connect"></div>
          <span>全连接阶段</span>
        </div>
        <div class="legend-item">
          <div class="legend-line cluster-connect"></div>
          <span>簇分配连接</span>
        </div>
        <div class="legend-item">
          <div class="legend-line fading-connect"></div>
          <span>消失连接</span>
        </div>
      </div>
    </a-card>

    <!-- 公式详情模态框 -->
    <a-modal 
      v-model:open="formulaModalVisible"
      title="FedSAK算法公式"
      width="700px"
      :footer="null"
    >
      <div class="formula-content">
        <h4>簇内 FedAvg</h4>
        <div class="formula-block">
          <div class="formula">
            θᵢ⁽ᵗ⁺¹⁾ = Σ(c∈𝒞ᵢ) (nᶜ/Nᵢ) · θᶜ⁽ᵗ⁾
          </div>
          <div class="formula-desc">
            其中 Nᵢ = Σ(c∈𝒞ᵢ) nᶜ，nᶜ为客户端c的样本数
          </div>
        </div>
        
        <h4>簇间 FedSAK</h4>
        <div class="formula-block">
          <div class="formula-step">
            <strong>1. 张量堆叠:</strong>
            <div class="formula">W⁽ˡ⁾ = stack(θ₁⁽ˡ⁾, ..., θₖ⁽ˡ⁾)</div>
          </div>
          <div class="formula-step">
            <strong>2. 轨迹范数正则:</strong>
            <div class="formula">
              𝓛ᵣ = λ Σ(l=1 to L) Σ(k=1 to p) ‖W⁽ˡ⁾₍ₖ₎‖*
            </div>
          </div>
          <div class="formula-step">
            <strong>3. 子梯度更新:</strong>
            <div class="formula">
              θᵢ⁽ˡ⁾ ← θᵢ⁽ˡ⁾ - ηᵩ(UVᵀ)ᵢ
            </div>
          </div>
        </div>
        
        <h4>当前参数</h4>
        <a-descriptions :column="2" size="small">
          <a-descriptions-item label="正则化系数 λ">
            {{ currentParams.lambda }}
          </a-descriptions-item>
          <a-descriptions-item label="学习率 ηᵩ">
            {{ currentParams.etaW }}
          </a-descriptions-item>
          <a-descriptions-item label="簇数 K">
            {{ currentParams.numClusters }}
          </a-descriptions-item>
          <a-descriptions-item label="客户端数">
            {{ currentParams.totalClients }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>

    <!-- 节点详情抽屉 -->
    <a-drawer
      v-model:open="nodeDrawerVisible"
      :title="selectedNode ? `${selectedNode.name} 详情` : '节点详情'"
      width="400"
    >
      <div v-if="selectedNode">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="节点类型">
            {{ getNodeTypeLabel(selectedNode.type) }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="selectedNode.online ? 'green' : 'red'">
              {{ selectedNode.online ? '在线' : '离线' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="所属簇" v-if="selectedNode.clusterId">
            簇 {{ selectedNode.clusterId }}
          </a-descriptions-item>
          <a-descriptions-item label="样本数量" v-if="selectedNode.sampleCount">
            {{ selectedNode.sampleCount }}
          </a-descriptions-item>
          <a-descriptions-item label="当前损失" v-if="selectedNode.currentLoss">
            {{ selectedNode.currentLoss.toFixed(4) }}
          </a-descriptions-item>
        </a-descriptions>
        
        <a-divider>最近日志</a-divider>
        <div class="node-logs">
          <div 
            v-for="log in selectedNode.logs || []" 
            :key="log.id"
            class="log-item"
            :class="log.level"
          >
            <div class="log-time">{{ log.time }}</div>
            <div class="log-message">{{ log.message }}</div>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ReloadOutlined 
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
  isLive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['nodeClick', 'roundChange'])

// 响应式数据
const loading = ref(false)
const topologyRef = ref(null)
const formulaModalVisible = ref(false)
const nodeDrawerVisible = ref(false)
const selectedNode = ref(null)
const isReplaying = ref(false)
const canReplay = ref(false)

let chartInstance = null

// 当前参数
const currentParams = ref({
  lambda: 1e-3,
  etaW: 0.1,
  numClusters: 4,
  totalClients: 20
})

// 模拟拓扑数据
const mockTopologyData = ref({
  nodes: [
    // L3 - FedSAK Aggregator
    { id: 'aggregator', name: 'FedSAK聚合器', type: 'aggregator', x: 400, y: 50, online: true },
    
    // L2 - Cluster Proxies
    { id: 'proxy_1', name: '簇代理 1', type: 'proxy', x: 200, y: 150, clusterId: 1, online: true },
    { id: 'proxy_2', name: '簇代理 2', type: 'proxy', x: 400, y: 150, clusterId: 2, online: true },
    { id: 'proxy_3', name: '簇代理 3', type: 'proxy', x: 600, y: 150, clusterId: 3, online: true },
    
    // L0 - Clients
    { id: 'client_1_1', name: '客户端 1-1', type: 'client', x: 150, y: 280, clusterId: 1, online: true, sampleCount: 1000, currentLoss: 0.245 },
    { id: 'client_1_2', name: '客户端 1-2', type: 'client', x: 200, y: 280, clusterId: 1, online: true, sampleCount: 800, currentLoss: 0.234 },
    { id: 'client_1_3', name: '客户端 1-3', type: 'client', x: 250, y: 280, clusterId: 1, online: false, sampleCount: 1200, currentLoss: 0.267 },
    
    { id: 'client_2_1', name: '客户端 2-1', type: 'client', x: 350, y: 280, clusterId: 2, online: true, sampleCount: 900, currentLoss: 0.198 },
    { id: 'client_2_2', name: '客户端 2-2', type: 'client', x: 400, y: 280, clusterId: 2, online: true, sampleCount: 1100, currentLoss: 0.212 },
    { id: 'client_2_3', name: '客户端 2-3', type: 'client', x: 450, y: 280, clusterId: 2, online: true, sampleCount: 950, currentLoss: 0.203 },
    
    { id: 'client_3_1', name: '客户端 3-1', type: 'client', x: 550, y: 280, clusterId: 3, online: true, sampleCount: 1050, currentLoss: 0.189 },
    { id: 'client_3_2', name: '客户端 3-2', type: 'client', x: 600, y: 280, clusterId: 3, online: false, sampleCount: 800, currentLoss: 0.234 },
    { id: 'client_3_3', name: '客户端 3-3', type: 'client', x: 650, y: 280, clusterId: 3, online: true, sampleCount: 1150, currentLoss: 0.176 },
  ],
  // 动态边连接：根据训练轮次决定连接方式
  edges: [],
  // 簇分组信息
  clusters: [
    { id: 1, name: '簇 1', color: '#1890ff' },
    { id: 2, name: '簇 2', color: '#52c41a' },
    { id: 3, name: '簇 3', color: '#fa8c16' }
  ]
})

// 生成动态连接边
const generateEdges = () => {
  const edges = []
  
  // Aggregator to Proxies (始终存在)
  edges.push(
    { source: 'aggregator', target: 'proxy_1', type: 'agg-proxy' },
    { source: 'aggregator', target: 'proxy_2', type: 'agg-proxy' },
    { source: 'aggregator', target: 'proxy_3', type: 'agg-proxy' }
  )
  
  // 获取客户端节点
  const clients = mockTopologyData.value.nodes.filter(n => n.type === 'client')
  const proxies = mockTopologyData.value.nodes.filter(n => n.type === 'proxy')
  
  // 根据训练轮次决定连接方式
  const currentRound = props.currentRound
  
  if (currentRound <= 5) {
    // 前5轮：全连接状态，每个客户端连接到所有簇代理
    clients.forEach(client => {
      proxies.forEach(proxy => {
        edges.push({
          source: proxy.id,
          target: client.id,
          type: 'proxy-client-full',
          strength: 1.0
        })
      })
    })
  } else if (currentRound <= 15) {
    // 第6-15轮：逐渐减少连接，聚类过程
    const clusteringProgress = (currentRound - 5) / 10  // 0 到 1
    
    clients.forEach(client => {
      proxies.forEach(proxy => {
        const isTargetCluster = proxy.clusterId === client.clusterId
        const shouldConnect = isTargetCluster || Math.random() > clusteringProgress * 0.8
        
        if (shouldConnect) {
          edges.push({
            source: proxy.id,
            target: client.id,
            type: isTargetCluster ? 'proxy-client-target' : 'proxy-client-fading',
            strength: isTargetCluster ? 1.0 : Math.max(0.1, 1.0 - clusteringProgress)
          })
        }
      })
    })
  } else {
    // 第16轮之后：只保留最终簇分配连接
    clients.forEach(client => {
      const targetProxy = proxies.find(p => p.clusterId === client.clusterId)
      if (targetProxy) {
        edges.push({
          source: targetProxy.id,
          target: client.id,
          type: 'proxy-client-final',
          strength: 1.0
        })
      }
    })
  }
  
  return edges
}

// 添加日志数据
const generateNodeLogs = (nodeId) => {
  const logs = []
  for (let i = 0; i < 5; i++) {
    logs.push({
      id: `log_${nodeId}_${i}`,
      time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
      message: `轮次 ${props.currentRound - i}: 模型训练完成，损失：0.${Math.floor(Math.random() * 300 + 150)}`,
      level: Math.random() > 0.8 ? 'warning' : 'info'
    })
  }
  return logs
}

// 初始化图表
const initChart = () => {
  if (!topologyRef.value) return
  
  chartInstance = echarts.init(topologyRef.value)
  
  const option = getChartOption()
  chartInstance.setOption(option)
  
  // 添加点击事件
  chartInstance.on('click', 'series.nodes', (params) => {
    const node = mockTopologyData.value.nodes.find(n => n.id === params.data.name)
    if (node) {
      selectedNode.value = {
        ...node,
        logs: generateNodeLogs(node.id)
      }
      nodeDrawerVisible.value = true
      emit('nodeClick', node)
    }
  })
  
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

// 获取图表配置
const getChartOption = () => {
  const nodes = mockTopologyData.value.nodes.map(node => ({
    name: node.id,
    x: node.x,
    y: node.y,
    symbolSize: getNodeSize(node.type),
    itemStyle: {
      color: getNodeColor(node)
    },
    label: {
      show: true,
      position: 'bottom',
      fontSize: 10,
      formatter: node.name
    },
    emphasis: {
      focus: 'adjacency'
    }
  }))
  
  // 生成动态边
  const dynamicEdges = generateEdges()
  const edges = dynamicEdges.map(edge => ({
    source: edge.source,
    target: edge.target,
    lineStyle: {
      color: getEdgeColorByType(edge),
      width: getEdgeWidthByType(edge),
      opacity: getEdgeOpacityByType(edge),
      type: edge.type === 'proxy-client-fading' ? 'dashed' : 'solid'
    },
    emphasis: {
      focus: 'adjacency',
      lineStyle: {
        width: 4
      }
    }
  }))
  
  return {
    title: {
      text: `分簇联邦学习拓扑 - 轮次 ${props.currentRound}`,
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [{
      name: '拓扑图',
      type: 'graph',
      layout: 'none',
      data: nodes,
      links: edges,
      roam: true,
      focusNodeAdjacency: true,
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)'
      },
      lineStyle: {
        color: 'source',
        curveness: 0.1
      },
      emphasis: {
        scale: true
      }
    }]
    // 移除 graphic 属性，不再绘制虚线方框
  }
}

// 根据边类型获取颜色
const getEdgeColorByType = (edge) => {
  switch (edge.type) {
    case 'agg-proxy':
      // 聚合器到代理：使用代理的簇颜色
      const targetProxy = mockTopologyData.value.nodes.find(n => n.id === edge.target)
      if (targetProxy?.clusterId) {
        const cluster = mockTopologyData.value.clusters.find(c => c.id === targetProxy.clusterId)
        return cluster ? cluster.color : '#1890ff'
      }
      return '#722ed1'
      
    case 'proxy-client-full':
      // 全连接阶段：较淡的灰色
      return '#bfbfbf'
      
    case 'proxy-client-target':
      // 目标簇连接：使用簇颜色
      const sourceProxy = mockTopologyData.value.nodes.find(n => n.id === edge.source)
      if (sourceProxy?.clusterId) {
        const cluster = mockTopologyData.value.clusters.find(c => c.id === sourceProxy.clusterId)
        return cluster ? cluster.color : '#1890ff'
      }
      return '#1890ff'
      
    case 'proxy-client-fading':
      // 正在消失的连接：红色
      return '#ff7875'
      
    case 'proxy-client-final':
      // 最终簇连接：鲜艳的簇颜色
      const finalProxy = mockTopologyData.value.nodes.find(n => n.id === edge.source)
      if (finalProxy?.clusterId) {
        const cluster = mockTopologyData.value.clusters.find(c => c.id === finalProxy.clusterId)
        return cluster ? cluster.color : '#1890ff'
      }
      return '#1890ff'
      
    default:
      return '#999'
  }
}

// 根据边类型获取线宽
const getEdgeWidthByType = (edge) => {
  switch (edge.type) {
    case 'agg-proxy':
      return 3  // 聚合器连接较粗
    case 'proxy-client-full':
      return 1  // 全连接时较细
    case 'proxy-client-target':
      return 2  // 目标连接中等
    case 'proxy-client-fading':
      return 1  // 消失连接较细
    case 'proxy-client-final':
      return 3  // 最终连接较粗
    default:
      return 2
  }
}

// 根据边类型获取透明度
const getEdgeOpacityByType = (edge) => {
  switch (edge.type) {
    case 'agg-proxy':
      return 1.0  // 聚合器连接完全不透明
    case 'proxy-client-full':
      return 0.3  // 全连接时很透明
    case 'proxy-client-target':
      return 0.8  // 目标连接较不透明
    case 'proxy-client-fading':
      return Math.max(0.1, edge.strength || 0.5)  // 根据强度动态变化
    case 'proxy-client-final':
      return 1.0  // 最终连接完全不透明
    default:
      return 0.6
  }
}

// 获取节点大小
const getNodeSize = (type) => {
  switch (type) {
    case 'aggregator': return 40
    case 'proxy': return 30
    case 'client': return 20
    default: return 15
  }
}

// 获取节点颜色
const getNodeColor = (node) => {
  if (node.type === 'aggregator') return '#722ed1'
  if (node.type === 'proxy') {
    const cluster = mockTopologyData.value.clusters.find(c => c.id === node.clusterId)
    return cluster ? cluster.color : '#1890ff'
  }
  if (node.type === 'client') {
    return node.online ? '#52c41a' : '#ff4d4f'
  }
  return '#1890ff'
}

// 节点类型标签
const getNodeTypeLabel = (type) => {
  switch (type) {
    case 'aggregator': return 'FedSAK聚合器 (L3)'
    case 'proxy': return '簇代理 (L2)'
    case 'client': return '客户端 (L0)'
    default: return '未知'
  }
}

// 显示公式模态框
const showFormulaModal = () => {
  formulaModalVisible.value = true
}

// 切换回放状态
const toggleReplay = () => {
  isReplaying.value = !isReplaying.value
  // TODO: 实现回放逻辑
}

// 重置视图
const resetView = () => {
  if (chartInstance) {
    chartInstance.dispatchAction({
      type: 'restore'
    })
  }
}

// 更新图表
const updateChart = () => {
  if (chartInstance) {
    const option = getChartOption()
    chartInstance.setOption(option)
  }
}

// 监听数据变化
watch(() => props.currentRound, () => {
  updateChart()
})

watch(() => props.experimentData, () => {
  updateChart()
}, { deep: true })

onMounted(async () => {
  await nextTick()
  initChart()
})
</script>

<style scoped>
.cluster-topology-card {
  padding: 0;
  margin: 0;
}

.cluster-topology-card .ant-card-body {
  padding: 16px;
  overflow: visible;
}

.topology-container {
  height: 500px;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  overflow: visible;
}

.topology-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.legend-color.aggregator {
  background-color: #722ed1;
}

.legend-color.proxy {
  background-color: #1890ff;
}

.legend-color.client-online {
  background-color: #52c41a;
}

.legend-color.client-offline {
  background-color: #ff4d4f;
}

.legend-line {
  width: 20px;
  height: 2px;
}

.legend-line.agg-proxy {
  background-color: #722ed1;
  height: 3px;
}

.legend-line.full-connect {
  background-color: #bfbfbf;
  opacity: 0.3;
  height: 1px;
}

.legend-line.cluster-connect {
  background-color: #1890ff;
  height: 2px;
}

.legend-line.fading-connect {
  background-color: #ff7875;
  border-style: dashed;
  border-width: 1px 0 0 0;
  height: 0;
}

.formula-content h4 {
  color: #1890ff;
  margin: 16px 0 8px 0;
}

.formula-block {
  margin-bottom: 16px;
  padding: 12px;
  background: #f6f6f6;
  border-radius: 6px;
}

.formula-step {
  margin-bottom: 8px;
}

.formula {
  font-family: 'Times New Roman', serif;
  font-size: 16px;
  color: #333;
  margin: 8px 0;
  text-align: center;
  font-weight: bold;
}

.formula-desc {
  font-size: 12px;
  color: #666;
  text-align: center;
  font-style: italic;
}

.node-logs {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
}

.log-item.warning {
  border-left-color: #fa8c16;
  background-color: #fff7e6;
}

.log-item.info {
  border-left-color: #1890ff;
  background-color: #e6f7ff;
}

.log-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.log-message {
  font-size: 13px;
  color: #333;
}
</style>
