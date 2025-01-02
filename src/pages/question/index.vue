<script setup lang="ts">
import Taro from '@tarojs/taro'
import { computed, onMounted, ref } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import AnimatedInput from '../../components/AnimatedInput/index.vue'
import AnimatedTextarea from '../../components/AnimatedTextarea/index.vue'
import { checkBounds, getQueryParams, isEmpty, postQuestionDetail, submitAnswer } from '../../utils/index'
import surveyDataJson from './index.json'

const { t, locale } = useI18n()

const surveyData = ref<SurveyData>()

// 总题数
const totalQuestionCount = ref(1)
// 用于显示的题号
const shownQuestionNumber = ref(1)

// 初始化答案
const finalAnswers = ref<Answers[]>([])
const tempAnswers = ref<TempAnswers>({})

const allQuestions = ref<Question[]>([])

// 控制当前展示的题目
const currentQuestionIndex = ref(0)

const cacheData = ref<CacheData>()
// 当前展示的题目
const currentQuestionId = computed(() => {
  if (allQuestions.value.length > 0) {
    return allQuestions.value[currentQuestionIndex.value]?.id || ''
  }
  return ''
})
const currentQuestion = computed(() => {
  if (allQuestions.value.length > 0) {
    return allQuestions.value.find(question => question.id === currentQuestionId.value) || ''
  }
  return ''
})

const questionTypeMap = {
  0: 'singleStringText', // 单行文本;
  1: 'numberText', // 数字;
  2: 'multipleStringText', // 多行文本;
  3: 'singleChoice', // 单选;
  4: 'multipleChoice', // 多选;
  5: 'stringTextGrid', // 网格单行文本;
  6: 'numberTextGrid', // 网格数字;
  7: 'singleChoiceGrid', // 矩阵单选;
  8: 'multipleChoiceGrid', // 矩阵多选
}
const queryParams = ref()
// surveyData.value = surveyDataJson as SurveyData
// TODO 缓存中取答案
onMounted(async () => {
  queryParams.value = Taro.getStorageSync('queryParams')
  console.log('onMounted queryParams', queryParams)
  try {
    // 获取json数据 surveyData 设置为SurveyData类型
    const res = await postQuestionDetail({ id: Number(queryParams.value.id), roleId: queryParams.value.roleId, fnUid: queryParams.value.fnUid, zoneId: Number(queryParams.value.zoneId) })
    surveyData.value = res
    // 设置标题
    if (surveyData.value?.title) {
      Taro.setNavigationBarTitle({
        title: surveyData.value?.title || '',
      })
    }
    console.log('surveyData', res)
  }
  catch (error) {
    console.log('error', error)
  }
  locale.value = queryParams.value.lang || 'en'

  // 初始化各种东西
  totalQuestionCount.value = surveyData.value?.questions.length || 0
  // 所有问题
  // 将问题中的类型 根据questionTypeMap转换
  allQuestions.value = (surveyData.value?.questions || []).map((question) => {
    question.type = questionTypeMap[question.type]
    return question
  })
  console.log('allQuestions', allQuestions.value)
  initAnswers()
  // 获取缓存数据
  cacheData.value = Taro.getStorageSync(`${surveyData.value?.survey_id}_${queryParams.value.roleId}_cacheData`)
  if (cacheData.value) {
    currentQuestionIndex.value = cacheData.value.currentQuestionIndex
    shownQuestionNumber.value = cacheData.value.shownQuestionNumber
    tempAnswers.value = cacheData.value.tempAnswers
    finalAnswers.value = cacheData.value.finalAnswers
  }
})

// 初始化答案 根据allQuestions 初始化
function initAnswers() {
  allQuestions.value.forEach((question) => {
    tempAnswers.value[question.id] = { type: question.type }
  })
  console.log('tempAnswers', tempAnswers.value)
}

// 判断是否是最后一题
const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === (totalQuestionCount.value - 1)
})

// 判断该题是否需要显示 根据  conditions是否为null  operator 0/1 and/or
function shouldShowQuestion(question: Question) {
  console.log('shouldShowQuestion', question)
  if (!question || !question.conditions) {
    return true
  }
  const conditions = question.conditions
  // 根据type 和 conditions 判断是否显示
  if (question.operator === 0) {
    return conditions.every(condition => tempAnswers.value[condition.questionId].selectedOption?.id === condition.conditionValue)
  }
  if (question.operator === 1) {
    return conditions.some(condition => tempAnswers.value[condition.questionId].selectedOption?.id === condition.conditionValue)
  }

  return true
}

