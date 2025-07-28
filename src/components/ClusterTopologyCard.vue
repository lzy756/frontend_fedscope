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
            <!-- <template #icon>∑</template> -->
            <template #icon>
              <component :is="ZoomInOutlined" />
            </template>
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
          <div class="legend-color cluster"></div>
          <span>客户端簇 (L1)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color client-participating"></div>
          <span>参与训练客户端 (L0)</span>
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
          <span>L3→L2 聚合器连接</span>
        </div>
        <div class="legend-item">
          <div class="legend-line proxy-cluster"></div>
          <span>L2→L1 簇管理连接</span>
        </div>
        <div class="legend-item">
          <div class="legend-line cluster-client-active"></div>
          <span>L1→L0 参与训练连接</span>
        </div>
        <div class="legend-item">
          <div class="legend-line full-connect"></div>
          <span>全连接阶段</span>
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
          <div class="formula" v-html="katex.renderToString('\\theta_i^{(t+1)} = \\sum_{c \\in \\mathcal{C}_i} \\frac{n_c}{N_i}\\,\\theta_c^{(t)}, \\qquad N_i = \\sum_{c \\in \\mathcal{C}_i} n_c')"></div>
          <div class="formula-desc">
            其中 nᶜ 为客户端c的样本数
          </div>
        </div>
        
        <h4>簇间 FedSAK</h4>
        <div class="formula-block">
          <div class="formula-step">
            <strong>1. 构建张量堆叠结构：</strong>
            <div class="formula" v-html="katex.renderToString('W^l = \\text{stack}(w_1^l, w_2^l, \\ldots, w_M^l)')"></div>
          </div>
          <div class="formula-step">
            <strong>2. 定义正则化项：</strong>
            <div class="formula" v-html="katex.renderToString('\\mathcal{L}_r = \\sum_{l=1}^L \\sum_{k=1}^{p} \\left\\| W_{(k)}^l \\right\\|_*')"></div>
            <div class="formula-desc">
              其中 <span v-html="katex.renderToString('W_{(k)}^l')"></span> 是张量在第 <span v-html="katex.renderToString('k')"></span> 模下的 unfolding 矩阵。
            </div>
          </div>
          <div class="formula-step">
            <strong>3. 次梯度下降优化共享层：</strong>
            <div class="formula" v-html="katex.renderToString('\\frac{\\partial \\left\\| W_{(k)}^l \\right\\|_*}{\\partial W_{(k)}^l} = U V^\\top')"></div>
            <div class="formula-desc">
              其中 <span v-html="katex.renderToString('U')"></span> 和 <span v-html="katex.renderToString('V')"></span> 是 <span v-html="katex.renderToString('W_{(k)}^l')"></span> 的 SVD 分解结果。
            </div>
          </div>
          <div class="formula-step">
            <div class="formula" v-html="katex.renderToString('\\tilde{w}_i^t = w_i^t - \\eta_w \\nabla \\mathcal{L}_r')"></div>
            <div class="formula-desc">
              对每个客户端上传的共享切片，执行一次梯度下降。
            </div>
          </div>
        </div>
        
        <h4>符号释义</h4>
        <div class="formula-block">
          <div class="formula-desc">
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('L')"></span>
              <span class="symbol-colon">：</span>
              <span>模型总层数</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('p')"></span>
              <span class="symbol-colon">：</span>
              <span>张量阶数（层参数展成张量后的阶数）</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('M')"></span>
              <span class="symbol-colon">：</span>
              <span>客户端总数</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('w_i^l')"></span>
              <span class="symbol-colon">：</span>
              <span>客户端<span v-html="katex.renderToString('i')"></span>在第<span v-html="katex.renderToString('l')"></span>层的共享参数</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('W^l')"></span>
              <span class="symbol-colon">：</span>
              <span>第<span v-html="katex.renderToString('l')"></span>层所有客户端共享参数堆叠成的张量</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('\\mathcal{L}_r')"></span>
              <span class="symbol-colon">：</span>
              <span>正则化损失 <span v-html="katex.renderToString('\\mathcal{L}_r = \\sum_{l=1}^L \\sum_{k=1}^{p} \\left\\| W_{(k)}^l \\right\\|_*')"></span></span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('W_{(k)}^l')"></span>
              <span class="symbol-colon">：</span>
              <span>张量<span v-html="katex.renderToString('W^l')"></span>在第<span v-html="katex.renderToString('k')"></span>模下的 unfolding 矩阵</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('U, V')"></span>
              <span class="symbol-colon">：</span>
              <span><span v-html="katex.renderToString('W_{(k)}^l')"></span>的 SVD 分解结果，用于计算迹范数的次梯度 <span v-html="katex.renderToString('\\frac{\\partial \\left\\| W_{(k)}^l \\right\\|_*}{\\partial W_{(k)}^l} = U V^\\top')"></span></span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('\\eta_w')"></span>
              <span class="symbol-colon">：</span>
              <span>FedSAK 步长 (学习率)</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('\\tilde{w}_i^t')"></span>
              <span class="symbol-colon">：</span>
              <span>服务器针对客户端<span v-html="katex.renderToString('i')"></span>个性化后的共享层</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('|\\cdot|_*')"></span>
              <span class="symbol-colon">：</span>
              <span>矩阵核范数（trace norm）</span>
            </div>
            <div class="symbol-definition">
              <span class="symbol-label" v-html="katex.renderToString('\\mathrm{stack}(\\cdot)')"></span>
              <span class="symbol-colon">：</span>
              <span>沿新维度将向量/矩阵堆叠为张量</span>
            </div>
          </div>
        </div>
        
        <h4>当前参数</h4>
        <a-descriptions :column="2" size="small">
          <a-descriptions-item label="正则化系数">
            <span v-html="katex.renderToString('\\lambda = ' + currentParams.lambda)"></span>
          </a-descriptions-item>
          <a-descriptions-item label="学习率">
            <span v-html="katex.renderToString('\\eta_w = ' + currentParams.etaW)"></span>
          </a-descriptions-item>
          <a-descriptions-item label="簇数">
            <span v-html="katex.renderToString('K = ' + currentParams.numClusters)"></span>
          </a-descriptions-item>
          <a-descriptions-item label="客户端数">
            <span v-html="katex.renderToString('C = ' + currentParams.totalClients)"></span>
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
          <a-descriptions-item label="客户端数量" v-if="selectedNode.clientCount">
            {{ selectedNode.clientCount }} 个客户端
          </a-descriptions-item>
          <a-descriptions-item label="参与训练" v-if="selectedNode.type === 'client'">
            <a-tag :color="selectedNode.participating ? 'green' : 'orange'">
              {{ selectedNode.participating ? '是' : '否' }}
            </a-tag>
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
  ReloadOutlined,
  ZoomInOutlined
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
const lastUpdatedRound = ref(-1) // 记录上次更新客户端参与状态的轮次

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
    
    // L1 - Client Clusters (虚拟节点，用于展示簇分组)
    { id: 'cluster_1', name: '客户端簇 C₁', type: 'cluster', x: 200, y: 220, clusterId: 1, online: true, clientCount: 6 },
    { id: 'cluster_2', name: '客户端簇 C₂', type: 'cluster', x: 400, y: 220, clusterId: 2, online: true, clientCount: 7 },
    { id: 'cluster_3', name: '客户端簇 C₃', type: 'cluster', x: 600, y: 220, clusterId: 3, online: true, clientCount: 7 },
    
    // L0 - Clients (移除固定的participating值，由动态函数控制)
    { id: 'client_1_1', name: '客户端 1-1', type: 'client', x: 120, y: 300, clusterId: 1, online: true, sampleCount: 1000, currentLoss: 0.245 },
    { id: 'client_1_2', name: '客户端 1-2', type: 'client', x: 160, y: 300, clusterId: 1, online: true, sampleCount: 800, currentLoss: 0.234 },
    { id: 'client_1_3', name: '客户端 1-3', type: 'client', x: 200, y: 300, clusterId: 1, online: false, sampleCount: 1200, currentLoss: 0.267 },
    { id: 'client_1_4', name: '客户端 1-4', type: 'client', x: 240, y: 300, clusterId: 1, online: true, sampleCount: 950, currentLoss: 0.251 },
    { id: 'client_1_5', name: '客户端 1-5', type: 'client', x: 280, y: 300, clusterId: 1, online: true, sampleCount: 1100, currentLoss: 0.239 },
    { id: 'client_1_6', name: '客户端 1-6', type: 'client', x: 120, y: 340, clusterId: 1, online: true, sampleCount: 900, currentLoss: 0.256 },
    
    { id: 'client_2_1', name: '客户端 2-1', type: 'client', x: 320, y: 300, clusterId: 2, online: true, sampleCount: 900, currentLoss: 0.198 },
    { id: 'client_2_2', name: '客户端 2-2', type: 'client', x: 360, y: 300, clusterId: 2, online: true, sampleCount: 1100, currentLoss: 0.212 },
    { id: 'client_2_3', name: '客户端 2-3', type: 'client', x: 400, y: 300, clusterId: 2, online: true, sampleCount: 950, currentLoss: 0.203 },
    { id: 'client_2_4', name: '客户端 2-4', type: 'client', x: 440, y: 300, clusterId: 2, online: true, sampleCount: 1050, currentLoss: 0.189 },
    { id: 'client_2_5', name: '客户端 2-5', type: 'client', x: 480, y: 300, clusterId: 2, online: false, sampleCount: 800, currentLoss: 0.234 },
    { id: 'client_2_6', name: '客户端 2-6', type: 'client', x: 320, y: 340, clusterId: 2, online: true, sampleCount: 1200, currentLoss: 0.195 },
    { id: 'client_2_7', name: '客户端 2-7', type: 'client', x: 360, y: 340, clusterId: 2, online: true, sampleCount: 980, currentLoss: 0.208 },
    
    { id: 'client_3_1', name: '客户端 3-1', type: 'client', x: 520, y: 300, clusterId: 3, online: true, sampleCount: 1050, currentLoss: 0.189 },
    { id: 'client_3_2', name: '客户端 3-2', type: 'client', x: 560, y: 300, clusterId: 3, online: false, sampleCount: 800, currentLoss: 0.234 },
    { id: 'client_3_3', name: '客户端 3-3', type: 'client', x: 600, y: 300, clusterId: 3, online: true, sampleCount: 1150, currentLoss: 0.176 },
    { id: 'client_3_4', name: '客户端 3-4', type: 'client', x: 640, y: 300, clusterId: 3, online: true, sampleCount: 920, currentLoss: 0.201 },
    { id: 'client_3_5', name: '客户端 3-5', type: 'client', x: 680, y: 300, clusterId: 3, online: true, sampleCount: 1080, currentLoss: 0.183 },
    { id: 'client_3_6', name: '客户端 3-6', type: 'client', x: 520, y: 340, clusterId: 3, online: true, sampleCount: 1000, currentLoss: 0.192 },
    { id: 'client_3_7', name: '客户端 3-7', type: 'client', x: 560, y: 340, clusterId: 3, online: true, sampleCount: 950, currentLoss: 0.186 },
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

