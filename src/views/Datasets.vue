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
            <!-- TODO: 添加更多数据类型选项 -->
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
            <!-- TODO: 完善状态筛选逻辑 -->
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
              <a-button type="link" size="small" @click="previewDataset(record)" disabled>
                <EyeOutlined />
                预览
              </a-button>
              <!-- TODO: 实现数据分析功能 -->
              <a-button type="link" size="small" disabled>
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
      v-model:visible="uploadModalVisible"
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
            <!-- TODO: 添加音频类型支持 -->
          </a-select>
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="uploadForm.description"
            placeholder="请输入数据集描述"
            :rows="3"
          />
        </a-form-item>

        <!-- TODO: 完善文件上传功能 -->
        <a-form-item label="数据文件" name="file">
          <a-upload-dragger
            v-model:file-list="uploadForm.fileList"
            name="file"
            :multiple="false"
            :before-upload="beforeUpload"
            @remove="handleRemove"
            disabled
          >
            <p class="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p class="ant-upload-text">文件上传功能开发中...</p>
            <p class="ant-upload-hint">
              即将支持 .csv, .json, .zip 等格式
            </p>
          </a-upload-dragger>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- TODO: 实现数据预览功能 -->
    <!-- 数据预览模态框 - 开发中 -->
    <a-modal
      v-model:visible="previewModalVisible"
      title="数据预览"
      width="900px"
      :footer="null"
    >
      <a-result
        status="info"
        title="功能开发中"
        sub-title="数据预览功能正在开发中，敬请期待"
      />
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

// 统计数据 - TODO: 从API获取真实数据
const totalDatasets = ref(3) // 暂时只显示部分数据
const totalSamples = ref(0) // TODO: 计算总样本数
const totalSize = ref(0) // TODO: 计算总存储空间
const activeDatasets = ref(2) // TODO: 统计活跃数据集

// 数据集列表 - TODO: 从后端API获取数据
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
    name: '测试数据集',
    type: 'text',
    status: 'processing',
    samples: 1000,
    features: 'Variable',
    classes: 2,
    size: 1024000,
    createTime: '2024-01-14T14:20:00Z',
    description: '用于测试的小型文本数据集'
  },
  {
    id: 3,
    name: '示例表格数据',
    type: 'tabular',
    status: 'ready',
    samples: 500,
    features: 10,
    classes: 3,
    size: 51200,
    createTime: '2024-01-13T09:15:00Z',
    description: '演示用的表格数据集'
  }
  // TODO: 添加更多数据集
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
  // TODO: 实现真实的文件上传逻辑
  message.warning('上传功能还在开发中，请稍后再试')
  uploadModalVisible.value = false
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
  // TODO: 完善文件类型验证
  message.warning('文件上传功能开发中')
  return false // 阻止自动上传
}

const handleRemove = (file) => {
  // TODO: 实现文件移除逻辑
  const index = uploadForm.fileList.indexOf(file)
  uploadForm.fileList.splice(index, 1)
}

const previewDataset = (record) => {
  // TODO: 实现数据预览功能
  previewData.value = { ...record }
  previewModalVisible.value = true
}

const analyzeDataset = (record) => {
  // TODO: 实现数据分析功能
  message.info('数据分析功能正在开发中')
}

// TODO: 集成图表库（如 ECharts）来显示数据分布
const renderDistributionChart = () => {
  // 图表渲染逻辑待实现
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
/* TODO: 优化移动端样式 */
/* TODO: 添加暗色主题支持 */
/* TODO: 完善动画效果 */
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
