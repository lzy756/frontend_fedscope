<template>
  <div class="settings-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">系统设置</h1>
        <p class="page-description">配置联邦学习系统参数、算法选项和管理配置模板</p>
      </div>
      <div class="header-actions">
        <a-space>
          <a-button @click="exportConfig">
            <template #icon>
              <DownloadOutlined />
            </template>
            导出配置
          </a-button>
          <a-button @click="importConfig">
            <template #icon>
              <UploadOutlined />
            </template>
            导入配置
          </a-button>
          <a-button type="primary" @click="saveAllSettings">
            <template #icon>
              <SaveOutlined />
            </template>
            保存设置
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 设置选项卡 -->
    <a-card class="settings-card">
      <a-tabs v-model:activeKey="activeTab" type="card" size="large">
        <!-- 系统配置 -->
        <a-tab-pane key="system" tab="系统配置">
          <a-form
            :model="systemConfig"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            layout="horizontal"
          >
            <!-- 基本设置 -->
            <a-divider orientation="left">基本设置</a-divider>
            
            <a-form-item label="系统名称">
              <a-input v-model:value="systemConfig.systemName" placeholder="请输入系统名称" />
            </a-form-item>

            <a-form-item label="系统描述">
              <a-textarea
                v-model:value="systemConfig.description"
                placeholder="请输入系统描述"
                :rows="3"
              />
            </a-form-item>

            <a-form-item label="系统语言">
              <a-select v-model:value="systemConfig.language" style="width: 200px">
                <a-select-option value="zh-CN">简体中文</a-select-option>
                <a-select-option value="en-US">English</a-select-option>
                <a-select-option value="ja-JP">日本語</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="时区设置">
              <a-select v-model:value="systemConfig.timezone" style="width: 200px">
                <a-select-option value="Asia/Shanghai">Asia/Shanghai</a-select-option>
                <a-select-option value="America/New_York">America/New_York</a-select-option>
                <a-select-option value="Europe/London">Europe/London</a-select-option>
                <a-select-option value="Asia/Tokyo">Asia/Tokyo</a-select-option>
              </a-select>
            </a-form-item>

            <!-- 性能设置 -->
            <a-divider orientation="left">性能设置</a-divider>

            <a-form-item label="最大并发数">
              <a-slider
                v-model:value="systemConfig.maxConcurrency"
                :min="1"
                :max="100"
                :marks="{ 1: '1', 50: '50', 100: '100' }"
                style="width: 300px"
              />
              <span style="margin-left: 16px;">{{ systemConfig.maxConcurrency }}</span>
            </a-form-item>

            <a-form-item label="内存限制 (GB)">
              <a-input-number
                v-model:value="systemConfig.memoryLimit"
                :min="1"
                :max="64"
                :step="0.5"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="CPU使用率限制 (%)">
              <a-slider
                v-model:value="systemConfig.cpuLimit"
                :min="10"
                :max="100"
                :marks="{ 10: '10%', 50: '50%', 100: '100%' }"
                style="width: 300px"
              />
              <span style="margin-left: 16px;">{{ systemConfig.cpuLimit }}%</span>
            </a-form-item>

            <a-form-item label="网络超时 (秒)">
              <a-input-number
                v-model:value="systemConfig.networkTimeout"
                :min="5"
                :max="300"
                style="width: 200px"
              />
            </a-form-item>

            <!-- 日志设置 -->
            <a-divider orientation="left">日志设置</a-divider>

            <a-form-item label="日志级别">
              <a-radio-group v-model:value="systemConfig.logLevel">
                <a-radio value="DEBUG">DEBUG</a-radio>
                <a-radio value="INFO">INFO</a-radio>
                <a-radio value="WARNING">WARNING</a-radio>
                <a-radio value="ERROR">ERROR</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="日志保留天数">
              <a-input-number
                v-model:value="systemConfig.logRetentionDays"
                :min="1"
                :max="365"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="启用详细日志">
              <a-switch v-model:checked="systemConfig.enableVerboseLog" />
            </a-form-item>

            <a-form-item label="启用性能监控">
              <a-switch v-model:checked="systemConfig.enablePerformanceMonitor" />
            </a-form-item>

            <!-- 安全设置 -->
            <a-divider orientation="left">安全设置</a-divider>

            <a-form-item label="启用SSL">
              <a-switch v-model:checked="systemConfig.enableSSL" />
            </a-form-item>

            <a-form-item label="会话超时 (分钟)">
              <a-input-number
                v-model:value="systemConfig.sessionTimeout"
                :min="5"
                :max="480"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="最大登录尝试次数">
              <a-input-number
                v-model:value="systemConfig.maxLoginAttempts"
                :min="3"
                :max="10"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="启用双因子认证">
              <a-switch v-model:checked="systemConfig.enableTwoFactor" />
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 算法配置 -->
        <a-tab-pane key="algorithm" tab="算法配置">
          <a-form
            :model="algorithmConfig"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            layout="horizontal"
          >
            <!-- 联邦学习算法 -->
            <a-divider orientation="left">联邦学习算法</a-divider>

            <a-form-item label="默认算法">
              <a-select v-model:value="algorithmConfig.defaultAlgorithm" style="width: 200px">
                <a-select-option value="FedAvg">FedAvg</a-select-option>
                <a-select-option value="FedProx">FedProx</a-select-option>
                <a-select-option value="FedSGD">FedSGD</a-select-option>
                <a-select-option value="SCAFFOLD">SCAFFOLD</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="聚合策略">
              <a-radio-group v-model:value="algorithmConfig.aggregationStrategy">
                <a-radio value="weighted_average">加权平均</a-radio>
                <a-radio value="simple_average">简单平均</a-radio>
                <a-radio value="median">中位数</a-radio>
                <a-radio value="trimmed_mean">截尾均值</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="客户端采样率">
              <a-slider
                v-model:value="algorithmConfig.clientSamplingRate"
                :min="0.1"
                :max="1.0"
                :step="0.1"
                :marks="{ 0.1: '10%', 0.5: '50%', 1.0: '100%' }"
                style="width: 300px"
              />
              <span style="margin-left: 16px;">{{ (algorithmConfig.clientSamplingRate * 100).toFixed(0) }}%</span>
            </a-form-item>

            <!-- 训练参数 -->
            <a-divider orientation="left">训练参数</a-divider>

            <a-form-item label="全局训练轮数">
              <a-input-number
                v-model:value="algorithmConfig.globalRounds"
                :min="1"
                :max="1000"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="本地训练轮数">
              <a-input-number
                v-model:value="algorithmConfig.localEpochs"
                :min="1"
                :max="100"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="学习率">
              <a-input-number
                v-model:value="algorithmConfig.learningRate"
                :min="0.0001"
                :max="1.0"
                :step="0.0001"
                :precision="4"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="批次大小">
              <a-select v-model:value="algorithmConfig.batchSize" style="width: 200px">
                <a-select-option :value="16">16</a-select-option>
                <a-select-option :value="32">32</a-select-option>
                <a-select-option :value="64">64</a-select-option>
                <a-select-option :value="128">128</a-select-option>
                <a-select-option :value="256">256</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="优化器">
              <a-radio-group v-model:value="algorithmConfig.optimizer">
                <a-radio value="SGD">SGD</a-radio>
                <a-radio value="Adam">Adam</a-radio>
                <a-radio value="AdamW">AdamW</a-radio>
                <a-radio value="RMSprop">RMSprop</a-radio>
              </a-radio-group>
            </a-form-item>

            <!-- 高级设置 -->
            <a-divider orientation="left">高级设置</a-divider>

            <a-form-item label="数据异构性处理">
              <a-switch v-model:checked="algorithmConfig.handleDataHeterogeneity" />
            </a-form-item>

            <a-form-item label="启用差分隐私">
              <a-switch v-model:checked="algorithmConfig.enableDifferentialPrivacy" />
            </a-form-item>

            <a-form-item label="隐私预算 (ε)">
              <a-input-number
                v-model:value="algorithmConfig.privacyBudget"
                :min="0.1"
                :max="10.0"
                :step="0.1"
                :disabled="!algorithmConfig.enableDifferentialPrivacy"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="启用安全聚合">
              <a-switch v-model:checked="algorithmConfig.enableSecureAggregation" />
            </a-form-item>

            <a-form-item label="容错机制">
              <a-select v-model:value="algorithmConfig.faultTolerance" style="width: 200px">
                <a-select-option value="none">无</a-select-option>
                <a-select-option value="retry">重试</a-select-option>
                <a-select-option value="skip">跳过</a-select-option>
                <a-select-option value="fallback">回退</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 配置模板 -->
        <a-tab-pane key="templates" tab="配置模板">
          <div class="templates-section">
            <div class="templates-header">
              <h3>配置模板管理</h3>
              <a-button type="primary" @click="showCreateTemplateModal">
                <template #icon>
                  <PlusOutlined />
                </template>
                创建模板
              </a-button>
            </div>

            <a-list
              :data-source="configTemplates"
              item-layout="horizontal"
              class="templates-list"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <template #actions>
                    <a @click="loadTemplate(item)">加载</a>
                    <a @click="editTemplate(item)">编辑</a>
                    <a @click="duplicateTemplate(item)">复制</a>
                    <a-popconfirm
                      title="确定要删除这个模板吗？"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="deleteTemplate(item)"
                    >
                      <a style="color: #f5222d;">删除</a>
                    </a-popconfirm>
                  </template>

                  <a-list-item-meta>
                    <template #title>
                      <span>{{ item.name }}</span>
                      <a-tag v-if="item.isDefault" color="blue" style="margin-left: 8px;">默认</a-tag>
                    </template>
                    <template #description>
                      <p>{{ item.description }}</p>
                      <div class="template-info">
                        <a-tag size="small">{{ item.algorithm }}</a-tag>
                        <span class="template-meta">
                          创建时间: {{ formatTime(item.createTime) }}
                        </span>
                        <span class="template-meta">
                          使用次数: {{ item.usageCount }}
                        </span>
                      </div>
                    </template>
                    <template #avatar>
                      <a-avatar :style="{ backgroundColor: getTemplateColor(item.type) }">
                        <component :is="getTemplateIcon(item.type)" />
                      </a-avatar>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </a-tab-pane>

        <!-- 监控设置 -->
        <a-tab-pane key="monitoring" tab="监控设置">
          <a-form
            :model="monitoringConfig"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            layout="horizontal"
          >
            <!-- 性能监控 -->
            <a-divider orientation="left">性能监控</a-divider>

            <a-form-item label="启用实时监控">
              <a-switch v-model:checked="monitoringConfig.enableRealTimeMonitoring" />
            </a-form-item>

            <a-form-item label="监控数据保留天数">
              <a-input-number
                v-model:value="monitoringConfig.dataRetentionDays"
                :min="1"
                :max="365"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="采样间隔 (秒)">
              <a-slider
                v-model:value="monitoringConfig.samplingInterval"
                :min="1"
                :max="60"
                :marks="{ 1: '1s', 30: '30s', 60: '60s' }"
                style="width: 300px"
              />
              <span style="margin-left: 16px;">{{ monitoringConfig.samplingInterval }}s</span>
            </a-form-item>

            <!-- 告警设置 -->
            <a-divider orientation="left">告警设置</a-divider>

            <a-form-item label="启用告警">
              <a-switch v-model:checked="monitoringConfig.enableAlerts" />
            </a-form-item>

            <a-form-item label="CPU使用率告警阈值 (%)">
              <a-input-number
                v-model:value="monitoringConfig.cpuAlertThreshold"
                :min="50"
                :max="95"
                :disabled="!monitoringConfig.enableAlerts"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="内存使用率告警阈值 (%)">
              <a-input-number
                v-model:value="monitoringConfig.memoryAlertThreshold"
                :min="50"
                :max="95"
                :disabled="!monitoringConfig.enableAlerts"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="网络延迟告警阈值 (ms)">
              <a-input-number
                v-model:value="monitoringConfig.latencyAlertThreshold"
                :min="100"
                :max="5000"
                :disabled="!monitoringConfig.enableAlerts"
                style="width: 200px"
              />
            </a-form-item>

            <a-form-item label="告警通知方式">
              <a-checkbox-group
                v-model:value="monitoringConfig.alertNotificationMethods"
                :disabled="!monitoringConfig.enableAlerts"
              >
                <a-checkbox value="email">邮件</a-checkbox>
                <a-checkbox value="sms">短信</a-checkbox>
                <a-checkbox value="webhook">Webhook</a-checkbox>
                <a-checkbox value="browser">浏览器通知</a-checkbox>
              </a-checkbox-group>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 创建模板模态框 -->
    <a-modal
      v-model:open="createTemplateModalVisible"
      title="创建配置模板"
      width="600px"
      @ok="handleCreateTemplate"
      @cancel="handleCancelCreateTemplate"
    >
      <a-form
        :model="templateForm"
        :rules="templateRules"
        ref="templateFormRef"
        layout="vertical"
      >
        <a-form-item label="模板名称" name="name">
          <a-input v-model:value="templateForm.name" placeholder="请输入模板名称" />
        </a-form-item>

        <a-form-item label="模板类型" name="type">
          <a-select v-model:value="templateForm.type" placeholder="请选择模板类型">
            <a-select-option value="system">系统配置</a-select-option>
            <a-select-option value="algorithm">算法配置</a-select-option>
            <a-select-option value="monitoring">监控配置</a-select-option>
            <a-select-option value="mixed">混合配置</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="算法类型" name="algorithm">
          <a-select v-model:value="templateForm.algorithm" placeholder="请选择算法类型">
            <a-select-option value="FedAvg">FedAvg</a-select-option>
            <a-select-option value="FedProx">FedProx</a-select-option>
            <a-select-option value="FedSGD">FedSGD</a-select-option>
            <a-select-option value="SCAFFOLD">SCAFFOLD</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="模板描述" name="description">
          <a-textarea
            v-model:value="templateForm.description"
            placeholder="请输入模板描述"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="设为默认模板" name="isDefault">
          <a-switch v-model:checked="templateForm.isDefault" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  DownloadOutlined,
  UploadOutlined,
  SaveOutlined,
  PlusOutlined,
  SettingOutlined,
  ExperimentOutlined,
  MonitorOutlined,
  FileOutlined
} from '@ant-design/icons-vue'

