<script setup lang="ts">
import Taro from '@tarojs/taro'
import { computed, onMounted, ref } from 'vue'
import surveyDataJson from './index.json'

const surveyData = surveyDataJson as SurveyData

// 显示题数  总题数 默认问题的当前索引  展示用的当前提数索引
const totalQuestionCount = ref(1)
const shownQuestionNumber = ref(1) // 用于显示的题号

// 初始化答案
const answers = ref<Answers>({})
const allQuestions = ref<Question[]>([])
// 当前展示的题目
const currentQuestionId = ref('')
const currentQuestion = computed(() => {
  const question = allQuestions.value.find(question => question.questionId === currentQuestionId.value)
  // TODO 应该没有这种情况 一定能找的到 找不到就报错
  // jumpTo 为Q0 直接结束 弹框
  if (!question) {
    console.log('question not found', currentQuestionId.value)
    // 返回个默认值 返回最后一题？
    return surveyData.questions[surveyData.questions.length - 1]
  }
  return question
})

onMounted(() => {
  // 获取json数据 surveyData 设置为SurveyData类型

  console.log('surveyData', surveyData)
  // 设置标题
  Taro.setNavigationBarTitle({
    title: surveyData.title,
  })

  // 初始化各种东西
  currentQuestionId.value = surveyData.questions[0].questionId
  totalQuestionCount.value = surveyData.totalQuestions

  // 所有问题
  allQuestions.value = [...(surveyData.questions || []), ...(surveyData.insertQuestions || [])]
  // 初始答案
  answers.value = surveyData.answers as Answers
  console.log('answers', answers.value)
})

function handleMatrixInput(rowId: string, e: any) {
  const currentQuestionId = currentQuestion.value.questionId
  if (!answers.value[currentQuestionId]) {
    answers.value[currentQuestionId] = { type: 'matrixText', answers: {} }
  }
  answers.value[currentQuestionId][rowId] = e.detail.value
}

const isLastQuestion = computed(() => {
  return shownQuestionNumber.value === totalQuestionCount.value || currentQuestion.value.jumpTo === 'Q0'
})

// 处理 单个问题的 dependsOn 属性 如果前面题目的答案不符合条件，则不显示当前题目 将该题目从allQuestions中移除
// TODO 选了某个选项直接结束的问题
function shouldJumpQuestion(question: Question) {
  console.log('shouldJumpQuestion', question)
  if (!question.dependsOn) {
    return false
  }
  const { questionId, optionId } = question.dependsOn
  const answer = answers.value[questionId]
  // TODO 应该没这种情况 错误处理
  if (!answer) {
    return false
  }
  if (answer.type === 'single' && answer.selectedOption === optionId) {
    return true
  }
  if (answer.type === 'multiple' && answer.selectedOptions?.includes(optionId)) {
    return true
  }
  return false
}

