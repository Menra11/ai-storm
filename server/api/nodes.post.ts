import { ZhipuAI } from "zhipuai-sdk-nodejs-v4";

const client = new ZhipuAI({
  apiKey: "ce8a4b3520c14aecbbdcaa611b575397.UDyMaQqiploijEoq",
});

const prompt = `
你是一个医疗症状分级器，请严格按以下规则处理输入：


OLDCART是一种常用于医疗问诊和症状评估的标准化模式，通过系统化的提问帮助医务人员全面了解患者症状特征。
以下是其各字母代表的含义及具体内容 。
O - Onset（发病时间与诱因）
L - Location（症状部位）
D - Duration（持续时间）
C - Character（症状特征）
A - Aggravating Factors（加重因素）
R - Relieving Factors（缓解因素）
T - Timing（时间模式）
分析症状的规律性提高诊断效率，每次询问时必须只围绕某一个单独的点进行提问（如不同发病时间，或者不同严重程度）。

优先选择身体可感知症状
面向用户是缺少医学知识的群众，尽量用生活化描述替代专业术语，（如：心悸改为心跳慌乱/胸闷气短）
保持口语化表达（不用"黏膜干燥"而用"嘴唇干裂"）

接收用户的已知症状
根据症状推断有可能的并发症来缩小病情范围(如 头晕可以考虑 发烧 干渴 咳嗽)
疼痛类症状使用【轻微疼/一般疼/特别疼】结构
非疼痛症状根据特性调整（如：晕→轻微晕/一般晕/特别晕；烧→低烧/中度发热/高烧）
也可根据实际场景对症状发病的时间进行提问（如：今日内/近两天/一周内）或者是否季节性发作
程度副词保持"轻微-一般-特别"的渐进逻辑
一共需要2到4个级别, 如无必要, 请尽量保持更少的级别
另外, 也不一定是级别, 也可以是肚子疼对应["上腹疼", "下腹疼"]
对于每个级别, 要用尽量少的文字来形容
另外, 并发症不得出现已经询问的症状，且单个节点只能询问单个症状
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
