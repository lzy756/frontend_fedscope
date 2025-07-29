<template>
  <div class="cluster-topology-card">
    <a-card title="分簇联邦学习拓扑图 (四层架构)" :loading="loading">
      <template #extra>
        <a-space>
          <a-button size="small" @click="showFormulaModal" title="查看公式详情">
            <template #icon>
              <FunctionOutlined />
            </template>
            公式
          </a-button>
          <a-button size="small" @click="resetView">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
          <a-button size="small" @click="fitToView">
            <template #icon>
              <ZoomInOutlined />
            </template>
            适应
          </a-button>
        </a-space>
      </template>

      <!-- Cytoscape 容器 -->
      <div class="topology-container" ref="cytoscapeContainer"></div>

      <!-- 图例 -->
      <div class="topology-legend">
        <div class="legend-section">
          <h4>节点类型</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-node l3"></div>
              <span>FedSAK聚合器 (L3)</span>
            </div>
            <div class="legend-item">
              <div class="legend-node l2"></div>
              <span>簇代理 (L2)</span>
            </div>
            <div class="legend-item">
              <div class="legend-node l1"></div>
              <span>客户端簇 (L1)</span>
            </div>
            <div class="legend-item">
              <div class="legend-node l0-active"></div>
              <span>参与训练客户端 (L0)</span>
            </div>
            <div class="legend-item">
              <div class="legend-node l0-online"></div>
              <span>在线客户端 (L0)</span>
            </div>
            <div class="legend-item">
              <div class="legend-node l0-offline"></div>
              <span>离线客户端 (L0)</span>
            </div>
          </div>
        </div>

        <div class="legend-section">
          <h4>连接类型</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-edge agg-proxy"></div>
              <span>L3→L2 聚合器连接</span>
            </div>
            <div class="legend-item">
              <div class="legend-edge proxy-cluster"></div>
              <span>L2→L1 簇管理连接</span>
            </div>
            <div class="legend-item">
              <div class="legend-edge cluster-client-active"></div>
              <span>L1→L0 参与训练连接</span>
            </div>
            <div class="legend-item">
              <div class="legend-edge full-connect"></div>
              <span>全连接阶段</span>
            </div>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 公式详情模态框 -->
    <a-modal
      v-model:open="formulaModalVisible"
      title="FedSAK算法公式"
      width="800px"
      :footer="null"
    >
      <div class="formula-content">
        <h4>簇内 FedAvg</h4>
        <div class="formula-block">
          <div
            class="formula"
            v-html="
              katex.renderToString(
                '\\theta_i^{(t+1)} = \\sum_{c \\in \\mathcal{C}_i} \\frac{n_c}{N_i}\\,\\theta_c^{(t)}, \\qquad N_i = \\sum_{c \\in \\mathcal{C}_i} n_c'
              )
            "
          ></div>
          <div class="formula-desc">其中 nᶜ 为客户端c的样本数</div>
        </div>

        <h4>簇间 FedSAK</h4>
        <div class="formula-block">
          <div class="formula-step">
            <strong>1. 构建张量堆叠结构：</strong>
            <div
              class="formula"
              v-html="
                katex.renderToString(
                  'W^l = \\text{stack}(w_1^l, w_2^l, \\ldots, w_M^l)'
                )
              "
            ></div>
          </div>
          <div class="formula-step">
            <strong>2. 定义正则化项：</strong>
            <div
              class="formula"
              v-html="
                katex.renderToString(
                  '\\mathcal{L}_r = \\sum_{l=1}^L \\sum_{k=1}^{p} \\left\\| W_{(k)}^l \\right\\|_*'
                )
              "
            ></div>
          </div>
          <div class="formula-step">
            <strong>3. 次梯度下降优化共享层：</strong>
            <div
              class="formula"
              v-html="
                katex.renderToString(
                  '\\frac{\\partial \\left\\| W_{(k)}^l \\right\\|_*}{\\partial W_{(k)}^l} = U V^\\top'
                )
              "
            ></div>
            <div
              class="formula"
              v-html="
                katex.renderToString(
                  '\\tilde{w}_i^t = w_i^t - \\eta_w \\nabla \\mathcal{L}_r'
                )
              "
            ></div>
          </div>
        </div>

        <h4>符号释义</h4>
        <div class="formula-block">
          <div class="formula-desc">
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('L')"
              ></span>
              <span class="symbol-colon">：</span>
              <span>模型总层数</span>
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('p')"
              ></span>
              <span class="symbol-colon">：</span>
              <span>张量阶数（层参数展成张量后的阶数）</span>
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('M')"
              ></span>
              <span class="symbol-colon">：</span>
              <span>客户端总数</span>
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('w_i^l')"
              ></span>
              <span class="symbol-colon">：</span>
              <span
                >客户端<span v-html="katex.renderToString('i')"></span>在第<span
                  v-html="katex.renderToString('l')"
                ></span
                >层的共享参数</span
              >
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('W^l')"
              ></span>
              <span class="symbol-colon">：</span>
              <span
                >第<span v-html="katex.renderToString('l')"></span
                >层所有客户端共享参数堆叠成的张量</span
              >
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('\\mathcal{L}_r')"
              ></span>
              <span class="symbol-colon">：</span>
              <span
                >正则化损失
                <span
                  v-html="
                    katex.renderToString(
                      '\\mathcal{L}_r = \\sum_{l=1}^L \\sum_{k=1}^{p} \\left\\| W_{(k)}^l \\right\\|_*'
                    )
                  "
                ></span
              ></span>
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('W_{(k)}^l')"
              ></span>
              <span class="symbol-colon">：</span>
              <span
                >张量<span v-html="katex.renderToString('W^l')"></span>在第<span
                  v-html="katex.renderToString('k')"
                ></span
                >模下的 unfolding 矩阵</span
              >
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('U, V')"
              ></span>
              <span class="symbol-colon">：</span>
              <span
                ><span v-html="katex.renderToString('W_{(k)}^l')"></span>的 SVD
                分解结果，用于计算迹范数的次梯度
                <span
                  v-html="
                    katex.renderToString(
                      '\\frac{\\partial \\left\\| W_{(k)}^l \\right\\|_*}{\\partial W_{(k)}^l} = U V^\\top'
                    )
                  "
                ></span
              ></span>
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('\\eta_w')"
              ></span>
              <span class="symbol-colon">：</span>
              <span>FedSAK 步长 (学习率)</span>
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('\\tilde{w}_i^t')"
              ></span>
              <span class="symbol-colon">：</span>
              <span
                >服务器针对客户端<span v-html="katex.renderToString('i')"></span
                >个性化后的共享层</span
              >
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('|\\cdot|_*')"
              ></span>
              <span class="symbol-colon">：</span>
              <span>矩阵核范数（trace norm）</span>
            </div>
            <div class="symbol-definition">
              <span
                class="symbol-label"
                v-html="katex.renderToString('\\mathrm{stack}(\\cdot)')"
              ></span>
              <span class="symbol-colon">：</span>
              <span>沿新维度将向量/矩阵堆叠为张量</span>
            </div>
          </div>
        </div>

        <h4>当前参数</h4>
        <a-descriptions :column="2" size="small">
          <a-descriptions-item label="正则化系数">
            <span
              v-html="
                katex.renderToString('\\lambda = ' + currentParams.lambda)
              "
            ></span>
          </a-descriptions-item>
          <a-descriptions-item label="学习率">
            <span
              v-html="katex.renderToString('\\eta_w = ' + currentParams.etaW)"
            ></span>
          </a-descriptions-item>
          <a-descriptions-item label="簇数">
            <span
              v-html="katex.renderToString('K = ' + currentParams.numClusters)"
            ></span>
          </a-descriptions-item>
          <a-descriptions-item label="客户端数">
            <span
              v-html="katex.renderToString('C = ' + currentParams.totalClients)"
            ></span>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>

    <!-- 节点详情抽屉 -->
    <a-drawer
      v-model:open="nodeDrawerVisible"
      :title="selectedNode ? `${selectedNode.name} 详情` : '节点详情'"
      width="400"
    >
      <div v-if="selectedNode">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="节点类型">
            {{ getNodeTypeLabel(selectedNode.layer) }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="selectedNode.online ? 'green' : 'red'">
              {{ selectedNode.online ? "在线" : "离线" }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="所属簇" v-if="selectedNode.clusterId">
            簇 {{ selectedNode.clusterId }}
          </a-descriptions-item>
          <a-descriptions-item
            label="客户端数量"
            v-if="selectedNode.clientCount"
          >
            {{ selectedNode.clientCount }} 个客户端
          </a-descriptions-item>
          <a-descriptions-item
            label="参与训练"
            v-if="selectedNode.layer === 'L0'"
          >
            <a-tag :color="selectedNode.participating ? 'green' : 'orange'">
              {{ selectedNode.participating ? "参与中" : "待选中" }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="样本数量" v-if="selectedNode.sampleCount">
            {{ selectedNode.sampleCount }}
          </a-descriptions-item>
          <a-descriptions-item label="当前损失" v-if="selectedNode.currentLoss">
            {{ selectedNode.currentLoss.toFixed(3) }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider>训练历史</a-divider>
        <div class="node-logs">
          <div
            v-for="log in selectedNode.logs || []"
            :key="log.id"
            :class="['log-item', log.level]"
          >
            <div class="log-time">{{ log.time }}</div>
            <div class="log-message">{{ log.message }}</div>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from "vue";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import cola from "cytoscape-cola";
import popper from "cytoscape-popper";
import * as katex from "katex";
import {
  ReloadOutlined,
  ZoomInOutlined,
  FunctionOutlined,
} from "@ant-design/icons-vue";

// 注册 Cytoscape 插件
cytoscape.use(dagre);
cytoscape.use(cola);
cytoscape.use(popper);

const props = defineProps({
  experimentData: {
    type: Object,
    default: () => ({}),
  },
  currentRound: {
    type: Number,
    default: 0,
  },
  isLive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["nodeClick", "roundChange"]);

// 响应式数据
const loading = ref(false);
const cytoscapeContainer = ref(null);
const formulaModalVisible = ref(false);
const nodeDrawerVisible = ref(false);
const selectedNode = ref(null);

let cy = null;
let animationTimer = null;

// 当前参数
const currentParams = ref({
  lambda: 1e-3,
  etaW: 0.1,
  numClusters: 3,
  totalClients: 27, // 3个簇 × 9个客户端
});

// 四层架构数据生成
const generateTopologyData = () => {
  const nodes = [];
  const edges = [];

  // L3 - FedSAK Aggregator (顶层中心)
  nodes.push({
    data: {
      id: "aggregator",
      label: "FedSAK\n全局聚合器",
      layer: "L3",
      type: "aggregator",
      online: true,
      description: "全局模型聚合与共享层优化",
      // 固定位置确保在中心顶部
      position: { x: 400, y: 0 }, // 进一步向上移动，避免遮挡簇C2文字标识
    },
  });

  // L1 - Client Clusters (compound nodes) 先创建，作为容器
  const clusterColors = ["#6BA3D0", "#95D475", "#FFC107"];
  const clusterPositions = [
    { x: 150, y: 320 }, // 左下
    { x: 400, y: 320 }, // 中下，与其他簇对齐
    { x: 650, y: 320 }, // 右下
  ];

  for (let i = 1; i <= currentParams.value.numClusters; i++) {
    nodes.push({
      data: {
        id: `cluster_group_${i}`,
        label: `簇 C${i}`,
        layer: "L1",
        type: "cluster",
        clusterId: i,
        online: true,
        description: `包含簇${i}的所有客户端`,
        color: clusterColors[i - 1],
      },
      // 设置位置，确保簇组位置一致
      position: clusterPositions[i - 1],
    });
  }

  // L2 - Cluster Proxies (簇代理，位于聚合器和簇之间)
  const proxyPositions = [
    { x: 200, y: 160 }, // 左上，稍微上移
    { x: 400, y: 160 }, // 中，稍微上移
    { x: 600, y: 160 }, // 右上，稍微上移
  ];

  for (let i = 1; i <= currentParams.value.numClusters; i++) {
    nodes.push({
      data: {
        id: `proxy_${i}`,
        label: `代理\nP${i}`,
        layer: "L2",
        type: "proxy",
        clusterId: i,
        online: true,
        parent: `cluster_group_${i}`, // 属于对应的簇组
        description: `管理簇${i}内的客户端聚合`,
        color: clusterColors[i - 1],
        position: proxyPositions[i - 1],
      },
    });

    // L3 -> L2 连接
    edges.push({
      data: {
        id: `agg_to_proxy_${i}`,
        source: "aggregator",
        target: `proxy_${i}`,
        type: "agg-proxy",
        animated: false, // 注释掉闪烁动画：原来是 true
      },
    });
  }

  // L0 - Clients (客户端节点，在各自的簇内)
  const clientsPerCluster = [9, 9, 9]; // 每个簇9个客户端

  for (
    let clusterId = 1;
    clusterId <= currentParams.value.numClusters;
    clusterId++
  ) {
    const numClients = clientsPerCluster[clusterId - 1] || 9;

    for (let j = 1; j <= numClients; j++) {
      const clientId = `client_${clusterId}_${j}`;

      // 使用固定种子确保一致性，不依赖currentRound
      const seed = clusterId * 100 + j;
      const seededRandom = (s) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
      };

      // 在线离线状态固定，不随轮次变化
      const isOnline = seededRandom(seed) > 0.15; // 85% 在线率

      // 参与训练状态根据轮次变化，但只选择在线的客户端
      const participationSeed = seed + props.currentRound * 1000;
      const participationRate =
        clusterId === 1 ? 0.55 : clusterId === 2 ? 0.67 : 0.61; // 参与率适当分散
      const isParticipating =
        isOnline && seededRandom(participationSeed) < participationRate;

      nodes.push({
        data: {
          id: clientId,
          label: `C${clusterId}.${j}`,
          layer: "L0",
          type: "client",
          clusterId: clusterId,
          parent: `cluster_group_${clusterId}`,
          online: isOnline,
          participating: isParticipating,
          sampleCount: Math.floor(seededRandom(seed + 2000) * 500) + 800,
          currentLoss: seededRandom(seed + 3000) * 0.1 + 0.15,
          description: `簇${clusterId}中的客户端${j}`,
          color: clusterColors[clusterId - 1],
        },
      });

      // L2 -> L0 连接（代理到客户端）
      if (isOnline) {
        edges.push({
          data: {
            id: `proxy_to_client_${clientId}`,
            source: `proxy_${clusterId}`,
            target: clientId,
            type: isParticipating
              ? "cluster-client-active"
              : "cluster-client-inactive",
            animated: isParticipating,
          },
        });
      }
    }
  }

  // 根据训练轮次添加特殊连接
  if (props.currentRound <= 2) {
    // 前2轮：全连接状态，每个客户端连接到所有簇代理
    const clients = nodes.filter((n) => n.data.layer === "L0");
    const proxies = nodes.filter((n) => n.data.layer === "L2");

    clients.forEach((client) => {
      proxies.forEach((proxy) => {
        if (proxy.data.clusterId !== client.data.clusterId) {
          edges.push({
            data: {
              id: `full_connect_${client.data.id}_${proxy.data.id}`,
              source: proxy.data.id,
              target: client.data.id,
              type: "full-connect",
              animated: false,
              phase: "initial",
            },
          });
        }
      });
    });
  } else if (props.currentRound <= 5) {
    // 第3-5轮：聚类过程，修改动画逻辑
    const clients = nodes.filter((n) => n.data.layer === "L0");
    const proxies = nodes.filter((n) => n.data.layer === "L2");

    // 使用固定种子确保每轮的随机结果一致
    const roundSeed = props.currentRound * 1000;
    const seededRandom = (index) => {
      const x = Math.sin(roundSeed + index) * 10000;
      return x - Math.floor(x);
    };

    let connectionIndex = 0;
    clients.forEach((client) => {
      proxies.forEach((proxy) => {
        const isTargetCluster = proxy.data.clusterId === client.data.clusterId;

        if (!isTargetCluster) {
          const rand = seededRandom(connectionIndex++);
          let edgeType, phase;

          if (props.currentRound === 3) {
            // 第3轮：70%变为黄色虚线，30%彻底消失
            if (rand < 0.7) {
              edgeType = "full-connect";
              phase = "to-warning";
            } else {
              edgeType = "full-connect-disappearing";
              phase = "disappearing-round3";
            }
          } else if (props.currentRound === 4) {
            // 第4轮：在剩余70%中，再有30%消失，40%继续为黄色虚线
            if (rand < 0.49) {
              // 70% * 70% = 49%
              edgeType = "full-connect-warning";
              phase = "warning-fading";
            } else if (rand < 0.7) {
              // 剩余的21%消失
              edgeType = "full-connect-disappearing";
              phase = "disappearing-round4";
            }
            // 其余30%在第3轮已经消失，不添加
          } else if (props.currentRound === 5) {
            // 第5轮：剩余连接最终消失
            if (rand < 0.49) {
              // 只有第3、4轮都存活的连接
              edgeType = "full-connect-disappearing";
              phase = "final-disappearing";
            }
          }

          // 只有定义了edgeType才添加边
          if (edgeType) {
            edges.push({
              data: {
                id: `clustering_${client.data.id}_${proxy.data.id}`,
                source: proxy.data.id,
                target: client.data.id,
                type: edgeType,
                animated: false,
                phase: phase,
              },
            });
          }
        }
      });
    });
  }

  return { nodes, edges };
};

// 获取 Cytoscape 样式配置
const getCytoscapeStyle = () => {
  return [
    // 基础节点样式
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-valign": "center",
        "text-halign": "center",
        color: "#fff",
        "font-size": "11px",
        "font-weight": "bold",
        "text-outline-width": 2,
        "text-outline-color": "#000",
        "text-wrap": "wrap",
        "text-max-width": "80px",
        "overlay-padding": "6px",
        "z-index": 10,
        "transition-property":
          "background-color, border-color, width, height, box-shadow",
        "transition-duration": "0.3s",
      },
    },

    // L3 - 聚合器样式（六边形，柔和紫色系）
    {
      selector: 'node[layer="L3"]',
      style: {
        "background-color": "#9254de",
        "background-gradient-stop-colors": "#9254de #722ed1",
        "background-gradient-direction": "to-bottom",
        shape: "hexagon",
        width: 80,
        height: 80,
        "border-width": 3,
        "border-color": "#fff",
        "box-shadow": "0px 4px 15px rgba(146, 84, 222, 0.3)",
        "font-size": "12px",
        "text-outline-color": "#2f1b69",
      },
    },

    // L2 - 代理样式（菱形，清新簇颜色）
    {
      selector: 'node[layer="L2"]',
      style: {
        "background-color": (ele) => {
          const clusterId = ele.data("clusterId");
          const colors = ["#6BA3D0", "#95D475", "#FFC107"];
          return colors[clusterId - 1] || "#6BA3D0";
        },
        shape: "diamond",
        width: 50,
        height: 50,
        "border-width": 3,
        "border-color": "#fff",
        "box-shadow": (ele) => {
          const clusterId = ele.data("clusterId");
          const colors = [
            "rgba(107, 163, 208, 0.25)",
            "rgba(149, 212, 117, 0.25)",
            "rgba(255, 193, 7, 0.25)",
          ];
          return `0px 3px 12px ${colors[clusterId - 1] || colors[0]}`;
        },
        "font-size": "10px",
      },
    },

    // L1 - 簇组样式 (compound nodes) - 虚线框
    {
      selector: 'node[layer="L1"]',
      style: {
        "background-opacity": 0, // 完全透明背景
        "background-color": "transparent",
        "border-width": 2,
        "border-style": "dashed",
        "border-color": (ele) => {
          const clusterId = ele.data("clusterId");
          const colors = ["#6BA3D0", "#95D475", "#FFC107"];
          return colors[clusterId - 1] || "#6BA3D0";
        },
        "border-opacity": 0.7,
        padding: "30px",
        shape: "round-rectangle",
        "text-valign": "top",
        "text-margin-y": "-15px",
        "font-size": "13px",
        "font-weight": "bold",
        color: (ele) => {
          const clusterId = ele.data("clusterId");
          const colors = ["#6BA3D0", "#95D475", "#FFC107"];
          return colors[clusterId - 1] || "#6BA3D0";
        },
        "text-outline-width": 1,
        "text-outline-color": "#fff",
      },
    },

    // L0 - 客户端样式（圆形，柔和状态颜色）
    {
      selector: 'node[layer="L0"]',
      style: {
        "background-color": (ele) => {
          const online = ele.data("online");
          const participating = ele.data("participating");
          if (!online) return "#ff7875";
          if (participating) return "#73d13d";
          return "#d9d9d9";
        },
        shape: "ellipse",
        width: 28,
        height: 28,
        "border-width": 2,
        "border-color": "#fff",
        "font-size": "9px",
        "box-shadow": (ele) => {
          const online = ele.data("online");
          const participating = ele.data("participating");
          if (!online) return "0px 2px 6px rgba(255, 120, 117, 0.25)";
          if (participating) return "0px 2px 10px rgba(115, 209, 61, 0.3)";
          return "0px 1px 4px rgba(217, 217, 217, 0.2)";
        },
      },
    },

    // 参与训练的客户端特殊效果
    {
      selector: 'node[layer="L0"][participating="true"]',
      style: {
        "background-color": "#73d13d",
        "box-shadow": "0px 0px 15px rgba(115, 209, 61, 0.4)",
        "border-color": "#95de64",
      },
    },

    // 离线客户端样式
    {
      selector: 'node[layer="L0"][online="false"]',
      style: {
        "background-color": "#ff7875",
        opacity: 0.8,
        "border-color": "#ffa39e",
      },
    },

    // 基础边样式
    {
      selector: "edge",
      style: {
        "line-color": "#d9d9d9",
        "target-arrow-shape": "triangle",
        "target-arrow-color": "#d9d9d9",
        width: 2,
        "curve-style": "straight",
        "arrow-scale": 1.0,
        opacity: 0.7,
        "overlay-padding": "3px",
        "transition-property": "line-color, width, opacity",
        "transition-duration": "0.3s",
      },
    },

    // L3->L2 聚合器连接（柔和紫色线）
    {
      selector: 'edge[type="agg-proxy"]',
      style: {
        "line-color": "#9254de",
        "target-arrow-color": "#9254de",
        "source-arrow-color": "#9254de",
        width: 3,
        "line-style": "solid",
        opacity: 0.8,
        "curve-style": "straight",
      },
    },

    // L2->L0 参与训练连接（柔和绿色线）
    {
      selector: 'edge[type="cluster-client-active"]',
      style: {
        "line-color": "#73d13d",
        "target-arrow-color": "#73d13d",
        width: 2,
        opacity: 0.7,
      },
    },

    // L2->L0 非参与连接（浅灰色细线）
    {
      selector: 'edge[type="cluster-client-inactive"]',
      style: {
        "line-color": "#f0f0f0",
        "target-arrow-color": "#f0f0f0",
        width: 1,
        opacity: 0.4,
        "line-style": "dashed",
      },
    },

    // 全连接边（前2轮） - 细灰线，无箭头，优化样式
    {
      selector: 'edge[type="full-connect"]',
      style: {
        "line-color": "#bfbfbf",
        "target-arrow-shape": "none",
        "source-arrow-shape": "none",
        width: 0.8,
        "line-style": "solid",
        opacity: 0.6,
        "curve-style": "straight",
      },
    },

    // 全连接边 - 警告状态（变为虚线）
    {
      selector: 'edge[type="full-connect-warning"]',
      style: {
        "line-color": "#faad14",
        "target-arrow-shape": "none",
        "source-arrow-shape": "none",
        width: 1,
        "line-style": "dashed",
        opacity: 0.6,
        "curve-style": "straight",
      },
    },

    // 全连接边 - 即将消失状态（红色虚线）
    {
      selector: 'edge[type="full-connect-disappearing"]',
      style: {
        "line-color": "#ff7875",
        "target-arrow-shape": "none",
        "source-arrow-shape": "none",
        width: 1,
        "line-style": "dotted",
        opacity: 0.3,
        "curve-style": "straight",
      },
    },

    // 聚类过程中的目标连接
    {
      selector: 'edge[type="cluster-client-target"]',
      style: {
        "line-color": (ele) => {
          const sourceNode = cy.$("#" + ele.data("source"));
          if (sourceNode.length > 0) {
            const clusterId = sourceNode.data("clusterId");
            const colors = ["#6BA3D0", "#95D475", "#FFC107"];
            return colors[clusterId - 1] || "#6BA3D0";
          }
          return "#6BA3D0";
        },
        "target-arrow-color": (ele) => {
          const sourceNode = cy.$("#" + ele.data("source"));
          if (sourceNode.length > 0) {
            const clusterId = sourceNode.data("clusterId");
            const colors = ["#6BA3D0", "#95D475", "#FFC107"];
            return colors[clusterId - 1] || "#6BA3D0";
          }
          return "#6BA3D0";
        },
        width: 2,
        opacity: 0.7,
      },
    },

    // 动画边效果
    /*
    {
      selector: 'edge[animated="true"]',
      style: {
        'line-dash-pattern': [10, 5],
        'line-dash-offset': 24
      }
    },
    */

    // 选中状态 - 只针对非L1层节点
    {
      selector: 'node[layer != "L1"]:selected',
      style: {
        "border-width": 4,
        "border-color": "#40a9ff",
        "box-shadow": "0px 0px 20px rgba(64, 169, 255, 0.5)",
        "z-index": 100,
      },
    },

    // 高亮状态 - 只针对非L1层节点
    {
      selector: 'node[layer != "L1"].highlighted',
      style: {
        "border-width": 4,
        "border-color": "#40a9ff",
        "box-shadow": "0px 0px 20px rgba(64, 169, 255, 0.6)",
        "z-index": 50,
      },
    },

    // 高亮的边
    {
      selector: "edge.highlighted",
      style: {
        "line-color": "#40a9ff",
        "target-arrow-color": "#40a9ff",
        width: 4,
        opacity: 1,
        "z-index": 50,
      },
    },

    // 悬停效果 - 排除L1层节点
    {
      selector: 'node[layer != "L1"]:active',
      style: {
        "overlay-opacity": 0.1,
        "overlay-color": "#40a9ff",
      },
    },
  ];
};

// 获取布局配置
const getLayoutConfig = (type = "preset") => {
  const layouts = {
    preset: {
      name: "preset",
      positions: (node) => {
        const nodeData = node.data();

        // L3 - 聚合器固定在顶部中心
        if (nodeData.layer === "L3") {
          return { x: 400, y: 0 }; // 保持在顶部y=0位置
        }

        // L2 - 代理节点位置
        if (nodeData.layer === "L2") {
          const clusterId = nodeData.clusterId;
          const positions = [
            { x: 150, y: 160 }, // 左，稍微上移
            { x: 400, y: 160 }, // 中，稍微上移
            { x: 650, y: 160 }, // 右，稍微上移
          ];
          return positions[clusterId - 1] || positions[0];
        }

        // L1 - 簇组位置（compound nodes）
        if (nodeData.layer === "L1") {
          const clusterId = nodeData.clusterId;
          const positions = [
            { x: 150, y: 320 }, // 左下
            { x: 400, y: 320 }, // 中下，与其他簇对齐
            { x: 650, y: 320 }, // 右下
          ];
          return positions[clusterId - 1] || positions[0];
        }

        // L0 - 客户端在簇内分布
        if (nodeData.layer === "L0") {
          const clusterId = nodeData.clusterId;
          const clientIndex = parseInt(nodeData.id.split("_")[2]) - 1;

          // 基础位置
          const basePositions = [
            { x: 150, y: 320 }, // 簇1中心
            { x: 400, y: 320 }, // 簇2中心，与其他簇对齐
            { x: 650, y: 320 }, // 簇3中心
          ];

          const base = basePositions[clusterId - 1] || basePositions[0];

          // 在簇内呈圆形分布，适应9个客户端的布局
          const totalClients = 9;
          const angle = (clientIndex * 2 * Math.PI) / totalClients;
          // 统一所有簇的半径
          const radius = 55;

          return {
            x: base.x + radius * Math.cos(angle),
            y: base.y + radius * Math.sin(angle),
          };
        }

        return { x: 400, y: 300 }; // 默认位置
      },
      fit: false, // 改为false，避免自动缩放改变精心设计的布局
      padding: 20,
      animate: false, // 改为false，避免动画干扰
      animationDuration: 0,
    },
    concentric: {
      name: "concentric",
      concentric: (node) => {
        const layer = node.data("layer");
        return layer === "L3" ? 4 : layer === "L2" ? 3 : layer === "L1" ? 2 : 1;
      },
      levelWidth: () => 1,
      minNodeSpacing: 100,
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
    },
    dagre: {
      name: "dagre",
      rankDir: "TB",
      nodeSep: 80,
      edgeSep: 20,
      rankSep: 120,
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
    },
    grid: {
      name: "grid",
      rows: 4,
      cols: 6,
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
    },
  };

  return layouts[type] || layouts.preset;
};

// 初始化 Cytoscape
const initCytoscape = () => {
  if (!cytoscapeContainer.value) return;

  const { nodes, edges } = generateTopologyData();

  cy = cytoscape({
    container: cytoscapeContainer.value,
    elements: [...nodes, ...edges],
    style: getCytoscapeStyle(),
    layout: getLayoutConfig(),

    // 交互配置
    minZoom: 0.3,
    maxZoom: 3,
    wheelSensitivity: 0.3,
    motionBlur: true,
    selectionType: "single",

    // 渲染配置
    textureOnViewport: false,
    hideEdgesOnViewport: false,
    hideLabelsOnViewport: false,
    pixelRatio: "auto",

    // 视口配置
    autoungrabify: false,
    userZoomingEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: false,
  });

  // 布局完成后自适应大小
  cy.ready(() => {
    // 等待DOM完全渲染后进行优化
    setTimeout(() => {
      // 计算合适的缩放比例，使拓扑图更好地利用容器空间
      const container = cytoscapeContainer.value;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // 基于设计的坐标范围计算合适的缩放
        // 设计范围：x: 0-800, y: 0-430左右
        const designWidth = 800;
        const designHeight = 430;

        // 计算缩放比例，留出一些边距
        const scaleX = (containerWidth - 40) / designWidth; // 40px边距
        const scaleY = (containerHeight - 40) / designHeight; // 40px边距
        const scale = Math.min(scaleX, scaleY, 1.2); // 最大不超过1.2倍

        // 设置缩放和居中
        cy.zoom(scale);
        cy.center();

        // 微调位置确保内容居中
        const pan = cy.pan();
        cy.pan({
          x: pan.x,
          y: pan.y + 10, // 稍微下移一点，确保顶部聚合器可见
        });
      }
    }, 100);
  });

  //   // 强制设置聚合器位置
  //   setTimeout(() => {
  //     const aggregator = cy.getElementById('aggregator')
  //     if (aggregator.length > 0) {
  //       aggregator.position({ x: 400, y: 0 })
  //     }

  //     // 强制设置簇2的位置，确保高度调整生效
  //     const cluster2 = cy.getElementById('cluster_group_2')
  //     if (cluster2.length > 0) {
  //       cluster2.position({ x: 400, y: 340 })
  //     }

  //     // 调整视图以确保所有元素可见
  //     cy.fit()
  //   }, 100)

  // 添加事件监听
  setupEventListeners();

  // 只有在实时模式下才启动动画
  if (props.isLive) {
    startTrainingAnimation();
  }
};

// 设置事件监听
const setupEventListeners = () => {
  if (!cy) return;

  // 节点点击事件
  cy.on("tap", "node", (evt) => {
    const node = evt.target;
    const nodeData = node.data();

    // 清除之前的高亮
    cy.elements().removeClass("highlighted");

    selectedNode.value = {
      ...nodeData,
      logs: generateNodeLogs(nodeData.id),
    };
    nodeDrawerVisible.value = true;
    emit("nodeClick", nodeData);
  });

  // 点击空白区域清除高亮
  cy.on("tap", (evt) => {
    if (evt.target === cy) {
      cy.elements().removeClass("highlighted");
    }
  });

  // 节点悬停效果
  cy.on("mouseover", "node", (evt) => {
    const node = evt.target;
    const nodeData = node.data();

    // 排除L1层节点的悬停效果
    if (nodeData.layer === "L1") {
      return;
    }

    const originalBorderWidth = getOriginalBorderWidth(nodeData.layer);
    node.style({
      "border-width": originalBorderWidth + 2,
      "border-color": "#40a9ff", // 使用更协调的蓝色
    });
  });

  cy.on("mouseout", "node", (evt) => {
    const node = evt.target;
    const nodeData = node.data();

    // 排除L1层节点
    if (nodeData.layer === "L1") {
      return;
    }

    // 重置节点样式到默认状态
    resetNodeStyle(node);
  });

  // 边悬停效果
  cy.on("mouseover", "edge", (evt) => {
    const edge = evt.target;
    const currentWidth = parseInt(edge.style("width"));
    edge.style({
      width: currentWidth + 2,
      opacity: 1,
      "z-index": 100,
    });
  });

  cy.on("mouseout", "edge", (evt) => {
    const edge = evt.target;
    // 使用 getEdgeDefaultStyle 函数获取默认样式
    const defaultStyle = getEdgeDefaultStyle(edge);
    edge.style(defaultStyle);
  });

  // 获取节点原始边框宽度的辅助函数
  const getOriginalBorderWidth = (layer) => {
    switch (layer) {
      case "L3":
        return 3;
      case "L2":
        return 3;
      case "L0":
        return 2;
      default:
        return 2;
    }
  };

  // 重置节点样式到默认状态
  const resetNodeStyle = (node) => {
    const layer = node.data("layer");
    const originalBorderWidth = getOriginalBorderWidth(layer);

    node.style({
      "border-width": originalBorderWidth,
      "border-color": "#fff",
    });
  };

  // 获取边的默认样式
  const getEdgeDefaultStyle = (edge) => {
    const type = edge.data("type");
    let originalWidth, originalOpacity;

    switch (type) {
      case "agg-proxy":
        originalWidth = 3;
        originalOpacity = 0.8;
        break;
      case "cluster-client-active":
        originalWidth = 2;
        originalOpacity = 0.7;
        break;
      case "cluster-client-inactive":
        originalWidth = 1;
        originalOpacity = 0.4;
        break;
      case "full-connect":
      case "full-connect-warning":
      case "full-connect-disappearing":
        originalWidth =
          type === "full-connect"
            ? 0.8
            : type === "full-connect-warning"
            ? 1
            : 1;
        originalOpacity =
          type === "full-connect"
            ? 0.6
            : type === "full-connect-warning"
            ? 0.6
            : 0.3;
        break;
      case "inter-cluster":
        originalWidth = 2;
        originalOpacity = 0.5;
        break;
      default:
        originalWidth = 2;
        originalOpacity = 0.7;
    }

    return {
      width: originalWidth,
      opacity: originalOpacity,
      "z-index": 1,
    };
  };
};

// 启动训练动画
const startTrainingAnimation = () => {
  if (!cy) return;

  // 清除之前的动画
  if (animationTimer) {
    clearInterval(animationTimer);
  }

  // 只有在实时模式下才启动动画
  if (!props.isLive) return;

  // 每3秒执行一次训练轮次动画
  animationTimer = setInterval(() => {
    simulateTrainingRound();
  }, 3000);
};

// 模拟训练轮次动画
const simulateTrainingRound = () => {
  if (!cy) return;

  console.log(`开始第 ${props.currentRound} 轮训练动画`);

  // 1. 客户端数据上传动画（波浪式启动）
  const activeClients = cy.nodes('[layer="L0"][participating="true"]');

  activeClients.forEach((client, index) => {
    setTimeout(() => {
      // 客户端脉冲效果
      client.animate(
        {
          style: {
            "background-color": "#ffd666",
            width: 35,
            height: 35,
            "box-shadow": "0px 0px 20px rgba(255, 214, 102, 0.6)",
          },
        },
        {
          duration: 400,
          complete: () => {
            client.animate(
              {
                style: {
                  "background-color": "#73d13d",
                  width: 28,
                  height: 28,
                  "box-shadow": "0px 0px 15px rgba(115, 209, 61, 0.4)",
                },
              },
              {
                duration: 400,
              }
            );
          },
        }
      );

      // 数据流动效果 - 连接线动画
      const proxyId = `proxy_${client.data("clusterId")}`;
      const edge = cy.edges(`[source="${proxyId}"][target="${client.id()}"]`);

      if (edge.length > 0) {
        edge.animate(
          {
            style: {
              "line-color": "#ffd666",
              width: 4,
              opacity: 1,
            },
          },
          {
            duration: 600,
            complete: () => {
              edge.animate(
                {
                  style: {
                    "line-color": "#73d13d",
                    width: 2,
                    opacity: 0.7,
                  },
                },
                {
                  duration: 400,
                }
              );
            },
          }
        );
      }
    }, index * 150); // 交错延迟
  });

  // 2. 簇内聚合动画（L2代理节点）
  setTimeout(() => {
    const proxies = cy.nodes('[layer="L2"]');
    proxies.forEach((proxy, index) => {
      setTimeout(() => {
        // 代理节点处理动画
        proxy.animate(
          {
            style: {
              "background-color": "#ffd666",
              width: 60,
              height: 60,
              "box-shadow": "0px 4px 20px rgba(255, 214, 102, 0.5)",
            },
          },
          {
            duration: 1000,
            complete: () => {
              // 恢复到原始颜色
              const clusterId = proxy.data("clusterId");
              const originalColors = ["#6BA3D0", "#95D475", "#FFC107"];
              const originalColor = originalColors[clusterId - 1] || "#6BA3D0";

              proxy.animate(
                {
                  style: {
                    "background-color": originalColor,
                    width: 50,
                    height: 50,
                    "box-shadow": `0px 3px 12px rgba(${
                      clusterId === 1
                        ? "107, 163, 208"
                        : clusterId === 2
                        ? "149, 212, 117"
                        : "255, 193, 7"
                    }, 0.25)`,
                  },
                },
                {
                  duration: 500,
                }
              );
            },
          }
        );
      }, index * 300); // 按簇顺序执行
    });
  }, 1200);

  // 3. 全局聚合动画（L3聚合器）
  setTimeout(() => {
    const aggregator = cy.nodes('[layer="L3"]');
    if (aggregator.length > 0) {
      // L2->L3 边动画（数据上传到聚合器）
      /*
      const aggEdges = cy.edges('[type="agg-proxy"]')
      aggEdges.animate({
        style: {
          'line-color': '#ffd666',
          'width': 5,
          'opacity': 1
        }
      }, {
        duration: 800,
        complete: () => {
          aggEdges.animate({
            style: {
              'line-color': '#9254de',
              'width': 3,
              'opacity': 0.8
            }
          }, {
            duration: 600
          })
        }
      })
      */

      // 聚合器处理动画（FedSAK算法执行）
      aggregator.animate(
        {
          style: {
            "background-color": "#ffd666",
            width: 95,
            height: 95,
            "box-shadow": "0px 6px 30px rgba(255, 214, 102, 0.6)",
          },
        },
        {
          duration: 1500,
          complete: () => {
            // 完成处理，返回原状态
            aggregator.animate(
              {
                style: {
                  "background-color": "#9254de",
                  width: 80,
                  height: 80,
                  "box-shadow": "0px 4px 15px rgba(146, 84, 222, 0.3)",
                },
              },
              {
                duration: 800,
              }
            );
          },
        }
      );
    }
  }, 2500);

  // 4. 模型分发动画（可选，显示聚合器向代理分发模型）
  /*
  setTimeout(() => {
    const aggEdges = cy.edges('[type="agg-proxy"]')
    aggEdges.animate({
      style: {
        'line-color': '#95de64',
        'width': 4,
        'opacity': 1
      }
    }, {
      duration: 600,
      complete: () => {
        aggEdges.animate({
          style: {
            'line-color': '#9254de',
            'width': 3,
            'opacity': 0.8
          }
        }, {
          duration: 400
        })
      }
    })
  }, 4500)
  */
};

// 更新拓扑数据 - 只更新数据，不重新布局
const updateTopology = () => {
  if (!cy) return;

  console.log(`更新拓扑数据到第 ${props.currentRound} 轮`);

  const { nodes, edges } = generateTopologyData();

  // 记录当前节点位置
  const nodePositions = {};
  cy.nodes().forEach((node) => {
    nodePositions[node.id()] = node.position();
  });

  // 只移除边，保留节点位置
  cy.edges().remove();

  // 更新节点数据（保持位置）
  nodes.forEach((nodeData) => {
    const existingNode = cy.getElementById(nodeData.data.id);
    if (existingNode.length > 0) {
      // 更新现有节点的数据
      existingNode.data(nodeData.data);
    } else {
      // 添加新节点，使用预设位置
      cy.add(nodeData);
      if (nodePositions[nodeData.data.id]) {
        cy.getElementById(nodeData.data.id).position(
          nodePositions[nodeData.data.id]
        );
      }
    }
  });

  // 添加新的边
  cy.add(edges);

  // 只在第一次初始化时应用布局
  if (Object.keys(nodePositions).length === 0) {
    cy.layout(getLayoutConfig()).run();
  } else {
    // 确保聚合器位置正确
    const aggregator = cy.getElementById("aggregator");
    if (aggregator.length > 0) {
      aggregator.position({ x: 400, y: 0 });
    }
  }

  // 触发全连接边的动态效果
  if (props.currentRound >= 3 && props.currentRound <= 5) {
    animateFullConnectionDisappearance();
  }
};

// 全连接边消失动画
const animateFullConnectionDisappearance = () => {
  if (!cy) return;

  // 找到所有全连接相关的边
  const fullConnectEdges = cy.edges('[type*="full-connect"]');

  fullConnectEdges.forEach((edge, index) => {
    setTimeout(() => {
      const phase = edge.data("phase");

      if (phase === "to-warning") {
        // 第3轮：灰色线变为黄色虚线（只执行一次）
        edge.animate(
          {
            style: {
              "line-color": "#faad14",
              "line-style": "dashed",
              opacity: 0.6,
            },
          },
          {
            duration: 1000,
          }
        );
      } else if (phase === "disappearing-round3") {
        // 第3轮：30%的连接直接消失
        edge.animate(
          {
            style: {
              "line-color": "#ff7875",
              "line-style": "dotted",
              opacity: 0.3,
            },
          },
          {
            duration: 600,
            complete: () => {
              edge.animate(
                {
                  style: {
                    opacity: 0,
                  },
                },
                {
                  duration: 400,
                  complete: () => {
                    edge.remove();
                  },
                }
              );
            },
          }
        );
      } else if (phase === "warning-fading") {
        // 第4轮：黄色虚线继续保持
        edge.animate(
          {
            style: {
              "line-color": "#faad14",
              "line-style": "dashed",
              opacity: 0.5,
            },
          },
          {
            duration: 800,
          }
        );
      } else if (phase === "disappearing-round4") {
        // 第4轮：再有30%的连接消失
        edge.animate(
          {
            style: {
              "line-color": "#ff7875",
              "line-style": "dotted",
              opacity: 0.3,
            },
          },
          {
            duration: 500,
            complete: () => {
              edge.animate(
                {
                  style: {
                    opacity: 0,
                  },
                },
                {
                  duration: 600,
                  complete: () => {
                    edge.remove();
                  },
                }
              );
            },
          }
        );
      } else if (phase === "final-disappearing") {
        // 第5轮：最终剩余连接消失
        edge.animate(
          {
            style: {
              "line-color": "#ff7875",
              "line-style": "dotted",
              opacity: 0.2,
            },
          },
          {
            duration: 500,
            complete: () => {
              edge.animate(
                {
                  style: {
                    opacity: 0,
                  },
                },
                {
                  duration: 800,
                  complete: () => {
                    edge.remove();
                  },
                }
              );
            },
          }
        );
      }
    }, index * 80); // 交错执行
  });
};

// 工具函数

const getNodeTypeLabel = (layer) => {
  switch (layer) {
    case "L3":
      return "FedSAK聚合器";
    case "L2":
      return "簇代理";
    case "L1":
      return "客户端簇";
    case "L0":
      return "客户端";
    default:
      return "未知";
  }
};

const generateNodeLogs = (nodeId) => {
  const logs = [];
  for (let i = 0; i < 5; i++) {
    const round = props.currentRound - i;
    if (round >= 0) {
      logs.push({
        id: `log_${nodeId}_${i}`,
        time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
        message: `轮次 ${round}: 模型更新完成，损失：0.${Math.floor(
          Math.random() * 300 + 150
        )}`,
        level: Math.random() > 0.8 ? "warning" : "info",
      });
    }
  }
  return logs;
};

// 控制函数
const showFormulaModal = () => {
  formulaModalVisible.value = true;
};

const resetView = () => {
  if (!cy) return;

  // 恢复到预设的初始布局
  const layout = getLayoutConfig("preset");
  const layoutRunner = cy.layout(layout);

  layoutRunner.run();

  // 等待布局完成后设置合适的缩放和位置
  layoutRunner.one("layoutstop", () => {
    const container = cytoscapeContainer.value;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // 基于设计的坐标范围计算合适的缩放
      const designWidth = 800;
      const designHeight = 430;

      // 计算缩放比例
      const scaleX = (containerWidth - 40) / designWidth;
      const scaleY = (containerHeight - 40) / designHeight;
      const scale = Math.min(scaleX, scaleY, 1.2);

      // 重置位置并设置缩放
      cy.zoom(scale);
      cy.center();

      // 微调位置
      const pan = cy.pan();
      cy.pan({
        x: pan.x,
        y: pan.y + 10,
      });
    }
  });
};

