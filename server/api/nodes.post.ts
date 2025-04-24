export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // 示例数据生成逻辑
  const newNode = {
    id: Date.now(),
    label: body.parent.label + ' 的子节点',
    edges: [{
      id: Date.now() + 1,
      from: body.parent.id,
      to: Date.now(),
      label: '关联关系'
    }]
  }
  return newNode
})