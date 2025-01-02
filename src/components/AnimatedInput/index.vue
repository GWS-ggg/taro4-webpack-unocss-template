<script setup lang="ts">
import type { AnswerType, Question, TempAnswers } from '../../types/index'
import { defineEmits, defineProps, ref } from 'vue'
import { checkBounds } from '../../utils/index'

const props = defineProps({
  value: String,
  min: Number,
  max: Number,
  includeBounds: Number,
  type: String,
})

const emit = defineEmits(['input', 'handleErrorContent'])

const isInputFocus = ref(false)

function handleInputFocus() {
  isInputFocus.value = true
}

function handleInputBlur() {
  isInputFocus.value = false
}
function handleErrorContent(content: string, value?: string, min?: string, max?: string) {
  emit('handleErrorContent', content, value, min, max)
}

function handleInputChange(e) {
  emit('input', e)
  // 每次输入做检查 是否符号边界
  textWithinLimits(e.detail.value)
}

// 处理文本题 最大值 最小值
function textWithinLimits(answer: string) {
  if (props.min === undefined || props.max === undefined || props.includeBounds === undefined) {
    return // 如果 min max includeBounds未定义，直接返回 不做校验
  }

  if (props.type === 'number') {
    const numberValue = answer.replace(/\D/g, '') // 移除非数字字符
    if (numberValue !== answer) {
      handleErrorContent('mustBeNumber')
      return
    }
    const number = Number(numberValue)

    const { result, reason } = checkBounds(number, props.min, props.max, props.includeBounds, props.type)
    if (!result) {
      handleErrorContent(reason, numberValue, props.min.toString(), props.max.toString())
    }
    return
  }

  const textLength = answer.length
  const { result, reason } = checkBounds(textLength, props.min, props.max, props.includeBounds, props.type || '')
  if (!result) {
    handleErrorContent(reason, textLength.toString(), props.min.toString(), props.max.toString())
  }
}
</script>

<template>
  <view relative>
    <input
      v-if="type !== 'textarea'"
      :type="type"
      :value="value"
      autoHeight
      class="relative border-b-3PX border-[#f0f0f0] rounded border-b-solid p-b-2PX"
      @focus="handleInputFocus"
      @blur="handleInputBlur"
      @input="handleInputChange"
    >
    <textarea
      v-if="type === 'textarea'"
      type="text"
      :value="value"
      :maxlength="max"
      class="relative w-full border-b-3PX border-[#f0f0f0] rounded border-b-solid p-b-4PX text-18PX"
      autoHeight
      @focus="handleInputFocus"
      @blur="handleInputBlur"
      @input="handleInputChange"
    />
    <view
      :class="isInputFocus ? 'scale-x-100' : 'scale-x-0'"
      class="absolute bottom-0 left-0 h-3PX w-full origin-center bg-[#0088ff] transition-transform duration-300"
    />
  </view>
</template>

<style scoped>
.test {
  border-bottom: 3PX solid #0088ff;
}
</style>
