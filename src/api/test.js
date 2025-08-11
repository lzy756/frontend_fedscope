// 模拟前端测试 API（SSE/WS 行为仿真）
// 提供：startModelTest、openTestStream、cancelModelTest

const activeJobs = new Map()

function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function randNorm(){ // 简单正态近似
  return (Math.random()+Math.random()+Math.random()+Math.random()+Math.random()+Math.random()-3)
}

export async function startModelTest(modelId, params){
  const total = params?.sampleCount || 50
  const jobId = `job_${Date.now()}_${Math.floor(Math.random()*1e6)}`
  // 将 total 与 inputType 存入 job，供流式过程严格遵循
  const inputType = params?.inputType === 'image' ? 'image' : 'text'
  activeJobs.set(jobId, { cancelled: false, total, inputType })
  return { jobId, total }
}

export function openTestStream(jobId, handlers){
  const job = activeJobs.get(jobId)
  if (!job) {
    setTimeout(() => handlers?.onError?.({ message: 'job not found' }), 0)
    return () => {}
  }

  // 严格使用 startModelTest 指定的 total
  const total = job.total
  let processed = 0
  let timer = null

  // 生成一个任务流
  const labels = ['cat','dog','car','tree','house','person']
  const imgUrls = [
    'https://picsum.photos/seed/1/128/128',
    'https://picsum.photos/seed/2/128/128',
    'https://picsum.photos/seed/3/128/128',
    'https://picsum.photos/seed/4/128/128',
    'https://picsum.photos/seed/5/128/128'
  ]

  function tick(){
    if (job.cancelled){
      clearInterval(timer)
      handlers?.onError?.({ message: 'cancelled' })
      return
    }
    // progress
    handlers?.onProgress?.({ processed, total, elapsedMs: processed*50 })

    if (processed >= total){
      clearInterval(timer)
      setTimeout(() => {
        handlers?.onSummary?.({ accuracy: undefined, processed: total, total })
      }, 200)
      return
    }

  // 生成一个 case（根据 job.inputType 固定为文本或图像）
  const isImage = job.inputType === 'image'
    const label = randChoice(labels)
    const correctProb = 0.78 + 0.1*randNorm() // around 78%
    const isCorrect = Math.random() < Math.max(0.4, Math.min(0.97, correctProb))
    const topK = []

    // 构造 topK 概率
    const shuffled = [...labels].sort(() => Math.random()-0.5)
    let remain = 1.0
    for (let i=0; i<5; i++){
      const l = shuffled[i]
      const p = (i===0 ? (0.5 + 0.4*Math.random()) : (0.1*Math.random()))
      topK.push({ label: l, prob: p })
      remain -= p
    }
    // 归一小修正
    const sum = topK.reduce((a,b)=>a+b.prob,0)
    for (const k of topK) k.prob = k.prob / sum

    // 若正确，将 top1 label 设置为真值
    if (isCorrect){
      topK.sort((a,b)=>b.prob-a.prob)
      topK[0].label = label
    }

    const caseId = `${isImage? 'img':'txt'}_${String(processed+1).padStart(5,'0')}`
    const output = { predLabel: topK[0].label, topK }
    const latencyMs = Math.floor(20 + Math.random()*60)

    const payload = isImage
      ? {
          caseId,
          input: { type: 'image', url: randChoice(imgUrls), mime: 'image/jpeg', width: 128, height: 128 },
          label,
          output,
          correct: output.predLabel === label,
          latencyMs
        }
      : {
          caseId,
          input: { type: 'text', text: `sample text ${caseId} about ${label}` },
          label,
          output,
          correct: output.predLabel === label,
          latencyMs
        }

    processed += 1
    handlers?.onCase?.(payload)
  }

  timer = setInterval(tick, 120)
  // 立即首帧
  setTimeout(tick, 10)

  return () => {
    try { clearInterval(timer) } catch {}
    activeJobs.delete(jobId)
  }
}

export async function cancelModelTest(jobId){
  const job = activeJobs.get(jobId)
  if (job) job.cancelled = true
  return { cancelled: true }
}