// 随机选择客户端参与训练
const updateClientParticipation = () => {
  const currentRound = props.currentRound
  
  // 使用轮次作为随机种子，确保相同轮次的结果一致
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  mockTopologyData.value.nodes.forEach(node => {
    if (node.type === 'client' && node.online) {
      // 为每个客户端在当前轮次生成唯一的种子
      const seed = currentRound * 1000 + parseInt(node.id.split('_')[2])
      const randomValue = seededRandom(seed)
      
      // 根据簇ID设置不同的参与率
      let participationRate = 0.6 // 默认60%参与率
      switch (node.clusterId) {
        case 1:
          participationRate = 0.5 // 簇1: 50%参与率
          break
        case 2:
          participationRate = 0.7 // 簇2: 70%参与率
          break
        case 3:
          participationRate = 0.6 // 簇3: 60%参与率
          break
      }
      
      // 第16轮后才开始随机选择，之前轮次保持全部参与
      if (currentRound >= 16) {
        node.participating = randomValue < participationRate
      } else {
        node.participating = true // 前期全部参与
      }
    } else if (!node.online) {
      node.participating = false // 离线客户端不参与
    }
  })
}

// 生成动态连接边
const generateEdges = () => {
  const edges = []
  
  // L3 -> L2: Aggregator to Proxies (始终存在)
  edges.push(
    { source: 'aggregator', target: 'proxy_1', type: 'agg-proxy' },
    { source: 'aggregator', target: 'proxy_2', type: 'agg-proxy' },
    { source: 'aggregator', target: 'proxy_3', type: 'agg-proxy' }
  )
  
  // L2 -> L1: Proxies to Client Clusters (始终存在)
  edges.push(
    { source: 'proxy_1', target: 'cluster_1', type: 'proxy-cluster' },
    { source: 'proxy_2', target: 'cluster_2', type: 'proxy-cluster' },
    { source: 'proxy_3', target: 'cluster_3', type: 'proxy-cluster' }
  )
  
  // 获取客户端节点
  const clients = mockTopologyData.value.nodes.filter(n => n.type === 'client')
  const clusters = mockTopologyData.value.nodes.filter(n => n.type === 'cluster')
  
  // 根据训练轮次决定连接方式
  const currentRound = props.currentRound
  
  if (currentRound <= 5) {
    // L1 -> L0: 前5轮：全连接状态，每个客户端连接到所有簇
    clients.forEach(client => {
      clusters.forEach(cluster => {
        edges.push({
          source: cluster.id,
          target: client.id,
          type: 'cluster-client-full',
          strength: 1.0
        })
      })
    })
  } else if (currentRound <= 15) {
    // L1 -> L0: 第6-15轮：逐渐减少连接，聚类过程
    const clusteringProgress = (currentRound - 5) / 10  // 0 到 1
    
    clients.forEach(client => {
      clusters.forEach(cluster => {
        const isTargetCluster = cluster.clusterId === client.clusterId
        const shouldConnect = isTargetCluster || Math.random() > clusteringProgress * 0.8
        
        if (shouldConnect) {
          edges.push({
            source: cluster.id,
            target: client.id,
            type: isTargetCluster ? 'cluster-client-target' : 'cluster-client-fading',
            strength: isTargetCluster ? 1.0 : Math.max(0.1, 1.0 - clusteringProgress)
          })
        }
      })
    })
  } else {
    // L1 -> L0: 第16轮之后：只保留最终簇分配连接，并突出显示参与训练的客户端
    clients.forEach(client => {
      const targetCluster = clusters.find(c => c.clusterId === client.clusterId)
      if (targetCluster) {
        const edgeType = client.participating ? 'cluster-client-active' : 'cluster-client-inactive'
        edges.push({
          source: targetCluster.id,
          target: client.id,
          type: edgeType,
          strength: client.participating ? 1.0 : 0.3
        })
      }
    })
  }
  
  return edges
}