// t{{}} 对应的值
const errorMin = ref('')
const errorMax = ref('')
const errorCurrent = ref('')

// 错误显示 多语言对应
const showErrorContent = ref(false)
const errorContent = ref('')
function handleErrorContent(content: string, errorValue?: string, minValue?: string, maxValue?: string) {
  console.log('errorContent show', content)
  showErrorContent.value = true
  errorContent.value = content
  errorCurrent.value = errorValue || ''
  errorMin.value = minValue || ''
  errorMax.value = maxValue || ''
}

// 必填判断 是否所有位置都已经填写
function isAllFilled(question: Question, answer: TempAnswers) {
  console.log('isAllFilled', question, answer)
  if (question.type === 'singleChoice') {
    return !isEmpty(answer[question.id].selectedOption?.id)
  }
  if (question.type === 'multipleChoice') {
    return !isEmpty(answer[question.id]?.selectedOptions)
  }
  if (question.type === 'singleStringText') {
    return !isEmpty(answer[question.id].text)
  }
  if (question.type === 'numberText') {
    return !isEmpty(answer[question.id].text)
  }
  if (question.type === 'multipleStringText') {
    return !isEmpty(answer[question.id].text)
  }
  if (question.type === 'stringTextGrid') {
    return question.questions.every((row) => {
      if (!shouldShowQuestion(row)) {
        return true
      }
      return !isEmpty(answer[question.id][row.id])
    })
  }
  if (question.type === 'numberTextGrid') {
    return question.questions.every((row) => {
      if (!shouldShowQuestion(row)) {
        return true
      }
      return !isEmpty(answer[question.id][row.id])
    })
  }
  if (question.type === 'singleChoiceGrid') {
    return question.questions.every(row => !isEmpty(answer[question.id]?.singleChoiceGrid?.[row.id]?.id))
  }
  if (question.type === 'multipleChoiceGrid') {
    return question.questions.every(row => !isEmpty(answer[question.id]?.multipleChoiceGrid?.[row.id]))
  }
  return true
}

// 选填判断 判断是否往最终答案里填写  非必答题已经答了部分 也返回true
function isPartFilled(question: Question, answer: TempAnswers) {
  console.log('isPartFilled', question, answer)
  if (question.type === 'singleChoice') {
    return !isEmpty(answer[question.id].selectedOption?.id)
  }
  if (question.type === 'multipleChoice') {
    return !isEmpty(answer[question.id]?.selectedOptions)
  }
  // Boolean(answer[question.questionId].text)：这个表达式会将 text 转换为布尔值。它会返回 true 当 text 是一个非空字符串，并返回 false 当 text 是 null、undefined 或者空字符串。
  if (question.type === 'singleStringText') {
    return !isEmpty(answer[question.id].text)
  }
  if (question.type === 'numberText') {
    return !isEmpty(answer[question.id].text)
  }
  if (question.type === 'multipleStringText') {
    return !isEmpty(answer[question.id].text)
  }
  if (question.type === 'stringTextGrid') {
    return question.questions.some(row => !isEmpty(answer[question.id][row.id]))
  }
  if (question.type === 'numberTextGrid') {
    return question.questions.some(row => !isEmpty(answer[question.id][row.id]))
  }
  if (question.type === 'singleChoiceGrid') {
    return question.questions.some(row => !isEmpty(answer[question.id]?.singleChoiceGrid?.[row.id]?.id))
  }
  if (question.type === 'multipleChoiceGrid') {
    return question.questions.some(row => !isEmpty(answer[question.id]?.multipleChoiceGrid?.[row.id]))
  }
  return false
}

