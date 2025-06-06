import { ZhipuAI } from "zhipuai-sdk-nodejs-v4";

const client = new ZhipuAI({
  apiKey: "ce8a4b3520c14aecbbdcaa611b575397.UDyMaQqiploijEoq",
});

const prompt = `
你是一个医疗症状分级器，请严格按以下规则处理输入：


OLDCART是一种常用于医疗问诊和症状评估的标准化模式，通过系统化的提问帮助医务人员全面了解患者症状特征。
以下是其各字母代表的含义及具体内容 。每次询问时可以围绕某一个单独的点进行提问。
O - Onset（发病时间与诱因）
询问症状开始的具体时间及可能的诱发因素（如运动、饮食、外伤等），以判断急性或慢性病程 
L - Location（症状部位）
明确症状发生的具体位置（如头痛位于前额或后脑），有助于定位病变器官或系统 
D - Duration（持续时间）
记录症状持续的时间长度（如持续数分钟或数天），区分急慢性疾病 
C - Character（症状特征）
描述症状的性质（如刺痛、钝痛、烧灼感等），例如心绞痛常表现为“压迫性胸痛” 
A - Aggravating Factors（加重因素）
识别使症状恶化的条件（如活动后疼痛加剧、特定体位诱发头晕等） 
R - Relieving Factors（缓解因素）
了解缓解症状的方法（如休息、药物、姿势调整等），为治疗提供参考 
T - Timing（时间模式）
分析症状的规律性（如晨起加重、夜间发作等），例如晨僵提示类风湿关节炎 
该模式通过结构化问诊提高诊断效率

接收用户的已知症状
根据症状推断有可能的并发症来缩小病情范围(如 头晕可以考虑 发烧 干渴 咳嗽)
疼痛类症状使用【轻微疼/一般疼/特别疼】结构
非疼痛症状根据特性调整（如：晕→轻微晕/一般晕/特别晕；烧→低烧/中度发热/高烧）
也可根据实际场景对症状发病的时间进行提问（如：今日内/近两天/一周内）或者是否季节性发作
程度副词保持"轻微-一般-特别"的渐进逻辑
一共需要2到4个级别, 如无必要, 请尽量保持更少的级别
另外, 也不一定是级别, 也可以是肚子疼对应["上腹疼", "下腹疼"]
对于每个级别, 要用尽量少的文字来形容
另外, 并发症不得出现已经询问的症状
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

对于这次输入, 你需要输出一共abcdefg个可能的并发症
并发症不得出现已知的症状
`;

interface NodeData {
  id: number | string;
  label: string;
}

interface EdgeData {
  id: number | string;
  from: number | string;
  to: number | string;
  label: string;
}

interface NodesData {
  nodes: NodeData[];
  edges: EdgeData[];
}

interface NodeMessage {
  condition: string;
  level: string[];
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const result = await client.createCompletions({
    model: "glm-z1-flash",
    messages: [
      {
        role: "assistant",
        content: prompt.replace("abcdefg", body.parent.len.toString()),
      },
      { role: "user", content: "已知症状: " + body.parent.konw.join(" ") },
    ],
    stream: false,
  });
  const message = (result as any).choices[0].message.content.replace(
    /<think>[\s\S]*?<\/think>\n?/g,
    ""
  ) as string;
  const think = (result as any).choices[0].message.content.match(
    /<think>[\s\S]*?<\/think>\n?/g
  ) as string[];
  console.log(
    prompt.replace("abcdefg", body.parent.len.toString()),
    "已知症状: " + body.parent.konw.join(" "),
    message
  );
  const nodeMessage: NodeMessage[] = eval(message);

  const returnNodes: NodesData = {
    nodes: [],
    edges: [],
  };
  let id = Date.now();
  let pid = id;
  nodeMessage.forEach((node) => {
    returnNodes.nodes.push({
      id: pid,
      label: node.condition,
    });
    returnNodes.edges.push({
      id: pid,
      from: body.parent.id,
      to: pid,
      label: "可能并发症状",
    });
    for (let i = 1; i <= node.level.length; i++) {
      returnNodes.nodes.push({
        id: id + i,
        label: node.level[i - 1],
      });
      returnNodes.edges.push({
        id: id + i,
        from: pid,
        to: id + i,
        label: "严重程度",
      });
    }
    pid += node.level.length + 1;
    id += node.level.length + 1;
  });
  console.log(returnNodes);
  return { returnNodes, think };
});
