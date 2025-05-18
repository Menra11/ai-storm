<script setup lang="ts">
// 导入 vue-vis-network 组件和相关类型
import { VueVisNetwork } from "vue-vis-network2";
import type { Edge, Node, Options } from "vis-network";
// 导入应用数据存储
import { useMyAppDataStore } from "@/stores/appData";

// 导入类型
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
  nodes?: NodeData[];
  edges?: EdgeData[];
}

interface MyNode extends Node {
  available?: boolean;
}

// 初始化应用数据存储
const myAppDataStore = useMyAppDataStore();
let kown: string[] = [];

// 定义网络图的引用
const networkRef = ref();
const defNodes: MyNode[] = [];
const defEdges: Edge[] = [];

const COLOR_SCHEME = {
  // 基础色
  default: {
    background: "#ffffff", // 白色背景
    border: "#93C5FD", // Tailwind blue-300
    highlight: {
      background: "#ffffff", // 高亮时更白
      border: "#3B82F6", // Tailwind blue-500
    },
    hover: {
      background: "#dbeafe", // Tailwind blue-100
      border: "#60A5FA", // Tailwind blue-400
    }, // Tailwind slate-400
  },
  // 激活状态
  active: {
    background: "#EDE9FE", // Tailwind purple-50
    border: "#8B5CF6", // Tailwind purple-300
    highlight: {
      background: "#EDE9FE", // Tailwind purple-100
      border: "#8B5CF6", // Tailwind purple-500
    },
    hover: {
      background: "#8B5CF6", // 比常规状态深2个色阶
      border: "#7C3AED", // 创造更明显的交互反馈
    },
  },
  // 边
  edge: {
    default: {
      color: "#93C5FD", // 与节点默认边框色一致 (blue-300)
      highlight: "#3B82F6", // 与节点高亮边框色同步 (blue-500)
      hover: "#60A5FA", // 与节点悬停色对应 (blue-400)
    },
    active: {
      color: "#8B5CF6", // 与激活节点边框色同步 (purple-500)
      highlight: "#7C3AED", // 与激活节点悬停边框色对应 (purple-600)
      hover: "#6D28D9", // 新增深紫色悬停状态 (purple-700)
    },
  },
  shadow: {
    default: {
      enabled: true,
      color: "#3B82F680", // 使用高亮色 blue-500 带 50% 透明度
      size: 8, // 增大阴影扩散范围
      x: 0,
      y: 0,
    },
    active: {
      enabled: true,
      color: "#8B5CF680", // 使用激活色 purple-500 带 50% 透明度
      size: 8,
      x: 0,
      y: 0,
    },
    // 边阴影（适配节点风格）
    edge: {
      default: {
        enabled: true,
        color: "#93C5FD80", // blue-300 65%透明度
        size: 4, // 比节点稍小但保持可见
        x: 0,
        y: 0,
      },
      active: {
        enabled: true,
        color: "#8B5CF680", // 与节点激活阴影同步
        size: 4,
        x: 0,
        y: 0,
      },
    },
  },
};
const COLOR_FONT = {
  default: "#64748B", // Tailwind slate-500
  active: "#4C1D95", // Tailwind purple-900
  edge: {
    default: "#3B82F6", // 使用节点高亮色 (blue-500)
    active: "#7C3AED", // 使用激活悬停色 (purple-600)
  },
};
const network = ref<{
  nodes: MyNode[];
  edges: Edge[];
  options: Options;
}>({
  nodes: [...defNodes],
  edges: [...defEdges],
  options: {
    nodes: {
      shape: "circle",
      size: 32, // 增大节点尺寸
      borderWidth: 2.5, // 加粗边框
      font: {
        color: COLOR_FONT.default,
        size: 14,
        face: "Inter, system-ui, sans-serif",
        multi: true, // 启用多行文字
        align: "center", // 文字居中
      },
      shapeProperties: {
        useBorderWithImage: true,
        borderRadius: 8,
      },
      // 调整尺寸计算方式
      scaling: {
        min: 24,
        max: 48,
        label: {
          enabled: true,
          min: 12,
          max: 14,
          maxVisible: 100,
          drawThreshold: 8,
        },
      },
      shadow: COLOR_SCHEME.shadow.default,
      color: COLOR_SCHEME.default,
    },
    edges: {
      font: {
        color: COLOR_FONT.edge.default, // 使用与节点相同的深蓝色
        size: 12, // 稍小于节点文字
        face: "Inter, system-ui, sans-serif",
        align: "horizontal",
        strokeWidth: 2, // 文字描边增强可读性
      },
      labelHighlightBold: false, // 禁用高亮加粗
      color: COLOR_SCHEME.edge.default,
      width: 2.5,
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.6, // 箭头大小
        },
      },
      dashes: false,
      shadow: COLOR_SCHEME.shadow.edge.default,
    },
    // 高亮显示聚焦时的线段
    interaction: {
      hover: true,
      tooltipDelay: 200,
      multiselect: true,
      selectConnectedEdges: true,
    },
    physics: {
      stabilization: {
        enabled: true,
        iterations: 50,
      },
      barnesHut: {
        gravitationalConstant: -5000, // 更松散的布局
        springLength: 200,
      },
    },
  },
});
// 插入换行符以实现多行文本
const insertLineBreaks = (str: string, maxLength: number) => {
  return str.replace(new RegExp(`(.{${maxLength}})`, "g"), "$1\n");
};