// 判断网格题是否全部符合条件
function isGridChecked(question: Question, answer: TempAnswers) {
  console.log('isGridChecked', question, answer)
  if (question.type === 'stringTextGrid' || question.type === 'numberTextGrid') {
    if (typeof question !== 'string' && 'questions' in question) {
      const hasError = question.questions.every((row) => {
        const value = answer[currentQuestionId.value][row.id]
        if (value === undefined) {
          return true
        }

        if (question.type === 'numberTextGrid') {
          const numberValue = value.replace(/\D/g, '') // 移除非数字字符
          if (numberValue !== value) {
            handleErrorContent('mustBeNumber')
            return false
          }
          const number = Number(numberValue)
          const { result, reason } = checkBounds(number, row.min, row.max, row.includeBounds, 'number')
          if (!result) {
            handleErrorContent(reason, numberValue, row.min.toString(), row.max.toString())
          }
          return result
        }

        const textLength = value.length
        const { result, reason } = checkBounds(textLength, row.min, row.max, row.includeBounds, '')
        if (!result) {
          handleErrorContent(reason, textLength.toString(), row.min.toString(), row.max.toString())
        }
        return result
      })
      console.log('hasError', hasError)
      return hasError
    }
  }
  return true
}

// 下一题按钮
function handleNextQuestion() {
  const question = currentQuestion.value
  // 为空 代表错误 报错  应该是一定有题目的
  if (question === '') {
    return
  }
  console.log('handleNextQuestion currentQuestion', question)

  // 有报错信息存在 直接返回
  if (showErrorContent.value) {
    return
  }

  // 多选超出 特殊处理 不往下走
  if (showMutipleErrorContent.value) {
    return
  }

  // 判断必填情况
  if (question && question.required && !isAllFilled(question, tempAnswers.value)) {
    showErrorContent.value = true
    handleErrorContent('required')
    // 弹框 TODO
    console.log('请先答完本题')
    return
  }
  // 判断网格题是否全部符合条件
  if (!isGridChecked(question, tempAnswers.value)) {
    console.log('网格题有不符合条件的')
    return
  }

  // TODO 删除？
  showErrorContent.value = false
  if (isPartFilled(question, tempAnswers.value)) {
    console.log('不为空 添加到最终答案里')
    // 根据类型往最终答案中添加
    addAnswerToFinal(question)
  }
  console.log('tempAnswers', tempAnswers.value)
  console.log('finalAnswers', finalAnswers.value)

  // // 跳题逻辑
  // let tempQuestionIndex = currentQuestionIndex.value
  // // TODO 错误处理 单选跳题
  // if (question.type === 'singleChoice' && tempAnswers.value[question.questionId].selectedOption?.jumpTo) {
  //   const newIndex = allQuestions.value.findIndex(questionTemp => questionTemp.questionId === tempAnswers.value[question.questionId].selectedOption?.jumpTo)
  //   tempQuestionIndex = newIndex
  // }
  // // 无条件跳题
  // if (question.jumpTo) {
  //   const newIndex = allQuestions.value.findIndex(questionTemp => questionTemp.questionId === question.jumpTo)
  //   tempQuestionIndex = newIndex
  // }

  // // 判断是否跳题
  // if (tempQuestionIndex === currentQuestionIndex.value) {
  //   currentQuestionIndex.value++
  // }
  // else {
  //   currentQuestionIndex.value = tempQuestionIndex
  // }

  // 展示用题号++
  shownQuestionNumber.value++

  // 题目索引
  // if (!isLastQuestion.value) {
  //   currentQuestionIndex.value++
  // }
  currentQuestionIndex.value++

  // 处理题目关联
  while (typeof currentQuestion.value !== 'string' && !shouldShowQuestion(currentQuestion.value)) {
    console.log('该题隐藏', currentQuestion.value)
    currentQuestionIndex.value++
    // TODO 最后一题被隐藏的情况 弹框结束 报错？
    if (currentQuestionIndex.value >= totalQuestionCount.value) {
      console.log('最后一题被隐藏  弹框结束')
      // 标记 完成答题
      if (cacheData.value) {
        cacheData.value.completed = true
        console.log('cacheData.value completed', cacheData.value)
        Taro.setStorageSync(`${surveyData.value?.survey_id}_${queryParams.value.roleId}_cacheData`, cacheData.value)
      }
      try {
        submitAnswer({ id: Number(queryParams.value.id), answer: JSON.stringify(finalAnswers.value), fnUid: queryParams.value.fnUid, roleId: queryParams.value.roleId, zoneId: Number(queryParams.value.zoneId) })
      }
      catch (error) {
        console.log('submitAnswer error', error)
      }
      // 保存进度并关闭问卷 跳转页面
      console.log('Survey closed tempAnswers', tempAnswers.value)
      console.log('Survey closed, finalAnswers:', finalAnswers.value)
      break
    }
  }
  // 缓存当前信息 题号 + 答案
  cacheData.value = ({
    currentQuestionIndex: currentQuestionIndex.value,
    shownQuestionNumber: shownQuestionNumber.value,
    tempAnswers: tempAnswers.value,
    finalAnswers: [...finalAnswers.value],
    completed: cacheData.value?.completed || false,
  })
  console.log('set cacheData', cacheData.value)
  Taro.setStorageSync(`${surveyData.value?.survey_id}_${queryParams.value.roleId}_cacheData`, cacheData.value)
}

