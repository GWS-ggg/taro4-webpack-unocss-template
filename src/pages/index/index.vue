<script setup lang="ts">
import Taro from '@tarojs/taro'
import { computed, onMounted, ref } from 'vue'
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
const currentQuestionIndex = ref(0)
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
    tempAnswers.value[question.questionId] = { type: question.type, isCompleted: false }
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

// 下一题按钮
function handleNextQuestion() {
  const question = currentQuestion.value
  // 为空 代表错误 报错  应该是一定有题目的
  if (question === '') {
    return
  }
  console.log(question)
  if (question && question.required && !tempAnswers.value[question.questionId].isCompleted) {
    // 弹框 TODO
    console.log('请先答完本题')
    return
  }

  // 根据类型往最终答案中添加
  addAnswerToFinal(question)
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

function addAnswerToFinal(question: Question) {
  // 没填东西 不更新答案
  if (!tempAnswers.value[question.questionId].isCompleted) {
    return
  }

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
      finalAnswers.value.push({
        questionId: row.rowId,
        answer: tempAnswers.value[question.questionId][row.rowId] || '',
      })
    })
  }
  else if (question.type === 'numberTextGrid') {
    question.rows.forEach((row) => {
      finalAnswers.value.push({
        questionId: row.rowId,
        answer: tempAnswers.value[question.questionId][row.rowId] || '',
      })
    })
  }
  else if (question.type === 'singleChoiceGrid') {
    question.rows.forEach((row) => {
      finalAnswers.value.push({
        questionId: row.rowId,
        answer: tempAnswers.value[question.questionId]?.singleChoiceGrid?.[row.rowId]?.optionId || '',
        answerText: tempAnswers.value[question.questionId]?.singleChoiceGrid?.[row.rowId]?.content || '',
      })
    })
  }
  else if (question.type === 'multipleChoiceGrid') {
    question.rows.forEach((row) => {
      finalAnswers.value.push({
        questionId: row.rowId,
        answer: tempAnswers.value[question.questionId]?.multipleChoiceGrid?.[row.rowId]?.map(option => option.optionId).join(',') || '',
        answerText: tempAnswers.value[question.questionId]?.multipleChoiceGrid?.[row.rowId]?.map(option => option.content).join(',') || '',
      })
    })
  }
}

