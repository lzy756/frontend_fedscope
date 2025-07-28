<template>
  <span ref="mathContainer" class="katex-container"></span>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps({
  math: {
    type: String,
    required: true
  },
  inline: {
    type: Boolean,
    default: true
  }
})

const mathContainer = ref(null)

const renderMath = () => {
  if (mathContainer.value && props.math) {
    try {
      katex.render(props.math, mathContainer.value, {
        displayMode: !props.inline,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: false
      })
    } catch (error) {
      console.warn('KaTeX render error:', error)
      mathContainer.value.textContent = props.math
    }
  }
}

onMounted(() => {
  renderMath()
})

watch(() => props.math, () => {
  renderMath()
})
</script>

<style scoped>
.katex-container {
  display: inline-block;
  vertical-align: middle;
}
</style>