// TODO  备份 然后比较最后答案和原答案 覆盖掉题号相同的 有必要么？
function addAnswerToFinal(question: Question) {
  if (question.type === 'singleChoice') {
    finalAnswers.value.push({
      id: question.id,
      value: tempAnswers.value[question.id].selectedOption?.id.toString() || '',
    })
  }
  if (question.type === 'multipleChoice') {
    tempAnswers.value[question.id].selectedOptions?.forEach((option) => {
      finalAnswers.value.push({
        id: question.id,
        value: option.id.toString(),
      })
    })
  }
  else if (question.type === 'singleStringText') {
    finalAnswers.value.push({
      id: question.id,
      value: tempAnswers.value[question.id].text || '',
    })
  }
  else if (question.type === 'numberText') {
    finalAnswers.value.push({
      id: question.id,
      value: tempAnswers.value[question.id].text || '',
    })
  }
  else if (question.type === 'multipleStringText') {
    finalAnswers.value.push({
      id: question.id,
      value: tempAnswers.value[question.id].text || '',
    })
  }
  else if (question.type === 'stringTextGrid') {
    question.questions.forEach((row) => {
      if (!isEmpty(tempAnswers.value[question.id][row.id])) {
        finalAnswers.value.push({
          id: row.id,
          value: tempAnswers.value[question.id][row.id],
        })
      }
    })
  }
  else if (question.type === 'numberTextGrid') {
    question.questions.forEach((row) => {
      if (!isEmpty(tempAnswers.value[question.id][row.id])) {
        finalAnswers.value.push({
          id: row.id,
          value: tempAnswers.value[question.id][row.id],
        })
      }
    })
  }
  else if (question.type === 'singleChoiceGrid') {
    question.questions.forEach((row) => {
      if (!isEmpty(tempAnswers.value[question.id]?.singleChoiceGrid?.[row.id])) {
        finalAnswers.value.push({
          id: row.id,
          value: tempAnswers.value[question.id]?.singleChoiceGrid?.[row.id]?.id.toString() || '',
        })
      }
    })
  }
  else if (question.type === 'multipleChoiceGrid') {
    question.questions.forEach((row) => {
      if (!isEmpty(tempAnswers.value[question.id]?.multipleChoiceGrid?.[row.id])) {
        tempAnswers.value[question.id]?.multipleChoiceGrid?.[row.id]?.forEach((option) => {
          finalAnswers.value.push({
            id: row.id,
            value: option.id.toString(),
          })
        })
      }
    })
  }
}

function closeSurvey() {
  // 最后一题是否是必答题
  if (currentQuestion.value && currentQuestion.value.required && !isAllFilled(currentQuestion.value, tempAnswers.value)) {
    console.log('最后一题是必答题，请先答完本题')
    showErrorContent.value = true
    return
  }

  handleNextQuestion()
  // 标记 完成答题
  if (cacheData.value) {
    cacheData.value.completed = true
    Taro.setStorageSync(`${surveyData.value?.survey_id}_${queryParams.value.roleId}_cacheData`, cacheData.value)
  }

  try {
    submitAnswer({ id: Number(queryParams.value.id), answer: JSON.stringify(finalAnswers.value), fnUid: queryParams.value.fnUid, roleId: queryParams.value.roleId, zoneId: Number(queryParams.value.zoneId) })
  }
  catch (error) {
    console.log('submitAnswer error', error)
  }
  // 保存进度并关闭问卷
  console.log('Survey closed tempAnswers', tempAnswers.value)
  console.log('Survey closed, finalAnswers:', finalAnswers.value)
}

