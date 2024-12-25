<script setup lang="ts">
import Taro from '@tarojs/taro'
import { computed, onMounted, ref } from 'vue'
import AnimatedInput from '../../components/AnimatedInput/index.vue'
import AnimatedTextarea from '../../components/AnimatedTextarea/index.vue'
import { isEmpty } from '../../utils/index'
import surveyDataJson from './index.json'

const surveyData = surveyDataJson as SurveyData

// 总题数
const totalQuestionCount = ref(1)
// 用于显示的题号
const shownQuestionNumber = ref(1)

// 初始化答案
const finalAnswers = ref<Answers[]>([])
const tempAnswers = ref<TempAnswers>({})

const allQuestions = ref<Question[]>([])

// 控制当前展示的题目
const currentQuestionIndex = ref(9)
// 当前展示的题目
const currentQuestionId = computed(() => {
  if (allQuestions.value.length > 0) {
    return allQuestions.value[currentQuestionIndex.value].questionId || ''
  }
  return ''
})
const currentQuestion = computed(() => {
  if (allQuestions.value.length > 0) {
    return allQuestions.value[currentQuestionIndex.value] || ''
  }
  return ''
})

// TODO 缓存中取答案
onMounted(() => {
  // 获取json数据 surveyData 设置为SurveyData类型

  console.log('surveyData', surveyData)
  // 设置标题
  Taro.setNavigationBarTitle({
    title: surveyData.title,
  })
  // description

  // 初始化各种东西
  totalQuestionCount.value = surveyData.questions.length
  // 所有问题
  allQuestions.value = surveyData.questions
  initAnswers()
  console.log('allQuestions', allQuestions.value, totalQuestionCount.value)
})

// 初始化答案 根据allQuestions 初始化
function initAnswers() {
  allQuestions.value.forEach((question) => {
    tempAnswers.value[question.questionId] = { type: question.type }
  })
  console.log('tempAnswers', tempAnswers.value)
}

// 判断是否是最后一题
const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === (totalQuestionCount.value - 1) || (currentQuestion.value && currentQuestion.value.jumpTo === 'Q0')
})

// 判断该题是否需要显示 根据dependsOn 属性
function shouldShowQuestion() {
  if (!currentQuestion.value || !currentQuestion.value.dependsOn) {
    return true
  }
  console.log('shouldShowQuestion', currentQuestion.value)
  const { type, conditions } = currentQuestion.value.dependsOn
  // 根据type 和 conditions 判断是否显示
  if (type === 'and') {
    return conditions.every(condition => tempAnswers.value[condition.questionId].selectedOption?.optionId === condition.optionId)
  }
  if (type === 'or') {
    return conditions.some(condition => tempAnswers.value[condition.questionId].selectedOption?.optionId === condition.optionId)
  }

  return true
}

const showErrorContent = ref(false)

// 必填判断 是否所有位置都已经填写
function isAllFilled(question: Question, answer: TempAnswers) {
  console.log('isAllFilled', question, answer)
  if (question.type === 'singleChoice') {
    console.log('answer[question.questionId].selectedOption?.optionId', answer[question.questionId].selectedOption?.optionId)
    return !isEmpty(answer[question.questionId].selectedOption?.optionId)
  }
  if (question.type === 'multipleChoice') {
    console.log('answer[question.questionId]?.selectedOptions', answer[question.questionId]?.selectedOptions)
    return !isEmpty(answer[question.questionId]?.selectedOptions)
  }
  // Boolean(answer[question.questionId].text)：这个表达式会将 text 转换为布尔值。它会返回 true 当 text 是一个非空字符串，并返回 false 当 text 是 null、undefined 或者空字符串。
  if (question.type === 'singleStringText') {
    console.log('answer[question.questionId].text', answer[question.questionId].text)
    return !isEmpty(answer[question.questionId].text)
  }
  if (question.type === 'numberText') {
    console.log('answer[question.questionId].number?.toString()', answer[question.questionId].number?.toString())
    return !isEmpty(answer[question.questionId].number?.toString())
  }
  if (question.type === 'multipleStringText') {
    console.log('answer[question.questionId].text', answer[question.questionId].text)
    return !isEmpty(answer[question.questionId].text)
  }
  if (question.type === 'stringTextGrid') {
    console.log('answer[question.questionId]', answer[question.questionId])
    return question.rows.every(row => !isEmpty(answer[question.questionId][row.rowId]))
  }
  if (question.type === 'numberTextGrid') {
    console.log('answer[question.questionId]', answer[question.questionId])
    return question.rows.every(row => !isEmpty(answer[question.questionId][row.rowId]))
  }
  if (question.type === 'singleChoiceGrid') {
    console.log('answer[question.questionId]?.singleChoiceGrid', answer[question.questionId]?.singleChoiceGrid)
    return question.rows.every(row => !isEmpty(answer[question.questionId]?.singleChoiceGrid?.[row.rowId]?.optionId))
  }
  if (question.type === 'multipleChoiceGrid') {
    console.log('answer[question.questionId]?.multipleChoiceGrid', answer[question.questionId]?.multipleChoiceGrid)
    return question.rows.every(row => !isEmpty(answer[question.questionId]?.multipleChoiceGrid?.[row.rowId]))
  }
  return true
}

