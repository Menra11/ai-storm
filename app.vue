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
  edges?: EdgeData[];
}

interface EdgeData {
  id: number | string;
  from: number | string;
  to: number | string;
  label: string;
}

interface MyNode extends Node {
  disavilable?: boolean;
}

// 初始化应用数据存储
const myAppDataStore = useMyAppDataStore();

// 定义网络图的引用
const networkRef = ref();
const defNodes: MyNode[] = [];
const defEdges: Edge[] = [];
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
        color: "#1E3A8A",
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
      shadow: {
        enabled: true,
        color: "rgba(147, 197, 253, 0.3)", // 蓝色阴影
        size: 10,
        x: 3,
        y: 3,
      },
      color: {
        background: "rgba(255, 255, 255)", // 半透明白色背景
        border: "#93C5FD", // Tailwind blue-300
        highlight: {
          background: "rgba(255, 255, 255)", // 高亮时更白
          border: "#3B82F6", // Tailwind blue-500
        },
        hover: {
          background: "rgba(219, 234, 254)", // Tailwind blue-100 带透明度
          border: "#60A5FA", // Tailwind blue-400
        },
      },
    },
    edges: {
      font: {
        color: "#1E3A8A", // 使用与节点相同的深蓝色
        size: 12, // 稍小于节点文字
        face: "Inter, system-ui, sans-serif",
        align: "horizontal",
        strokeWidth: 2, // 文字描边增强可读性
      },
      labelHighlightBold: false, // 禁用高亮加粗
      color: {
        color: "#BFDBFE", // Tailwind blue-200
        highlight: "#3B82F6", // 高亮时使用蓝色
        hover: "#60A5FA",
      },
      width: 2.5,
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.6, // 箭头大小
        },
      },
      dashes: false,
      shadow: {
        enabled: true,
        color: "rgba(147, 197, 253, 0.2)",
        size: 5,
      },
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
let clickTimer: number | null = null;

const handleClick = (event: any) => {
  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    console.log('handleClick with node:', event.nodes[0]);
    for (let i = 0; i < network.value.nodes.length; i++) {
      if (network.value.nodes[i].id != event.nodes[0]) continue;
      if (network.value.nodes[i].disavilable) {
        network.value.nodes[i].disavilable = false;
        network.value.nodes[i].font = { color: '#000000' };
      } else {
        network.value.nodes[i].disavilable = true;
        network.value.nodes[i].font = { color: '#AAAAAA' };
      }
    }
    myAppDataStore.selectedNode = event.nodes[0];
  }, 250);
};

const handleDoubleClick = (event: any) => {
  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = null;
  console.log('handleDoubleClick with node:', event.nodes[0]);
  for (let i = 0; i < network.value.nodes.length; i++) {
    if (network.value.nodes[i].id != event.nodes[0]) continue;
    addNode(null, {id:network.value.nodes[i].id,  label: network.value.nodes[i].label})
  }
}

const keyWord = ref("");
// 添加节点
const addNode = async (key?: string, parent?: {id: number | string, label: string}) => {
  if (myAppDataStore.nodesLength == 0 && key) {
    network.value.nodes.push({
      id: 1,
      label: key,
    });
    keyWord.value = ""; // 清空输入框
    return;
    
  }

  const response: NodeData = await $fetch("/api/nodes", {
    method: "POST",
    body: {
      parent: parent,
    },
  });

  network.value.nodes.push({
    id: response.id,
    label: insertLineBreaks(response.label, 8),
  });
  response.edges?.forEach((edge) => {
    network.value.edges.push({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: insertLineBreaks(edge.label, 8),
    });
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
    const response: NodeData = await $fetch("/api/combine", {
      method: "POST",
      body: { nodeIds, node1, node2 },
    });

    network.value.nodes.push({
      id: response.id,
      label: insertLineBreaks(response.label, 8),
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

// 清除网络图数据
const clearNetWork = () => {
  network.value.nodes = [];
  network.value.edges = [];
  myAppDataStore.selectedNode = undefined;
  myAppDataStore.isHiddenCombineNav = true;
};
onUpdated(() => {
  // 监听网络图的变化
  myAppDataStore.nodesLength = network.value.nodes.length;
});
</script>

<template>
  <!-- 主要的模板代码 -->
  <div class="w-screen h-screen relative">
    <vue-vis-network
      class="w-full bg-white h-full network-background"
      :nodes="network.nodes"
      :edges="network.edges"
      :options="network.options"
      @click="handleClick($event)"
      @double-click="handleDoubleClick($event)"
    >
    </vue-vis-network>

    <aside class="absolute top-10 left-10 z-10 isolate">
      <!-- 主导航 -->
      <nav
        class="nav flex flex-col bg-blue-100/80 backdrop-blur-xs rounded-xl shadow-lg p-4 space-y-2 w-48 transition-all duration-200 border border-blue-200/50 hover:shadow-xl hover:bg-blue-100/90"
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
        >
          合并节点
        </button>

        <!-- Remove Node 按钮 -->
        <button
          @click="removeNode(myAppDataStore.selectedNode)"
          class="px-4 py-2 text-sm font-medium text-blue-900 bg-white/50 hover:bg-blue-200/30 rounded-lg border border-blue-200/50 hover:border-blue-300 transition-colors duration-200 shadow-sm"
        >
          删除节点
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
    </aside>
  </div>
</template>

<style scoped>
/* 网格背景容器 */
.network-background {
  background-image: linear-gradient(
      rgba(220, 220, 220, 0.15) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(220, 220, 220, 0.15) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: -1px -1px;
}
/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .network-background {
    background-image: linear-gradient(
        rgba(100, 100, 100, 0.15) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(100, 100, 100, 0.15) 1px, transparent 1px);
  }
}

/* 画布透明处理 */
:deep(.vis-network) canvas {
  background-color: transparent !important;
}
</style>
