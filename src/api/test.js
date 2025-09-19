// 实际后端 API（SSE）集成
// 提供：startModelTest、openTestStream、cancelModelTest

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_BASE_URL)
  ? import.meta.env.VITE_BACKEND_BASE_URL
  : 'http://localhost:8000'

function buildUrl(path){
  return `${BASE_URL.replace(/\/$/, '')}${path}`
}

async function httpJson(url, { method = 'GET', body, headers = {} } = {}){
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  })
  if (!res.ok){
    let msg = `${res.status} ${res.statusText}`
    try { const j = await res.json(); msg = j?.message || msg } catch {}
    throw new Error(msg)
  }
  try { return await res.json() } catch { return null }
}

export async function startModelTest(modelId, params){
  const payload = {
    modelId,
    sampleCount: params?.sampleCount ?? 50,
    randomSeed: params?.randomSeed,
    inputType: params?.inputType === 'image' ? 'image' : 'text'
  }
  const data = await httpJson(buildUrl('/api/model-tests/'), { method: 'POST', body: payload })
  return { jobId: data.jobId, total: data.total }
}

export function openTestStream(jobId, handlers){
  if (!jobId){
    setTimeout(() => handlers?.onError?.({ message: 'invalid jobId' }), 0)
    return () => {}
  }
  const url = buildUrl(`/api/model-tests/${encodeURIComponent(jobId)}/stream`)
  let es
  try {
    es = new EventSource(url, { withCredentials: true })
  } catch (err) {
    setTimeout(() => handlers?.onError?.({ message: err?.message || 'EventSource error' }), 0)
    return () => {}
  }

  const safeParse = (e) => { try { return JSON.parse(e.data) } catch { return null } }

  // 命名事件
  es.addEventListener('progress', (e) => {
    const p = safeParse(e)
    if (p) handlers?.onProgress?.(p)
  })
  es.addEventListener('case', (e) => {
    const c = safeParse(e)
    if (c) handlers?.onCase?.(c)
  })
  es.addEventListener('summary', (e) => {
    const s = safeParse(e)
    if (s) handlers?.onSummary?.(s)
    // 收到 summary 后关闭
    try { es.close() } catch {}
  })
  es.addEventListener('error', (e) => {
    const err = safeParse(e) || { message: 'stream error' }
    handlers?.onError?.(err)
    try { es.close() } catch {}
  })
  // 心跳可忽略
  es.addEventListener('ping', () => {})

  // 网络层面的错误/断开
  es.onerror = () => {
    // 若后端也发了 error 事件，此处可能重复触发；做兜底不二次关闭
    // 不覆盖命名 error 的消息
  }

  // 返回关闭函数
  return () => { try { es.close() } catch {} }
}

export async function cancelModelTest(jobId){
  if (!jobId) return { cancelled: true }
  const data = await httpJson(buildUrl(`/api/model-tests/${encodeURIComponent(jobId)}/cancel`), { method: 'POST' })
  return data || { cancelled: true }
}
