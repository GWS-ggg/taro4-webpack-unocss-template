import { defineConfig, presetAttributify } from 'unocss'
import presetWeapp from 'unocss-preset-weapp'
import { extractorAttributify, transformerClass } from 'unocss-preset-weapp/transformer'

const { presetWeappAttributify, transformerAttributify } = extractorAttributify()

// https://unocss.dev/interactive/
export default defineConfig({
  presets: [
    // https://github.com/MellowCo/unocss-preset-weapp
    // @ts-ignore
    presetWeapp({
      isH5: process.env.TARO_ENV === 'h5',
      platform: 'taro',
      taroWebpack: 'webpack5',
      designWidth: 750,
      deviceRatio: {
        640: 2.34 / 2,
        750: 1,
        375: 2,
        828: 1.81 / 2
      }
    }),
    // @ts-ignore
    presetWeappAttributify(),
    presetAttributify({
      prefix: 'un-',
      prefixedOnly: false
      // ignoreAttributes: []
    })
  ],
  transformers: [
    // https://github.com/MellowCo/unocss-preset-weapp/tree/main/src/transformer/transformerAttributify
    // @ts-ignore
    transformerAttributify(),
    // https://github.com/MellowCo/unocss-preset-weapp/tree/main/src/transformer/transformerClass
    // @ts-ignore
    transformerClass({
      // transformRules: {
      //   '?': '-wenhao-',
      //   '.': '-d111-',
      //   '/': '-s111-',
      //   ':': '-c111-',
      //   '%': '-p111-',
      //   '!': '-e111-',
      //   '#': '-w111-',
      //   '(': '-b111l-',
      //   ')': '-b111r-',
      //   '[': '-f111l-',
      //   ']': '-f111r-',
      //   $: '-r111-',
      //   ',': '-r222-'
      // }
    })
  ],
  // @ts-ignore opacity: active, disabled
  // rules: [[/^opacity-(active|disabled)$/, ([, d]) => ({ opacity: `var(--van-${d}-opacity)` })]],
  theme: {
    colors: {
      primary: 'var(--nut-primary-color)', // class="bg-primary"
      primaryEnd: 'var(--nut-primary-color-end)', // class="bg-primaryEnd"
      success: 'var(--nut-success-color)',
      danger: 'var(--nut-danger-color)',
      warning: 'var(-nut-warning-color)',
      text: 'var(--nut-title-color)',
      text2: 'var(--nut-title-color2)',
      text3: 'var(--nut-text-color)',
      border: 'var(--nut-border-color)',
      active: 'var(--nut-active-color)',
      help: 'var(--nut-help-color)',
      disable: 'var(--nut-disable-color)',
      required: 'var(--nut-required-color)'
    }
  }
})
