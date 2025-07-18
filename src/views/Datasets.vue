<template>
  <div class="datasets-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">数据集管理</h1>
        <p class="page-description">管理联邦学习数据集，支持上传、预览和分析</p>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="showUploadModal">
          <template #icon>
            <UploadOutlined />
          </template>
          上传数据集
        </a-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="24" class="stats-row">
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="总数据集"
            :value="totalDatasets"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <DatabaseOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="总样本数"
            :value="totalSamples"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <FileTextOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="存储空间"
            :value="totalSize"
            suffix="GB"
            :value-style="{ color: '#fa8c16' }"
          >
            <template #prefix>
              <HddOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="活跃数据集"
            :value="activeDatasets"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 搜索和筛选 -->
    <a-card class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索数据集名称"
            enter-button
            @search="handleSearch"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-select
            v-model:value="filterType"
            placeholder="数据类型"
            style="width: 100%"
            @change="handleFilter"
          >
            <a-select-option value="">全部类型</a-select-option>
            <a-select-option value="image">图像</a-select-option>
            <a-select-option value="text">文本</a-select-option>
            <a-select-option value="tabular">表格</a-select-option>
            <a-select-option value="audio">音频</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-select
            v-model:value="filterStatus"
            placeholder="状态"
            style="width: 100%"
            @change="handleFilter"
          >
            <a-select-option value="">全部状态</a-select-option>
            <a-select-option value="ready">就绪</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="error">错误</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 数据集列表 -->
    <a-card class="table-card">
      <template #title>
        <span>数据集列表</span>
      </template>
      <template #extra>
        <a-space>
          <a-button @click="refreshData">
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="filteredDatasets"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 数据集名称 -->
          <template v-if="column.key === 'name'">
            <div class="dataset-name">
              <component :is="getTypeIcon(record.type)" class="type-icon" />
              <span class="name-text">{{ record.name }}</span>
            </div>
          </template>

          <!-- 数据类型标签 -->
          <template v-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">
              {{ getTypeLabel(record.type) }}
            </a-tag>
          </template>

          <!-- 状态标签 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              <component :is="getStatusIcon(record.status)" />
              {{ getStatusLabel(record.status) }}
            </a-tag>
          </template>

          <!-- 大小格式化 -->
          <template v-if="column.key === 'size'">
            {{ formatSize(record.size) }}
          </template>

          <!-- 创建时间格式化 -->
          <template v-if="column.key === 'createTime'">
            {{ formatTime(record.createTime) }}
          </template>

          <!-- 操作按钮 -->
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="previewDataset(record)">
                <EyeOutlined />
                预览
              </a-button>
              <a-button type="link" size="small" @click="analyzeDataset(record)">
                <BarChartOutlined />
                分析
              </a-button>
              <a-button type="link" size="small" @click="downloadDataset(record)">
                <DownloadOutlined />
                下载
              </a-button>
              <a-popconfirm
                title="确定要删除这个数据集吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteDataset(record)"
              >
                <a-button type="link" size="small" danger>
                  <DeleteOutlined />
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 上传数据集模态框 -->
    <a-modal
      v-model:open="uploadModalVisible"
      title="上传数据集"
      width="600px"
      @ok="handleUploadOk"
      @cancel="handleUploadCancel"
    >
      <a-form
        :model="uploadForm"
        :rules="uploadRules"
        ref="uploadFormRef"
        layout="vertical"
      >
        <a-form-item label="数据集名称" name="name">
          <a-input v-model:value="uploadForm.name" placeholder="请输入数据集名称" />
        </a-form-item>

        <a-form-item label="数据类型" name="type">
          <a-select v-model:value="uploadForm.type" placeholder="请选择数据类型">
            <a-select-option value="image">图像</a-select-option>
            <a-select-option value="text">文本</a-select-option>
            <a-select-option value="tabular">表格</a-select-option>
            <a-select-option value="audio">音频</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="uploadForm.description"
            placeholder="请输入数据集描述"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="数据文件" name="file">
          <a-upload-dragger
            v-model:file-list="uploadForm.fileList"
            name="file"
            :multiple="false"
            :before-upload="beforeUpload"
            @remove="handleRemove"
          >
            <p class="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p class="ant-upload-hint">
              支持 .csv, .json, .zip 等格式，单个文件大小不超过 100MB
            </p>
          </a-upload-dragger>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 数据预览模态框 -->
    <a-modal
      v-model:open="previewModalVisible"
      :title="`数据预览 - ${previewData.name}`"
      width="900px"
      :footer="null"
    >
      <div v-if="previewData.samples">
        <a-descriptions :column="2" size="small" class="preview-info">
          <a-descriptions-item label="数据类型">
            <a-tag :color="getTypeColor(previewData.type)">
              {{ getTypeLabel(previewData.type) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="样本数量">
            {{ previewData.samples }}
          </a-descriptions-item>
          <a-descriptions-item label="特征数量">
            {{ previewData.features || 'N/A' }}
          </a-descriptions-item>
          <a-descriptions-item label="标签数量">
            {{ previewData.classes || 'N/A' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider>数据样本</a-divider>
        
        <!-- 图像数据预览 -->
        <div v-if="previewData.type === 'image'" class="image-preview">
          <a-row :gutter="16">
            <a-col
              v-for="(image, index) in previewData.imageData"
              :key="index"
              :span="6"
            >
              <a-card size="small">
                <img :src="image.url" :alt="`Sample ${index}`" class="preview-image" />
                <p class="image-label">{{ image.label }}</p>
              </a-card>
            </a-col>
          </a-row>
        </div>

        <!-- 表格数据预览 -->
        <div v-else-if="previewData.type === 'tabular'" class="table-preview">
          <a-table
            :columns="previewData.tableColumns"
            :data-source="previewData.tableData"
            :pagination="false"
            size="small"
            :scroll="{ x: 600 }"
          />
        </div>

        <!-- 文本数据预览 -->
        <div v-else-if="previewData.type === 'text'" class="text-preview">
          <a-list
            :data-source="previewData.textData"
            size="small"
          >
            <template #renderItem="{ item, index }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>样本 {{ index + 1 }}</template>
                  <template #description>
                    <p class="text-content">{{ item.content }}</p>
                    <a-tag v-if="item.label" size="small">{{ item.label }}</a-tag>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-modal>

    <!-- 数据分析模态框 -->
    <a-modal
      v-model:open="analysisModalVisible"
      :title="`数据分析 - ${analysisData.name}`"
      width="1000px"
      :footer="null"
    >
      <div v-if="analysisData.stats">
        <a-row :gutter="24">
          <!-- 基础统计 -->
          <a-col :span="12">
            <a-card title="基础统计" size="small">
              <a-descriptions :column="1" size="small">
                <a-descriptions-item label="总样本数">
                  {{ analysisData.stats.totalSamples }}
                </a-descriptions-item>
                <a-descriptions-item label="特征维度">
                  {{ analysisData.stats.features }}
                </a-descriptions-item>
                <a-descriptions-item label="类别数量">
                  {{ analysisData.stats.classes }}
                </a-descriptions-item>
                <a-descriptions-item label="数据质量">
                  <a-progress
                    :percent="analysisData.stats.quality"
                    size="small"
                    :status="analysisData.stats.quality > 80 ? 'success' : 'normal'"
                  />
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>

          <!-- 分布图表 -->
          <a-col :span="12">
            <a-card title="类别分布" size="small">
              <div class="chart-container">
                <div ref="distributionChart" style="height: 200px;"></div>
              </div>
            </a-card>
          </a-col>
        </a-row>

        <a-row :gutter="24" style="margin-top: 16px;">
          <!-- 数据质量分析 -->
          <a-col :span="24">
            <a-card title="数据质量分析" size="small">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-statistic
                    title="完整率"
                    :value="analysisData.stats.completeness"
                    suffix="%"
                    :value-style="{ color: '#52c41a' }"
                  />
                </a-col>
                <a-col :span="8">
                  <a-statistic
                    title="一致性"
                    :value="analysisData.stats.consistency"
                    suffix="%"
                    :value-style="{ color: '#1890ff' }"
                  />
                </a-col>
                <a-col :span="8">
                  <a-statistic
                    title="准确性"
                    :value="analysisData.stats.accuracy"
                    suffix="%"
                    :value-style="{ color: '#722ed1' }"
                  />
                </a-col>
              </a-row>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HddOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  BarChartOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InboxOutlined,
  FileImageOutlined,
  FileTextOutlined as FileTextIcon,
  TableOutlined,
  AudioOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'

// 响应式数据
const loading = ref(false)
const searchText = ref('')
const filterType = ref('')
const filterStatus = ref('')
const uploadModalVisible = ref(false)
const previewModalVisible = ref(false)
const analysisModalVisible = ref(false)
const uploadFormRef = ref()

// 统计数据
const totalDatasets = ref(12)
const totalSamples = ref(125000)
const totalSize = ref(2.4)
const activeDatasets = ref(8)

// 数据集列表
const datasets = ref([
  {
    id: 1,
    name: 'CIFAR-10',
    type: 'image',
    status: 'ready',
    samples: 60000,
    features: '32x32x3',
    classes: 10,
    size: 163840000, // bytes
    createTime: '2024-01-15T10:30:00Z',
    description: '常用的图像分类数据集，包含10个类别的32x32彩色图像'
  },
  {
    id: 2,
    name: 'IMDB电影评论',
    type: 'text',
    status: 'ready',
    samples: 50000,
    features: 'Variable',
    classes: 2,
    size: 84213760,
    createTime: '2024-01-14T14:20:00Z',
    description: '电影评论情感分析数据集，包含正面和负面评论'
  },
  {
    id: 3,
    name: '房价预测数据',
    type: 'tabular',
    status: 'processing',
    samples: 1460,
    features: 81,
    classes: null,
    size: 460800,
    createTime: '2024-01-13T09:15:00Z',
    description: '房屋特征与价格的回归数据集'
  },
  {
    id: 4,
    name: '语音识别数据',
    type: 'audio',
    status: 'ready',
    samples: 8000,
    features: 'Variable',
    classes: 35,
    size: 2147483648,
    createTime: '2024-01-12T16:45:00Z',
    description: '英语语音命令识别数据集'
  },
  {
    id: 5,
    name: 'Fashion-MNIST',
    type: 'image',
    status: 'error',
    samples: 70000,
    features: '28x28x1',
    classes: 10,
    size: 26214400,
    createTime: '2024-01-11T11:30:00Z',
    description: '时尚物品图像分类数据集'
  }
])

// 表格列定义
const columns = [
  {
    title: '数据集名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    fixed: 'left'
  },
  {
    title: '数据类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '样本数',
    dataIndex: 'samples',
    key: 'samples',
    width: 100,
    sorter: (a, b) => a.samples - b.samples
  },
  {
    title: '特征',
    dataIndex: 'features',
    key: 'features',
    width: 120
  },
  {
    title: '类别数',
    dataIndex: 'classes',
    key: 'classes',
    width: 100
  },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
    width: 100,
    sorter: (a, b) => a.size - b.size
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150,
    sorter: (a, b) => new Date(a.createTime) - new Date(b.createTime)
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right'
  }
]

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 上传表单
const uploadForm = reactive({
  name: '',
  type: '',
  description: '',
  fileList: []
})

// 上传验证规则
const uploadRules = {
  name: [
    { required: true, message: '请输入数据集名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ],
  fileList: [
    { required: true, message: '请上传数据文件', trigger: 'change' }
  ]
}

// 预览数据
const previewData = ref({})

// 分析数据
const analysisData = ref({})

// 计算属性：过滤后的数据集
const filteredDatasets = computed(() => {
  let result = datasets.value

  if (searchText.value) {
    result = result.filter(item =>
      item.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }

  if (filterType.value) {
    result = result.filter(item => item.type === filterType.value)
  }

  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }

  pagination.total = result.length
  return result
})

// 工具函数
const getTypeIcon = (type) => {
  const iconMap = {
    image: FileImageOutlined,
    text: FileTextIcon,
    tabular: TableOutlined,
    audio: AudioOutlined
  }
  return iconMap[type] || FileTextIcon
}

const getTypeColor = (type) => {
  const colorMap = {
    image: 'blue',
    text: 'green',
    tabular: 'orange',
    audio: 'purple'
  }
  return colorMap[type] || 'default'
}

const getTypeLabel = (type) => {
  const labelMap = {
    image: '图像',
    text: '文本',
    tabular: '表格',
    audio: '音频'
  }
  return labelMap[type] || type
}

const getStatusIcon = (status) => {
  const iconMap = {
    ready: CheckCircleOutlined,
    processing: LoadingOutlined,
    error: ExclamationCircleOutlined
  }
  return iconMap[status] || CheckCircleOutlined
}

const getStatusColor = (status) => {
  const colorMap = {
    ready: 'success',
    processing: 'processing',
    error: 'error'
  }
  return colorMap[status] || 'default'
}

const getStatusLabel = (status) => {
  const labelMap = {
    ready: '就绪',
    processing: '处理中',
    error: '错误'
  }
  return labelMap[status] || status
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (timeString) => {
  return new Date(timeString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 事件处理函数
const handleSearch = () => {
  pagination.current = 1
}

const handleFilter = () => {
  pagination.current = 1
}

const resetFilters = () => {
  searchText.value = ''
  filterType.value = ''
  filterStatus.value = ''
  pagination.current = 1
}

const handleTableChange = (paginationConfig, filters, sorter) => {
  pagination.current = paginationConfig.current
  pagination.pageSize = paginationConfig.pageSize
}

const refreshData = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    loading.value = false
    message.success('数据刷新成功')
  }, 1000)
}

const showUploadModal = () => {
  uploadModalVisible.value = true
}

const handleUploadOk = async () => {
  try {
    await uploadFormRef.value.validate()
    // 模拟上传
    loading.value = true
    setTimeout(() => {
      loading.value = false
      uploadModalVisible.value = false
      message.success('数据集上传成功')
      // 重置表单
      uploadForm.name = ''
      uploadForm.type = ''
      uploadForm.description = ''
      uploadForm.fileList = []
    }, 2000)
  } catch (error) {
    console.error('验证失败:', error)
  }
}

const handleUploadCancel = () => {
  uploadModalVisible.value = false
  // 重置表单
  uploadForm.name = ''
  uploadForm.type = ''
  uploadForm.description = ''
  uploadForm.fileList = []
}

const beforeUpload = (file) => {
  const isValidType = file.type.includes('text') || file.type.includes('json') || file.type.includes('zip')
  if (!isValidType) {
    message.error('只支持文本、JSON或ZIP文件格式')
  }
  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    message.error('文件大小不能超过100MB')
  }
  return false // 阻止自动上传
}

const handleRemove = (file) => {
  const index = uploadForm.fileList.indexOf(file)
  uploadForm.fileList.splice(index, 1)
}

const previewDataset = (record) => {
  previewData.value = { ...record }
  
  // 模拟预览数据
  if (record.type === 'image') {
    previewData.value.imageData = [
      { url: '/api/placeholder/64/64', label: '猫' },
      { url: '/api/placeholder/64/64', label: '狗' },
      { url: '/api/placeholder/64/64', label: '鸟' },
      { url: '/api/placeholder/64/64', label: '车' }
    ]
  } else if (record.type === 'tabular') {
    previewData.value.tableColumns = [
      { title: 'ID', dataIndex: 'id', key: 'id' },
      { title: '特征1', dataIndex: 'feature1', key: 'feature1' },
      { title: '特征2', dataIndex: 'feature2', key: 'feature2' },
      { title: '标签', dataIndex: 'label', key: 'label' }
    ]
    previewData.value.tableData = [
      { id: 1, feature1: 0.5, feature2: 1.2, label: 'A' },
      { id: 2, feature1: 0.8, feature2: 0.9, label: 'B' },
      { id: 3, feature1: 0.3, feature2: 1.5, label: 'A' }
    ]
  } else if (record.type === 'text') {
    previewData.value.textData = [
      { content: '这是一个很好的电影，我非常喜欢！', label: '正面' },
      { content: '电影情节拖沓，不推荐观看。', label: '负面' },
      { content: '演员表演很棒，值得一看。', label: '正面' }
    ]
  }
  
  previewModalVisible.value = true
}

const analyzeDataset = (record) => {
  analysisData.value = {
    ...record,
    stats: {
      totalSamples: record.samples,
      features: record.features,
      classes: record.classes,
      quality: 92,
      completeness: 98,
      consistency: 95,
      accuracy: 88
    }
  }
  analysisModalVisible.value = true
  
  // 在下一个 tick 渲染图表
  nextTick(() => {
    renderDistributionChart()
  })
}

const renderDistributionChart = () => {
  // 这里可以集成真实的图表库如 ECharts
  // 暂时使用文本模拟
}

const downloadDataset = (record) => {
  message.info(`开始下载数据集: ${record.name}`)
  // 实际下载逻辑
}

const deleteDataset = (record) => {
  const index = datasets.value.findIndex(item => item.id === record.id)
  if (index > -1) {
    datasets.value.splice(index, 1)
    message.success('数据集删除成功')
    // 更新统计数据
    totalDatasets.value--
  }
}

// 组件挂载时初始化
onMounted(() => {
  pagination.total = datasets.value.length
})
</script>

<style scoped>
.datasets-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content h1.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #262626;
}

.page-description {
  color: #8c8c8c;
  margin: 0;
}

.header-actions {
  flex-shrink: 0;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-card :deep(.ant-statistic-title) {
  font-size: 14px;
  color: #8c8c8c;
}

.stat-card :deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 600;
}

.filter-card {
  margin-bottom: 24px;
}

.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dataset-name {
  display: flex;
  align-items: center;
}

.type-icon {
  margin-right: 8px;
  color: #1890ff;
}

.name-text {
  font-weight: 500;
}

.preview-info {
  margin-bottom: 16px;
}

.image-preview {
  max-height: 400px;
  overflow-y: auto;
}

.preview-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.image-label {
  text-align: center;
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #666;
}

.table-preview {
  max-height: 400px;
  overflow: auto;
}

.text-preview {
  max-height: 400px;
  overflow-y: auto;
}

.text-content {
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fafafa;
  border-radius: 4px;
  border: 1px dashed #d9d9d9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .datasets-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .filter-card :deep(.ant-row) {
    flex-direction: column;
  }
  
  .filter-card :deep(.ant-col) {
    margin-bottom: 8px;
  }
}

@media (max-width: 992px) {
  .stats-row :deep(.ant-col) {
    margin-bottom: 16px;
  }
}
</style>
