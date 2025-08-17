<template>
  <div class="experiments">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">实验管理</h1>
          <p class="page-description">管理和监控联邦学习实验</p>
        </div>
        <div class="action-section">
          <a-space>
            <a-button @click="refreshData">
              <template #icon>
                <ReloadOutlined />
              </template>
              刷新
            </a-button>
            <a-button type="primary" @click="showCreateModal">
              <template #icon>
                <PlusOutlined />
              </template>
              创建实验
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" class="stats-row">
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="总实验数"
            :value="stats.total"
            :value-style="{ color: '#3f8600' }"
          >
            <template #prefix>
              <ExperimentOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="运行中"
            :value="stats.running"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <PlayCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="已完成"
            :value="stats.completed"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="失败"
            :value="stats.failed"
            :value-style="{ color: '#f5222d' }"
          >
            <template #prefix>
              <CloseCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 筛选和搜索 -->
    <a-card class="filter-card">
      <a-form layout="inline" :model="filters">
        <a-form-item label="实验状态">
          <a-select
            v-model:value="filters.status"
            placeholder="选择状态"
            style="width: 120px"
            allow-clear
            @change="handleFilterChange"
          >
            <a-select-option value="running">运行中</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
            <a-select-option value="pending">待启动</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="算法类型">
          <a-select
            v-model:value="filters.algorithm"
            placeholder="选择算法"
            style="width: 150px"
            allow-clear
            @change="handleFilterChange"
          >
            <a-select-option value="Cluster-FedSAK">Cluster-FedSAK</a-select-option>
            <a-select-option value="FedAvg">FedAvg</a-select-option>
            <a-select-option value="FedProx">FedProx</a-select-option>
            <a-select-option value="FedOpt">FedOpt</a-select-option>
            <a-select-option value="SCAFFOLD">SCAFFOLD</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="搜索">
          <a-input
            v-model:value="filters.keyword"
            placeholder="搜索实验名称或描述"
            style="width: 200px"
            @change="handleFilterChange"
          >
            <template #suffix>
              <SearchOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item>
          <a-button @click="resetFilters">
            <template #icon>
              <ClearOutlined />
            </template>
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 实验列表 -->
    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredExperiments"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="showDetail(record)">{{ record.name }}</a>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              <template #icon>
                <component :is="getStatusIcon(record.status)" />
              </template>
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'progress'">
            <a-progress
              :percent="record.progress"
              :status="record.status === 'failed' ? 'exception' : 'normal'"
              size="small"
            />
          </template>
          <template v-else-if="column.key === 'participants'">
            <a-tag>{{ record.participants }}个参与方</a-tag>
          </template>
          <template v-else-if="column.key === 'duration'">
            {{ formatDuration(record.duration) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                type="link"
                size="small"
                @click="showDetail(record)"
              >
                <template #icon>
                  <EyeOutlined />
                </template>
                详情
              </a-button>
              <a-button
                v-if="record.status === 'running'"
                type="link"
                size="small"
                danger
                @click="stopExperiment(record)"
              >
                <template #icon>
                  <StopOutlined />
                </template>
                停止
              </a-button>
              <a-button
                v-if="record.status === 'pending'"
                type="link"
                size="small"
                @click="startExperiment(record)"
              >
                <template #icon>
                  <PlayCircleOutlined />
                </template>
                启动
              </a-button>
              <a-popconfirm
                title="确定要删除这个实验吗？"
                @confirm="deleteExperiment(record)"
              >
                <a-button
                  type="link"
                  size="small"
                  danger
                >
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建实验模态框 -->
    <a-modal
      v-model:open="createModalVisible"
      title="创建新实验"
      width="800px"
      @ok="handleCreateExperiment"
      @cancel="createModalVisible = false"
    >
      <a-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="实验名称" name="name">
              <a-input v-model:value="createForm.name" placeholder="输入实验名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="算法类型" name="algorithm">
              <a-select v-model:value="createForm.algorithm" placeholder="选择算法">
                <a-select-option value="Cluster-FedSAK">
                  <ClusterOutlined /> Cluster-FedSAK
                </a-select-option>
                <a-select-option value="FedAvg">
                  <NodeIndexOutlined /> FedAvg
                </a-select-option>
                <a-select-option value="FedProx">
                  <NodeIndexOutlined /> FedProx
                </a-select-option>
                <a-select-option value="FedOpt">
                  <NodeIndexOutlined /> FedOpt
                </a-select-option>
                <a-select-option value="SCAFFOLD">
                  <NodeIndexOutlined /> SCAFFOLD
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="实验描述" name="description">
          <a-textarea
            v-model:value="createForm.description"
            placeholder="输入实验描述"
            :rows="3"
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="训练轮次" name="rounds">
              <a-input-number
                v-model:value="createForm.rounds"
                :min="1"
                :max="1000"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="参与方数量" name="participantCount">
              <a-input-number
                v-model:value="createForm.participantCount"
                :min="2"
                :max="100"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="学习率" name="learningRate">
              <a-input-number
                v-model:value="createForm.learningRate"
                :min="0.001"
                :max="1"
                :step="0.001"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="数据集" name="dataset">
          <a-select v-model:value="createForm.dataset" placeholder="选择数据集">
            <a-select-option value="cifar10">
              <DatabaseOutlined /> CIFAR-10
            </a-select-option>
            <a-select-option value="mnist">
              <DatabaseOutlined /> MNIST
            </a-select-option>
            <a-select-option value="femnist">
              <DatabaseOutlined /> FEMNIST
            </a-select-option>
            <a-select-option value="shakespeare">
              <DatabaseOutlined /> Shakespeare
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 实验详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="实验详情"
      width="1400px"
      :footer="null"
      :style="{ top: '20px'}"
      wrap-class-name="experiment-detail-modal"
    >
      <div v-if="selectedExperiment">
        <a-tabs v-model:activeKey="detailActiveTab" type="card">
          <!-- Overview 标签页 -->
          <a-tab-pane key="overview" tab="概览">
            <a-descriptions :column="2" bordered>
              <a-descriptions-item label="实验名称">
                {{ selectedExperiment.name }}
              </a-descriptions-item>
              <a-descriptions-item label="实验状态">
                <a-tag :color="getStatusColor(selectedExperiment.status)">
                  {{ getStatusText(selectedExperiment.status) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="算法类型">
                {{ selectedExperiment.algorithm }}
              </a-descriptions-item>
              <a-descriptions-item label="创建时间">
                {{ selectedExperiment.createTime }}
              </a-descriptions-item>
              <a-descriptions-item label="训练进度">
                <a-progress :percent="selectedExperiment.progress" />
              </a-descriptions-item>
              <a-descriptions-item label="参与方数量">
                {{ selectedExperiment.participants }}
              </a-descriptions-item>
              <a-descriptions-item label="数据集">
                {{ selectedExperiment.dataset }}
              </a-descriptions-item>
              <a-descriptions-item label="学习率">
                {{ selectedExperiment.learningRate }}
              </a-descriptions-item>
              <a-descriptions-item label="实验描述" :span="2">
                {{ selectedExperiment.description }}
              </a-descriptions-item>
            </a-descriptions>
          </a-tab-pane>

          <!-- Metrics 标签页 -->
          <a-tab-pane key="metrics" tab="指标">
            <div class="metrics-placeholder">
              <a-empty description="基础指标图表将在此显示" />
            </div>
          </a-tab-pane>

          <!-- Cluster-FedSAK 标签页 -->
          <a-tab-pane key="cluster-fedsak" tab="分簇-FedSAK">
            <div class="cluster-fedsak-container">
              <a-button type="primary" @click="goToClusterFedSAKPage">
                <template #icon>
                  <FullscreenOutlined />
                </template>
                查看分簇-FedSAK可视化
              </a-button>
              <a-alert
                message="分簇-FedSAK 可视化已移至独立页面"
                description="点击上方按钮跳转到分簇-FedSAK可视化页面，您可以在那里查看详细的可视化内容。"
                type="info"
                show-icon
                style="margin-top: 16px;"
              />
            </div>
          </a-tab-pane>

          <!-- Logs 标签页 -->
          <a-tab-pane key="logs" tab="日志">
            <div class="logs-container">
              <a-timeline>
                <a-timeline-item
                  v-for="log in selectedExperiment.logs"
                  :key="log.id"
                  :color="log.type === 'error' ? 'red' : log.type === 'warning' ? 'orange' : 'blue'"
                >
                  <p><strong>{{ log.time }}</strong></p>
                  <p>{{ log.message }}</p>
                </a-timeline-item>
              </a-timeline>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message, Alert } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExperimentOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  StopOutlined,
  DeleteOutlined,
  ClearOutlined,
  DatabaseOutlined,
  ClusterOutlined,
  NodeIndexOutlined,
  FullscreenOutlined
} from '@ant-design/icons-vue'
import ClusterFedSAKView from '@/components/ClusterFedSAKView.vue'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const createModalVisible = ref(false)
const detailModalVisible = ref(false)
const detailActiveTab = ref('overview')
const createFormRef = ref()
const selectedExperiment = ref(null)

// 统计数据
const stats = ref({
  total: 0,
  running: 0,
  completed: 0,
  failed: 0
})

// 筛选条件
const filters = ref({
  status: '',
  algorithm: '',
  keyword: ''
})

// 创建实验表单
const createForm = ref({
  name: '',
  algorithm: '',
  description: '',
  rounds: 100,
  participantCount: 5,
  learningRate: 0.01,
  dataset: ''
})

// 表单验证规则
const createRules = {
  name: [{ required: true, message: '请输入实验名称' }],
  algorithm: [{ required: true, message: '请选择算法类型' }],
  rounds: [{ required: true, message: '请输入训练轮次' }],
  participantCount: [{ required: true, message: '请输入参与方数量' }],
  learningRate: [{ required: true, message: '请输入学习率' }],
  dataset: [{ required: true, message: '请选择数据集' }]
}

// 实验数据
const experiments = ref([
  {
    id: 1,
    name: 'CIFAR-10 分簇联邦学习实验',
    algorithm: 'Cluster-FedSAK',
    status: 'running',
    progress: 0, // 从0开始，这样可以看到完整的聚类过程
    participants: 20,
    dataset: 'CIFAR-10',
    learningRate: 0.01,
    duration: 5400000, // 毫秒
    createTime: '2025-01-20 09:30:00',
    description: '使用分簇-FedSAK算法在CIFAR-10数据集上进行图像分类实验，支持客户端异构特征聚类',
    logs: [
      { id: 1, time: '09:30:00', message: '分簇联邦学习实验启动', type: 'info' },
      { id: 2, time: '09:35:00', message: '客户端聚类完成，生成4个簇', type: 'success' },
      { id: 3, time: '10:00:00', message: '第0轮初始化完成，开始FedSAK训练', type: 'info' },
      { id: 4, time: '10:30:00', message: '全连接阶段，所有客户端均连接至各簇代理', type: 'success' }
    ]
  },
  {
    id: 2,
    name: 'CIFAR-10 传统联邦学习',
    algorithm: 'FedAvg',
    status: 'completed',
    progress: 100,
    participants: 5,
    dataset: 'CIFAR-10',
    learningRate: 0.01,
    duration: 3600000, // 毫秒
    createTime: '2024-01-15 10:30:00',
    description: '使用 FedAvg 算法在 CIFAR-10 数据集上进行图像分类实验',
    logs: [
      { id: 1, time: '10:30:00', message: '实验启动', type: 'info' },
      { id: 2, time: '10:35:00', message: '参与方连接成功', type: 'success' },
      { id: 3, time: '11:00:00', message: '第10轮训练完成，准确率: 78.5%', type: 'info' }
    ]
  },
  {
    id: 3,
    name: 'MNIST 手写数字识别',
    algorithm: 'FedProx',
    status: 'completed',
    progress: 100,
    participants: 8,
    dataset: 'MNIST',
    learningRate: 0.005,
    duration: 2400000,
    createTime: '2024-01-14 14:20:00',
    description: '使用 FedProx 算法进行手写数字识别任务',
    logs: [
      { id: 1, time: '14:20:00', message: '实验启动', type: 'info' },
      { id: 2, time: '14:25:00', message: '所有参与方已连接', type: 'success' },
      { id: 3, time: '15:00:00', message: '训练完成，最终准确率: 95.2%', type: 'success' }
    ]
  },
  {
    id: 4,
    name: '文本分类实验',
    algorithm: 'SCAFFOLD',
    status: 'failed',
    progress: 30,
    participants: 3,
    dataset: 'Shakespeare',
    learningRate: 0.02,
    duration: 1800000,
    createTime: '2024-01-13 09:15:00',
    description: '基于 Shakespeare 数据集的文本分类任务',
    logs: [
      { id: 1, time: '09:15:00', message: '实验启动', type: 'info' },
      { id: 2, time: '09:20:00', message: '参与方连接异常', type: 'warning' },
      { id: 3, time: '09:45:00', message: '训练过程中出现错误', type: 'error' }
    ]
  }
])

// 表格列配置
const columns = [
  {
    title: '实验名称',
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: '算法',
    dataIndex: 'algorithm',
    key: 'algorithm',
    width: 100
  },
  {
    title: '状态',
    key: 'status',
    width: 120
  },
  {
    title: '进度',
    key: 'progress',
    width: 150
  },
  {
    title: '参与方',
    key: 'participants',
    width: 100
  },
  {
    title: '数据集',
    dataIndex: 'dataset',
    key: 'dataset',
    width: 100
  },
  {
    title: '持续时间',
    key: 'duration',
    width: 120
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
]

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 计算属性：过滤后的实验数据
const filteredExperiments = computed(() => {
  let result = experiments.value

  if (filters.value.status) {
    result = result.filter(exp => exp.status === filters.value.status)
  }

  if (filters.value.algorithm) {
    result = result.filter(exp => exp.algorithm === filters.value.algorithm)
  }

  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    result = result.filter(exp => 
      exp.name.toLowerCase().includes(keyword) ||
      exp.description.toLowerCase().includes(keyword)
    )
  }

  pagination.value.total = result.length
  return result
})

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const loadData = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    updateStats()
    loading.value = false
  }, 1000)
}

