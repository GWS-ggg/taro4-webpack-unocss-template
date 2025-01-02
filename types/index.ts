// 基础问题接口，包含所有问题共有的属性
interface BaseQuestion {
  id: number
  title: string
  index: number
  required: number // 0 不必须 1 必须
  operator: number // 0 或 1  => and 或 or
  conditions: {
    questionId: number
    conditionValue: number
    conditionType: number // 0 等于 1 大于 2 小于 3 大于等于 4 小于等于 5 不等于
  }[]
}

// 单选题接口
interface SingleChoiceQuestion extends BaseQuestion {
  type: 'singleChoice'
  options: Option[]
}

// 多选题接口
interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multipleChoice'
  options: Option[]
  maxSelection?: number
  min: number
  max: number
  includeBounds: number
}

// 单行字符串文本题接口
interface SingleStringTextQuestion extends BaseQuestion {
  type: 'singleStringText'
  includeBounds: number
  min: number
  max: number
}

// 多行字符串文本题接口
interface MultipleStringTextQuestion extends BaseQuestion {
  type: 'multipleStringText'
  includeBounds: number
  min: number
  max: number
}

// 数字文本接口
interface NumberTextQuestion extends BaseQuestion {
  type: 'numberText'
  min: number
  max: number
  includeBounds: number
}

// 字符串文本网格
interface StringTextGridQuestion extends BaseQuestion {
  type: 'stringTextGrid'
  questions: SingleStringTextQuestion[]
  min: number
  max: number
  includeBounds: number
}

// 数字文本网格
interface NumberTextGridQuestion extends BaseQuestion {
  type: 'numberTextGrid'
  questions: NumberTextQuestion[]
  min: number
  max: number
  includeBounds: number
}
// 单选网格
interface SingleChoiceGridQuestion extends BaseQuestion {
  type: 'singleChoiceGrid'
  options: Option[]
  questions: Row[]
}

// 多选网格
interface MultipleChoiceGridQuestion extends BaseQuestion {
  type: 'multipleChoiceGrid'
  options: Option[]
  questions: Row[]
  maxSelection?: number
}

// 联合类型，表示所有可能的问题类型
type Question = SingleChoiceQuestion | MultipleChoiceQuestion | SingleStringTextQuestion | MultipleStringTextQuestion | NumberTextQuestion | StringTextGridQuestion | NumberTextGridQuestion | SingleChoiceGridQuestion | MultipleChoiceGridQuestion

// 定义问题选项的结构
interface Option {
  id: number
  title: string
}

// 定义矩阵问题中行的结构
interface Row {
  id: string
  title: string
}

// 定义整个问卷数据的结构
interface SurveyData {
  survey_id: number
  title: string
  desc: string
  questions: Question[]
}

type AnswerValue = number | string | string[] | SubAnswers

interface SubAnswers {
  [key: string]: AnswerValue
}

interface Answers {
  [key: string]: AnswerValue
}

// 定义答案的结构
interface AnswerType {
  type: 'singleChoice' | 'multipleChoice' | 'singleStringText' | 'multipleStringText' | 'numberText' | 'stringTextGrid' | 'numberTextGrid' | 'singleChoiceGrid' | 'multipleChoiceGrid'
  selectedOption?: Option // 用于单选
  selectedOptions?: Option[] // 用于多选
  text?: string // 文本题
  number?: number // 数字题
  TextGrid?: Record<string, string> // 矩阵题
  singleChoiceGrid?: {
    [rowId: string]: Option
  }
  multipleChoiceGrid?: {
    [rowId: string]: Option[]
  }
}

interface TempAnswers {
  [key: string]: AnswerType
}

interface CacheData {
  currentQuestionIndex: number
  shownQuestionNumber: number
  tempAnswers: TempAnswers
  finalAnswers: Answers[]
  completed?: boolean
}
