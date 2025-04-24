// server/api/nodes/combine.post.ts
interface CombineResponse {
  id: number | string;
  label: string;
  edges: Array<{
    id: number | string;
    from: number | string;
    to: number | string;
    label: string;
  }>;
}
export default defineEventHandler(async (event) => {
  // 请求验证
  const body = await readBody(event);

  if (!body?.nodeIds || body.nodeIds.length !== 2) {
    throw createError({
      statusCode: 400,
      statusMessage: "需要提供两个有效的节点ID",
    });
  }
  // 获取节点数据
  const node1 = body.node1;
  const node2 = body.node2;

  // 数据有效性检查
  if (!node1 || !node2) {
    throw createError({
      statusCode: 404,
      statusMessage: "其中一个节点不存在",
    });
  }

  if (node1.id === node2.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "不能合并相同节点",
    });
  }

  const relationLabel = body.relationType || "合并关联";
  const newEdges = [
    {
      id: Date.now() + 1,
      from: node1.id,
      to: Date.now(),
      label: relationLabel,
    },
    {
      id: Date.now() + 2,
      from: node2.id,
      to: Date.now(),
      label: relationLabel,
    },
  ];
  // 7. 返回响应
  return {
    nodes:{
      id: Date.now(),
      label: body.label || "新节点"
    },
    edges: newEdges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      label: e.label,
    })),
  };
});