// 处理网络图事件
let clickTimer: number | null | NodeJS.Timeout = null;

const handleClick = (event: any) => {
  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    const nodeId = event.nodes[0];
    console.log("handleclick nodeid", nodeId);
    if (!nodeId) return;
    const targetIndex = network.value.nodes.findIndex((n) => n.id === nodeId);
    if (targetIndex < 0) return;
    const targetNode = network.value.nodes[targetIndex];
    // 切换状态
    const newAvailable = !targetNode.available;
    targetNode.available = newAvailable;
    console.log(newAvailable);

    // 递归更新相关节点和边
    if (newAvailable) {
      activateNodeChain(nodeId);
    } else {
      deactivateNodeChain(nodeId);
    }

    console.log("Updated network:", network.value);
  }, 250);
};

// 递归激活节点链
const activateNodeChain = (nodeId: string | number) => {
  const currentIndex = network.value.nodes.findIndex((n) => n.id === nodeId);
  const currentNode = network.value.nodes[currentIndex];
  console.log("Activating node:", currentNode);

  if (!currentNode) return;

  // 更新当前节点
  currentNode.available = true;
  currentNode.color = COLOR_SCHEME.active;
  currentNode.font = { color: COLOR_FONT.active };
  currentNode.shadow = COLOR_SCHEME.shadow.active;

  // 更新关联边
  network.value.edges.forEach((edge) => {
    if (edge.to === nodeId) {
      edge.color = COLOR_SCHEME.edge.active;
      edge.font = { color: COLOR_FONT.edge.active };
      edge.shadow = COLOR_SCHEME.shadow.edge.active;

      // 递归更新上游节点
      activateNodeChain(edge.from);
    }
  });

  // 停止条件：到达根节点
  if (nodeId === 1) {
    console.log("activateNodeChain over");
    return;
  }
};

// 递归取消激活节点链
const deactivateNodeChain = (nodeId: string | number) => {
  const currentIndex = network.value.nodes.findIndex((n) => n.id === nodeId);
  const currentNode = network.value.nodes[currentIndex];
  console.log("deActivating node:", currentNode);
  if (!currentNode) return;

  // 更新当前节点
  currentNode.available = false;
  currentNode.color = COLOR_SCHEME.default;
  currentNode.font = { color: COLOR_FONT.default };
  currentNode.shadow = COLOR_SCHEME.shadow.default;

  // 更新下游边和节点
  network.value.edges.forEach((edge) => {
    if (edge.to === nodeId) {
      edge.color = COLOR_SCHEME.edge.default;
      edge.font = { color: COLOR_FONT.edge.default };
      edge.shadow = COLOR_SCHEME.shadow.edge.default;
    }
    if (edge.from === nodeId) {
      edge.color = COLOR_SCHEME.edge.default;
      edge.font = { color: COLOR_FONT.edge.default };
      edge.shadow = COLOR_SCHEME.shadow.edge.default;

      // 递归更新下游节点
      deactivateNodeChain(edge.to);
    }
  });

  console.log("deactivateNodeChain over");
};