const updateStats = () => {
  const total = experiments.value.length
  const running = experiments.value.filter(exp => exp.status === 'running').length
  const completed = experiments.value.filter(exp => exp.status === 'completed').length
  const failed = experiments.value.filter(exp => exp.status === 'failed').length

  stats.value = { total, running, completed, failed }
}

const refreshData = () => {
  loadData()
  message.success('数据已刷新')
}

const showCreateModal = () => {
  createModalVisible.value = true
}

const handleCreateExperiment = async () => {
  try {
    await createFormRef.value.validate()
    
    // 模拟创建实验
    const newExperiment = {
      id: Date.now(),
      ...createForm.value,
      status: 'pending',
      progress: 0,
      duration: 0,
      createTime: new Date().toLocaleString(),
      logs: [
        { id: 1, time: new Date().toLocaleTimeString(), message: '实验已创建', type: 'info' }
      ]
    }

    experiments.value.unshift(newExperiment)
    updateStats()
    
    createModalVisible.value = false
    createForm.value = {
      name: '',
      algorithm: '',
      description: '',
      rounds: 100,
      participantCount: 5,
      learningRate: 0.01,
      dataset: ''
    }
    
    message.success('实验创建成功')
  } catch (error) {
    console.error('验证失败:', error)
  }
}

