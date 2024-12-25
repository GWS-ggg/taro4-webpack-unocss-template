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
