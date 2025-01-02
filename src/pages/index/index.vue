<script setup lang="ts">
import { postQuestionDetail } from '@/utils'
import Taro from '@tarojs/taro'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import surveyDataJson from '../question/index.json'

const { t, locale } = useI18n()

function handleTap() {
  Taro.navigateTo({
    url: '/pages/question/index',
  })
}
function getQueryParams() {
  // 获取当前页面的路由信息
  const currentInstance = Taro.getCurrentInstance()
  const routerParams = currentInstance.router?.params

  if (routerParams) {
    // 从路由参数中提取需要的字段
    const { lang, id, zoneId, roleId, fnUid } = routerParams
    return { lang, id, zoneId, roleId, fnUid }
  }
  else {
    console.log('未找到路由参数')
    return {}
  }
}
const queryParams = getQueryParams()
Taro.setStorageSync('queryParams', queryParams)
locale.value = queryParams.lang || 'en'
console.log('Query Params:', queryParams)
const surveyData = ref<SurveyData>()
// surveyData.value = surveyDataJson as SurveyData
getQuestionDetail()

async function getQuestionDetail() {
  try {
    const res = await postQuestionDetail({ id: Number(queryParams.id), roleId: queryParams.roleId, fnUid: queryParams.fnUid, zoneId: Number(queryParams.zoneId) })
    surveyData.value = res as SurveyData
    console.log('surveyData', surveyData.value)
    if (surveyData.value.title) {
      Taro.setNavigationBarTitle({
        title: surveyData.value?.title,
      })
    }
  }
  catch (error) {
    console.log('error', error)
  }
}
</script>

<template>
  <view class="h-full w-full f-c bg-[rgb(217,242,253)]">
    <view
      v-if="surveyData?.questions && surveyData.questions.length > 0"
      class="mx-auto h-[100vh] max-w-750PX w-[90%] flex-col bg-[rgb(217,242,253)] p-5 text-[18PX]"
      lg="w-750PX"
    >
      <view class="mt-2 flex flex-col bg-[#fff] p-5">
        <view class="f-c">
          {{ surveyData?.title || '' }}
        </view>
        <view class="mt-5 f-s">
          {{ surveyData?.desc || '' }}
        </view>
      </view>
      <view
        class="custom-button mt-5 cursor-pointer"
        @tap="handleTap"
      >
        {{ t('startQuiz') }}
      </view>
    </view>
    <view
      v-else
      class="mx-auto h-[100vh] max-w-750PX w-[90%] flex-col bg-[rgb(217,242,253)] p-5 text-[18PX]"
      lg="w-750PX"
    >
      <view class="mt-2 flex flex-col bg-[#fff] p-5">
        <view class="f-c">
          {{ t('surveyNotFound') }}
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>

</style>