// 响应式数据
const activeTab = ref('system')
const createTemplateModalVisible = ref(false)
const templateFormRef = ref()

// 系统配置
const systemConfig = reactive({
  systemName: 'FederatedScope',
  description: '联邦学习管理平台',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  maxConcurrency: 10,
  memoryLimit: 8,
  cpuLimit: 80,
  networkTimeout: 30,
  logLevel: 'INFO',
  logRetentionDays: 30,
  enableVerboseLog: false,
  enablePerformanceMonitor: true,
  enableSSL: true,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  enableTwoFactor: false
})

// 算法配置
const algorithmConfig = reactive({
  defaultAlgorithm: 'FedAvg',
  aggregationStrategy: 'weighted_average',
  clientSamplingRate: 0.3,
  globalRounds: 100,
  localEpochs: 5,
  learningRate: 0.01,
  batchSize: 32,
  optimizer: 'SGD',
  handleDataHeterogeneity: true,
  enableDifferentialPrivacy: false,
  privacyBudget: 1.0,
  enableSecureAggregation: false,
  faultTolerance: 'retry'
})

// 监控配置
const monitoringConfig = reactive({
  enableRealTimeMonitoring: true,
  dataRetentionDays: 90,
  samplingInterval: 10,
  enableAlerts: true,
  cpuAlertThreshold: 85,
  memoryAlertThreshold: 90,
  latencyAlertThreshold: 1000,
  alertNotificationMethods: ['email', 'browser']
})