const handleDoubleClick = (event: any) => {
  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = null;
  console.log("handleDoubleClick with node:", event.nodes[0]);
  // console.log("全部节点", network.value);

  const targetIndex = network.value.nodes.findIndex(
    (n) => n.id === event.nodes[0]
  );
  const targetEdge = network.value.edges.findIndex(
    (e) => e.id === event.nodes[0]
  );
  console.log(targetEdge);

  if (targetIndex > -1) {
    // node
    network.value.nodes[targetIndex].available = true;
    network.value.nodes[targetIndex].font = {
      color: COLOR_FONT.active,
    };
    network.value.nodes[targetIndex].color = COLOR_SCHEME.active;
    network.value.nodes[targetIndex].shadow = COLOR_SCHEME.shadow.active;
    // edge
    if (targetEdge > -1) {
      network.value.edges[targetEdge].color = COLOR_SCHEME.edge.active;
      network.value.edges[targetEdge].font = {
        color: COLOR_FONT.edge.active,
      };
      network.value.edges[targetEdge].shadow = COLOR_SCHEME.shadow.edge.active;
    }

    if (targetIndex != 0) {
      const fromTargetIndex = network.value.nodes.findIndex(
        (n) => n.id === network.value.edges[targetEdge].from
      );
      const fromTargetEdge = network.value.edges.findIndex(
        (e) => e.id === network.value.edges[targetEdge].from
      );
      // node
      network.value.nodes[fromTargetIndex].available = true;
      network.value.nodes[fromTargetIndex].font = {
        color: COLOR_FONT.active,
      };
      network.value.nodes[fromTargetIndex].color = COLOR_SCHEME.active;
      network.value.nodes[fromTargetIndex].shadow = COLOR_SCHEME.shadow.active;

      // edge
      network.value.edges[fromTargetEdge].color = COLOR_SCHEME.edge.active;
      network.value.edges[fromTargetEdge].font = {
        color: COLOR_FONT.edge.active,
      };
      network.value.edges[fromTargetEdge].shadow =
        COLOR_SCHEME.shadow.edge.active;
    }
  }
  for (let i = 0; i < network.value.nodes.length; i++) {
    if (network.value.nodes[i].id != event.nodes[0]) continue;
    let len = 2;
    if (network.value.nodes[i].id === 1) len = 4;
    addNode(null, {
      id: network.value.nodes[i].id,
      label: network.value.nodes[i].label,
      len: len,
      konw: kown,
    });
  }
};

const keyWord = ref("");
// 添加节点
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const addNode = async (
  key?: string,
  parent?: { id: number | string; label: string; len: number; konw: string[] }
) => {
  if (myAppDataStore.nodesLength == 0 && key) {
    network.value.nodes.push({
      id: 1,
      label: key,
      font: { color: COLOR_FONT.active },
      color: COLOR_SCHEME.active,
      shadow: COLOR_SCHEME.shadow.active,
      available: true,
    });
    kown.push(key);
    keyWord.value = ""; // 清空输入框
    return;
  }
  const response: NodesData = await $fetch("/api/nodes", {
    method: "POST",
    body: {
      parent: parent,
    },
  });
  response.edges?.forEach(async (edge) => {
    network.value.edges.push({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.label,
    });
  });
  for (const node of response.nodes) {
    await sleep(200);
    network.value.nodes.push({
      id: node.id,
      label: insertLineBreaks(node.label, 20),
    });
  }
  response.edges?.forEach((edge) => {
    if (edge.from == parent?.id) {
      for (let i = 0; i < network.value.nodes.length; i++) {
        if (network.value.nodes[i].id != edge.to) continue;
        network.value.nodes[i].font = { color: COLOR_FONT.default };
        network.value.nodes[i].available = false;
        kown.push(network.value.nodes[i].label);
      }
    }
  });
};

// 切换合并节点的显示状态
const combineNode = () => {
  myAppDataStore.isHiddenCombineNav = !myAppDataStore.isHiddenCombineNav;
};

