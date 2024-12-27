import { createI18n } from 'vue-i18n'
import en from './lang/en'
import zhCN from './lang/zh-cn'

const messages = {
  'zh-CN': zhCN,
  en,
}

// 获取浏览器的默认语言
// const browserLanguage = navigator.language || navigator.languages[0]

// 创建 i18n 实例
const i18n = createI18n({
  locale: 'en', // 默认语言
  fallbackLocale: 'en', // 回退语言
  messages,
})

export default i18n
