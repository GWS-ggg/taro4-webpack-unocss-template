import { createApp } from 'vue'

import i18n from './i18n/i18n'
import './app.scss'
import 'uno.css'

const App = createApp({
  onShow(options) {
    console.log('App onShow.')
  },
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})

App.use(i18n)
export default App
