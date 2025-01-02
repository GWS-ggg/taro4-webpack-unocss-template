import exp from 'node:constants'
import Taro from '@tarojs/taro'

export function isEmpty(value: any): boolean {
  // 判断是否为 null 或 undefined
  if (value === null || value === undefined) {
    return true
  }

  // 判断是否为空字符串
  if (typeof value === 'string' && value.trim() === '') {
    return true
  }

  // 判断是否为空数组
  if (Array.isArray(value) && value.length === 0) {
    return true
  }

  // 判断是否为空对象（不包括函数和数组）
  if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
    return true
  }

  // 其他情况不为空
  return false
}

export function checkBounds(length: number, min: number, max: number, boundsType: number, type: string): { result: boolean, reason: string } {
  let result = false
  let reason = ''

  const isNumber = type === 'number'
  const belowMin = isNumber ? 'belowMin_num' : 'belowMin_str'
  const aboveMax = isNumber ? 'aboveMax_num' : 'aboveMax_str'

  switch (boundsType) {
    case 0: // IncludeBoth "[,]"
      result = length >= min && length <= max
      reason = !result ? (length < min ? `${belowMin}_inclusive` : `${aboveMax}_inclusive`) : ''
      break
    case 1: // IncludeLeftOnly "[,)"
      result = length >= min && length < max
      reason = !result ? (length < min ? `${belowMin}_exclusive` : `${aboveMax}_inclusive`) : ''
      break
    case 2: // IncludeRightOnly "(,]"
      result = length > min && length <= max
      reason = !result ? (length <= min ? `${belowMin}_inclusive` : `${aboveMax}_exclusive`) : ''
      break
    case 3: // IncludeNeither "(,)"
      result = length > min && length < max
      reason = !result ? (length <= min ? `${belowMin}_exclusive` : `${aboveMax}_exclusive`) : ''
      break
    default:
      result = true // 如果 boundsType 不合法，直接返回 true
      reason = 'Invalid boundsType'
  }

  return { result, reason }
}

// 封装 POST 请求函数
export function postQuestionDetail({ id, roleId, fnUid, zoneId }: { id: number, roleId?: string, fnUid?: string, zoneId?: number }) {
  if (typeof id !== 'number') {
    throw new TypeError('参数 "id" 是必传的，并且必须是数字类型')
  }

  // 构建请求数据，只包含传递的参数
  const requestData: Record<string, any> = { id }
  if (roleId !== undefined)
    requestData.roleId = roleId
  if (fnUid !== undefined)
    requestData.fnUid = fnUid
  if (zoneId !== undefined && !Number.isNaN(zoneId))
    requestData.zoneId = zoneId

  return Taro.request({
    url: 'https://mprogram-test.forevernine.com/box/qn/detail', // 请求的 URL
    method: 'POST', // 请求方法
    header: {
      'Content-Type': 'application/x-www-form-urlencoded', // 设置请求头
    },
    data: requestData, // 动态构建的请求数据
  }).then((response) => {
    const { data } = response
    // 处理返回的数据
    if (data.code === 0) {
      // 成功处理
      return data.data // 返回处理后的数据
    }
    else {
      // 处理错误
      throw new Error(data.msg || 'Unknown error')
    }
  })
}

export function submitAnswer({ id, answer, roleId, fnUid, zoneId }: { id: number, answer: string, roleId?: string, fnUid?: string, zoneId?: number }) {
  if (typeof id !== 'number' || typeof answer !== 'string') {
    throw new TypeError('参数 "id" 和 "answer" 是必传的，并且必须是数字和字符串类型')
  }

  // 构建请求数据，只包含传递的参数
  const requestData: Record<string, any> = { id, answers: answer }
  if (roleId !== undefined)
    requestData.roleId = roleId
  if (fnUid !== undefined)
    requestData.fnUid = fnUid
  if (zoneId !== undefined && !Number.isNaN(zoneId))
    requestData.zoneId = zoneId

  return Taro.request({
    url: 'https://mprogram-test.forevernine.com/box/qn/submit', // 请求的 URL
    method: 'POST', // 请求方法
    header: {
      'Content-Type': 'application/x-www-form-urlencoded', // 设置请求头
    },
    data: requestData, // 动态构建的请求数据
  })
}

export function getQueryParams() {
  // 获取当前页面的路由信息
  const currentInstance = Taro.getCurrentInstance()
  const routerParams = currentInstance.router?.params

  if (routerParams) {
    // 从路由参数中提取需要的字段
    const { lang, id, zoneId, roleId, fnUid } = routerParams
    console.log('lang:', lang)
    console.log('id:', id)
    console.log('zoneId:', zoneId)
    console.log('roleId:', roleId)
    console.log('fnUid:', fnUid)

    return { lang, id, zoneId, roleId, fnUid }
  }
  else {
    console.log('未找到路由参数')
    return {}
  }
}