// 添加日志数据
const generateNodeLogs = (nodeId) => {
  const logs = []
  const node = mockTopologyData.value.nodes.find(n => n.id === nodeId)
  
  for (let i = 0; i < 5; i++) {
    const round = props.currentRound - i
    if (round >= 0) {
      let message = ''
      
      if (node?.type === 'client') {
        // 为客户端生成参与状态相关的日志
        const wasParticipating = round >= 16 ? checkClientParticipationAtRound(nodeId, round) : true
        if (wasParticipating) {
          message = `轮次 ${round}: 参与训练，模型上传完成，损失：0.${Math.floor(Math.random() * 300 + 150)}`
        } else {
          message = `轮次 ${round}: 未被选中参与训练，等待下轮选择`
        }
      } else {
        message = `轮次 ${round}: 模型聚合完成，损失：0.${Math.floor(Math.random() * 300 + 150)}`
      }
      
      logs.push({
        id: `log_${nodeId}_${i}`,
        time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
        message: message,
        level: Math.random() > 0.8 ? 'warning' : 'info'
      })
    }
  }
  return logs
}

// 检查特定轮次的客户端参与状态
const checkClientParticipationAtRound = (clientId, round) => {
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  const node = mockTopologyData.value.nodes.find(n => n.id === clientId)
  if (!node || !node.online) return false
  
  const seed = round * 1000 + parseInt(clientId.split('_')[2])
  const randomValue = seededRandom(seed)
  
  let participationRate = 0.6
  switch (node.clusterId) {
    case 1: participationRate = 0.5; break
    case 2: participationRate = 0.7; break
    case 3: participationRate = 0.6; break
  }
  
  return round >= 16 ? randomValue < participationRate : true
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
      text: `分簇联邦学习拓扑 (四层架构) - 轮次 ${props.currentRound}`,
      subtext: `参与训练客户端: ${getParticipatingClientsCount()}/${getTotalOnlineClientsCount()}`,
      left: 'center',
      textStyle: {
        fontSize: 14
      },
      subtextStyle: {
        fontSize: 12,
        color: '#666'
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
      // L3->L2: 聚合器到代理，使用紫色
      return '#722ed1'
      
    case 'proxy-cluster':
      // L2->L1: 代理到客户端簇，使用簇颜色
      const targetCluster = mockTopologyData.value.nodes.find(n => n.id === edge.target)
      if (targetCluster?.clusterId) {
        const cluster = mockTopologyData.value.clusters.find(c => c.id === targetCluster.clusterId)
        return cluster ? cluster.color : '#1890ff'
      }
      return '#1890ff'
      
    case 'cluster-client-full':
      // L1->L0: 全连接阶段，较淡的灰色
      return '#bfbfbf'
      
    case 'cluster-client-target':
      // L1->L0: 目标簇连接，使用簇颜色
      const sourceCluster = mockTopologyData.value.nodes.find(n => n.id === edge.source)
      if (sourceCluster?.clusterId) {
        const cluster = mockTopologyData.value.clusters.find(c => c.id === sourceCluster.clusterId)
        return cluster ? cluster.color : '#1890ff'
      }
      return '#1890ff'
      
    case 'cluster-client-fading':
      // L1->L0: 正在消失的连接，红色
      return '#ff7875'
      
    case 'cluster-client-active':
      // L1->L0: 参与训练的客户端连接，鲜艳的簇颜色
      const activeCluster = mockTopologyData.value.nodes.find(n => n.id === edge.source)
      if (activeCluster?.clusterId) {
        const cluster = mockTopologyData.value.clusters.find(c => c.id === activeCluster.clusterId)
        return cluster ? cluster.color : '#1890ff'
      }
      return '#1890ff'
      
    case 'cluster-client-inactive':
      // L1->L0: 未参与训练的客户端连接，较淡的簇颜色
      const inactiveCluster = mockTopologyData.value.nodes.find(n => n.id === edge.source)
      if (inactiveCluster?.clusterId) {
        const cluster = mockTopologyData.value.clusters.find(c => c.id === inactiveCluster.clusterId)
        return cluster ? cluster.color + '80' : '#1890ff80'  // 添加透明度
      }
      return '#1890ff80'
      
    default:
      return '#999'
  }
}

