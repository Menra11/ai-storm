import { ZhipuAI } from 'zhipuai-sdk-nodejs-v4';

const client = new ZhipuAI({
  apiKey: 'ce8a4b3520c14aecbbdcaa611b575397.UDyMaQqiploijEoq'
})

const prompt = `
【角色】医疗症状分析AI
【任务】根据用户输入的零散症状，按以下逻辑生成响应：

症状解析

自动提取关键症状（如发热时长、疼痛部位、伴随反应等）

识别潜在冲突描述（例：同时报“腹泻”和“严重便秘”）

病因推断

按可能性降序排列（最高不超过3项）

必须标注推测依据（例：“病毒性感冒：基于发热+肌肉酸痛+流涕组合”）

输出结构
■ 可能病因：[简明病因1]/[病因2]（例：细菌感染/过敏反应）
■ 疑似病症：[医学标准病名]（例：急性扁桃体炎）
■ 行动建议：
✓ 饮食：禁忌食物+推荐食疗（例：避免冰饮/可饮菊花茶）
✓ 缓解措施：非药物方法（例：淡盐水漱喉）
✓ 可用药物：通用药名+提示（例：“咽痛可含服西瓜霜，6小时1次”）
■ 紧急警示：❗[需立即就医的情况]（例：吞咽伴呼吸急促）

限制条件

需要使用尽可能简短的语言
禁用绝对表述（如“确诊”“100%是”）
药物建议仅限非处方药且标注“请阅读说明书”
每项建议不超过2行，中文口语化
`

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const result = await client.createCompletions({
    model: "glm-z1-flash",
    messages: [
        {"role": "assistant", "content": prompt},
        {"role": "user", "content": "已知症状: " + body.selectedNodes.join(' ')},
    ],
        stream: false, 
    })
    const message = (result as any).choices[0].message.content.replace(/<think>[\s\S]*?<\/think>\n?/g, '') as string;
    console.log(message);
    return message;
})