// 单选 选项选中状态绑定 选项初始化 可以定义默认哪个选项选中
function handleSelectBind(option: Option) {
  if (tempAnswers.value[currentQuestionId.value]) {
    return tempAnswers.value[currentQuestionId.value].selectedOption === option
  }
  return false
}
// 单选 解决单选框选中问题 在单选框内任何位置都可触发
function handleSelectOption(option: Option) {
  tempAnswers.value[currentQuestionId.value].selectedOption = option
  showErrorContent.value = false
}

// 多选报错显示  超出最多
const showMutipleErrorContent = ref(false)
// 多选 选中状态绑定
function handleMutipleBind(option: Option) {
  return tempAnswers.value[currentQuestionId.value]?.selectedOptions?.includes(option) || false
}
// 多选  选中点击 处理最多选择问题
function selectMutipleOption(option: Option) {
  const question = currentQuestion.value
  const selectedOptions = tempAnswers.value[currentQuestionId.value]?.selectedOptions || []
  if (!selectedOptions.includes(option)) {
    selectedOptions.push(option)
  }
  else {
    selectedOptions.splice(selectedOptions.indexOf(option), 1)
  }

  showMutipleErrorContent.value = false

  if (question && question.type === 'multipleChoice' && question.max) {
    if (selectedOptions.length > question.max) {
      // 自动去掉最开始选择的那个
      // selectedOptions.shift()

      // 报错
      showMutipleErrorContent.value = true
    }
  }
  tempAnswers.value[currentQuestionId.value].selectedOptions = selectedOptions
  showErrorContent.value = false
}
// 字符串文本框输入
function handleTextChange(e: any) {
  tempAnswers.value[currentQuestionId.value].text = e.detail.value
  showErrorContent.value = false
}

// 矩阵文本框输入
function handleMatrixInput(rowId: number, e: any) {
  tempAnswers.value[currentQuestionId.value][rowId] = e.detail.value
  showErrorContent.value = false
}

// 单选网格题
function handleSingleChoiceGridTap(rowId: string, option: Option) {
  const singleGrid = tempAnswers.value[currentQuestionId.value]?.singleChoiceGrid || {}
  singleGrid[rowId] = option
  tempAnswers.value[currentQuestionId.value].singleChoiceGrid = singleGrid
  showErrorContent.value = false
}
function handleSingleChoiceGridBind(rowId: string, option: Option) {
  return tempAnswers.value[currentQuestionId.value]?.singleChoiceGrid?.[rowId] === option || false
}

// 多选网格题
function handleMultipleChoiceGridTap(rowId: string, option: Option) {
  const multipleGrid = tempAnswers.value[currentQuestionId.value]?.multipleChoiceGrid || {}
  const multipleGridOptions = multipleGrid[rowId] || []
  if (!multipleGridOptions.includes(option)) {
    multipleGridOptions.push(option)
  }
  else {
    multipleGridOptions.splice(multipleGridOptions.indexOf(option), 1)
  }
  multipleGrid[rowId] = multipleGridOptions

  tempAnswers.value[currentQuestionId.value].multipleChoiceGrid = multipleGrid
  showErrorContent.value = false
}
function handleMultipleChoiceGridBind(rowId: string, option: Option) {
  return tempAnswers.value[currentQuestionId.value]?.multipleChoiceGrid?.[rowId]?.includes(option) || false
}

// 进度条
const progressPercentage = computed(() => {
  return ((currentQuestionIndex.value + 1) / totalQuestionCount.value) * 100
})
</script>