// 根据边类型获取线宽
const getEdgeWidthByType = (edge) => {
  switch (edge.type) {
    case 'agg-proxy':
      return 3  // L3->L2: 聚合器连接较粗
    case 'proxy-cluster':
      return 2  // L2->L1: 代理到簇连接中等
    case 'cluster-client-full':
      return 1  // L1->L0: 全连接时较细
    case 'cluster-client-target':
      return 2  // L1->L0: 目标连接中等
    case 'cluster-client-fading':
      return 1  // L1->L0: 消失连接较细
    case 'cluster-client-active':
      return 3  // L1->L0: 参与训练连接较粗
    case 'cluster-client-inactive':
      return 1  // L1->L0: 未参与训练连接较细
    default:
      return 2
  }
}

// 根据边类型获取透明度
const getEdgeOpacityByType = (edge) => {
  switch (edge.type) {
    case 'agg-proxy':
      return 1.0  // L3->L2: 聚合器连接完全不透明
    case 'proxy-cluster':
      return 1.0  // L2->L1: 代理到簇连接完全不透明
    case 'cluster-client-full':
      return 0.3  // L1->L0: 全连接时很透明
    case 'cluster-client-target':
      return 0.8  // L1->L0: 目标连接较不透明
    case 'cluster-client-fading':
      return Math.max(0.1, edge.strength || 0.5)  // L1->L0: 根据强度动态变化
    case 'cluster-client-active':
      return 1.0  // L1->L0: 参与训练连接完全不透明
    case 'cluster-client-inactive':
      return 0.3  // L1->L0: 未参与训练连接很透明
    default:
      return 0.6
  }
}