// 下一题按钮
function handleNextQuestion() {
  const question = currentQuestion.value
  // 备份当前问题
  const clonedQuestionId = question.questionId
  // 是否新插入了题目
  let insertFlag = false

  if (question && question.required && !answers.value[question.questionId]) {
    // 弹框 TODO
    console.log('请先答完本题')
    return
  }

  // 单选
  if (question && question.type === 'single') {
    const selectedOption = question.options.find(option => option.optionId === answers.value[question.questionId].selectedOption)
    console.log('selectedOption', selectedOption)
    // TODO 处理找不到问题的情况 没有这种情况才对  错误处理
    if (selectedOption) {
      if (selectedOption.jumpTo) {
        const nextQuestion = allQuestions.value.find(question => question.questionId === selectedOption.jumpTo)
        if (nextQuestion) {
          let tempQuestionId = currentQuestion.value.jumpTo
          // TODO 会有问题么 思考 模拟跳转到nextQuestion 题 用于题数变化
          while (tempQuestionId !== nextQuestion.questionId) {
            console.log('count-- tempQuestionId', tempQuestionId)
            totalQuestionCount.value--
            tempQuestionId = allQuestions.value.find(question => question.questionId === tempQuestionId)?.jumpTo || ''
            if (tempQuestionId === '' || tempQuestionId === 'Q0') {
              console.log('跳转循环 count问题')
              break
            }
          }
          // 修改当前题号
          currentQuestionId.value = nextQuestion.questionId
        }

        // 找不到下一题 直接终止问卷 ？ TODO 应该没有这种情况才是正常的
      }
      else if (selectedOption.insertAfter) {
        const insertQuestion = allQuestions.value.find(question => question.questionId === selectedOption.insertAfter)
        if (insertQuestion) {
          console.log('insertQuestion', insertQuestion)
          currentQuestionId.value = insertQuestion.questionId
          // 修改插入问题的跳转 jumpTo为原问题的跳转
          currentQuestion.value.jumpTo = question.jumpTo
          insertFlag = true
        }
      }
      else {
        // TODO 错误处理 按理说 jumpTo 一定有值
        currentQuestionId.value = question.jumpTo || ''
      }
    }
  }
  else if (question && question.type === 'multiple') {
    // 多选
    const selectedOptions = answers.value[question.questionId]?.selectedOptions || []
    const selectedOptionsDetails = question.options.filter(option => selectedOptions.includes(option.optionId))
    console.log('Selected Options Details:', selectedOptionsDetails)
    // 查看选项是否有 jumpTo或者insertAfter 只找第一个命中的选项 多余的不管
    // TODO  多个选项有jumpTo或者insertAfter 应该怎么处理
    const jumpTo = selectedOptionsDetails.find(option => option.jumpTo)
    const insertAfter = selectedOptionsDetails.find(option => option.insertAfter)
    if (jumpTo) {
      const nextQuestion = allQuestions.value.find(question => question.questionId === jumpTo.jumpTo)
      if (nextQuestion) {
        let tempQuestionId = currentQuestion.value.jumpTo
        // TODO 会有问题么 思考 模拟跳转到nextQuestion 题 用于题数变化
        while (tempQuestionId !== nextQuestion.questionId) {
          console.log('count-- tempQuestionId', tempQuestionId)
          totalQuestionCount.value--
          tempQuestionId = allQuestions.value.find(question => question.questionId === tempQuestionId)?.jumpTo || ''
          if (tempQuestionId === '' || tempQuestionId === 'Q0') {
            console.log('跳转循环 count问题')
            break
          }
        }
        // 修改当前题号
        currentQuestionId.value = nextQuestion.questionId
      }
    }
    else if (insertAfter) {
      const insertQuestion = allQuestions.value.find(question => question.questionId === insertAfter.insertAfter)
      if (insertQuestion) {
        currentQuestionId.value = insertQuestion.questionId
        // 修改插入问题的跳转 jumpTo为原问题的跳转
        currentQuestion.value.jumpTo = question.jumpTo
        insertFlag = true
      }
    }
    else {
      // TODO 错误处理 按理说 jumpTo 一定有值
      currentQuestionId.value = question.jumpTo || ''
    }
  }
  else if (question && question.type === 'singleLineText') {
    // 单行文本
    const nextQuestion = allQuestions.value.find(tempQuestion => tempQuestion.questionId === question.jumpTo)
    console.log('nextQuestion', nextQuestion)
    if (nextQuestion) {
      currentQuestionId.value = nextQuestion.questionId
    }
  }
  else if (question && question.type === 'multipleLineText') {
    // 多行文本
    const nextQuestion = allQuestions.value.find(tempQuestion => tempQuestion.questionId === question.jumpTo)
    if (nextQuestion) {
      currentQuestionId.value = nextQuestion.questionId
    }
  }
  else if (question && question.type === 'matrixText') {
    // 矩阵文本
    const nextQuestion = allQuestions.value.find(tempQuestion => tempQuestion.questionId === question.jumpTo)
    if (nextQuestion) {
      currentQuestionId.value = nextQuestion.questionId
    }
  }

  // TODO 处理跳转错误 ''改成Q0 ?  直接结束？
  if (clonedQuestionId === currentQuestionId.value || currentQuestionId.value === '') {
    console.log('跳转错误', clonedQuestionId, currentQuestionId.value)
  }
  console.log('clonedQuestionId', clonedQuestionId)
  console.log('currentQuestionId', currentQuestionId.value)
  console.log('currentAnswer', answers.value)

  // 应该一次扫描全部问题 有多个连续跳转的问题存在
  // 处理 题目关联问题 跳转时判断是否显示该题 不显示则直接跳过
  // 循环处理连续需要跳过的问题
  while (shouldJumpQuestion(currentQuestion.value)) {
    console.log('shouldIncludeQuestion', currentQuestion.value)
    totalQuestionCount.value--
    currentQuestionId.value = currentQuestion.value.jumpTo || ''
    // TODO 错误处理问题
    // 如果为Q0 => 后面的题都隐藏了 直接结束  弹窗？
    if (currentQuestionId.value === '' || currentQuestionId.value === 'Q0') {
      console.log('currentQuestionId.value', currentQuestionId.value)
      console.log('currentQuestion.value', currentQuestion.value)
      console.log('跳转错误 dependsOn 问题')
      break
    }
  }
  if (insertFlag) {
    totalQuestionCount.value++
  }
  shownQuestionNumber.value++
}

