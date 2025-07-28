<template>
  <span class="math-text-renderer">
    <template v-for="(segment, index) in parsedSegments" :key="index">
      <KatexRenderer
        v-if="segment.type === 'math'"
        :math="segment.content"
        :inline="true"
      />
      <span v-else>{{ segment.content }}</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import KatexRenderer from './KatexRenderer.vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  }
})

// 解析包含数学公式的文本
const parsedSegments = computed(() => {
  const segments = []
  const text = props.text
  
  // 匹配 $...$ 或 $$...$$ 包围的数学公式
  const mathRegex = /(\$\$[^$]+\$\$|\$[^$]+\$)/g
  let lastIndex = 0
  let match
  
  while ((match = mathRegex.exec(text)) !== null) {
    // 添加数学公式前的普通文本
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      })
    }
    
    // 添加数学公式
    const mathContent = match[0].replace(/^\$+|\$+$/g, '') // 移除 $ 符号
    segments.push({
      type: 'math',
      content: mathContent
    })
    
    lastIndex = mathRegex.lastIndex
  }
  
  // 添加最后剩余的普通文本
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }
  
  return segments
})
</script>

<style scoped>
.math-text-renderer {
  display: inline;
  line-height: 1.4;
}
</style>