// 移除节点
const removeNode = (selectedNodeId: number | undefined) => {
  if (selectedNodeId) {
    network.value.nodes.reduce((acc, node) => {
      if (node.id === selectedNodeId) {
        network.value.nodes.splice(acc, 1);
        network.value.edges = network.value.edges.filter((edge) => {
          return edge.from !== selectedNodeId && edge.to !== selectedNodeId;
        });
      }
      return acc + 1;
    }, 0);
    myAppDataStore.selectedNode = undefined;
  } else {
    alert("请先选择节点");
  }
};

// 输入值的引用
const selectedNode1 = ref(null);
const selectedNode2 = ref(null);
// 合并节点
const Combine = async () => {
  // 验证选择有效性
  const nodeIds = [selectedNode1.value, selectedNode2.value];
  const node1 = network.value.nodes.find(
    (node) => node.id === selectedNode1.value
  );
  const node2 = network.value.nodes.find(
    (node) => node.id === selectedNode2.value
  );
  if (nodeIds.some((id) => !id)) return alert("请选择两个节点");
  if (selectedNode1.value === selectedNode2.value)
    return alert("请选择两个不同的节点");
  try {
    const response: NodesData = await $fetch("/api/combine", {
      method: "POST",
      body: { nodeIds, node1, node2 },
    });

    network.value.nodes.push({
      id: response.nodes[0].id,
      label: insertLineBreaks(response.nodes[0].label, 8),
    });
    response.edges?.forEach((edge) => {
      network.value.edges.push({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: insertLineBreaks(edge.label, 8),
      });
    });
    // 重置状态
    myAppDataStore.isHiddenCombineNav = true;
    selectedNode1.value = null;
    selectedNode2.value = null;
  } catch (error) {
    console.error("合并失败:", error);
    alert("合并操作失败");
  }
};
const selectTheListOfNodes = ref([]);
const selectTheStringOfNodes = ref("");
const summary = ref("");
const max_line_length = 40;
const getsTheSelectedNode = async () => {
  myAppDataStore.isHiddenTheSummery = !myAppDataStore.isHiddenTheSummery;
  selectTheListOfNodes.value = [];
  summary.value = "";
  for (let i = 0; i < network.value.nodes.length; i++) {
    if (network.value.nodes[i].available) {
      selectTheListOfNodes.value.push(network.value.nodes[i].label);
      selectTheStringOfNodes.value += network.value.nodes[i].label + "->";
    }
  }
  selectTheStringOfNodes.value = insertLineBreaks(
    selectTheStringOfNodes.value.slice(0, -2),
    max_line_length
  );
  const data: string = await $fetch("/api/summary", {
    method: "POST",
    body: {
      selectedNodes: selectTheListOfNodes.value,
    },
  });
  summary.value = insertLineBreaks(data, max_line_length);
  console.log("服务端存储结果:", data);
};

// 清除网络图数据
const clearNetWork = () => {
  network.value.nodes = [];
  network.value.edges = [];
  myAppDataStore.selectedNode = undefined;
  myAppDataStore.isHiddenCombineNav = true;
  location.reload();
};
onUpdated(() => {
  // 监听网络图的变化
  myAppDataStore.nodesLength = network.value.nodes.length;
});
</script>