const showDetail = (record) => {
  selectedExperiment.value = record
  detailActiveTab.value = record.algorithm === 'Cluster-FedSAK' ? 'cluster-fedsak' : 'overview'
  detailModalVisible.value = true
}

const handleExperimentUpdate = ({ round, data }) => {
  if (selectedExperiment.value) {
    // 更新实验进度和状态
    selectedExperiment.value.progress = Math.min(100, Math.round((round / 100) * 100))
    
    // 添加日志条目
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      message: `轮次 ${round} 完成，当前指标更新`,
      type: 'info'
    }
    
    if (!selectedExperiment.value.logs) {
      selectedExperiment.value.logs = []
    }
    selectedExperiment.value.logs.unshift(newLog)
    
    // 限制日志条数
    if (selectedExperiment.value.logs.length > 50) {
      selectedExperiment.value.logs = selectedExperiment.value.logs.slice(0, 50)
    }
  }
}

const goToClusterFedSAKPage = () => {
  // 跳转到分簇-FedSAK页面
  router.push('/cluster-fedsak')
}

const startExperiment = (record) => {
  record.status = 'running'
  updateStats()
  message.success(`实验 "${record.name}" 已启动`)
}

const stopExperiment = (record) => {
  record.status = 'completed'
  record.progress = 100
  updateStats()
  message.success(`实验 "${record.name}" 已停止`)
}