const fitToView = () => {
  if (!cy) return;

  // 使用自定义适应逻辑，保持设计比例
  const container = cytoscapeContainer.value;
  if (container) {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const designWidth = 800;
    const designHeight = 430;

    const scaleX = (containerWidth - 30) / designWidth;
    const scaleY = (containerHeight - 30) / designHeight;
    const scale = Math.min(scaleX, scaleY, 1.5); // 适应时可以放大到1.5倍

    cy.zoom(scale);
    cy.center();
  }
};

// 监听器
watch(
  () => props.currentRound,
  () => {
    updateTopology();
  }
);

watch(
  () => props.experimentData,
  () => {
    updateTopology();
  },
  { deep: true }
);

watch(
  () => props.isLive,
  (newValue) => {
    if (newValue) {
      // 当切换到实时模式时，启动动画
      startTrainingAnimation();
    } else {
      // 当切换到非实时模式时，停止动画
      if (animationTimer) {
        clearInterval(animationTimer);
        animationTimer = null;
      }
    }
  }
);

// 生命周期
onMounted(async () => {
  await nextTick();
  initCytoscape();
});

onUnmounted(() => {
  if (animationTimer) {
    clearInterval(animationTimer);
  }
  if (cy) {
    cy.destroy();
  }
});
</script>