// 配置模板
const configTemplates = ref([
  {
    id: 1,
    name: '默认FedAvg配置',
    type: 'algorithm',
    algorithm: 'FedAvg',
    description: '标准的联邦平均算法配置，适用于大多数场景',
    isDefault: true,
    createTime: '2024-01-15T10:30:00Z',
    usageCount: 45,
    config: {
      globalRounds: 100,
      localEpochs: 5,
      learningRate: 0.01,
      batchSize: 32
    }
  },
  {
    id: 2,
    name: '高性能训练配置',
    type: 'system',
    algorithm: 'FedProx',
    description: '针对高性能计算环境优化的配置',
    isDefault: false,
    createTime: '2024-01-14T14:20:00Z',
    usageCount: 23,
    config: {
      maxConcurrency: 50,
      memoryLimit: 32,
      cpuLimit: 95
    }
  },
  {
    id: 3,
    name: '隐私保护配置',
    type: 'mixed',
    algorithm: 'SCAFFOLD',
    description: '启用差分隐私和安全聚合的配置',
    isDefault: false,
    createTime: '2024-01-13T09:15:00Z',
    usageCount: 12,
    config: {
      enableDifferentialPrivacy: true,
      privacyBudget: 2.0,
      enableSecureAggregation: true
    }
  },
  {
    id: 4,
    name: '开发测试配置',
    type: 'algorithm',
    algorithm: 'FedSGD',
    description: '适用于开发和测试的快速配置',
    isDefault: false,
    createTime: '2024-01-12T16:45:00Z',
    usageCount: 67,
    config: {
      globalRounds: 10,
      localEpochs: 1,
      learningRate: 0.1,
      batchSize: 64
    }
  }
])