const deleteExperiment = (record) => {
  const index = experiments.value.findIndex(exp => exp.id === record.id)
  if (index > -1) {
    experiments.value.splice(index, 1)
    updateStats()
    message.success('实验已删除')
  }
}

const handleFilterChange = () => {
  pagination.value.current = 1
}

const resetFilters = () => {
  filters.value = {
    status: '',
    algorithm: '',
    keyword: ''
  }
  pagination.value.current = 1
}

const handleTableChange = (pag) => {
  pagination.value = { ...pagination.value, ...pag }
}

// 工具方法
const getStatusColor = (status) => {
  const colors = {
    running: 'processing',
    completed: 'success',
    failed: 'error',
    pending: 'default'
  }
  return colors[status] || 'default'
}

const getStatusIcon = (status) => {
  const icons = {
    running: LoadingOutlined,
    completed: CheckCircleOutlined,
    failed: CloseCircleOutlined,
    pending: PauseCircleOutlined
  }
  return icons[status] || PauseCircleOutlined
}

const getStatusText = (status) => {
  const texts = {
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    pending: '待启动'
  }
  return texts[status] || '未知'
}

const formatDuration = (duration) => {
  if (!duration) return '-'
  
  const hours = Math.floor(duration / 3600000)
  const minutes = Math.floor((duration % 3600000) / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  } else {
    return `${seconds}秒`
  }
}
</script>

<style scoped>
.experiments {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title-section h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.page-description {
  margin: 8px 0 0 0;
  color: #8c8c8c;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 24px;
}

.filter-card {
  margin-bottom: 24px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 实验详情模态框样式 */
.cluster-fedsak-container {
  height: 70vh;
  max-height: 900px;
  max-width: 1300px;
  padding: 0;
  overflow: auto;
  background: #f5f5f5;
}

.metrics-placeholder {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logs-container {
  max-height: 60vh;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .experiments {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .action-section {
    width: 100%;
  }
  
  .cluster-fedsak-container {
    height: 60vh;
  }
}
</style>

<!-- 全局样式，用于模态框 -->
<style>
.experiment-detail-modal .ant-modal-body {
  padding: 16px !important;
  max-height: 80vh;
}

.experiment-detail-modal .ant-tabs-content-holder {
  padding: 16px 0 !important;
}

.experiment-detail-modal .ant-tabs-tab {
  padding: 8px 16px !important;
}

.experiment-detail-modal .ant-modal-content {
  overflow: visible !important;
}
</style>