<template>
  <view class="h-full w-full flex items-center justify-center bg-[rgb(217,242,253)]">
    <view
      v-if="surveyData?.questions && surveyData.questions.length > 0"
      class="mx-auto h-[100vh] max-w-750PX w-[90%] flex-col bg-[rgb(217,242,253)] p-5 text-[18PX]"
      lg="w-750PX"
    >
      <view v-if="!cacheData?.completed">
        <view class="mt-2 h-5PX w-full overflow-hidden rounded bg-[#fff]">
          <view
            class="h-full bg-oceanBlue transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"
          />
        </view>
        <view
          class="flex flex-col border border-[#fff] border-solid bg-[#fff] p-5"
          :class="showErrorContent ? ' border  border-solid border-red' : ''"
        >
          <view>
            <!-- <view class="mb-5 f-c">
              <text>当前进度: 第{{ shownQuestionNumber }}题 </text>
            </view>
            <view class="mb-5 f-c">
              <text>进度条进度: 第{{ currentQuestionIndex + 1 }}题 / {{ totalQuestionCount }}题</text>
            </view> -->
            <view
              v-if="currentQuestion"
              class="mb-5"
            >
              <view v-if="currentQuestion.type === 'singleChoice'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}
                </text>
                <view class="mt-5 w-full flex flex-col gap-2">
                  <label
                    v-for="option in currentQuestion.options"
                    :key="option.id"
                    class="flex cursor-pointer items-center rounded p-3"
                    @tap="handleSelectOption(option)"
                  >
                    <view class="flex cursor-pointer items-center">
                      <view
                        class="mr-2 h-20PX w-20PX f-c border-2PX border-[rgb(95,99,104)] rounded-full border-solid"
                        :class="handleSelectBind(option) ? 'border-2PX border-solid border-oceanBlue' : ''"
                      >
                        <view
                          v-if="handleSelectBind(option)"
                          class="h-12PX w-12PX rounded-full bg-oceanBlue"
                        />
                      </view>
                      <view class="ml-2">{{ option.title }}</view>
                    </view>
                  </label>
                </view>
              </view>
              <view v-if="currentQuestion.type === 'multipleChoice'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}
                </text>
                <text
                  v-if="currentQuestion.max && currentQuestion.max < currentQuestion.options.length"
                  class="text-18PX"
                >
                  {{ t('chooseLimit_head') }} {{ currentQuestion.max }} {{ t('chooseLimit_tail') }}
                </text>
                <view class="mt-5 w-full flex flex-col gap-2">
                  <label
                    v-for="option in currentQuestion.options"
                    :key="option.id"
                    class="flex cursor-pointer items-center rounded p-3"
                    @tap="selectMutipleOption(option)"
                  >
                    <view class="flex cursor-pointer items-center">
                      <view
                        class="mr-2 h-20PX w-20PX flex items-center justify-center border-2PX border-[rgb(95,99,104)] border-solid"
                        :class="handleMutipleBind(option) ? 'border-blue-500 bg-blue-500' : 'bg-white'"
                      >
                        <view
                          v-if="handleMutipleBind(option)"
                          class="h-12PX w-12PX bg-white"
                          style="clip-path: polygon(14% 44%, 0% 65%, 50% 100%, 100% 0%, 80% 0%, 45% 75%);"
                        />
                      </view>
                      <view class="ml-2">{{ option.title }}</view>
                    </view>
                  </label>
                </view>
                <view
                  v-if="showMutipleErrorContent"
                  class="flex color-red"
                >
                  <view class="icon-small-wrp">
                    <icon
                      class="icon-small"
                      type="warn"
                      size="23PX"
                    />
                  </view>
                  <view class="ml-2">
                    {{ t('maxChoice_head') }}{{ currentQuestion.maxSelection }}{{ t('maxChoice_tail') }}
                  </view>
                </view>
              </view>
              <view v-if="currentQuestion.type === 'singleStringText'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}
                </text>
                <AnimatedInput
                  class="mt-5"
                  type="text"
                  :min="currentQuestion.min"
                  :max="currentQuestion.max"
                  :include-bounds="currentQuestion.includeBounds"
                  :value="tempAnswers[currentQuestionId].text"
                  @input="handleTextChange"
                  @handle-error-content="handleErrorContent"
                />
              </view>
              <view v-if="currentQuestion.type === 'multipleStringText'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}
                </text>
                <AnimatedInput
                  class="mt-5 w-full"
                  type="textarea"
                  :min="currentQuestion.min"
                  :max="currentQuestion.max"
                  :include-bounds="currentQuestion.includeBounds"
                  :value="tempAnswers[currentQuestionId].text"
                  @input="handleTextChange"
                  @handle-error-content="handleErrorContent"
                />
              </view>
              <view v-if="currentQuestion.type === 'numberText'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}{{ t('onlyNumber') }}
                </text>
                <AnimatedInput
                  class="mt-5"
                  type="number"
                  :min="currentQuestion.min"
                  :max="currentQuestion.max"
                  :include-bounds="currentQuestion.includeBounds"
                  :value="tempAnswers[currentQuestionId].text"
                  @input="handleTextChange"
                  @handle-error-content="handleErrorContent"
                />
              </view>
              <view v-if="currentQuestion.type === 'stringTextGrid'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}
                </text>
                <view
                  v-for="row in currentQuestion.questions"
                  :key="row.id"
                  class="mt-5 flex items-center justify-between"
                >
                  <view
                    v-if="shouldShowQuestion(row)"
                    class="flex items-center justify-between"
                  >
                    <view class="mr-2 w-1/2">
                      {{ row.title }}
                    </view>
                    <view class="relative w-1/2">
                      <AnimatedInput
                        type="text"
                        :min="row.min"
                        :max="row.max"
                        :include-bounds="row.includeBounds"
                        :value="tempAnswers[currentQuestionId]?.[row.id]"
                        @input="(e) => handleMatrixInput(row.id, e)"
                        @handle-error-content="handleErrorContent"
                      />
                    </view>
                  </view>
                </view>
              </view>
              <view v-if="currentQuestion.type === 'numberTextGrid'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}{{ t('onlyNumber') }}
                </text>
                <view
                  v-for="row in currentQuestion.questions"
                  :key="row.id"
                  class="mt-5 flex items-center justify-between"
                >
                  <view
                    v-if="shouldShowQuestion(row)"
                    class="flex items-center justify-between"
                  >
                    <view class="mr-2 w-1/2">
                      {{ row.title }}
                    </view>
                    <view class="relative w-1/2">
                      <AnimatedInput
                        type="number"
                        :min="row.min"
                        :max="row.max"
                        :include-bounds="row.includeBounds"
                        :value="tempAnswers[currentQuestionId]?.[row.id]"
                        @input="(e) => handleMatrixInput(row.id, e)"
                        @handle-error-content="handleErrorContent"
                      />
                    </view>
                  </view>
                </view>
              </view>
              <view v-if="currentQuestion.type === 'singleChoiceGrid'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}
                </text>
                <view class="mt-5">
                  <!-- 选项标题行 -->
                  <view :style="`display: grid; grid-template-columns: repeat(${currentQuestion.options.length + 1}, 1fr); gap: 10px;`">
                    <view class="text-center" />
                    <view
                      v-for="option in currentQuestion.options"
                      :key="option.id"
                      class="text-center"
                    >
                      {{ option.title }}
                    </view>
                  </view>

                  <!-- 行内容和选项 -->
                  <view
                    v-for="row in currentQuestion.questions"
                    :key="row.id"
                    class="mt-5"
                    :style="`display: grid; grid-template-columns: repeat(${currentQuestion.options.length + 1}, 1fr); gap: 10px;`"
                  >
                    <view class="text-center">
                      {{ row.title }}
                    </view>
                    <label
                      v-for="option in currentQuestion.options"
                      :key="option.id"
                      class="f-c cursor-pointer rounded"
                      @tap="handleSingleChoiceGridTap(row.id, option)"
                    >
                      <view class="f-c cursor-pointer">
                        <view
                          class="h-20PX w-20PX f-c border-2PX border-[rgb(95,99,104)] rounded-full border-solid"
                          :class="handleSingleChoiceGridBind(row.id, option) ? 'border-2PX border-solid border-oceanBlue' : ''"
                        >
                          <view
                            v-if="handleSingleChoiceGridBind(row.id, option)"
                            class="h-12PX w-12PX rounded-full bg-oceanBlue"
                          />
                        </view>
                      </view>
                    </label>
                  </view>
                </view>
              </view>
              <view v-if="currentQuestion.type === 'multipleChoiceGrid'">
                <text
                  v-if="currentQuestion.required"
                  class="text-red"
                >
                  *
                </text>
                <text class="text-18PX">
                  {{ shownQuestionNumber }}.{{ currentQuestion.title }}
                </text>
                <view class="mt-5">
                  <!-- 选项标题行 -->
                  <view :style="`display: grid; grid-template-columns: repeat(${currentQuestion.options.length + 1}, 1fr); gap: 10px;`">
                    <view class="text-center" />
                    <view
                      v-for="option in currentQuestion.options"
                      :key="option.id"
                      class="text-center"
                    >
                      {{ option.title }}
                    </view>
                  </view>

                  <!-- 行内容和选项 -->
                  <view
                    v-for="row in currentQuestion.questions"
                    :key="row.id"
                    class="mt-5"
                    :style="`display: grid; grid-template-columns: repeat(${currentQuestion.options.length + 1}, 1fr); gap: 10px;`"
                  >
                    <view class="text-center">
                      {{ row.title }}
                    </view>
                    <label
                      v-for="option in currentQuestion.options"
                      :key="option.id"
                      class="f-c cursor-pointer rounded"
                      @tap="handleMultipleChoiceGridTap(row.id, option)"
                    >
                      <view class="f-c">
                        <view
                          class="h-20PX w-20PX flex items-center justify-center border-2PX border-[rgb(95,99,104)] border-solid"
                          :class="handleMultipleChoiceGridBind(row.id, option) ? 'border-blue-500 bg-blue-500' : 'bg-white'"
                        >
                          <view
                            v-if="handleMultipleChoiceGridBind(row.id, option)"
                            class="h-12PX w-12PX bg-white"
                            style="clip-path: polygon(14% 44%, 0% 65%, 50% 100%, 100% 0%, 80% 0%, 45% 75%);"
                          />
                        </view>
                      </view>
                    </label>
                  </view>
                </view>
              </view>
            </view>
            <view
              v-if="showErrorContent"
              class="flex color-red"
            >
              <view class="icon-small-wrp">
                <icon
                  class="icon-small"
                  type="warn"
                  size="23PX"
                />
              </view>
              <view class="ml-2">
                {{ t(errorContent, { errorMin, errorMax, errorCurrent }) }}
              </view>
            </view>
          </view>
        </view>
        <view class="mt-5 f-c flex-col">
          <view
            v-if="!isLastQuestion"
            class="custom-button mt-5 cursor-pointer"
            @tap="handleNextQuestion"
          >
            {{ t('next') }}
          </view>
          <view
            v-if="isLastQuestion"
            class="custom-button mt-5 cursor-pointer"
            @tap="closeSurvey"
          >
            {{ t('submit') }}
          </view>
        </view>
      </view>
      <view v-if="cacheData?.completed">
        <view class="mt-2 flex flex-col bg-[#fff] p-5">
          <view class="f-c">
            {{ t('thankYou') }}
          </view>
        </view>
      </view>
    </view>
    <view
      v-if="!surveyData?.questions || surveyData.questions.length === 0"
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

