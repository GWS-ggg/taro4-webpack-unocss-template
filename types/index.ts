// 基础问题接口，包含所有问题共有的属性
interface BaseQuestion {
  questionId: string
  content: string
  required?: boolean
  jumpTo?: string
  dependsOn?: {
    questionId: string
    optionId: string
  }
}

// 单选题接口
interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single'
  options: Option[]
}

// 多选题接口
interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple'
  options: Option[]
  maxSelection?: number
}

// 单行文本题接口
interface SingleLineTextQuestion extends BaseQuestion {
  type: 'singleLineText'
  maxLength?: number
}

// 多行文本题接口
interface MultipleLineTextQuestion extends BaseQuestion {
  type: 'multipleLineText'
  maxLength?: number
}

// 矩阵文本题接口
interface MatrixTextQuestion extends BaseQuestion {
  type: 'matrixText'
  rows: Row[]
}

// 联合类型，表示所有可能的问题类型
type Question = SingleChoiceQuestion | MultipleChoiceQuestion | SingleLineTextQuestion | MultipleLineTextQuestion | MatrixTextQuestion

// 定义问题选项的结构
interface Option {
  optionId: string
  content: string
  jumpTo?: string
  insertAfter?: string
}

// 定义矩阵问题中行的结构
interface Row {
  rowId: string
  content: string
  required?: boolean
}

// 定义整个问卷数据的结构
interface SurveyData {
  surveyId: string
  title: string
  description: string
  totalQuestions: number
  pagination: boolean
  questions: Question[]
  insertQuestions?: Question[]
  answers: Record<string, AnswerType>
}

// 定义答案的结构
interface AnswerType {
  type: 'single' | 'multiple' | 'singleLineText' | 'multipleLineText' | 'matrixText'
  selectedOption?: string // 用于单选
  selectedOptions?: string[] // 用于多选
  text?: string // 文本题
  answers?: Record<string, string> // 矩阵题
}

interface Answers {
  [key: string]: AnswerType
}