// 选填判断 判断是否往最终答案里填写  非必答题已经答了部分 也返回true
function isPartFilled(question: Question, answer: TempAnswers) {
  console.log('isPartFilled', question, answer)
  if (question.type === 'singleChoice') {
    console.log('answer[question.questionId].selectedOption?.optionId', answer[question.questionId].selectedOption?.optionId)
    return !isEmpty(answer[question.questionId].selectedOption?.optionId)
  }
  if (question.type === 'multipleChoice') {
    console.log('answer[question.questionId]?.selectedOptions', answer[question.questionId]?.selectedOptions)
    return !isEmpty(answer[question.questionId]?.selectedOptions)
  }
  // Boolean(answer[question.questionId].text)：这个表达式会将 text 转换为布尔值。它会返回 true 当 text 是一个非空字符串，并返回 false 当 text 是 null、undefined 或者空字符串。
  if (question.type === 'singleStringText') {
    console.log('answer[question.questionId].text', answer[question.questionId].text)
    return !isEmpty(answer[question.questionId].text)
  }
  if (question.type === 'numberText') {
    console.log('answer[question.questionId].number?.toString()', answer[question.questionId].number?.toString())
    return !isEmpty(answer[question.questionId].number?.toString())
  }
  if (question.type === 'multipleStringText') {
    console.log('answer[question.questionId].text', answer[question.questionId].text)
    return !isEmpty(answer[question.questionId].text)
  }
  if (question.type === 'stringTextGrid') {
    console.log('answer[question.questionId]', answer[question.questionId])
    return question.rows.some(row => !isEmpty(answer[question.questionId][row.rowId]))
  }
  if (question.type === 'numberTextGrid') {
    console.log('answer[question.questionId]', answer[question.questionId])
    return question.rows.some(row => !isEmpty(answer[question.questionId][row.rowId]))
  }
  if (question.type === 'singleChoiceGrid') {
    console.log('answer[question.questionId]?.singleChoiceGrid', answer[question.questionId]?.singleChoiceGrid)
    return question.rows.some(row => !isEmpty(answer[question.questionId]?.singleChoiceGrid?.[row.rowId]?.optionId))
  }
  if (question.type === 'multipleChoiceGrid') {
    console.log('answer[question.questionId]?.multipleChoiceGrid', answer[question.questionId]?.multipleChoiceGrid)
    return question.rows.some(row => !isEmpty(answer[question.questionId]?.multipleChoiceGrid?.[row.rowId]))
  }
  return false
}

