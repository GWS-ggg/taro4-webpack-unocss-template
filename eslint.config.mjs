// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  rules: {
    'semi': ['error', 'never'], // 禁用自动分号添加
    'no-extra-semi': 'error', // 禁止不必要的分号
    'no-console': 'off', // 允许使用 console
    'vue/max-attributes-per-line': ['error', {
      singleline: {
        max: 1,
      },
      multiline: {
        max: 1,
      },
    }],
    'vue/first-attribute-linebreak': ['error', {
      singleline: 'beside',
      multiline: 'below',
    }],
  },
  extends: ['taro/vue3'],
})