// 模板表单
const templateForm = reactive({
  name: '',
  type: '',
  algorithm: '',
  description: '',
  isDefault: false
})

// 表单验证规则
const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  algorithm: [{ required: true, message: '请选择算法类型', trigger: 'change' }]
}

// 工具函数
const getTemplateIcon = (type) => {
  const iconMap = {
    system: SettingOutlined,
    algorithm: ExperimentOutlined,
    monitoring: MonitorOutlined,
    mixed: FileOutlined
  }
  return iconMap[type] || FileOutlined
}

const getTemplateColor = (type) => {
  const colorMap = {
    system: '#1890ff',
    algorithm: '#52c41a',
    monitoring: '#fa8c16',
    mixed: '#722ed1'
  }
  return colorMap[type] || '#1890ff'
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
const saveAllSettings = () => {
  message.loading({ content: '正在保存设置...', key: 'save', duration: 0 })
  
  // 模拟保存过程
  setTimeout(() => {
    message.success({ content: '设置保存成功', key: 'save' })
  }, 1500)
}

const exportConfig = () => {
  const config = {
    system: systemConfig,
    algorithm: algorithmConfig,
    monitoring: monitoringConfig,
    exportTime: new Date().toISOString()
  }
  
  const dataStr = JSON.stringify(config, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `federatedscope-config-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  
  URL.revokeObjectURL(url)
  message.success('配置导出成功')
}

const importConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result)
          
          if (config.system) Object.assign(systemConfig, config.system)
          if (config.algorithm) Object.assign(algorithmConfig, config.algorithm)
          if (config.monitoring) Object.assign(monitoringConfig, config.monitoring)
          
          message.success('配置导入成功')
        } catch (error) {
          message.error('配置文件格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  
  input.click()
}

const loadTemplate = (template) => {
  if (template.type === 'system' || template.type === 'mixed') {
    Object.assign(systemConfig, template.config)
  }
  if (template.type === 'algorithm' || template.type === 'mixed') {
    Object.assign(algorithmConfig, template.config)
  }
  if (template.type === 'monitoring' || template.type === 'mixed') {
    Object.assign(monitoringConfig, template.config)
  }
  
  template.usageCount++
  message.success(`模板 "${template.name}" 加载成功`)
}

const editTemplate = (template) => {
  Object.assign(templateForm, {
    name: template.name,
    type: template.type,
    algorithm: template.algorithm,
    description: template.description,
    isDefault: template.isDefault
  })
  createTemplateModalVisible.value = true
}

const duplicateTemplate = (template) => {
  const newTemplate = {
    ...template,
    id: Date.now(),
    name: `${template.name} - 副本`,
    isDefault: false,
    createTime: new Date().toISOString(),
    usageCount: 0
  }
  configTemplates.value.push(newTemplate)
  message.success('模板复制成功')
}

const deleteTemplate = (template) => {
  const index = configTemplates.value.findIndex(t => t.id === template.id)
  if (index > -1) {
    configTemplates.value.splice(index, 1)
    message.success('模板删除成功')
  }
}

const handleCreateTemplate = async () => {
  try {
    await templateFormRef.value.validate()
    
    const newTemplate = {
      id: Date.now(),
      ...templateForm,
      createTime: new Date().toISOString(),
      usageCount: 0,
      config: {}
    }
    
    // 根据类型保存当前配置
    if (templateForm.type === 'system' || templateForm.type === 'mixed') {
      newTemplate.config = { ...newTemplate.config, ...systemConfig }
    }
    if (templateForm.type === 'algorithm' || templateForm.type === 'mixed') {
      newTemplate.config = { ...newTemplate.config, ...algorithmConfig }
    }
    if (templateForm.type === 'monitoring' || templateForm.type === 'mixed') {
      newTemplate.config = { ...newTemplate.config, ...monitoringConfig }
    }
    
    configTemplates.value.push(newTemplate)
    createTemplateModalVisible.value = false
    
    // 重置表单
    Object.assign(templateForm, {
      name: '',
      type: '',
      algorithm: '',
      description: '',
      isDefault: false
    })
    
    message.success('模板创建成功')
  } catch (error) {
    console.error('验证失败:', error)
  }
}

const handleCancelCreateTemplate = () => {
  createTemplateModalVisible.value = false
  // 重置表单
  Object.assign(templateForm, {
    name: '',
    type: '',
    algorithm: '',
    description: '',
    isDefault: false
  })
}

// 组件挂载时初始化
onMounted(() => {
  // 初始化操作
})
</script>

<style scoped>
.settings-container {
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

.settings-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-card :deep(.ant-tabs-card > .ant-tabs-content) {
  margin-top: 16px;
}

.settings-card :deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab) {
  background: #fafafa;
  border: 1px solid #d9d9d9;
  margin-right: 8px;
}

.settings-card :deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active) {
  background: white;
  border-bottom-color: white;
}

.templates-section {
  padding: 8px 0;
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.templates-header h3 {
  margin: 0;
  color: #262626;
  font-size: 18px;
  font-weight: 500;
}

.templates-list {
  background: white;
  border-radius: 8px;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.template-meta {
  color: #8c8c8c;
  font-size: 12px;
}

/* 表单样式优化 */
.ant-form-item {
  margin-bottom: 24px;
}

.ant-divider {
  margin: 32px 0 24px 0;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

/* 滑块样式 */
.ant-slider {
  margin: 8px 0;
}

/* 开关样式 */
.ant-switch {
  margin: 4px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .settings-card :deep(.ant-form-item-label) {
    text-align: left !important;
  }
  
  .settings-card :deep(.ant-form-item-control) {
    margin-left: 0 !important;
  }
  
  .templates-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

@media (max-width: 992px) {
  .settings-card :deep(.ant-form) {
    .ant-form-item-label {
      text-align: left;
    }
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .settings-container {
    background: #141414;
  }
  
  .settings-card {
    background: #1f1f1f;
    border: 1px solid #303030;
  }
}
</style>