// 下一题按钮
function handleNextQuestion() {
  const question = currentQuestion.value
  // 为空 代表错误 报错  应该是一定有题目的
  if (question === '') {
    return
  }
  console.log(question)

  // 判断必填情况
  if (question && question.required && !isAllFilled(question, tempAnswers.value)) {
    showErrorContent.value = true
    // 弹框 TODO
    console.log('请先答完本题')
    return
  }
  showErrorContent.value = false
  if (isPartFilled(question, tempAnswers.value)) {
    console.log('不为空 添加到最终答案里')
    // 根据类型往最终答案中添加
    addAnswerToFinal(question)
  }
  console.log('tempAnswers', tempAnswers.value)
  console.log('finalAnswers', finalAnswers.value)

  // 跳题逻辑
  let tempQuestionIndex = currentQuestionIndex.value
  // TODO 错误处理 单选跳题
  if (question.type === 'singleChoice' && tempAnswers.value[question.questionId].selectedOption?.jumpTo) {
    const newIndex = allQuestions.value.findIndex(questionTemp => questionTemp.questionId === tempAnswers.value[question.questionId].selectedOption?.jumpTo)
    tempQuestionIndex = newIndex
  }
  // 无条件跳题
  if (question.jumpTo) {
    const newIndex = allQuestions.value.findIndex(questionTemp => questionTemp.questionId === question.jumpTo)
    tempQuestionIndex = newIndex
  }

  // 判断是否跳题
  if (tempQuestionIndex === currentQuestionIndex.value) {
    currentQuestionIndex.value++
  }
  else {
    currentQuestionIndex.value = tempQuestionIndex
  }

  // 展示用题号++
  shownQuestionNumber.value++

  // 处理题目关联
  while (!shouldShowQuestion()) {
    currentQuestionIndex.value++
    // TODO 最后一题被隐藏的情况 弹框结束 报错？
    if (currentQuestionIndex.value >= totalQuestionCount.value) {
      console.log('最后一题被隐藏  弹框结束')
      break
    }
  }
}

