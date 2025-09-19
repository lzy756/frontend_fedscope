<template>
  <a-modal
    :visible="visible"
    :title="`测试模型 - ${modelName || modelId}`"
    width="1000px"
    :confirm-loading="state.status==='running'"
    :mask-closable="false"
    @cancel="handleClose"
    :footer="null"
  >
    <div class="test-dialog">
      <!-- 参数与操作区 -->
      <a-card size="small" class="panel">
        <a-form layout="inline">
          <a-form-item label="样本数">
            <a-input-number v-model:value="form.sampleCount" :min="1" :max="2000" :disabled="isRunning" />
          </a-form-item>
          <a-form-item label="随机种子">
            <a-input-number v-model:value="form.randomSeed" :min="0" :max="1e9" :disabled="isRunning" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :disabled="isRunning" @click="startTest">开始测试</a-button>
          </a-form-item>
          <a-form-item>
            <a-button danger :disabled="!isRunning" @click="cancelTest">取消测试</a-button>
          </a-form-item>
        </a-form>
        <div v-if="state.status!=='idle'" class="progress-row">
          <a-progress 
            :percent="progressPercent" 
            :status="progressStatus" 
            :show-info="true"
            :format="() => `${actualProcessed}/${actualTotal || '?'}`"
          />
          <div class="progress-info">
            <span class="progress-detail">进度：{{ actualProcessed }} / {{ actualTotal || '-' }}</span>
            <span class="accuracy-info" v-if="actualProcessed > 0">
              Top-1 准确率：{{ (top1*100).toFixed(2) }}%
            </span>
            <span class="accuracy-info" v-if="hasTop5 && actualProcessed > 0">
              Top-5 准确率：{{ (top5*100).toFixed(2) }}%
            </span>
            <span class="status-info" v-if="state.status === 'running'">
              正在测试中...
            </span>
          </div>
        </div>
        <a-alert
          v-if="state.status==='error' && state.error"
          type="error"
          :message="'测试出错：' + state.error.message"
          show-icon
          style="margin-top: 8px;"
        />
        <a-alert
          v-if="state.status==='cancelled'"
          type="warning"
          message="已取消测试"
          show-icon
          style="margin-top: 8px;"
        />
        <a-alert
          v-if="state.status==='success'"
          type="success"
          :message="`测试完成：Top-1 ${(top1*100).toFixed(2)}%`"
          show-icon
          style="margin-top: 8px;"
        />
      </a-card>

      <!-- 结果列表区 -->
      <a-card size="small" class="panel" title="测试样本结果" :extra="`共 ${state.cases.length} 条`">
        <a-table
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          row-key="caseId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key==='input'">
              <div v-if="record.input?.type==='image'" class="input-cell">
                <img :src="record.input.url || record.input.dataUrl || fallbackImg" class="thumb" alt="preview" />
                <div class="meta">
                  <div class="dim" v-if="record.input.width && record.input.height">{{ record.input.width }}x{{ record.input.height }}</div>
                  <div class="mime" v-if="record.input.mime">{{ record.input.mime }}</div>
                </div>
              </div>
              <div v-else class="input-text" :title="record.input?.text">{{ truncate(record.input?.text, 80) }}</div>
            </template>
            <template v-else-if="column.key==='pred'">
              <div class="pred">
                <a-tag :color="record.correct ? 'green' : 'red'">{{ record.output?.predLabel }}</a-tag>
                <span v-if="record.output?.topK?.length">( {{ (record.output.topK[0].prob*100).toFixed(1) }}% )</span>
              </div>
            </template>
            <template v-else-if="column.key==='topk'">
              <div class="topk">
                <a-tag v-for="(k,i) in (record.output?.topK||[]).slice(0,5)" :key="i" :color="i===0?'blue':'default'">
                  {{ k.label }} {{ (k.prob*100).toFixed(0) }}%
                </a-tag>
              </div>
            </template>
            <template v-else-if="column.key==='correct'">
              <a-badge :status="record.correct ? 'success' : 'error'" :text="record.correct?'正确':'错误'" />
            </template>
            <template v-else-if="column.key==='latency'">
              {{ record.latencyMs }} ms
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </a-modal>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { startModelTest, openTestStream, cancelModelTest } from '@/api/test'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelId: { type: [String, Number], required: true },
  modelName: { type: String, default: '' }
})
const emit = defineEmits(['close','update:visible'])

const form = reactive({
  sampleCount: 50,
  randomSeed: 42
})

const state = reactive({
  jobId: null,
  status: 'idle', // idle|running|success|error|cancelled
  cases: [],
  summary: { processed: 0, total: 0 },
  error: null
})

let closeStream = null

// 基于模型名称推断输入类型：image | text（默认 text）
const inputType = computed(() => {
  const name = (props.modelName || '').toLowerCase()
  const imageKeys = ['resnet', 'vit', 'mobilenet', 'densenet', 'cnn', 'vgg', 'alexnet', 'convnext']
  const textKeys = ['lstm', 'transformer', 'bert', 'roberta', 'gpt', 'rnn', 'gru']
  if (imageKeys.some(k => name.includes(k))) return 'image'
  if (textKeys.some(k => name.includes(k))) return 'text'
  return 'text'
})

