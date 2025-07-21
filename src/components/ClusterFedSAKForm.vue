<template>
  <div class="cluster-fedsak-form">
    <a-card title="分簇-FedSAK 实验参数配置">
      <a-form :model="form" :rules="rules" layout="vertical">
        <!-- 基础参数 -->
        <h4 class="section-title">基础配置</h4>
        <a-row :gutter="16">
          <a-col span="12">
            <a-form-item label="聚类算法" name="clusterAlgo">
              <a-select
                v-model:value="form.clusterAlgo"
                placeholder="选择聚类算法"
              >
                <a-select-option value="K-means">K-means</a-select-option>
                <a-select-option value="Spectral">谱聚类</a-select-option>
                <a-select-option value="DBSCAN">DBSCAN</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col span="12">
            <a-form-item label="簇数量 (K)" name="numClusters">
              <a-input-number
                v-model:value="form.numClusters"
                :min="2"
                :max="20"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- FedSAK 参数 -->
        <h4 class="section-title">FedSAK 算法参数</h4>
        <a-row :gutter="16">
          <a-col span="8">
            <a-form-item name="lambdaTrace">
              <template #label>
                <span>正则化系数 λ</span>
                <a-tooltip title="轨迹范数正则化强度">
                  <QuestionCircleOutlined style="margin-left: 4px; color: #1890ff;" />
                </a-tooltip>
              </template>
              <a-input-number
                v-model:value="form.lambdaTrace"
                :min="0"
                :max="1"
                :step="0.001"
                :formatter="value => `${value}`"
                :parser="value => value.replace(/[^\d.]/g, '')"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col span="8">
            <a-form-item name="etaW">
              <template #label>
                <span>FedSAK 学习率 η_w</span>
                <a-tooltip title="子梯度更新步长">
                  <QuestionCircleOutlined style="margin-left: 4px; color: #1890ff;" />
                </a-tooltip>
              </template>
              <a-input-number
                v-model:value="form.etaW"
                :min="0.001"
                :max="1"
                :step="0.01"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col span="8">
            <a-form-item label="本地训练轮次 (E)" name="localEpochs">
              <a-input-number
                v-model:value="form.localEpochs"
                :min="1"
                :max="50"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 客户端配置 -->
        <h4 class="section-title">客户端配置</h4>
        <a-row :gutter="16">
          <a-col span="8">
            <a-form-item label="客户端总数" name="totalClients">
              <a-input-number
                v-model:value="form.totalClients"
                :min="form.numClusters * 2"
                :max="200"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col span="8">
            <a-form-item label="每轮参与率" name="participationRate">
              <a-slider
                v-model:value="form.participationRate"
                :min="0.1"
                :max="1"
                :step="0.1"
                :tooltip-formatter="(value) => `${Math.round(value * 100)}%`"
              />
            </a-form-item>
          </a-col>
          <a-col span="8">
            <a-form-item name="heterogeneity">
              <template #label>
                <span>数据异构程度</span>
                <a-tooltip title="控制客户端数据分布的不一致性">
                  <QuestionCircleOutlined style="margin-left: 4px; color: #1890ff;" />
                </a-tooltip>
              </template>
              <a-select v-model:value="form.heterogeneity">
                <a-select-option value="low">低 (α=1.0)</a-select-option>
                <a-select-option value="medium">中 (α=0.5)</a-select-option>
                <a-select-option value="high">高 (α=0.1)</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 高级配置 -->
        <a-collapse>
          <a-collapse-panel key="advanced" header="高级配置">
            <a-row :gutter="16">
              <a-col span="12">
                <a-form-item label="通信轮次" name="commRounds">
                  <a-input-number
                    v-model:value="form.commRounds"
                    :min="10"
                    :max="1000"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="收敛容忍度" name="tolerance">
                  <a-input-number
                    v-model:value="form.tolerance"
                    :min="0.0001"
                    :max="0.1"
                    :step="0.0001"
                    :formatter="value => `${value}`"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="16">
              <a-col span="12">
                <a-form-item label="随机种子" name="randomSeed">
                  <a-input-number
                    v-model:value="form.randomSeed"
                    :min="0"
                    :max="9999"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="GPU使用" name="useGpu">
                  <a-switch v-model:checked="form.useGpu" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-collapse-panel>
        </a-collapse>

        <!-- 参数预览 -->
        <div class="params-preview">
          <h4>参数预览</h4>
          <a-descriptions :column="3" size="small" bordered>
            <a-descriptions-item label="平均每簇客户端数">
              {{ Math.round(form.totalClients / form.numClusters) }}
            </a-descriptions-item>
            <a-descriptions-item label="每轮活跃客户端">
              {{ Math.round(form.totalClients * form.participationRate) }}
            </a-descriptions-item>
            <a-descriptions-item label="预计训练时长">
              {{ estimatedDuration }}
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <a-space>
            <a-button @click="resetForm">重置</a-button>
            <a-button @click="saveTemplate">保存模板</a-button>
            <a-button @click="loadTemplate">加载模板</a-button>
            <a-button type="primary" @click="validateAndSubmit">
              创建实验
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'

