<template>
  <div class="participants-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">参与方管理</h1>
        <p class="page-description">管理联邦学习参与方，监控连接状态和配置参数</p>
      </div>
      <div class="header-actions">
        <a-space>
          <a-button @click="showConnectionModal">
            <template #icon>
              <LinkOutlined />
            </template>
            连接状态
          </a-button>
          <a-button type="primary" @click="showAddModal">
            <template #icon>
              <PlusOutlined />
            </template>
            添加参与方
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="24" class="stats-row">
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="总参与方"
            :value="totalParticipants"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <TeamOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="在线参与方"
            :value="onlineParticipants"
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
            title="活跃参与方"
            :value="activeParticipants"
            :value-style="{ color: '#fa8c16' }"
          >
            <template #prefix>
              <ThunderboltOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <a-card class="stat-card">
          <a-statistic
            title="平均延迟"
            :value="avgLatency"
            suffix="ms"
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
            placeholder="搜索参与方名称"
            enter-button
            @search="handleSearch"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-select
            v-model:value="filterStatus"
            placeholder="连接状态"
            style="width: 100%"
            @change="handleFilter"
          >
            <a-select-option value="">全部状态</a-select-option>
            <a-select-option value="online">在线</a-select-option>
            <a-select-option value="offline">离线</a-select-option>
            <a-select-option value="connecting">连接中</a-select-option>
            <a-select-option value="error">错误</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-select
            v-model:value="filterRole"
            placeholder="参与方角色"
            style="width: 100%"
            @change="handleFilter"
          >
            <a-select-option value="">全部角色</a-select-option>
            <a-select-option value="client">客户端</a-select-option>
            <a-select-option value="server">服务端</a-select-option>
            <a-select-option value="coordinator">协调器</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 参与方列表 -->
    <a-card class="table-card">
      <template #title>
        <span>参与方列表</span>
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
        :data-source="filteredParticipants"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 参与方名称 -->
          <template v-if="column.key === 'name'">
            <div class="participant-name">
              <component :is="getRoleIcon(record.role)" class="role-icon" />
              <span class="name-text">{{ record.name }}</span>
            </div>
          </template>

          <!-- 连接状态 -->
          <template v-if="column.key === 'status'">
            <a-badge :status="getBadgeStatus(record.status)" :text="getStatusLabel(record.status)" />
          </template>

          <!-- 角色标签 -->
          <template v-if="column.key === 'role'">
            <a-tag :color="getRoleColor(record.role)">
              {{ getRoleLabel(record.role) }}
            </a-tag>
          </template>

          <!-- 延迟显示 -->
          <template v-if="column.key === 'latency'">
            <span :class="getLatencyClass(record.latency)">
              {{ record.latency }}ms
            </span>
          </template>

          <!-- 数据量格式化 -->
          <template v-if="column.key === 'dataSize'">
            {{ formatDataSize(record.dataSize) }}
          </template>

          <!-- 最后活跃时间 -->
          <template v-if="column.key === 'lastActive'">
            {{ formatTime(record.lastActive) }}
          </template>

          <!-- 操作按钮 -->
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="showDetailModal(record)">
                <EyeOutlined />
                详情
              </a-button>
              <a-button type="link" size="small" @click="showConfigModal(record)">
                <SettingOutlined />
                配置
              </a-button>
              <a-button 
                type="link" 
                size="small" 
                :disabled="record.status === 'offline'"
                @click="testConnection(record)"
              >
                <WifiOutlined />
                测试连接
              </a-button>
              <a-popconfirm
                title="确定要移除这个参与方吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="removeParticipant(record)"
              >
                <a-button type="link" size="small" danger>
                  <DeleteOutlined />
                  移除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 参与方详情模态框 -->
    <a-modal
      v-model:visible="detailModalVisible"
      :title="`参与方详情 - ${selectedParticipant.name}`"
      width="800px"
      :footer="null"
    >
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 基本信息 -->
        <a-tab-pane key="basic" tab="基本信息">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="参与方名称">
              {{ selectedParticipant.name }}
            </a-descriptions-item>
            <a-descriptions-item label="角色">
              <a-tag :color="getRoleColor(selectedParticipant.role)">
                {{ getRoleLabel(selectedParticipant.role) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="连接状态">
              <a-badge :status="getBadgeStatus(selectedParticipant.status)" :text="getStatusLabel(selectedParticipant.status)" />
            </a-descriptions-item>
            <a-descriptions-item label="IP地址">
              {{ selectedParticipant.ip }}
            </a-descriptions-item>
            <a-descriptions-item label="端口">
              {{ selectedParticipant.port }}
            </a-descriptions-item>
            <a-descriptions-item label="延迟">
              <span :class="getLatencyClass(selectedParticipant.latency)">
                {{ selectedParticipant.latency }}ms
              </span>
            </a-descriptions-item>
            <a-descriptions-item label="数据量">
              {{ formatDataSize(selectedParticipant.dataSize) }}
            </a-descriptions-item>
            <a-descriptions-item label="CPU使用率">
              {{ selectedParticipant.cpuUsage }}%
            </a-descriptions-item>
            <a-descriptions-item label="内存使用率">
              {{ selectedParticipant.memoryUsage }}%
            </a-descriptions-item>
            <a-descriptions-item label="最后活跃">
              {{ formatTime(selectedParticipant.lastActive) }}
            </a-descriptions-item>
            <a-descriptions-item label="描述" :span="2">
              {{ selectedParticipant.description }}
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <!-- 通信状态 -->
        <a-tab-pane key="communication" tab="通信状态">
          <a-timeline>
            <a-timeline-item
              v-for="log in selectedParticipant.connectionLogs"
              :key="log.id"
              :color="getTimelineColor(log.type)"
            >
              <template #dot>
                <component :is="getLogIcon(log.type)" />
              </template>
              <div class="communication-log">
                <div class="log-header">
                  <span class="log-type">{{ getLogTypeLabel(log.type) }}</span>
                  <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                </div>
                <p class="log-message">{{ log.message }}</p>
                <div v-if="log.details" class="log-details">
                  <a-tag v-for="(value, key) in log.details" :key="key" size="small">
                    {{ key }}: {{ value }}
                  </a-tag>
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-tab-pane>

        <!-- 性能监控 -->
        <a-tab-pane key="performance" tab="性能监控">
          <a-row :gutter="24">
            <a-col :span="12">
              <a-card title="系统资源" size="small">
                <div class="performance-item">
                  <span>CPU使用率</span>
                  <a-progress :percent="selectedParticipant.cpuUsage" />
                </div>
                <div class="performance-item">
                  <span>内存使用率</span>
                  <a-progress :percent="selectedParticipant.memoryUsage" />
                </div>
                <div class="performance-item">
                  <span>网络延迟</span>
                  <a-progress 
                    :percent="Math.max(0, 100 - selectedParticipant.latency / 10)" 
                    :status="selectedParticipant.latency > 500 ? 'exception' : 'normal'"
                  />
                </div>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card title="训练统计" size="small">
                <a-statistic
                  title="参与轮数"
                  :value="selectedParticipant.participatedRounds"
                />
                <a-statistic
                  title="数据上传量"
                  :value="selectedParticipant.uploadedData"
                  suffix="MB"
                />
                <a-statistic
                  title="平均训练时间"
                  :value="selectedParticipant.avgTrainingTime"
                  suffix="s"
                />
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <!-- 参与方配置模态框 -->
    <a-modal
      v-model:visible="configModalVisible"
      :title="`配置参与方 - ${configParticipant.name}`"
      width="600px"
      @ok="handleConfigOk"
      @cancel="handleConfigCancel"
    >
      <a-form
        :model="configForm"
        :rules="configRules"
        ref="configFormRef"
        layout="vertical"
      >
        <a-form-item label="参与方名称" name="name">
          <a-input v-model:value="configForm.name" placeholder="请输入参与方名称" />
        </a-form-item>

        <a-form-item label="角色" name="role">
          <a-select v-model:value="configForm.role" placeholder="请选择角色">
            <a-select-option value="client">客户端</a-select-option>
            <a-select-option value="server">服务端</a-select-option>
            <a-select-option value="coordinator">协调器</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="IP地址" name="ip">
          <a-input v-model:value="configForm.ip" placeholder="请输入IP地址" />
        </a-form-item>

        <a-form-item label="端口" name="port">
          <a-input-number
            v-model:value="configForm.port"
            :min="1"
            :max="65535"
            style="width: 100%"
            placeholder="请输入端口号"
          />
        </a-form-item>

        <a-form-item label="启用SSL" name="sslEnabled">
          <a-switch v-model:checked="configForm.sslEnabled" />
        </a-form-item>

        <a-form-item label="自动重连" name="autoReconnect">
          <a-switch v-model:checked="configForm.autoReconnect" />
        </a-form-item>

        <a-form-item label="超时时间(秒)" name="timeout">
          <a-input-number
            v-model:value="configForm.timeout"
            :min="1"
            :max="300"
            style="width: 100%"
            placeholder="请输入超时时间"
          />
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="configForm.description"
            placeholder="请输入描述信息"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加参与方模态框 -->
    <a-modal
      v-model:visible="addModalVisible"
      title="添加参与方"
      width="600px"
      @ok="handleAddOk"
      @cancel="handleAddCancel"
    >
      <a-form
        :model="addForm"
        :rules="addRules"
        ref="addFormRef"
        layout="vertical"
      >
        <a-form-item label="参与方名称" name="name">
          <a-input v-model:value="addForm.name" placeholder="请输入参与方名称" />
        </a-form-item>

        <a-form-item label="角色" name="role">
          <a-select v-model:value="addForm.role" placeholder="请选择角色">
            <a-select-option value="client">客户端</a-select-option>
            <a-select-option value="server">服务端</a-select-option>
            <a-select-option value="coordinator">协调器</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="IP地址" name="ip">
          <a-input v-model:value="addForm.ip" placeholder="请输入IP地址" />
        </a-form-item>

        <a-form-item label="端口" name="port">
          <a-input-number
            v-model:value="addForm.port"
            :min="1"
            :max="65535"
            style="width: 100%"
            placeholder="请输入端口号"
          />
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="addForm.description"
            placeholder="请输入描述信息"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 连接状态模态框 -->
    <a-modal
      v-model:visible="connectionModalVisible"
      title="连接状态监控"
      width="900px"
      :footer="null"
    >
      <div class="connection-monitor">
        <a-row :gutter="24" style="margin-bottom: 16px;">
          <a-col :span="6">
            <a-statistic title="总连接数" :value="connectionStats.total" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="成功连接" :value="connectionStats.success" :value-style="{ color: '#52c41a' }" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="失败连接" :value="connectionStats.failed" :value-style="{ color: '#f5222d' }" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="平均延迟" :value="connectionStats.avgLatency" suffix="ms" />
          </a-col>
        </a-row>

        <a-table
          :columns="connectionColumns"
          :data-source="participants"
          :pagination="false"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-badge :status="getBadgeStatus(record.status)" :text="getStatusLabel(record.status)" />
            </template>
            <template v-if="column.key === 'latency'">
              <span :class="getLatencyClass(record.latency)">
                {{ record.latency }}ms
              </span>
            </template>
          </template>
        </a-table>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  LinkOutlined,
  PlusOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  SettingOutlined,
  WifiOutlined,
  DeleteOutlined,
  UserOutlined,
  CloudServerOutlined,
  ControlOutlined,
  ApiOutlined,
  DisconnectOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'

// 响应式数据
const loading = ref(false)
const searchText = ref('')
const filterStatus = ref('')
const filterRole = ref('')
const detailModalVisible = ref(false)
const configModalVisible = ref(false)
const addModalVisible = ref(false)
const connectionModalVisible = ref(false)
const activeTab = ref('basic')
const configFormRef = ref()
const addFormRef = ref()

// 统计数据
const totalParticipants = ref(15)
const onlineParticipants = ref(12)
const activeParticipants = ref(8)
const avgLatency = ref(45)

// 选中的参与方
const selectedParticipant = ref({})
const configParticipant = ref({})

// 参与方列表数据
const participants = ref([
  {
    id: 1,
    name: 'Client-001',
    role: 'client',
    status: 'online',
    ip: '192.168.1.100',
    port: 8080,
    latency: 23,
    dataSize: 1048576000,
    cpuUsage: 65,
    memoryUsage: 78,
    participatedRounds: 45,
    uploadedData: 256,
    avgTrainingTime: 12.5,
    lastActive: '2024-01-17T09:30:00Z',
    description: '主要的训练客户端，负责图像分类任务',
    connectionLogs: [
      {
        id: 1,
        type: 'connect',
        timestamp: '2024-01-17T09:30:00Z',
        message: '成功连接到服务器',
        details: { protocol: 'HTTP', version: '1.1' }
      },
      {
        id: 2,
        type: 'training',
        timestamp: '2024-01-17T09:35:00Z',
        message: '开始本地训练',
        details: { epoch: 1, batch_size: 32 }
      },
      {
        id: 3,
        type: 'upload',
        timestamp: '2024-01-17T09:45:00Z',
        message: '上传模型参数',
        details: { size: '12.5MB', duration: '2.3s' }
      }
    ]
  },
  {
    id: 2,
    name: 'Server-001',
    role: 'server',
    status: 'online',
    ip: '192.168.1.10',
    port: 8000,
    latency: 12,
    dataSize: 0,
    cpuUsage: 45,
    memoryUsage: 56,
    participatedRounds: 100,
    uploadedData: 0,
    avgTrainingTime: 0,
    lastActive: '2024-01-17T10:00:00Z',
    description: '中央服务器，负责模型聚合',
    connectionLogs: [
      {
        id: 1,
        type: 'start',
        timestamp: '2024-01-17T08:00:00Z',
        message: '服务器启动',
        details: { port: 8000, workers: 4 }
      },
      {
        id: 2,
        type: 'aggregate',
        timestamp: '2024-01-17T09:50:00Z',
        message: '执行模型聚合',
        details: { clients: 8, round: 45 }
      }
    ]
  },
  {
    id: 3,
    name: 'Client-002',
    role: 'client',
    status: 'connecting',
    ip: '192.168.1.101',
    port: 8080,
    latency: 156,
    dataSize: 524288000,
    cpuUsage: 82,
    memoryUsage: 91,
    participatedRounds: 42,
    uploadedData: 198,
    avgTrainingTime: 15.2,
    lastActive: '2024-01-17T09:28:00Z',
    description: '辅助训练客户端',
    connectionLogs: [
      {
        id: 1,
        type: 'connect',
        timestamp: '2024-01-17T09:28:00Z',
        message: '尝试连接服务器',
        details: { attempt: 1 }
      },
      {
        id: 2,
        type: 'error',
        timestamp: '2024-01-17T09:29:00Z',
        message: '连接超时，正在重试',
        details: { timeout: '30s', retry: 2 }
      }
    ]
  },
  {
    id: 4,
    name: 'Coordinator-001',
    role: 'coordinator',
    status: 'online',
    ip: '192.168.1.50',
    port: 9000,
    latency: 34,
    dataSize: 0,
    cpuUsage: 35,
    memoryUsage: 42,
    participatedRounds: 100,
    uploadedData: 0,
    avgTrainingTime: 0,
    lastActive: '2024-01-17T09:59:00Z',
    description: '协调器节点，管理训练流程',
    connectionLogs: [
      {
        id: 1,
        type: 'start',
        timestamp: '2024-01-17T08:00:00Z',
        message: '协调器启动',
        details: { mode: 'federated', algorithm: 'FedAvg' }
      },
      {
        id: 2,
        type: 'coordinate',
        timestamp: '2024-01-17T09:00:00Z',
        message: '开始新一轮协调',
        details: { round: 45, clients: 8 }
      }
    ]
  },
  {
    id: 5,
    name: 'Client-003',
    role: 'client',
    status: 'offline',
    ip: '192.168.1.102',
    port: 8080,
    latency: 999,
    dataSize: 2097152000,
    cpuUsage: 0,
    memoryUsage: 0,
    participatedRounds: 38,
    uploadedData: 312,
    avgTrainingTime: 18.7,
    lastActive: '2024-01-17T08:45:00Z',
    description: '临时离线的客户端',
    connectionLogs: [
      {
        id: 1,
        type: 'disconnect',
        timestamp: '2024-01-17T08:45:00Z',
        message: '客户端断开连接',
        details: { reason: 'network_error' }
      }
    ]
  },
  {
    id: 6,
    name: 'Client-004',
    role: 'client',
    status: 'error',
    ip: '192.168.1.103',
    port: 8080,
    latency: 567,
    dataSize: 734003200,
    cpuUsage: 95,
    memoryUsage: 98,
    participatedRounds: 23,
    uploadedData: 145,
    avgTrainingTime: 25.3,
    lastActive: '2024-01-17T09:15:00Z',
    description: '出现错误的客户端',
    connectionLogs: [
      {
        id: 1,
        type: 'error',
        timestamp: '2024-01-17T09:15:00Z',
        message: '训练过程中出现错误',
        details: { error: 'OutOfMemoryError', code: 'E001' }
      }
    ]
  }
])

// 表格列定义
const columns = [
  {
    title: '参与方名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
    fixed: 'left'
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: 100
  },
  {
    title: '连接状态',
    dataIndex: 'status',
    key: 'status',
    width: 120
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 120
  },
  {
    title: '端口',
    dataIndex: 'port',
    key: 'port',
    width: 80
  },
  {
    title: '延迟',
    dataIndex: 'latency',
    key: 'latency',
    width: 80,
    sorter: (a, b) => a.latency - b.latency
  },
  {
    title: '数据量',
    dataIndex: 'dataSize',
    key: 'dataSize',
    width: 100
  },
  {
    title: '最后活跃',
    dataIndex: 'lastActive',
    key: 'lastActive',
    width: 150
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right'
  }
]

// 连接状态表格列
const connectionColumns = [
  { title: '参与方', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
  { title: '延迟', dataIndex: 'latency', key: 'latency' }
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

// 配置表单
const configForm = reactive({
  name: '',
  role: '',
  ip: '',
  port: 8080,
  sslEnabled: false,
  autoReconnect: true,
  timeout: 30,
  description: ''
})

// 添加表单
const addForm = reactive({
  name: '',
  role: '',
  ip: '',
  port: 8080,
  description: ''
})

// 表单验证规则
const configRules = {
  name: [{ required: true, message: '请输入参与方名称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }]
}

const addRules = {
  name: [{ required: true, message: '请输入参与方名称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }]
}

// 连接统计
const connectionStats = computed(() => {
  const online = participants.value.filter(p => p.status === 'online').length
  const offline = participants.value.filter(p => p.status === 'offline').length
  const error = participants.value.filter(p => p.status === 'error').length
  const avgLat = Math.round(
    participants.value.reduce((sum, p) => sum + (p.status === 'online' ? p.latency : 0), 0) / online
  )
  
  return {
    total: participants.value.length,
    success: online,
    failed: offline + error,
    avgLatency: avgLat || 0
  }
})

// 计算属性：过滤后的参与方
const filteredParticipants = computed(() => {
  let result = participants.value

  if (searchText.value) {
    result = result.filter(participant =>
      participant.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }

  if (filterStatus.value) {
    result = result.filter(participant => participant.status === filterStatus.value)
  }

  if (filterRole.value) {
    result = result.filter(participant => participant.role === filterRole.value)
  }

  pagination.total = result.length
  return result
})

// 工具函数
const getRoleIcon = (role) => {
  const iconMap = {
    client: UserOutlined,
    server: CloudServerOutlined,
    coordinator: ControlOutlined
  }
  return iconMap[role] || UserOutlined
}

const getRoleColor = (role) => {
  const colorMap = {
    client: 'blue',
    server: 'green',
    coordinator: 'purple'
  }
  return colorMap[role] || 'default'
}

const getRoleLabel = (role) => {
  const labelMap = {
    client: '客户端',
    server: '服务端',
    coordinator: '协调器'
  }
  return labelMap[role] || role
}

const getBadgeStatus = (status) => {
  const statusMap = {
    online: 'success',
    offline: 'default',
    connecting: 'processing',
    error: 'error'
  }
  return statusMap[status] || 'default'
}

const getStatusLabel = (status) => {
  const labelMap = {
    online: '在线',
    offline: '离线',
    connecting: '连接中',
    error: '错误'
  }
  return labelMap[status] || status
}

const getLatencyClass = (latency) => {
  if (latency < 50) return 'latency-good'
  if (latency < 100) return 'latency-normal'
  if (latency < 200) return 'latency-warning'
  return 'latency-error'
}

const getTimelineColor = (type) => {
  const colorMap = {
    connect: 'green',
    disconnect: 'red',
    training: 'blue',
    upload: 'cyan',
    aggregate: 'purple',
    coordinate: 'orange',
    start: 'green',
    error: 'red'
  }
  return colorMap[type] || 'blue'
}

const getLogIcon = (type) => {
  const iconMap = {
    connect: ApiOutlined,
    disconnect: DisconnectOutlined,
    training: ThunderboltOutlined,
    upload: LinkOutlined,
    aggregate: ControlOutlined,
    coordinate: ControlOutlined,
    start: CheckCircleOutlined,
    error: WarningOutlined
  }
  return iconMap[type] || InfoCircleOutlined
}

const getLogTypeLabel = (type) => {
  const labelMap = {
    connect: '连接',
    disconnect: '断开',
    training: '训练',
    upload: '上传',
    aggregate: '聚合',
    coordinate: '协调',
    start: '启动',
    error: '错误'
  }
  return labelMap[type] || type
}

const formatDataSize = (bytes) => {
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
  filterStatus.value = ''
  filterRole.value = ''
  pagination.current = 1
}

const handleTableChange = (paginationConfig, filters, sorter) => {
  pagination.current = paginationConfig.current
  pagination.pageSize = paginationConfig.pageSize
}

const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    message.success('数据刷新成功')
  }, 1000)
}

const showDetailModal = (participant) => {
  selectedParticipant.value = participant
  activeTab.value = 'basic'
  detailModalVisible.value = true
}

const showConfigModal = (participant) => {
  configParticipant.value = participant
  // 复制数据到表单
  Object.assign(configForm, {
    name: participant.name,
    role: participant.role,
    ip: participant.ip,
    port: participant.port,
    sslEnabled: false,
    autoReconnect: true,
    timeout: 30,
    description: participant.description
  })
  configModalVisible.value = true
}

const showAddModal = () => {
  addModalVisible.value = true
}

const showConnectionModal = () => {
  connectionModalVisible.value = true
}

const testConnection = (participant) => {
  message.loading({ content: `正在测试 ${participant.name} 的连接...`, key: 'test', duration: 0 })
  setTimeout(() => {
    const success = Math.random() > 0.3
    if (success) {
      message.success({ content: `${participant.name} 连接测试成功`, key: 'test' })
    } else {
      message.error({ content: `${participant.name} 连接测试失败`, key: 'test' })
    }
  }, 2000)
}

const removeParticipant = (participant) => {
  const index = participants.value.findIndex(p => p.id === participant.id)
  if (index > -1) {
    participants.value.splice(index, 1)
    message.success('参与方移除成功')
    totalParticipants.value--
    if (participant.status === 'online') {
      onlineParticipants.value--
    }
  }
}

const handleConfigOk = async () => {
  try {
    await configFormRef.value.validate()
    message.success('配置保存成功')
    configModalVisible.value = false
  } catch (error) {
    console.error('验证失败:', error)
  }
}

const handleConfigCancel = () => {
  configModalVisible.value = false
}

const handleAddOk = async () => {
  try {
    await addFormRef.value.validate()
    // 添加新参与方
    const newParticipant = {
      id: Date.now(),
      ...addForm,
      status: 'offline',
      latency: 0,
      dataSize: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      participatedRounds: 0,
      uploadedData: 0,
      avgTrainingTime: 0,
      lastActive: new Date().toISOString(),
      connectionLogs: []
    }
    participants.value.push(newParticipant)
    message.success('参与方添加成功')
    totalParticipants.value++
    addModalVisible.value = false
    
    // 重置表单
    Object.assign(addForm, {
      name: '',
      role: '',
      ip: '',
      port: 8080,
      description: ''
    })
  } catch (error) {
    console.error('验证失败:', error)
  }
}

const handleAddCancel = () => {
  addModalVisible.value = false
  // 重置表单
  Object.assign(addForm, {
    name: '',
    role: '',
    ip: '',
    port: 8080,
    description: ''
  })
}

// 组件挂载时初始化
onMounted(() => {
  pagination.total = participants.value.length
})
</script>

<style scoped>
.participants-container {
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

.participant-name {
  display: flex;
  align-items: center;
}

.role-icon {
  margin-right: 8px;
  color: #1890ff;
}

.name-text {
  font-weight: 500;
}

.latency-good {
  color: #52c41a;
  font-weight: 500;
}

.latency-normal {
  color: #1890ff;
  font-weight: 500;
}

.latency-warning {
  color: #faad14;
  font-weight: 500;
}

.latency-error {
  color: #f5222d;
  font-weight: 500;
}

.communication-log {
  padding: 8px 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.log-type {
  font-weight: 500;
  color: #262626;
}

.log-time {
  color: #8c8c8c;
  font-size: 12px;
}

.log-message {
  color: #595959;
  margin: 4px 0 8px 0;
  font-size: 14px;
}

.log-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.performance-item {
  margin-bottom: 16px;
}

.performance-item span {
  display: block;
  margin-bottom: 8px;
  color: #595959;
  font-size: 14px;
}

.connection-monitor {
  padding: 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .participants-container {
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
}

@media (max-width: 992px) {
  .stats-row :deep(.ant-col) {
    margin-bottom: 16px;
  }
}

/* Badge 样式优化 */
:deep(.ant-badge-status-text) {
  margin-left: 8px;
}

/* Timeline 样式优化 */
:deep(.ant-timeline-item-content) {
  margin-left: 20px;
}
</style>