// 获取节点大小
const getNodeSize = (type) => {
  switch (type) {
    case 'aggregator': return 40
    case 'proxy': return 30
    case 'cluster': return 25
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
  if (node.type === 'cluster') {
    const cluster = mockTopologyData.value.clusters.find(c => c.id === node.clusterId)
    return cluster ? cluster.color + '40' : '#1890ff40'  // 半透明显示
  }
  if (node.type === 'client') {
    if (!node.online) return '#ff4d4f'  // 离线：红色
    if (node.participating) return '#52c41a'  // 参与训练：绿色
    return '#d9d9d9'  // 在线但未参与：灰色
  }
  return '#1890ff'
}

// 获取参与训练的客户端数量
const getParticipatingClientsCount = () => {
  return mockTopologyData.value.nodes.filter(n => 
    n.type === 'client' && n.online && n.participating
  ).length
}

// 获取在线客户端总数
const getTotalOnlineClientsCount = () => {
  return mockTopologyData.value.nodes.filter(n => 
    n.type === 'client' && n.online
  ).length
}

// 节点类型标签
const getNodeTypeLabel = (type) => {
  switch (type) {
    case 'aggregator': return 'FedSAK聚合器 (L3)'
    case 'proxy': return '簇代理 (L2)'
    case 'cluster': return '客户端簇 (L1)'
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
watch(() => props.currentRound, (newRound, oldRound) => {
  // 只有当轮次实际发生变化时才更新客户端参与状态
  if (newRound !== lastUpdatedRound.value) {
    console.log(`轮次变化: ${oldRound} -> ${newRound}, 重新选择参与客户端`)
    lastUpdatedRound.value = newRound
    updateClientParticipation()
  }
  updateChart()
})

watch(() => props.experimentData, () => {
  updateChart()
}, { deep: true })

onMounted(async () => {
  await nextTick()
  // 初始化时设置客户端参与状态
  lastUpdatedRound.value = props.currentRound
  updateClientParticipation()
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

.legend-color.cluster {
  background-color: #1890ff;
  opacity: 0.4;
}

.legend-color.client-participating {
  background-color: #52c41a;
}

.legend-color.client-online {
  background-color: #d9d9d9;
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

.legend-line.proxy-cluster {
  background-color: #1890ff;
  height: 2px;
}

.legend-line.cluster-client-active {
  background-color: #52c41a;
  height: 3px;
}

.legend-line.full-connect {
  background-color: #bfbfbf;
  opacity: 0.3;
  height: 1px;
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

.symbol-definition {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
  text-align: left;
  font-style: normal;
}

.symbol-definition .symbol-label {
  margin-right: 8px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.symbol-definition .symbol-colon {
  margin: 0 8px;
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