const emit = defineEmits(['submit', 'cancel'])

// 表单数据
const form = ref({
  // 基础配置
  clusterAlgo: 'K-means',
  numClusters: 4,
  
  // FedSAK 参数
  lambdaTrace: 0.001,
  etaW: 0.1,
  localEpochs: 5,
  
  // 客户端配置
  totalClients: 20,
  participationRate: 0.8,
  heterogeneity: 'medium',
  
  // 高级配置
  commRounds: 100,
  tolerance: 0.001,
  randomSeed: 42,
  useGpu: true
})

// 表单验证规则
const rules = {
  clusterAlgo: [{ required: true, message: '请选择聚类算法' }],
  numClusters: [
    { required: true, message: '请输入簇数量' },
    { type: 'number', min: 2, message: '簇数量至少为2' }
  ],
  lambdaTrace: [
    { required: true, message: '请输入正则化系数' },
    { type: 'number', min: 0, message: '正则化系数必须非负' }
  ],
  etaW: [
    { required: true, message: '请输入学习率' },
    { type: 'number', min: 0.001, message: '学习率必须大于0.001' }
  ],
  localEpochs: [
    { required: true, message: '请输入本地训练轮次' },
    { type: 'number', min: 1, message: '本地训练轮次至少为1' }
  ],
  totalClients: [
    { required: true, message: '请输入客户端总数' },
    { type: 'number', min: 4, message: '客户端总数至少为4' }
  ],
  commRounds: [
    { required: true, message: '请输入通信轮次' },
    { type: 'number', min: 10, message: '通信轮次至少为10' }
  ]
}

// 计算属性
const estimatedDuration = computed(() => {
  const rounds = form.value.commRounds
  const epochs = form.value.localEpochs
  const clients = Math.round(form.value.totalClients * form.value.participationRate)
  
  // 粗略估计：每轮每个epoch每个客户端1秒
  const totalSeconds = rounds * epochs * 2 // 2秒每轮（包括通信开销）
  
  if (totalSeconds < 60) {
    return `约 ${totalSeconds} 秒`
  } else if (totalSeconds < 3600) {
    return `约 ${Math.round(totalSeconds / 60)} 分钟`
  } else {
    return `约 ${Math.round(totalSeconds / 3600)} 小时`
  }
})

// 方法
const validateAndSubmit = async () => {
  try {
    // 表单验证
    if (form.value.totalClients < form.value.numClusters * 2) {
      message.error('客户端总数至少应为簇数量的2倍')
      return
    }
    
    // 提交表单
    emit('submit', form.value)
    message.success('实验参数配置完成')
  } catch (error) {
    message.error('参数验证失败：' + error.message)
  }
}

const resetForm = () => {
  form.value = {
    clusterAlgo: 'K-means',
    numClusters: 4,
    lambdaTrace: 0.001,
    etaW: 0.1,
    localEpochs: 5,
    totalClients: 20,
    participationRate: 0.8,
    heterogeneity: 'medium',
    commRounds: 100,
    tolerance: 0.001,
    randomSeed: 42,
    useGpu: true
  }
  message.info('表单已重置')
}

const saveTemplate = () => {
  const template = {
    name: `FedSAK模板_${new Date().getTime()}`,
    params: { ...form.value },
    createTime: new Date().toISOString()
  }
  
  // 保存到本地存储
  const templates = JSON.parse(localStorage.getItem('fedsak_templates') || '[]')
  templates.push(template)
  localStorage.setItem('fedsak_templates', JSON.stringify(templates))
  
  message.success('模板已保存')
}

const loadTemplate = () => {
  const templates = JSON.parse(localStorage.getItem('fedsak_templates') || '[]')
  if (templates.length === 0) {
    message.info('暂无保存的模板')
    return
  }
  
  // 简单选择最新的模板，实际应该弹窗让用户选择
  const latestTemplate = templates[templates.length - 1]
  form.value = { ...latestTemplate.params }
  message.success(`已加载模板：${latestTemplate.name}`)
}
</script>

<style scoped>
.cluster-fedsak-form {
  max-width: 1000px;
  margin: 0 auto;
}

.section-title {
  color: #1890ff;
  margin: 24px 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.params-preview {
  margin: 24px 0;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.params-preview h4 {
  margin-bottom: 12px;
  color: #666;
}

.form-actions {
  margin-top: 24px;
  text-align: center;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
