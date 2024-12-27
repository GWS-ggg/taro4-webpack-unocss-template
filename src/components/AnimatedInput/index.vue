<script setup>
import { defineEmits, defineProps, ref } from 'vue'

const _props = defineProps({
  value: String,
  maxlength: Number,
})

const emit = defineEmits(['input'])

const isInputFocus = ref(false)

function handleInputFocus() {
  isInputFocus.value = true
}

function handleInputBlur() {
  isInputFocus.value = false
}

function handleInputChange(e) {
  emit('input', e)
}
</script>

<template>
  <view relative>
    <input
      type="text"
      :value="value"
      :maxlength="maxlength"
      autoHeight
      class="relative border-b-3PX border-[#f0f0f0] rounded border-b-solid p-b-2PX"
      @focus="handleInputFocus"
      @blur="handleInputBlur"
      @input="handleInputChange"
    >
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