function closeSurvey() {
  // 保存进度并关闭问卷
  console.log('Survey closed, progress saved:', answers.value)
}

// 多选 选中状态绑定
function handleMutipleBind(optionId: string) {
  return answers.value[currentQuestion.value.questionId]?.selectedOptions?.includes(optionId) || false
}
// 多选 h5使用 选中点击 处理最多选择问题
function selectMutipleOption(optionId: string) {
  const question = currentQuestion.value
  const selectedOptions = answers.value[currentQuestion.value.questionId]?.selectedOptions || []
  if (!selectedOptions.includes(optionId)) {
    selectedOptions.push(optionId)
  }
  else {
    selectedOptions.splice(selectedOptions.indexOf(optionId), 1)
  }
  if (question && question.type === 'multiple' && question.maxSelection) {
    if (selectedOptions.length > question.maxSelection) {
      // 自动去掉最开始选择的那个
      selectedOptions.shift()
    }
    answers.value[currentQuestion.value.questionId].selectedOptions = selectedOptions
  }

  console.log('selectedOptions h5', answers.value[currentQuestion.value.questionId].selectedOptions)
}
// 文本框输入
function handleTextChange(e) {
  answers.value[currentQuestion.value.questionId].text = e.detail.value
}
// 单选 选项选中状态绑定 选项初始化 可以定义默认哪个选项选中
function handleSelectBind(optionId: string) {
  if (answers.value[currentQuestion.value.questionId]) {
    return answers.value[currentQuestion.value.questionId].selectedOption === optionId
  }
  return false
}
// 单选 解决单选框选中问题 在单选框内任何位置都可触发
function selectOption(optionId: string) {
  answers.value[currentQuestion.value.questionId].selectedOption = optionId
  console.log('selectOption', optionId)
}
</script>

<template>
  <view class="flex-col p-5 text-[18PX]">
    <view class="mb-5 f-c">
      <text>当前进度: {{ shownQuestionNumber }} / {{ totalQuestionCount }}</text>
    </view>
    <view
      v-if="currentQuestion"
      class="mb-5"
    >
      <view v-if="currentQuestion.type === 'single'">
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
            @tap="selectOption(option.optionId)"
          >
            <radio
              :value="option.optionId"
              :checked="handleSelectBind(option.optionId)"
              class="scale-110 transform"
            />
            <text class="ml-2">{{ option.content }}</text>
          </label>
        </radio-group>
      </view>
      <view v-if="currentQuestion.type === 'multiple'">
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
            @tap="selectMutipleOption(option.optionId)"
          >
            <checkbox
              :value="option.optionId"
              :checked="handleMutipleBind(option.optionId)"
              class="scale-110 transform"
            >
              <text class="ml-2">{{ option.content }}</text>
            </checkbox>
          </label>
        </checkbox-group>
      </view>
      <view v-if="currentQuestion.type === 'singleLineText'">
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
          :value="answers[currentQuestion.questionId]?.text"
          :maxlength="currentQuestion.maxLength"
          class="mt-5 border border-[#f0f0f0] rounded border-solid bg-white p-3"
          @blur="handleTextChange"
        >
      </view>
      <view v-if="currentQuestion.type === 'multipleLineText'">
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
          :value="answers[currentQuestion.questionId]?.text"
          :maxlength="currentQuestion.maxLength"
          class="mt-5 w-full border border-[#f0f0f0] rounded border-solid bg-white p-1"
          @input="handleTextChange"
        />
      </view>
      <view v-if="currentQuestion.type === 'matrixText'">
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
            :value="answers[currentQuestion.questionId]?.[row.rowId]"
            class="w-1/2 border border-[#f0f0f0] rounded border-solid bg-white p-3"
            @blur="(e) => handleMatrixInput(row.rowId, e)"
          >
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