<template>
  <!-- 主要的模板代码 -->
  <div class="w-screen h-screen raletive">
    <vue-vis-network
      class="w-full h-full bg-white network-background rounded-xl shadow-lg"
      :nodes="network.nodes"
      :edges="network.edges"
      :options="network.options"
      @click="handleClick($event)"
      @double-click="handleDoubleClick($event)"
    >
    </vue-vis-network>

    <aside class="w-[calc(196px + 16px)] h-full absolute left-10 top-6 z-10">
      <!-- 主导航 -->
      <nav
        class="nav flex flex-col bg-blue-100/80 backdrop-blur-xs rounded-xl shadow-lg p-4 space-y-2 w-48 transition-all duration-200 border border-blue-200/50"
      >
        <div v-if="myAppDataStore.nodesLength == 0" class="flex gap-2 mb-2">
          <!-- 添加横向间距 -->
          <input
            v-model="keyWord"
            type="text"
            class="w-full px-4 py-2 text-sm bg-white/50 border border-blue-200/50 rounded-lg shadow-sm placeholder:text-blue-400/70 focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300 transition-all duration-200 hover:border-blue-300/80"
            placeholder="输入关键词"
          />
          <button
            @click="addNode(keyWord)"
            class="px-4 py-2 text-sm font-medium text-blue-900 bg-white/50 hover:bg-blue-200/30 rounded-lg border border-blue-200/50 hover:border-blue-300 transition-colors duration-200 shadow-sm whitespace-nowrap"
          >
            √
          </button>
        </div>
        <!-- Add Node 按钮 -->
        <button
          v-else="myAppDataStore.nodesLength > 0"
          @click="addNode()"
          class="flex items-center px-4 py-2 text-sm font-medium text-blue-900 bg-white/50 hover:bg-blue-200/30 rounded-lg transition-all duration-200 border border-blue-200/50 hover:border-blue-300 hover:text-blue-700 shadow-sm"
          hidden
        >
          <svg
            class="w-5 h-5 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          添加节点
        </button>

        <!-- Combine Node 按钮 -->
        <button
          @click="combineNode()"
          class="px-4 py-2 text-sm font-medium text-blue-900 bg-white/50 hover:bg-blue-200/30 rounded-lg border border-blue-200/50 hover:border-blue-300 transition-colors duration-200 shadow-sm"
          hidden
        >
          合并节点
        </button>

        <!-- Remove Node 按钮 -->
        <button
          @click="removeNode(myAppDataStore.selectedNode)"
          class="px-4 py-2 text-sm font-medium text-blue-900 bg-white/50 hover:bg-blue-200/30 rounded-lg border border-blue-200/50 hover:border-blue-300 transition-colors duration-200 shadow-sm"
          hidden
        >
          删除节点
        </button>
        <!-- 提出总结 -->
        <button
          @click="getsTheSelectedNode()"
          class="px-4 py-2 text-sm font-medium text-blue-900 bg-white/50 hover:bg-blue-200/30 rounded-lg border border-blue-200/50 hover:border-blue-300 transition-colors duration-200 shadow-sm"
        >
          提出总结
        </button>

        <!-- 分割线 -->
        <div class="border-t border-blue-200/50 my-2"></div>

        <!-- Reset 按钮 -->
        <!-- <button
          @click="resetNetwork"
          class="px-4 py-2 text-sm font-medium text-red-700 bg-white/50 hover:bg-red-100/30 rounded-lg border border-red-200/50 hover:border-red-300 transition-colors duration-200 shadow-sm"
        >
          Reset
        </button> -->
        <button
          @click="clearNetWork"
          class="px-4 py-2 text-sm font-medium text-red-700 bg-white/50 hover:bg-red-100/30 rounded-lg border border-red-200/50 hover:border-red-300 transition-colors duration-200 shadow-sm"
        >
          清除所有节点
        </button>
      </nav>
      <!-- Combine 面板 -->
      <div
        class="flex flex-col gap-2 mt-4 px-4 py-3 bg-blue-100/80 backdrop-blur-xs rounded-xl border border-blue-200/50 shadow-lg transition-all duration-200"
        :hidden="myAppDataStore.isHiddenCombineNav"
      >
        <header class="font-sans mr-2 text-gl font-bold text-blue-900">
          Combine
        </header>

        <!-- Node1 选择 -->
        <div class="w-full space-y-1">
          <label class="text-xs font-bold text-blue-700/90">节点1：</label>
          <select
            name="node1"
            class="w-full px-2 py-1 text-sm bg-white/50 rounded-md border border-blue-200/70 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            v-model="selectedNode1"
          >
            <option disabled :value="null" class="text-blue-900/80">
              选择节点1
            </option>
            <option
              v-for="(node, index) in network.nodes"
              :key="index"
              :value="node.id"
              class="text-blue-900"
            >
              {{ node.label }}
            </option>
          </select>
        </div>

        <!-- Node2 选择 -->
        <div class="w-full space-y-1">
          <label class="text-xs font-bold text-blue-700/90">节点2：</label>
          <select
            name="node1"
            class="w-full px-2 py-1 text-sm bg-white/50 rounded-md border border-blue-200/70 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            v-model="selectedNode2"
          >
            <option disabled :value="null" class="text-blue-900/80">
              选择节点2
            </option>
            <option
              v-for="(node, index) in network.nodes"
              :key="index"
              :value="node.id"
              class="text-blue-900"
            >
              {{ node.label }}
            </option>
          </select>
        </div>

        <!-- Combine 按钮 -->
        <button
          class="mt-2 px-3 py-1.5 text-sm font-medium text-blue-900 bg-white/50 hover:bg-blue-200/30 rounded-md border border-blue-200/50 hover:border-blue-300 transition-colors duration-200 shadow-sm"
          @click="Combine()"
        >
          合并
        </button>
      </div>
      <!-- think -->
      <div
        id="think"
        class="mt-6 p-4 border border-blue-200/50 bg-blue-100/80 rounded-xl shadow-lg border border-blue-200/50 h-[calc(100vh-300px)]"
      >
        <div
          id="content"
          class="w-full px-4 py-2 text-sm bg-white/50 border border-blue-200/50 rounded-lg shadow-sm placeholder:text-blue-400/70 focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300 transition-all duration-200 hover:border-blue-300/80"
        >
          think
        </div>
      </div>
    </aside>

    <main
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 min-h-[200px] min-w-[320px] max-h-1/2"
      :hidden="myAppDataStore.isHiddenTheSummery"
    >
      <!-- 总结面板 -->
      <div
        class="flex flex-col gap-2 mx-4 px-4 py-3 bg-blue-100/80 backdrop-blur-xs rounded-xl border border-blue-200/50 shadow-lg transition-all duration-200"
      >
        <header class="font-sans text-gl font-bold text-blue-900">总结</header>
        <div
          class="w-full p-3 space-y-1 bg-white/30 rounded-lg min-h-[120px] break-words overflow-y-auto whitespace-pre text-blue-900"
          v-if="summary"
        >
          <div>选择的病症节点：{{ selectTheStringOfNodes }}</div>
          {{ summary }}
        </div>
        <div
          class="w-full p-3 space-y-1 bg-white/30 rounded-lg min-h-[120px] break-words overflow-y-auto whitespace-pre"
          v-else
        >
          <div class="dot-loading flex items-start justify-start space-x-2 p-3">
            <div class="dot animate-pulse"></div>
            <div class="dot animate-pulse"></div>
            <div class="dot animate-pulse"></div>
          </div>
        </div>

        <div class="flex justify-start">
          <button
            class="mt-2 px-3 py-1.5 text-sm font-medium text-blue-900 bg-white/50 hover:bg-blue-200/30 rounded-md border border-blue-200/50 hover:border-blue-300 transition-colors duration-200 shadow-sm"
            @click="clearNetWork"
          >
            确认
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 网格背景容器 */
.network-background {
  background-image: 
    /* 主网格线 (更饱和的蓝色) */ linear-gradient(
      rgba(96, 165, 250, 0.2) 1.2px,
      transparent 1.2px
    ),
    /* 辅助网格线 (增加层次感) */
      linear-gradient(90deg, rgba(96, 165, 250, 0.15) 1px, transparent 1px),
    /* 微纹理网格 (增强细节) */
      linear-gradient(rgba(147, 197, 253, 0.08) 0.8px, transparent 0.8px),
    linear-gradient(90deg, rgba(147, 197, 253, 0.08) 0.8px, transparent 0.8px);

  background-size: 30px 30px, /* 主网格尺寸 */ 30px 30px,
    /* 辅助网格尺寸 */ 15px 15px, /* 微纹理网格尺寸 */ 15px 15px;

  background-position: 0 0, /* 主网格定位 */ 0 0, /* 辅助网格定位 */ -1px -1px,
    /* 微纹理偏移 */ -1px -1px;

  background-color: #f0f9ff; /* Tailwind blue-50 作为底色 */
}
/* 画布透明处理 */
:deep(.vis-network) canvas {
  background-color: transparent !important;
}
/* 自定义动画关键帧 */
@keyframes pulse {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* 圆点基础样式 */
.dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  background-color: #3b82f6;
  animation: pulse 1.4s infinite ease-in-out;
}

/* 设置延迟 */
.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}
</style>
