import type { LocaleMessages } from 'vue-i18n'

const locale: LocaleMessages<any> = {
  next: '下一题',
  chooseLimit_head: '（最多选择 ',
  chooseLimit_tail: ' 个选项）',
  submit: '提交',
  required: '此问题必须填写',
  confirm: '确认',
  startQuiz: '开始答题',
  endQuiz: '结束答题',
  onlyNumber: '（只能输入数字）',
  maxChoice_head: '最多只能选择 ',
  maxChoice_tail: ' 个选项',
  belowMin_str_inclusive: '输入内容长度不能小于或等于{errorMin}，当前长度为{errorCurrent}',
  belowMin_str_exclusive: '输入内容长度不能小于{errorMin}，当前长度为{errorCurrent}',
  aboveMax_str_inclusive: '输入内容长度不能大于或等于{errorMax}，当前长度为{errorCurrent}',
  aboveMax_str_exclusive: '输入内容长度不能超过{errorMax}，当前长度为{errorCurrent}',
  belowMin_num_inclusive: '数值不能小于或等于{errorMin}，当前值为{errorCurrent}',
  belowMin_num_exclusive: '数值不能小于{errorMin}，当前值为{errorCurrent}',
  aboveMax_num_inclusive: '数值不能大于或等于{errorMax}，当前值为{errorCurrent}',
  aboveMax_num_exclusive: '数值不能超过{errorMax}，当前值为{errorCurrent}',
  mustBeNumber: '请输入数字',
  thankYou: '已完成所有问题，感谢您的支持，请在游戏邮箱查收活动奖励！',
  surveyNotFound: '问卷不存在',
}

export default locale