function closeSurvey() {
  // 保存最后一题答案
  if (currentQuestion.value) {
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
  tempAnswers.value[currentQuestionId.value].isCompleted = true
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
  tempAnswers.value[currentQuestionId.value].isCompleted = true
}
// 字符串文本框输入
function handleTextChange(e: any) {
  tempAnswers.value[currentQuestionId.value].text = e.detail.value
  tempAnswers.value[currentQuestionId.value].isCompleted = true
}

// 数字文本框输入
function handleNumberInput(e: any) {
  const numberValue = e.detail.value.replace(/\D/g, '') // 移除非数字字符
  const tempData = {
    ...tempAnswers.value,
  }
  tempData[currentQuestionId.value].number = numberValue
  tempData[currentQuestionId.value].isCompleted = true
  // 重新赋值整个对象以确保视图更新
  tempAnswers.value = tempData
}

// 矩阵文本框输入
function handleMatrixInput(rowId: string, e: any) {
  tempAnswers.value[currentQuestionId.value][rowId] = e.detail.value
  tempAnswers.value[currentQuestionId.value].isCompleted = true
}

// 矩阵数字框输入
function handleNumberMatrixInput(rowId: string, e: any) {
  const numberValue = e.detail.value.replace(/\D/g, '') // 移除非数字字符
  const tempData = {
    ...tempAnswers.value,
  }
  tempData[currentQuestionId.value][rowId] = numberValue
  tempData[currentQuestionId.value].isCompleted = true
  // 重新赋值整个对象以确保视图更新
  tempAnswers.value = tempData
}

// 单选网格题
function handleSingleChoiceGridTap(rowId: string, option: Option) {
  const singleGrid = tempAnswers.value[currentQuestionId.value]?.singleChoiceGrid || {}
  singleGrid[rowId] = option
  tempAnswers.value[currentQuestionId.value].singleChoiceGrid = singleGrid
  tempAnswers.value[currentQuestionId.value].isCompleted = true
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
  tempAnswers.value[currentQuestionId.value].isCompleted = true
}
function handleMultipleChoiceGridBind(rowId: string, option: Option) {
  return tempAnswers.value[currentQuestionId.value]?.multipleChoiceGrid?.[rowId]?.includes(option) || false
}
</script>

<template>
  <view class="flex-col p-5 text-[18PX]">
    <view class="mb-5 f-c">
      <text>当前进度: 第{{ shownQuestionNumber }}题 </text>
    </view>
    <view class="mb-5 f-c">
      <text>进度条进度: 第{{ currentQuestionIndex + 1 }}题 / {{ totalQuestionCount }}题</text>
    </view>
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
        <radio-group class="mt-5 w-full flex flex-col gap-2">
          <label
            v-for="option in currentQuestion.options"
            :key="option.optionId"
            class="flex cursor-pointer items-center border border-[#f0f0f0] rounded border-solid bg-white p-3"
            @tap="handleSelectOption(option)"
          >
            <radio
              :value="option.optionId"
              :checked="handleSelectBind(option)"
              class="scale-110 transform"
            />
            <text class="ml-2">{{ option.content }}</text>
          </label>
        </radio-group>
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
        <checkbox-group class="mt-5 w-full flex flex-col gap-2">
          <label
            v-for="option in currentQuestion.options"
            :key="option.optionId"
            class="flex cursor-pointer items-center border border-[#f0f0f0] rounded border-solid bg-white p-3"
            @tap="selectMutipleOption(option)"
          >
            <checkbox
              :value="option.optionId"
              :checked="handleMutipleBind(option)"
              class="scale-110 transform"
            >
              <text class="ml-2">{{ option.content }}</text>
            </checkbox>
          </label>
        </checkbox-group>
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
        <input
          type="text"
          :value="tempAnswers[currentQuestionId].text"
          :maxlength="currentQuestion.maxLength"
          class="mt-5 border border-[#f0f0f0] rounded border-solid bg-white p-3"
          @blur="handleTextChange"
        >
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
        <textarea
          :value="tempAnswers[currentQuestionId].text"
          :maxlength="currentQuestion.maxLength"
          class="mt-5 w-full border border-[#f0f0f0] rounded border-solid bg-white p-1"
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
        <input
          type="text"
          :value="tempAnswers[currentQuestionId].number"
          :min="currentQuestion.min"
          :max="currentQuestion.max"
          class="mt-5 border border-[#f0f0f0] rounded border-solid bg-white p-3"
          @input="handleNumberInput"
        >
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
          <text class="mr-2 w-1/2">
            {{ row.content }}
          </text>
          <input
            type="text"
            :value="tempAnswers[currentQuestionId]?.[row.rowId]"
            class="w-1/2 border border-[#f0f0f0] rounded border-solid bg-white p-3"
            @blur="(e) => handleMatrixInput(row.rowId, e)"
          >
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
          <text class="mr-2 w-1/2">
            {{ row.content }}
          </text>
          <input
            type="text"
            :value="tempAnswers[currentQuestionId]?.[row.rowId]"
            class="w-1/2 border border-[#f0f0f0] rounded border-solid bg-white p-3"
            @input="(e) => handleNumberMatrixInput(row.rowId, e)"
          >
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
            <label
              v-for="option in currentQuestion.options"
              :key="option.optionId"
              class="flex justify-center"
              @tap="handleSingleChoiceGridTap(row.rowId, option)"
            >
              <radio
                :value="option.optionId"
                :checked="handleSingleChoiceGridBind(row.rowId, option)"
              />
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
            <label
              v-for="option in currentQuestion.options"
              :key="option.optionId"
              class="flex justify-center"
              @tap="handleMultipleChoiceGridTap(row.rowId, option)"
            >
              <checkbox
                :value="option.optionId"
                :checked="handleMultipleChoiceGridBind(row.rowId, option)"
              />
            </label>
          </view>
        </view>
      </view>
    </view>
    <view class="f-c flex-col">
      <button
        v-if="!isLastQuestion"
        class="custom-button mt-5"
        @tap="handleNextQuestion"
      >
        下一题
      </button>
      <text v-if="isLastQuestion">
        题目已答完，感谢您的配合！
      </text>
      <button
        v-if="isLastQuestion"
        class="custom-button mt-5"
        @tap="closeSurvey"
      >
        关闭
      </button>
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
  background-color: #0095FF;
  color: #fff
}

/* 选中状态下的样式 */
// label:has(radio:checked) {
//   @apply border-blue-500 bg-blue-50;
// }
</style>