<style lang="scss">
radio {

  /* 自定义单选框的颜色 */
  .wx-radio-input.wx-radio-input-checked {
    background-color: #0088ff !important;
    border-color: #0088ff !important;
  }
}

.custom-button {
  -webkit-box-sizing: border-box;
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    text-align: center;
    color: #0088ff;
    -webkit-tap-highlight-color: transparent;
    background-color: #fff;
    border-width: 0;
    border-radius: 5PX;
    outline: 0;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding-left: 14PX;
    padding-right: 14PX;
    font-size: 18PX;
    line-height: 2.55556;
    text-decoration: none;
    display: block;
    position: relative;
    overflow: hidden;

}

/* 选中状态下的样式 */
// label:has(radio:checked) {
//   @apply border-blue-500 bg-blue-50;
// }

.custom-radio {
  width: 20PX;
  height: 20PX;
  border: 2PX solid rgb(95, 99, 104); /* Outer circle color */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}
.custom-radio-border {
  border: 2PX solid #0088ff;
}

.inner-circle {
  width: 12PX;
  height: 12PX;
  background-color: #0088ff; /* Inner circle color */
  border-radius: 50%;
}

.input:focus {
  border-color: #0088ff !important;
}

.circle-fade-enter-active, .circle-fade-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.circle-fade-enter, .circle-fade-leave-to {
  transform: scale(0);
  opacity: 0;
}

.circle-fade-enter-to, .circle-fade-leave {
  transform: scale(1);
  opacity: 1;
}
// textarea 字体大小修改
.taro-textarea {
  font-size: 18PX !important;
  font-family: -apple-system-font, Helvetica Neue, sans-serif !important
}
</style>
}