// TODO  备份 然后比较最后答案和原答案 覆盖掉题号相同的 有必要么？
function addAnswerToFinal(question: Question) {
  if (question.type === 'singleChoice') {
    finalAnswers.value.push({
      questionId: question.questionId,
      answer: tempAnswers.value[question.questionId].selectedOption?.optionId || '',
      answerText: tempAnswers.value[question.questionId].selectedOption?.content || '',
    })
  }
  if (question.type === 'multipleChoice') {
    finalAnswers.value.push({
      questionId: question.questionId,
      answer: tempAnswers.value[question.questionId].selectedOptions?.map(option => option.optionId).join(',') || '',
      answerText: tempAnswers.value[question.questionId].selectedOptions?.map(option => option.content).join(',') || '',
    })
  }
  else if (question.type === 'singleStringText') {
    finalAnswers.value.push({
      questionId: question.questionId,
      answer: tempAnswers.value[question.questionId].text || '',
    })
  }
  else if (question.type === 'numberText') {
    finalAnswers.value.push({
      questionId: question.questionId,
      answer: tempAnswers.value[question.questionId].number?.toString() || '',
    })
  }
  else if (question.type === 'multipleStringText') {
    finalAnswers.value.push({
      questionId: question.questionId,
      answer: tempAnswers.value[question.questionId].text || '',
    })
  }
  else if (question.type === 'stringTextGrid') {
    question.rows.forEach((row) => {
      if (!isEmpty(tempAnswers.value[question.questionId][row.rowId])) {
        finalAnswers.value.push({
          questionId: row.rowId,
          answer: tempAnswers.value[question.questionId][row.rowId],
        })
      }
    })
  }
  else if (question.type === 'numberTextGrid') {
    question.rows.forEach((row) => {
      if (!isEmpty(tempAnswers.value[question.questionId][row.rowId])) {
        finalAnswers.value.push({
          questionId: row.rowId,
          answer: tempAnswers.value[question.questionId][row.rowId],
        })
      }
    })
  }
  else if (question.type === 'singleChoiceGrid') {
    question.rows.forEach((row) => {
      if (!isEmpty(tempAnswers.value[question.questionId]?.singleChoiceGrid?.[row.rowId])) {
        finalAnswers.value.push({
          questionId: row.rowId,
          answer: tempAnswers.value[question.questionId]?.singleChoiceGrid?.[row.rowId]?.optionId || '',
          answerText: tempAnswers.value[question.questionId]?.singleChoiceGrid?.[row.rowId]?.content || '',
        })
      }
    })
  }
  else if (question.type === 'multipleChoiceGrid') {
    question.rows.forEach((row) => {
      if (!isEmpty(tempAnswers.value[question.questionId]?.multipleChoiceGrid?.[row.rowId])) {
        finalAnswers.value.push({
          questionId: row.rowId,
          answer: tempAnswers.value[question.questionId]?.multipleChoiceGrid?.[row.rowId]?.map(option => option.optionId).join(',') || '',
          answerText: tempAnswers.value[question.questionId]?.multipleChoiceGrid?.[row.rowId]?.map(option => option.content).join(',') || '',
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

  // 保存最后一题答案
  if (currentQuestion.value && isPartFilled(currentQuestion.value, tempAnswers.value)) {
    console.log('不为空 添加到最终答案里')
    addAnswerToFinal(currentQuestion.value)
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

  if (question && question.type === 'multipleChoice' && question.maxSelection) {
    if (selectedOptions.length > question.maxSelection) {
      // 自动去掉最开始选择的那个
      selectedOptions.shift()
    }
  }
  tempAnswers.value[currentQuestionId.value].selectedOptions = selectedOptions
  showErrorContent.value = false
}
// 字符串文本框输入
function handleTextChange(e: any) {
  tempAnswers.value[currentQuestionId.value].text = e.detail.value
  showErrorContent.value = false
  console.log('handleTextChange', e, tempAnswers.value[currentQuestionId.value])
}

// 数字文本框输入
const isNumberInputFocus = ref(false)

function handleInputFocus() {
  isNumberInputFocus.value = true
}

function handleInputBlur() {
  isNumberInputFocus.value = false
}
function handleNumberInput(e: any) {
  console.log('handleNumberInput', e)
  const numberValue = e.detail.value.replace(/\D/g, '') // 移除非数字字符
  const tempData = {
    ...tempAnswers.value,
  }
  tempAnswers.value[currentQuestionId.value].number = numberValue
  showErrorContent.value = false
  // 重新赋值整个对象以确保视图更新
  tempAnswers.value = tempData
}

// 矩阵文本框输入
function handleMatrixInput(rowId: string, e: any) {
  tempAnswers.value[currentQuestionId.value][rowId] = e.detail.value
  showErrorContent.value = false
}

// 矩阵数字框输入
const isMatrixInputFocus = ref({})

function handleMatrixInputFocus(rowId: string) {
  isMatrixInputFocus.value[rowId] = true
}

function handleMatrixInputBlur(rowId: string) {
  isMatrixInputFocus.value[rowId] = false
}

// 矩阵数字框输入
function handleNumberMatrixInput(rowId: string, e: any) {
  console.log('rowId', rowId, e.detail.value)
  const numberValue = e.detail.value.replace(/\D/g, '') // 移除非数字字符
  console.log('numberValue', numberValue)
  const tempData = {
    ...tempAnswers.value,
  }
  tempData[currentQuestionId.value][rowId] = numberValue
  console.log('tempData', tempData)
  showErrorContent.value = false
  // 重新赋值整个对象以确保视图更新
  tempAnswers.value = tempData
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
  <view class="h-full w-full flex items-center justify-center">
    <view class="mx-auto h-[100vh] max-w-1200PX flex-col bg-[rgb(217,242,253)] p-5 text-[18PX]">
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
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <view class="mt-5 w-full flex flex-col gap-2">
                <label
                  v-for="option in currentQuestion.options"
                  :key="option.optionId"
                  class="flex cursor-pointer items-center rounded p-3"
                  @tap="handleSelectOption(option)"
                >
                  <view class="flex items-center">
                    <view
                      class="mr-2 h-20PX w-20PX f-c border-2PX border-[rgb(95,99,104)] rounded-full border-solid"
                      :class="handleSelectBind(option) ? 'border-2PX border-solid border-oceanBlue' : ''"
                    >
                      <view
                        v-if="handleSelectBind(option)"
                        class="h-12PX w-12PX rounded-full bg-oceanBlue"
                      />
                    </view>
                    <view class="ml-2">{{ option.content }}</view>
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
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <text
                v-if="currentQuestion.maxSelection && currentQuestion.maxSelection < currentQuestion.options.length"
                class="text-18PX"
              >
                (最多选择{{ currentQuestion.maxSelection }}项)
              </text>
              <view class="mt-5 w-full flex flex-col gap-2">
                <label
                  v-for="option in currentQuestion.options"
                  :key="option.optionId"
                  class="flex cursor-pointer items-center rounded p-3"
                  @tap="selectMutipleOption(option)"
                >
                  <view class="flex items-center">
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
                    <view class="ml-2">{{ option.content }}</view>
                  </view>
                </label>
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
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <!-- <view relative>
              <input
                type="text"
                :value="tempAnswers[currentQuestionId].text"
                :maxlength="currentQuestion.maxLength"
                class="relative mt-5 border-b-3PX border-[#f0f0f0] rounded border-b-solid p-2"
                @focus="handleInputFocus"
                @blur="handleInputBlur"
                @input="handleTextChange"
              >
              <view
                :class="isInputFocus ? 'scale-x-100' : 'scale-x-0'"
                class="absolute bottom-0 left-0 h-3PX w-full origin-center bg-oceanBlue transition-transform duration-300"
              />
            </view> -->
              <AnimatedInput
                class="mt-5"
                type="text"
                :value="tempAnswers[currentQuestionId].text"
                :maxlength="currentQuestion.maxLength"
                @input="handleTextChange"
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
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <AnimatedTextarea
                class="mt-5 w-full"
                :value="tempAnswers[currentQuestionId].text"
                :maxlength="currentQuestion.maxLength"
                @input="handleTextChange"
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
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <view relative>
                <input
                  type="text"
                  :value="tempAnswers[currentQuestionId].number"
                  :min="currentQuestion.min"
                  :max="currentQuestion.max"
                  class="mt-5 border-b-2PX border-[#f0f0f0] rounded border-b-solid bg-white p-3"
                  @focus="handleInputFocus"
                  @blur="handleInputBlur"
                  @input="handleNumberInput"
                >
                <view
                  :class="isNumberInputFocus ? 'scale-x-100' : 'scale-x-0'"
                  class="absolute bottom-0 left-0 h-3PX w-full origin-center bg-oceanBlue transition-transform duration-300"
                />
              </view>
            </view>
            <view v-if="currentQuestion.type === 'stringTextGrid'">
              <text
                v-if="currentQuestion.required"
                class="text-red"
              >
                *
              </text>
              <text class="text-18PX">
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <view
                v-for="row in currentQuestion.rows"
                :key="row.rowId"
                class="mt-5 flex items-center justify-between"
              >
                <view class="mr-2 w-1/2">
                  {{ row.content }}
                </view>
                <!-- <input
                type="text"
                :value="tempAnswers[currentQuestionId]?.[row.rowId]"
                class="w-1/2 border border-[#f0f0f0] rounded border-solid bg-white p-3"
                @blur="(e) => handleMatrixInput(row.rowId, e)"
              > -->
                <AnimatedInput
                  type="text"
                  :value="tempAnswers[currentQuestionId]?.[row.rowId]"
                  @input="(e) => handleMatrixInput(row.rowId, e)"
                />
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
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <view
                v-for="row in currentQuestion.rows"
                :key="row.rowId"
                class="mt-5 flex items-center justify-between"
              >
                <view class="mr-2 w-1/2">
                  {{ row.content }}
                </view>
                <view class="relative w-1/2">
                  <input
                    type="text"
                    :value="tempAnswers[currentQuestionId]?.[row.rowId]"
                    class="w-full border-b-2PX border-[#f0f0f0] rounded border-b-solid bg-white p-b-2PX"
                    @focus="() => handleMatrixInputFocus(row.rowId)"
                    @blur="() => handleMatrixInputBlur(row.rowId)"
                    @input="(e) => handleNumberMatrixInput(row.rowId, e)"
                  >
                  <view
                    :class="isMatrixInputFocus[row.rowId] ? 'scale-x-100' : 'scale-x-0'"
                    class="absolute bottom-0 left-0 h-3PX w-full origin-center bg-oceanBlue transition-transform duration-300"
                  />
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
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <view class="mt-5">
                <!-- 选项标题行 -->
                <view :style="`display: grid; grid-template-columns: repeat(${currentQuestion.options.length + 1}, 1fr); gap: 10px;`">
                  <view class="text-center" />
                  <view
                    v-for="option in currentQuestion.options"
                    :key="option.optionId"
                    class="text-center"
                  >
                    {{ option.content }}
                  </view>
                </view>

                <!-- 行内容和选项 -->
                <view
                  v-for="row in currentQuestion.rows"
                  :key="row.rowId"
                  class="mt-5"
                  :style="`display: grid; grid-template-columns: repeat(${currentQuestion.options.length + 1}, 1fr); gap: 10px;`"
                >
                  <view class="text-center">
                    {{ row.content }}
                  </view>
                  <!-- <label
                  v-for="option in currentQuestion.options"
                  :key="option.optionId"
                  class="flex justify-center"
                  @tap="handleSingleChoiceGridTap(row.rowId, option)"
                >
                  <radio
                    :value="option.optionId"
                    :checked="handleSingleChoiceGridBind(row.rowId, option)"
                  />
                </label> -->
                  <label
                    v-for="option in currentQuestion.options"
                    :key="option.optionId"
                    class="flex cursor-pointer items-center rounded"
                    @tap="handleSingleChoiceGridTap(row.rowId, option)"
                  >
                    <view class="flex items-center">
                      <view
                        class="h-20PX w-20PX f-c border-2PX border-[rgb(95,99,104)] rounded-full border-solid"
                        :class="handleSingleChoiceGridBind(row.rowId, option) ? 'border-2PX border-solid border-oceanBlue' : ''"
                      >
                        <view
                          v-if="handleSingleChoiceGridBind(row.rowId, option)"
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
                {{ shownQuestionNumber }}.{{ currentQuestion.content }}
              </text>
              <view class="mt-5">
                <!-- 选项标题行 -->
                <view :style="`display: grid; grid-template-columns: repeat(${currentQuestion.options.length + 1}, 1fr); gap: 10px;`">
                  <view class="text-center" />
                  <view
                    v-for="option in currentQuestion.options"
                    :key="option.optionId"
                    class="text-center"
                  >
                    {{ option.content }}
                  </view>
                </view>

                <!-- 行内容和选项 -->
                <view
                  v-for="row in currentQuestion.rows"
                  :key="row.rowId"
                  class="mt-5"
                  :style="`display: grid; grid-template-columns: repeat(${currentQuestion.options.length + 1}, 1fr); gap: 10px;`"
                >
                  <view class="text-center">
                    {{ row.content }}
                  </view>
                  <!-- <label
                  v-for="option in currentQuestion.options"
                  :key="option.optionId"
                  class="flex justify-center"
                  @tap="handleMultipleChoiceGridTap(row.rowId, option)"
                >
                  <checkbox
                    :value="option.optionId"
                    :checked="handleMultipleChoiceGridBind(row.rowId, option)"
                  />
                </label> -->
                  <label
                    v-for="option in currentQuestion.options"
                    :key="option.optionId"
                    class="f-c cursor-pointer rounded"
                    @tap="handleMultipleChoiceGridTap(row.rowId, option)"
                  >
                    <view class="f-c">
                      <view
                        class="h-20PX w-20PX flex items-center justify-center border-2PX border-[rgb(95,99,104)] border-solid"
                        :class="handleMultipleChoiceGridBind(row.rowId, option) ? 'border-blue-500 bg-blue-500' : 'bg-white'"
                      >
                        <view
                          v-if="handleMultipleChoiceGridBind(row.rowId, option)"
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
              此问题必须填写
            </view>
          </view>
        </view>
      </view>
      <view class="mt-5 f-c flex-col">
        <view
          v-if="!isLastQuestion"
          class="custom-button mt-5"
          @tap="handleNextQuestion"
        >
          下一题
        </view>
        <text v-if="isLastQuestion">
          题目已答完，感谢您的配合！
        </text>
        <button
          v-if="isLastQuestion"
          class="custom-button mt-5"
          @tap="closeSurvey"
        >
          提交
        </button>
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
</style>
