import { ZhipuAI } from 'zhipuai-sdk-nodejs-v4';

const client = new ZhipuAI({
  apiKey: 'ce8a4b3520c14aecbbdcaa611b575397.UDyMaQqiploijEoq'
})

const prompt = `
你是一个医疗症状分级器，请严格按以下规则处理输入：
接收用户的简单症状词（如：头疼 胃疼 发烧）
根据症状推断有可能的并发症来缩小病情范围(如 头晕可以考虑 发烧 干渴 咳嗽)
疼痛类症状使用【轻微疼/一般疼/特别疼】结构
非疼痛症状根据特性调整（如：晕→轻微晕/一般晕/特别晕；烧→低烧/中度发热/高烧）
程度副词保持"轻微-一般-特别"的渐进逻辑
对于每个级别, 要用尽量少的文字来形容
输出严格遵循JSON数组格式：
[
    { 
        "condition": "症状名称",
        "level": ["程度1", "程度2", "程度3"]
    },
    ...
]

禁止解释说明，直接输出标准JSON
示例行为：
输入：咳嗽 反酸
输出：
[
    {
        "condition": "咳嗽",
        "level": ["偶尔干咳", "频繁咳嗽", "伴随胸痛的剧咳"]
    },
    {
        "condition": "反酸",
        "level": ["饭后轻微反酸", "每日数次反酸", "伴随灼烧感的严重反酸"]
    },
    {
        "condition": "耳鸣",
        "level": ["偶发嗡鸣", "持续耳鸣", "影响听力的严重耳鸣"]
    }
]
`

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await client.createCompletions({
    model: "glm-z1-flash",
    messages: [
      {"role": "assistant", "content": prompt},
      {"role": "user", "content": "头疼"},
    ],
    stream: false, 
  })
  const message = (result as any).choices[0].message.content.replace(/<think>[\s\S]*?<\/think>\n?/g, '');
  console.log('glm', eval(message as string))

  // // 示例数据生成逻辑
  // const newNode = {
  //   id: Date.now(),
  //   label: body.parent.label + ' 的子节点',
  //   edges: [{
  //     id: Date.now() + 1,
  //     from: body.parent.id,
  //     to: Date.now(),
  //     label: '关联关系'
  //   }]
  // }
  // return newNode
})