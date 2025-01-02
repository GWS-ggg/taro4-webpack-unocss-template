import type { LocaleMessages } from 'vue-i18n'

const locale: LocaleMessages<any> = {
  next: 'Next Question',
  chooseLimit_head: '(Choose up to ',
  chooseLimit_tail: ' options)',
  submit: 'Submit',
  required: 'This is a required question',
  confirm: 'Confirm',
  startQuiz: 'Start Quiz',
  endQuiz: 'End Quiz',
  onlyNumber: '(Must be a number)',
  maxChoice_head: 'You can only choose up to ',
  maxChoice_tail: ' options',
  belowMin_str_inclusive: 'Input content length cannot be less than or equal to {errorMin}, current length is {errorCurrent}',
  belowMin_str_exclusive: 'Input content length cannot be less than {errorMin}, current length is {errorCurrent}',
  aboveMax_str_inclusive: 'Input content length cannot be greater than or equal to {errorMax}, current length is {errorCurrent}',
  aboveMax_str_exclusive: 'Input content length cannot be greater than {errorMax}, current length is {errorCurrent}',
  belowMin_num_inclusive: 'Number cannot be less than or equal to {errorMin}, current value is {errorCurrent}',
  belowMin_num_exclusive: 'Number cannot be less than {errorMin}, current value is {errorCurrent}',
  aboveMax_num_inclusive: 'Number cannot be greater than or equal to {errorMax}, current value is {errorCurrent}',
  aboveMax_num_exclusive: 'Number cannot be greater than {errorMax}, current value is {errorCurrent}',
  mustBeNumber: 'Please enter a number',
  thankYou: 'All questions have been completed. Thank you for your support. Please check your game mailbox for event rewards!',
  surveyNotFound: 'Survey not found',
}

export default locale
