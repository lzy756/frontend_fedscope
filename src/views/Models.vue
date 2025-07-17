<template>
  <div class="models-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">模型管理</h1>
        <p class="page-description">管理联邦学习模型，支持模型版本控制、性能对比和部署</p>
      </div>
      <div class="header-actions">
        <a-space>
          <a-button @click="showCompareModal">
            <template #icon>
              <SwapOutlined />
            </template>
            模型对比
          </a-button>
          <a-button type="primary" @click="showUploadModal">
            <template #icon>
              <UploadOutlined />
            </template>
            上传模型
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="24" class="stats-row">
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="总模型数"
            :value="totalModels"
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
            title="活跃模型"
            :value="activeModels"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="最佳准确率"
            :value="bestAccuracy"
            suffix="%"
            :value-style="{ color: '#fa8c16' }"
          >
            <template #prefix>
              <TrophyOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="平均训练时间"
            :value="avgTrainingTime"
            suffix="min"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix>
              <ClockCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 搜索和筛选 -->
    <a-card class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索模型名称"
            enter-button
            @search="handleSearch"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-select
            v-model:value="filterAlgorithm"
            placeholder="算法类型"
            style="width: 100%"
            @change="handleFilter"
          >
            <a-select-option value="">全部算法</a-select-option>
            <a-select-option value="FedAvg">FedAvg</a-select-option>
            <a-select-option value="FedProx">FedProx</a-select-option>
            <a-select-option value="FedSGD">FedSGD</a-select-option>
            <a-select-option value="SCAFFOLD">SCAFFOLD</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-select
            v-model:value="filterStatus"
            placeholder="状态"
            style="width: 100%"
            @change="handleFilter"
          >
            <a-select-option value="">全部状态</a-select-option>
            <a-select-option value="trained">已训练</a-select-option>
            <a-select-option value="training">训练中</a-select-option>
            <a-select-option value="deployed">已部署</a-select-option>
            <a-select-option value="archived">已归档</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 模型库 -->
    <div class="models-grid">
      <a-row :gutter="[24, 24]">
        <a-col
          v-for="model in filteredModels"
          :key="model.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          :xl="6"
        >
          <a-card
            :hoverable="true"
            class="model-card"
            @click="showModelDetail(model)"
          >
            <template #cover>
              <div class="model-cover">
                <component :is="getAlgorithmIcon(model.algorithm)" class="algorithm-icon" />
                <div class="model-status">
                  <a-tag :color="getStatusColor(model.status)">
                    {{ getStatusLabel(model.status) }}
                  </a-tag>
                </div>
              </div>
            </template>

            <template #actions>
              <a-tooltip title="查看详情">
                <EyeOutlined @click.stop="showModelDetail(model)" />
              </a-tooltip>
              <a-tooltip title="下载模型">
                <DownloadOutlined @click.stop="downloadModel(model)" />
              </a-tooltip>
              <a-tooltip title="部署模型">
                <RocketOutlined @click.stop="deployModel(model)" />
              </a-tooltip>
              <a-popconfirm
                title="确定要删除这个模型吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteModel(model)"
                @click.stop
              >
                <a-tooltip title="删除模型">
                  <DeleteOutlined />
                </a-tooltip>
              </a-popconfirm>
            </template>

            <a-card-meta :title="model.name">
              <template #description>
                <div class="model-info">
                  <p class="model-algorithm">
                    <span class="label">算法:</span>
                    <a-tag size="small" :color="getAlgorithmColor(model.algorithm)">
                      {{ model.algorithm }}
                    </a-tag>
                  </p>
                  <p class="model-accuracy">
                    <span class="label">准确率:</span>
                    <span class="value accuracy">{{ model.accuracy }}%</span>
                  </p>
                  <p class="model-size">
                    <span class="label">模型大小:</span>
                    <span class="value">{{ formatSize(model.size) }}</span>
                  </p>
                  <p class="model-time">
                    <span class="label">训练时间:</span>
                    <span class="value">{{ model.trainingTime }}min</span>
                  </p>
                </div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 模型详情模态框 -->
    <a-modal
      v-model:visible="detailModalVisible"
      :title="`模型详情 - ${selectedModel.name}`"
      width="1000px"
      :footer="null"
    >
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 基本信息 -->
        <a-tab-pane key="basic" tab="基本信息">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="模型名称">
              {{ selectedModel.name }}
            </a-descriptions-item>
            <a-descriptions-item label="算法类型">
              <a-tag :color="getAlgorithmColor(selectedModel.algorithm)">
                {{ selectedModel.algorithm }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="模型状态">
              <a-tag :color="getStatusColor(selectedModel.status)">
                {{ getStatusLabel(selectedModel.status) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="准确率">
              <span class="accuracy-value">{{ selectedModel.accuracy }}%</span>
            </a-descriptions-item>
            <a-descriptions-item label="模型大小">
              {{ formatSize(selectedModel.size) }}
            </a-descriptions-item>
            <a-descriptions-item label="训练时间">
              {{ selectedModel.trainingTime }} 分钟
            </a-descriptions-item>
            <a-descriptions-item label="参与方数量">
              {{ selectedModel.participants }}
            </a-descriptions-item>
            <a-descriptions-item label="训练轮数">
              {{ selectedModel.rounds }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatTime(selectedModel.createTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="最后更新">
              {{ formatTime(selectedModel.updateTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="模型描述" :span="2">
              {{ selectedModel.description }}
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <!-- 性能指标 -->
        <a-tab-pane key="performance" tab="性能指标">
          <a-row :gutter="24">
            <a-col :span="12">
              <a-card title="训练指标" size="small">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-statistic
                      title="训练损失"
                      :value="selectedModel.performance.trainLoss"
                      :precision="4"
                    />
                  </a-col>
                  <a-col :span="12">
                    <a-statistic
                      title="验证损失"
                      :value="selectedModel.performance.validLoss"
                      :precision="4"
                    />
                  </a-col>
                  <a-col :span="12">
                    <a-statistic
                      title="训练准确率"
                      :value="selectedModel.performance.trainAccuracy"
                      suffix="%"
                    />
                  </a-col>
                  <a-col :span="12">
                    <a-statistic
                      title="验证准确率"
                      :value="selectedModel.performance.validAccuracy"
                      suffix="%"
                    />
                  </a-col>
                </a-row>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card title="模型复杂度" size="small">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-statistic
                      title="参数数量"
                      :value="selectedModel.performance.parameters"
                    />
                  </a-col>
                  <a-col :span="12">
                    <a-statistic
                      title="FLOPs"
                      :value="selectedModel.performance.flops"
                      suffix="M"
                    />
                  </a-col>
                  <a-col :span="12">
                    <a-statistic
                      title="推理时间"
                      :value="selectedModel.performance.inferenceTime"
                      suffix="ms"
                    />
                  </a-col>
                  <a-col :span="12">
                    <a-statistic
                      title="内存占用"
                      :value="selectedModel.performance.memoryUsage"
                      suffix="MB"
                    />
                  </a-col>
                </a-row>
              </a-card>
            </a-col>
          </a-row>

          <a-card title="训练曲线" style="margin-top: 16px;">
            <div class="chart-container">
              <div ref="performanceChart" style="height: 300px;"></div>
            </div>
          </a-card>
        </a-tab-pane>

        <!-- 配置信息 -->
        <a-tab-pane key="config" tab="配置信息">
          <a-collapse accordion>
            <a-collapse-panel key="training" header="训练配置">
              <a-descriptions :column="2" size="small">
                <a-descriptions-item label="学习率">
                  {{ selectedModel.config.learningRate }}
                </a-descriptions-item>
                <a-descriptions-item label="批次大小">
                  {{ selectedModel.config.batchSize }}
                </a-descriptions-item>
                <a-descriptions-item label="本地轮数">
                  {{ selectedModel.config.localEpochs }}
                </a-descriptions-item>
                <a-descriptions-item label="全局轮数">
                  {{ selectedModel.config.globalRounds }}
                </a-descriptions-item>
                <a-descriptions-item label="优化器">
                  {{ selectedModel.config.optimizer }}
                </a-descriptions-item>
                <a-descriptions-item label="损失函数">
                  {{ selectedModel.config.lossFunction }}
                </a-descriptions-item>
              </a-descriptions>
            </a-collapse-panel>
            <a-collapse-panel key="federated" header="联邦学习配置">
              <a-descriptions :column="2" size="small">
                <a-descriptions-item label="聚合算法">
                  {{ selectedModel.config.aggregation }}
                </a-descriptions-item>
                <a-descriptions-item label="客户端采样率">
                  {{ selectedModel.config.clientSampling }}
                </a-descriptions-item>
                <a-descriptions-item label="数据异构性">
                  {{ selectedModel.config.dataHeterogeneity }}
                </a-descriptions-item>
                <a-descriptions-item label="安全机制">
                  {{ selectedModel.config.security }}
                </a-descriptions-item>
              </a-descriptions>
            </a-collapse-panel>
            <a-collapse-panel key="model" header="模型架构">
              <a-descriptions :column="1" size="small">
                <a-descriptions-item label="网络架构">
                  {{ selectedModel.config.architecture }}
                </a-descriptions-item>
                <a-descriptions-item label="输入维度">
                  {{ selectedModel.config.inputDim }}
                </a-descriptions-item>
                <a-descriptions-item label="输出维度">
                  {{ selectedModel.config.outputDim }}
                </a-descriptions-item>
                <a-descriptions-item label="隐藏层数">
                  {{ selectedModel.config.hiddenLayers }}
                </a-descriptions-item>
              </a-descriptions>
            </a-collapse-panel>
          </a-collapse>
        </a-tab-pane>

        <!-- 版本历史 -->
        <a-tab-pane key="versions" tab="版本历史">
          <a-timeline>
            <a-timeline-item
              v-for="version in selectedModel.versions"
              :key="version.id"
              :color="version.current ? 'green' : 'blue'"
            >
              <template #dot>
                <CheckCircleOutlined v-if="version.current" style="color: #52c41a;" />
              </template>
              <div class="version-item">
                <div class="version-header">
                  <span class="version-name">{{ version.name }}</span>
                  <a-tag v-if="version.current" color="green" size="small">当前版本</a-tag>
                  <span class="version-time">{{ formatTime(version.createTime) }}</span>
                </div>
                <p class="version-description">{{ version.description }}</p>
                <div class="version-metrics">
                  <a-tag>准确率: {{ version.accuracy }}%</a-tag>
                  <a-tag>大小: {{ formatSize(version.size) }}</a-tag>
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <!-- 模型对比模态框 -->
    <a-modal
      v-model:visible="compareModalVisible"
      title="模型对比"
      width="1200px"
      :footer="null"
    >
      <div class="compare-section">
        <div class="model-selector">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-select
                v-model:value="compareModels[0]"
                placeholder="选择第一个模型"
                style="width: 100%"
                @change="updateComparison"
              >
                <a-select-option
                  v-for="model in models"
                  :key="model.id"
                  :value="model.id"
                >
                  {{ model.name }}
                </a-select-option>
              </a-select>
            </a-col>
            <a-col :span="12">
              <a-select
                v-model:value="compareModels[1]"
                placeholder="选择第二个模型"
                style="width: 100%"
                @change="updateComparison"
              >
                <a-select-option
                  v-for="model in models"
                  :key="model.id"
                  :value="model.id"
                >
                  {{ model.name }}
                </a-select-option>
              </a-select>
            </a-col>
          </a-row>
        </div>

        <div v-if="compareModels[0] && compareModels[1]" class="comparison-content">
          <!-- 基本指标对比 -->
          <a-card title="性能对比" style="margin-top: 16px;">
            <a-table
              :columns="comparisonColumns"
              :data-source="comparisonData"
              :pagination="false"
              size="small"
            />
          </a-card>

          <!-- 可视化对比 -->
          <a-card title="可视化对比" style="margin-top: 16px;">
            <div class="chart-container">
              <div ref="comparisonChart" style="height: 300px;"></div>
            </div>
          </a-card>
        </div>
      </div>
    </a-modal>

    <!-- 上传模型模态框 -->
    <a-modal
      v-model:visible="uploadModalVisible"
      title="上传模型"
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
        <a-form-item label="模型名称" name="name">
          <a-input v-model:value="uploadForm.name" placeholder="请输入模型名称" />
        </a-form-item>

        <a-form-item label="算法类型" name="algorithm">
          <a-select v-model:value="uploadForm.algorithm" placeholder="请选择算法类型">
            <a-select-option value="FedAvg">FedAvg</a-select-option>
            <a-select-option value="FedProx">FedProx</a-select-option>
            <a-select-option value="FedSGD">FedSGD</a-select-option>
            <a-select-option value="SCAFFOLD">SCAFFOLD</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="模型描述" name="description">
          <a-textarea
            v-model:value="uploadForm.description"
            placeholder="请输入模型描述"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="模型文件" name="file">
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
              支持 .pth, .h5, .pkl 等模型文件格式
            </p>
          </a-upload-dragger>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  SwapOutlined,
  UploadOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  RocketOutlined,
  DeleteOutlined,
  InboxOutlined,
  ExperimentOutlined,
  CodeOutlined,
  BranchesOutlined,
  NodeIndexOutlined
} from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const filterAlgorithm = ref('')
const filterStatus = ref('')
const detailModalVisible = ref(false)
const compareModalVisible = ref(false)
const uploadModalVisible = ref(false)
const activeTab = ref('basic')
const uploadFormRef = ref()

// 统计数据
const totalModels = ref(24)
const activeModels = ref(18)
const bestAccuracy = ref(94.2)
const avgTrainingTime = ref(45)

// 选中的模型
const selectedModel = ref({})

// 对比模型
const compareModels = ref([null, null])

// 模型列表数据
const models = ref([
  {
    id: 1,
    name: 'ResNet-18-FedAvg',
    algorithm: 'FedAvg',
    status: 'deployed',
    accuracy: 94.2,
    size: 45068288, // bytes
    trainingTime: 45,
    participants: 10,
    rounds: 100,
    createTime: '2024-01-15T10:30:00Z',
    updateTime: '2024-01-16T14:20:00Z',
    description: '基于ResNet-18架构的联邦平均算法模型，用于图像分类任务',
    performance: {
      trainLoss: 0.1234,
      validLoss: 0.1456,
      trainAccuracy: 95.6,
      validAccuracy: 94.2,
      parameters: 11689512,
      flops: 1814.0,
      inferenceTime: 5.2,
      memoryUsage: 44.1
    },
    config: {
      learningRate: 0.01,
      batchSize: 32,
      localEpochs: 5,
      globalRounds: 100,
      optimizer: 'SGD',
      lossFunction: 'CrossEntropy',
      aggregation: 'FedAvg',
      clientSampling: 0.1,
      dataHeterogeneity: 'IID',
      security: 'None',
      architecture: 'ResNet-18',
      inputDim: '224x224x3',
      outputDim: '10',
      hiddenLayers: 18
    },
    versions: [
      {
        id: 1,
        name: 'v1.0.0',
        current: true,
        accuracy: 94.2,
        size: 45068288,
        createTime: '2024-01-16T14:20:00Z',
        description: '初始版本，基础ResNet-18实现'
      },
      {
        id: 2,
        name: 'v0.9.0',
        current: false,
        accuracy: 92.8,
        size: 44102400,
        createTime: '2024-01-15T10:30:00Z',
        description: '测试版本，调整了网络结构'
      }
    ]
  },
  {
    id: 2,
    name: 'LSTM-FedProx',
    algorithm: 'FedProx',
    status: 'trained',
    accuracy: 89.7,
    size: 12582912,
    trainingTime: 32,
    participants: 8,
    rounds: 80,
    createTime: '2024-01-14T09:15:00Z',
    updateTime: '2024-01-14T16:45:00Z',
    description: 'LSTM模型用于文本分类的FedProx实现',
    performance: {
      trainLoss: 0.2345,
      validLoss: 0.2567,
      trainAccuracy: 91.2,
      validAccuracy: 89.7,
      parameters: 3145728,
      flops: 456.7,
      inferenceTime: 8.1,
      memoryUsage: 12.3
    },
    config: {
      learningRate: 0.001,
      batchSize: 64,
      localEpochs: 3,
      globalRounds: 80,
      optimizer: 'Adam',
      lossFunction: 'CrossEntropy',
      aggregation: 'FedProx',
      clientSampling: 0.2,
      dataHeterogeneity: 'Non-IID',
      security: 'DP',
      architecture: 'LSTM',
      inputDim: 'Variable',
      outputDim: '5',
      hiddenLayers: 2
    },
    versions: [
      {
        id: 1,
        name: 'v1.0.0',
        current: true,
        accuracy: 89.7,
        size: 12582912,
        createTime: '2024-01-14T16:45:00Z',
        description: '正式版本，优化了收敛性'
      }
    ]
  },
  {
    id: 3,
    name: 'MobileNet-FedSGD',
    algorithm: 'FedSGD',
    status: 'training',
    accuracy: 87.3,
    size: 13845504,
    trainingTime: 28,
    participants: 15,
    rounds: 120,
    createTime: '2024-01-13T11:20:00Z',
    updateTime: '2024-01-17T09:30:00Z',
    description: '轻量级MobileNet模型的联邦SGD实现',
    performance: {
      trainLoss: 0.3456,
      validLoss: 0.3789,
      trainAccuracy: 88.9,
      validAccuracy: 87.3,
      parameters: 3471872,
      flops: 299.8,
      inferenceTime: 3.2,
      memoryUsage: 13.5
    },
    config: {
      learningRate: 0.05,
      batchSize: 128,
      localEpochs: 1,
      globalRounds: 120,
      optimizer: 'SGD',
      lossFunction: 'CrossEntropy',
      aggregation: 'FedSGD',
      clientSampling: 0.3,
      dataHeterogeneity: 'IID',
      security: 'SecAgg',
      architecture: 'MobileNet-v2',
      inputDim: '224x224x3',
      outputDim: '100',
      hiddenLayers: 19
    },
    versions: [
      {
        id: 1,
        name: 'v0.8.0',
        current: true,
        accuracy: 87.3,
        size: 13845504,
        createTime: '2024-01-17T09:30:00Z',
        description: '当前训练版本'
      }
    ]
  },
  {
    id: 4,
    name: 'Transformer-SCAFFOLD',
    algorithm: 'SCAFFOLD',
    status: 'archived',
    accuracy: 91.8,
    size: 109051904,
    trainingTime: 85,
    participants: 12,
    rounds: 60,
    createTime: '2024-01-10T15:45:00Z',
    updateTime: '2024-01-12T10:15:00Z',
    description: '基于Transformer架构的SCAFFOLD算法实现',
    performance: {
      trainLoss: 0.1876,
      validLoss: 0.2145,
      trainAccuracy: 93.4,
      validAccuracy: 91.8,
      parameters: 27314176,
      flops: 2876.5,
      inferenceTime: 12.6,
      memoryUsage: 106.7
    },
    config: {
      learningRate: 0.0001,
      batchSize: 16,
      localEpochs: 2,
      globalRounds: 60,
      optimizer: 'AdamW',
      lossFunction: 'CrossEntropy',
      aggregation: 'SCAFFOLD',
      clientSampling: 0.15,
      dataHeterogeneity: 'Non-IID',
      security: 'HE',
      architecture: 'Transformer',
      inputDim: 'Variable',
      outputDim: '2',
      hiddenLayers: 12
    },
    versions: [
      {
        id: 1,
        name: 'v1.2.0',
        current: true,
        accuracy: 91.8,
        size: 109051904,
        createTime: '2024-01-12T10:15:00Z',
        description: '归档版本，性能优秀但计算复杂'
      }
    ]
  },
  {
    id: 5,
    name: 'CNN-FedAvg-Mini',
    algorithm: 'FedAvg',
    status: 'trained',
    accuracy: 82.5,
    size: 2097152,
    trainingTime: 15,
    participants: 20,
    rounds: 50,
    createTime: '2024-01-12T08:30:00Z',
    updateTime: '2024-01-12T12:45:00Z',
    description: '轻量级CNN模型，适合资源受限环境',
    performance: {
      trainLoss: 0.4567,
      validLoss: 0.4890,
      trainAccuracy: 84.1,
      validAccuracy: 82.5,
      parameters: 524288,
      flops: 89.3,
      inferenceTime: 1.8,
      memoryUsage: 2.1
    },
    config: {
      learningRate: 0.02,
      batchSize: 256,
      localEpochs: 10,
      globalRounds: 50,
      optimizer: 'SGD',
      lossFunction: 'CrossEntropy',
      aggregation: 'FedAvg',
      clientSampling: 0.4,
      dataHeterogeneity: 'IID',
      security: 'None',
      architecture: 'SimpleCNN',
      inputDim: '32x32x3',
      outputDim: '10',
      hiddenLayers: 4
    },
    versions: [
      {
        id: 1,
        name: 'v1.0.0',
        current: true,
        accuracy: 82.5,
        size: 2097152,
        createTime: '2024-01-12T12:45:00Z',
        description: '轻量级版本，快速训练'
      }
    ]
  },
  {
    id: 6,
    name: 'DenseNet-FedProx',
    algorithm: 'FedProx',
    status: 'deployed',
    accuracy: 93.1,
    size: 28774400,
    trainingTime: 68,
    participants: 6,
    rounds: 90,
    createTime: '2024-01-11T14:20:00Z',
    updateTime: '2024-01-15T11:30:00Z',
    description: 'DenseNet架构的FedProx实现，密集连接提升性能',
    performance: {
      trainLoss: 0.1567,
      validLoss: 0.1834,
      trainAccuracy: 94.8,
      validAccuracy: 93.1,
      parameters: 7193600,
      flops: 1345.2,
      inferenceTime: 7.4,
      memoryUsage: 28.1
    },
    config: {
      learningRate: 0.005,
      batchSize: 32,
      localEpochs: 4,
      globalRounds: 90,
      optimizer: 'SGD',
      lossFunction: 'CrossEntropy',
      aggregation: 'FedProx',
      clientSampling: 0.12,
      dataHeterogeneity: 'Non-IID',
      security: 'DP',
      architecture: 'DenseNet-121',
      inputDim: '224x224x3',
      outputDim: '1000',
      hiddenLayers: 121
    },
    versions: [
      {
        id: 1,
        name: 'v1.1.0',
        current: true,
        accuracy: 93.1,
        size: 28774400,
        createTime: '2024-01-15T11:30:00Z',
        description: '优化版本，提升了收敛速度'
      }
    ]
  }
])

// 上传表单
const uploadForm = reactive({
  name: '',
  algorithm: '',
  description: '',
  fileList: []
})

// 上传验证规则
const uploadRules = {
  name: [
    { required: true, message: '请输入模型名称', trigger: 'blur' }
  ],
  algorithm: [
    { required: true, message: '请选择算法类型', trigger: 'change' }
  ],
  fileList: [
    { required: true, message: '请上传模型文件', trigger: 'change' }
  ]
}

// 对比表格列
const comparisonColumns = [
  {
    title: '指标',
    dataIndex: 'metric',
    key: 'metric',
    width: 120
  },
  {
    title: '模型1',
    dataIndex: 'model1',
    key: 'model1'
  },
  {
    title: '模型2',
    dataIndex: 'model2',
    key: 'model2'
  },
  {
    title: '差值',
    dataIndex: 'diff',
    key: 'diff'
  }
]

// 计算属性：过滤后的模型
const filteredModels = computed(() => {
  let result = models.value

  if (searchText.value) {
    result = result.filter(model =>
      model.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }

  if (filterAlgorithm.value) {
    result = result.filter(model => model.algorithm === filterAlgorithm.value)
  }

  if (filterStatus.value) {
    result = result.filter(model => model.status === filterStatus.value)
  }

  return result
})

// 对比数据
const comparisonData = computed(() => {
  if (!compareModels.value[0] || !compareModels.value[1]) return []
  
  const model1 = models.value.find(m => m.id === compareModels.value[0])
  const model2 = models.value.find(m => m.id === compareModels.value[1])
  
  if (!model1 || !model2) return []
  
  return [
    {
      metric: '准确率',
      model1: `${model1.accuracy}%`,
      model2: `${model2.accuracy}%`,
      diff: `${(model1.accuracy - model2.accuracy).toFixed(2)}%`
    },
    {
      metric: '模型大小',
      model1: formatSize(model1.size),
      model2: formatSize(model2.size),
      diff: formatSize(model1.size - model2.size)
    },
    {
      metric: '训练时间',
      model1: `${model1.trainingTime}min`,
      model2: `${model2.trainingTime}min`,
      diff: `${model1.trainingTime - model2.trainingTime}min`
    },
    {
      metric: '参与方数量',
      model1: model1.participants,
      model2: model2.participants,
      diff: model1.participants - model2.participants
    },
    {
      metric: '训练轮数',
      model1: model1.rounds,
      model2: model2.rounds,
      diff: model1.rounds - model2.rounds
    }
  ]
})

// 工具函数
const getAlgorithmIcon = (algorithm) => {
  const iconMap = {
    FedAvg: ExperimentOutlined,
    FedProx: CodeOutlined,
    FedSGD: BranchesOutlined,
    SCAFFOLD: NodeIndexOutlined
  }
  return iconMap[algorithm] || ExperimentOutlined
}

const getAlgorithmColor = (algorithm) => {
  const colorMap = {
    FedAvg: 'blue',
    FedProx: 'green',
    FedSGD: 'orange',
    SCAFFOLD: 'purple'
  }
  return colorMap[algorithm] || 'default'
}

const getStatusColor = (status) => {
  const colorMap = {
    trained: 'success',
    training: 'processing',
    deployed: 'magenta',
    archived: 'gold'
  }
  return colorMap[status] || 'default'
}

const getStatusLabel = (status) => {
  const labelMap = {
    trained: '已训练',
    training: '训练中',
    deployed: '已部署',
    archived: '已归档'
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
  // 搜索逻辑已在计算属性中处理
}

const handleFilter = () => {
  // 筛选逻辑已在计算属性中处理
}

const resetFilters = () => {
  searchText.value = ''
  filterAlgorithm.value = ''
  filterStatus.value = ''
}

const showModelDetail = (model) => {
  selectedModel.value = model
  activeTab.value = 'basic'
  detailModalVisible.value = true
  
  // 在下一个tick渲染图表
  nextTick(() => {
    renderPerformanceChart()
  })
}

const showCompareModal = () => {
  compareModalVisible.value = true
  compareModels.value = [null, null]
}

const showUploadModal = () => {
  uploadModalVisible.value = true
}

const downloadModel = (model) => {
  message.info(`开始下载模型: ${model.name}`)
  // 实际下载逻辑
}

const deployModel = (model) => {
  message.loading({ content: '正在部署模型...', key: 'deploy', duration: 0 })
  setTimeout(() => {
    model.status = 'deployed'
    message.success({ content: `模型 ${model.name} 部署成功`, key: 'deploy' })
  }, 2000)
}

const deleteModel = (model) => {
  const index = models.value.findIndex(m => m.id === model.id)
  if (index > -1) {
    models.value.splice(index, 1)
    message.success('模型删除成功')
    totalModels.value--
  }
}

const updateComparison = () => {
  if (compareModels.value[0] && compareModels.value[1]) {
    nextTick(() => {
      renderComparisonChart()
    })
  }
}

const renderPerformanceChart = () => {
  // 这里可以集成真实的图表库如 ECharts
  // 暂时使用文本模拟
}

const renderComparisonChart = () => {
  // 这里可以集成真实的图表库如 ECharts
  // 暂时使用文本模拟
}

const handleUploadOk = async () => {
  try {
    await uploadFormRef.value.validate()
    message.loading({ content: '正在上传模型...', key: 'upload', duration: 0 })
    
    setTimeout(() => {
      message.success({ content: '模型上传成功', key: 'upload' })
      uploadModalVisible.value = false
      // 重置表单
      uploadForm.name = ''
      uploadForm.algorithm = ''
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
  uploadForm.algorithm = ''
  uploadForm.description = ''
  uploadForm.fileList = []
}

const beforeUpload = (file) => {
  const isValidType = /\.(pth|h5|pkl|pt|ckpt)$/i.test(file.name)
  if (!isValidType) {
    message.error('只支持 .pth, .h5, .pkl, .pt, .ckpt 格式的模型文件')
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

// 组件挂载时初始化
onMounted(() => {
  // 初始化操作
})
</script>

<style scoped>
.models-container {
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

.models-grid {
  margin-bottom: 24px;
}

.model-card {
  height: 100%;
  transition: all 0.3s ease;
}

.model-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.model-cover {
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.algorithm-icon {
  font-size: 48px;
  color: white;
  margin-bottom: 8px;
}

.model-status {
  position: absolute;
  top: 12px;
  right: 12px;
}

.model-info {
  font-size: 12px;
}

.model-info p {
  margin: 4px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-info .label {
  color: #8c8c8c;
  margin-right: 8px;
}

.model-info .value {
  font-weight: 500;
  color: #262626;
}

.model-info .accuracy {
  color: #52c41a;
  font-weight: 600;
}

.model-algorithm {
  align-items: center !important;
}

/* 确保标签与文本垂直居中对齐 */
.model-info .ant-tag {
  vertical-align: middle;
  margin: 0;
  line-height: 1.6;
  display: inline-flex;
  align-items: center;
}

.model-algorithm .ant-tag {
  margin-left: auto;
}

.accuracy-value {
  font-size: 16px;
  font-weight: 600;
  color: #52c41a;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fafafa;
  border-radius: 4px;
  border: 1px dashed #d9d9d9;
  min-height: 200px;
}

.version-item {
  padding: 8px 0;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-name {
  font-weight: 500;
  color: #262626;
}

.version-time {
  color: #8c8c8c;
  font-size: 12px;
  margin-left: auto;
}

.version-description {
  color: #595959;
  margin: 4px 0 8px 0;
  font-size: 14px;
}

.version-metrics {
  display: flex;
  gap: 8px;
}

.compare-section {
  padding: 8px 0;
}

.model-selector {
  margin-bottom: 16px;
}

.comparison-content {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .models-container {
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
    width: 100% !important;
  }
  
  .model-cover {
    height: 100px;
  }
  
  .algorithm-icon {
    font-size: 36px;
  }
}

@media (max-width: 992px) {
  .stats-row :deep(.ant-col) {
    margin-bottom: 16px;
  }
}

/* 卡片动画 */
.model-card :deep(.ant-card-actions) {
  background: #fafafa;
}

.model-card :deep(.ant-card-actions > li) {
  margin: 0;
}

.model-card :deep(.ant-card-actions > li > span) {
  padding: 12px 0;
  color: #8c8c8c;
  transition: color 0.3s;
}

.model-card :deep(.ant-card-actions > li > span:hover) {
  color: #1890ff;
}

/* Tab 样式优化 */
.ant-tabs-card > .ant-tabs-content {
  margin-top: 16px;
}

/* 描述列表样式 */
.ant-descriptions-bordered .ant-descriptions-item-label {
  background: #fafafa;
  font-weight: 500;
}
</style>