const isRunning = computed(() => state.status === 'running')

// 统一的进度数据源
const actualProcessed = computed(() => {
  // 优先使用 cases 的实际长度，这是最准确的已处理数量
  return state.cases.length
})

const actualTotal = computed(() => {
  // 如果测试还在进行中且 summary.total 已设置，使用它
  // 如果测试完成，使用实际的 cases 长度作为 total
  if (state.status === 'success') {
    return state.cases.length
  }
  return state.summary.total || 0
})

const progressPercent = computed(() => {
  const total = actualTotal.value
  if (!total) return 0
  const processed = actualProcessed.value
  // 确保进度不超过 100%
  return Math.min(100, Math.floor((processed / total) * 100))
})

const progressStatus = computed(() => {
  if (state.status === 'error') return 'exception'
  if (state.status === 'cancelled') return 'normal'
  if (state.status === 'success') return 'success'
  return 'active'
})

const top1 = computed(() => {
  const total = actualProcessed.value
  if (!total) return 0
  const correct = state.cases.filter(c => c.correct).length
  return correct / total
})

const top5 = computed(() => {
  const total = actualProcessed.value
  if (!total) return 0
  let count = 0
  for (const c of state.cases) {
    const label = c.label
    const ok = Array.isArray(c.output?.topK) && c.output.topK.some(k => k.label === label)
    if (ok) count++
  }
  return count / total
})

const hasTop5 = computed(() => state.cases.some(c => Array.isArray(c.output?.topK) && c.output.topK.length > 1))

const columns = [
  { title: '输入', dataIndex: 'input', key: 'input', width: 220 },
  { title: '标签', dataIndex: 'label', key: 'label', width: 120 },
  { title: '预测', key: 'pred', width: 160 },
  { title: 'Top-5', key: 'topk' },
  { title: '正确', key: 'correct', width: 100 },
  { title: '延迟', key: 'latency', width: 100 }
]

const pagination = reactive({ pageSize: 10, showTotal: (t) => `共 ${t} 条` })
const fallbackImg = '/favicon.ico'

const tableData = computed(() => state.cases)

function truncate(str, n) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}

async function startTest() {
  if (isRunning.value) return
  state.status = 'running'
  state.cases = []
  state.summary = { processed: 0, total: 0 }
  state.error = null
  try {
  const { jobId, total } = await startModelTest(props.modelId, { sampleCount: form.sampleCount, randomSeed: form.randomSeed, inputType: inputType.value })
    state.jobId = jobId
    state.summary.total = total
    closeStream = openTestStream(jobId, {
      onProgress: (evt) => {
        // 更新后端报告的进度信息
        if (typeof evt.processed === 'number') {
          state.summary.processed = evt.processed
        }
        if (typeof evt.total === 'number' && !state.summary.total) {
          state.summary.total = evt.total
        }
      },
      onCase: (c) => {
        // 添加新的测试用例
        state.cases.push(c)
        // 实时更新处理数量，确保与 cases 数组长度保持一致
        state.summary.processed = state.cases.length
      },
      onSummary: (s) => {
        // 测试完成，使用最终统计
        if (typeof s.processed === 'number') {
          state.summary.processed = s.processed
        }
        if (typeof s.total === 'number') {
          state.summary.total = s.total
        }
        // 确保 processed 与实际 cases 数量一致
        state.summary.processed = Math.max(state.summary.processed || 0, state.cases.length)
        state.status = 'success'
        closeStream?.()
        closeStream = null
      },
      onError: (e) => {
        state.status = 'error'
        state.error = e
        closeStream?.()
        closeStream = null
      }
    })
  } catch (err) {
    state.status = 'error'
    state.error = { message: err?.message || '启动失败' }
  }
}

async function cancelTest() {
  if (!state.jobId) return
  try {
    await cancelModelTest(state.jobId)
  } finally {
    state.status = 'cancelled'
    closeStream?.()
    closeStream = null
  }
}

function handleClose() {
  if (isRunning.value) {
    message.warning('测试进行中，已自动取消')
    cancelTest()
  }
  emit('update:visible', false)
  emit('close')
}

watch(() => props.visible, (v) => {
  if (!v) {
    // 清理状态
    closeStream?.()
    closeStream = null
    state.jobId = null
    state.status = 'idle'
    state.cases = []
    state.summary = { processed: 0, total: 0 }
    state.error = null
  }
})

onBeforeUnmount(() => {
  closeStream?.()
  closeStream = null
})
</script>

<style scoped>
.test-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.panel { margin-bottom: 8px; }
.progress-row { margin-top: 8px; }
.progress-info { 
  display: flex; 
  gap: 16px; 
  margin-top: 8px; 
  color: #595959; 
  font-size: 14px;
}
.progress-detail { font-weight: 500; }
.accuracy-info { color: #1890ff; }
.status-info { 
  color: #52c41a; 
  font-style: italic; 
}
.input-cell { display: flex; align-items: center; gap: 8px; }
.thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 4px; border: 1px solid #f0f0f0; }
.input-text { max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pred { display: flex; align-items: center; gap: 6px; }
.topk { display: flex; flex-wrap: wrap; gap: 4px; max-width: 420px; }
</style>
