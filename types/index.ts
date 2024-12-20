// 基础问题接口，包含所有问题共有的属性
interface BaseQuestion {
  questionId: string
  content: string
  required?: boolean
  dependsOn?: {
    type: 'and' | 'or'
    conditions: {
      questionId: string
      optionId: string
    }[]
  }
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
}

// 单行字符串文本题接口
interface SingleStringTextQuestion extends BaseQuestion {
  type: 'singleStringText'
  maxLength?: number
}

// 多行字符串文本题接口
interface MultipleStringTextQuestion extends BaseQuestion {
  type: 'multipleStringText'
  maxLength?: number
}

// 数字文本接口
interface NumberTextQuestion extends BaseQuestion {
  type: 'numberText'
  min?: number
  max?: number
}

// 字符串文本网格
interface StringTextGridQuestion extends BaseQuestion {
  type: 'stringTextGrid'
  rows: Row[]
  maxLength?: number
}

// 数字文本网格
interface NumberTextGridQuestion extends BaseQuestion {
  type: 'numberTextGrid'
  rows: Row[]
  min?: number
  max?: number
}

// 单选网格
interface SingleChoiceGridQuestion extends BaseQuestion {
  type: 'singleChoiceGrid'
  options: Option[]
  rows: Row[]
}

// 多选网格
interface MultipleChoiceGridQuestion extends BaseQuestion {
  type: 'multipleChoiceGrid'
  options: Option[]
  rows: Row[]
  maxSelection?: number
}

// 联合类型，表示所有可能的问题类型
type Question = SingleChoiceQuestion | MultipleChoiceQuestion | SingleStringTextQuestion | MultipleStringTextQuestion | NumberTextQuestion | StringTextGridQuestion | NumberTextGridQuestion | SingleChoiceGridQuestion | MultipleChoiceGridQuestion

// 定义问题选项的结构
interface Option {
  optionId: string
  content: string
  jumpTo?: string
}

// 定义矩阵问题中行的结构
interface Row {
  rowId: string
  content: string
}

// 定义整个问卷数据的结构
interface SurveyData {
  surveyId: string
  title: string
  description: string
  questions: Question[]
}

type AnswerValue = string | string[] | SubAnswers

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
  TextGrid?: Record<string, string> // 矩阵题
  singleChoiceGrid?: Record<string, Option>
  multipleChoiceGrid?: Record<string, Option[]>
}

interface TempAnswers {
  [key: string]: AnswerType
}