<style scoped>
.cluster-topology-card {
  padding: 0;
  margin: 0;
}

.cluster-topology-card .ant-card-body {
  padding: 16px;
  overflow: visible;
}

.topology-container {
  height: 430px;
  width: 100%;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f6f8fc 0%, #ffffff 50%, #f0f4f8 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.topology-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      circle at 20% 20%,
      rgba(24, 144, 255, 0.03) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 80%,
      rgba(82, 196, 26, 0.03) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 40% 60%,
      rgba(250, 140, 22, 0.03) 0%,
      transparent 50%
    );
  pointer-events: none;
}

.topology-legend {
  display: flex;
  gap: 32px;
  margin-top: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 6px;
  overflow-x: auto;
}

.legend-section h4 {
  margin: 0 0 12px 0;
  color: #1890ff;
  font-size: 14px;
  font-weight: bold;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  white-space: nowrap;
}

.legend-node {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.legend-node.l3 {
  background-color: #9254de;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border-radius: 0;
}

.legend-node.l2 {
  background-color: #6ba3d0;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  border-radius: 0;
}

.legend-node.l1 {
  background-color: #6ba3d0;
  opacity: 0.3;
  border-style: dashed;
}

.legend-node.l0-active {
  background-color: #73d13d;
}

.legend-node.l0-online {
  background-color: #d9d9d9;
}

.legend-node.l0-offline {
  background-color: #ff7875;
}

.legend-edge {
  width: 24px;
  height: 3px;
  border-radius: 1px;
}

.legend-edge.agg-proxy {
  background-color: #9254de;
  height: 4px;
}

.legend-edge.proxy-cluster {
  background-color: #6ba3d0;
}

.legend-edge.cluster-client-active {
  background-color: #73d13d;
}

.legend-edge.full-connect {
  background-color: #bfbfbf;
  border-style: solid;
  border-width: 0;
  height: 1.5px;
}

.formula-content h4 {
  color: #1890ff;
  margin: 20px 0 12px 0;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.formula-block {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.formula-step {
  margin-bottom: 12px;
}

.formula {
  font-family: "Times New Roman", serif;
  font-size: 18px;
  color: #333;
  margin: 12px 0;
  text-align: center;
  font-weight: bold;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
}

.formula-desc {
  font-size: 13px;
  color: #666;
  text-align: center;
  font-style: italic;
  margin-top: 8px;
}

.node-logs {
  max-height: 400px;
  overflow-y: auto;
}

.log-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid #1890ff;
  background: #f6f8fa;
  transition: all 0.3s ease;
}

.log-item:hover {
  background: #e6f7ff;
  transform: translateX(4px);
}

.log-item.warning {
  border-left-color: #fa8c16;
  background-color: #fff7e6;
}

.log-item.info {
  border-left-color: #1890ff;
  background-color: #e6f7ff;
}

.log-time {
  font-size: 11px;
  color: #8c8c8c;
  margin-bottom: 6px;
  font-weight: 500;
}

.log-message {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .topology-legend {
    flex-direction: column;
    gap: 16px;
  }

  .legend-items {
    flex-direction: column;
    gap: 8px;
  }

  .topology-container {
    height: 400px;
  }
}

/* 自定义滚动条 */
.node-logs::-webkit-scrollbar {
  width: 6px;
}

.node-logs::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.node-logs::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.node-logs::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.symbol-definition {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
  text-align: left;
  font-style: normal;
}

.symbol-definition .symbol-label {
  margin-right: 8px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.symbol-definition .symbol-colon {
  margin: 0 8px;
}
</style>
