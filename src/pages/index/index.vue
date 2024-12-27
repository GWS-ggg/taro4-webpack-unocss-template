<script setup lang="ts">
import Taro from '@tarojs/taro'
import { useI18n } from 'vue-i18n'
import surveyDataJson from './index.json'

const { t, locale } = useI18n()
const surveyData = surveyDataJson as SurveyData

locale.value = 'zh-CN'
Taro.setNavigationBarTitle({
  title: surveyData.title,
})

function handleTap() {
  Taro.navigateTo({
    url: '/pages/question/index',
  })
}
</script>

<template>
  <view class="h-full w-full f-c bg-[rgb(217,242,253)]">
    <view
      class="mx-auto h-[100vh] max-w-750PX w-[90%] flex-col bg-[rgb(217,242,253)] p-5 text-[18PX]"
      lg="w-750PX"
    >
      <view class="mt-2 flex flex-col bg-[#fff] p-5">
        <view class="f-c">
          {{ surveyData.title }}
        </view>
        <view class="mt-5 f-s">
          {{ surveyData.description }}
        </view>
      </view>
      <view
        class="custom-button mt-5 cursor-pointer"
        @tap="handleTap"
      >
        {{ t('startQuiz') }}
      </view>
    </view>
  </view>
</template>

<style scoped>

</style>
