import {
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  NodeMouseHandler,
  EdgeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomNode } from "./CustomNode";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { FilterPanel } from "./FilterPanel";
import { MetricsDashboard } from "./MetricsDashboard";
import { QuickFilters } from "./QuickFilters";
import { RelationshipFilter } from "./RelationshipFilter";
import { VersionPanel } from "./VersionPanel";
import { CopilotPanel } from "./CopilotPanel";
import { graphData, EdgeRelationship } from "../data/graphData";
import {
  Version,
  getNodeVersionInfo,
} from "../data/versionData";
import { DesignScheme } from "../data/tradeoffData";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const nodeTypes = {
  custom: CustomNode,
};

interface SteeringKPIFlowProps {
  selectedScheme: DesignScheme | null;
  onBackToTradeoff: () => void;
}

export function SteeringKPIFlow({
  selectedScheme,
  onBackToTradeoff,
}: SteeringKPIFlowProps) {
  // 构建树形结构的节点和边（每个节点左侧只有一个输入，右侧可以有多个输出）
  const { treeNodes, treeEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // 用于追踪已处理的节点实例，避免循环引用
    const processedInstances = new Set<string>();
    
    // 布局配置：更紧凑的间距
    const levelSpacing = 200; // 横向层级间距（更密集）
    const verticalSpacing = 50; // 纵向节点间距（更密集）
    
    const getNodeInstance = (originalId: string, parentPath: string) => {
      return `${parentPath}::${originalId}`;
    };

    // 递归构建树形结构
    const buildTree = (
      sourceNodeId: string,
      targetOriginalId: string,
      parentPath: string,
      relationship: EdgeRelationship,
      level: number,
      verticalOffset: { value: number }
    ) => {
      const targetNodeData = graphData.nodes.find(n => n.id === targetOriginalId);
      if (!targetNodeData) return null;

      const targetInstanceId = getNodeInstance(targetOriginalId, parentPath);
      
      // 检查是否已处理过此实例，避免循环引用
      if (processedInstances.has(targetInstanceId)) {
        return null;
      }
      
      processedInstances.add(targetInstanceId);
      
      // 创建节点副本 - 紧凑布局
      const targetNode: Node = {
        ...targetNodeData,
        id: targetInstanceId,
        position: {
          x: level * levelSpacing,
          y: verticalOffset.value
        },
        data: {
          ...targetNodeData.data,
        }
      };

      nodes.push(targetNode);
      
      // 创建边 - 使用贝塞尔曲线
      if (sourceNodeId) {
        const edgeId = `${sourceNodeId}-to-${targetInstanceId}`;
        const originalEdge = graphData.edges.find(e => 
          e.source === sourceNodeId.split('::').pop() && 
          e.target === targetOriginalId
        );
        
        edges.push({
          id: edgeId,
          source: sourceNodeId,
          target: targetInstanceId,
          type: 'default', // 贝塞尔曲线
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: originalEdge?.style || { strokeWidth: 2 },
          data: { relationship }
        });
      }

      verticalOffset.value += verticalSpacing; // 更紧凑的垂直间距

      // 递归处理子节点 - 只处理向前的边，避免反向验证边造成循环
      const outgoingEdges = graphData.edges.filter(e => {
        if (e.source !== targetOriginalId) return false;
        
        // 过滤掉反向边（从verify回到kpi的验证边）
        const targetNode = graphData.nodes.find(n => n.id === e.target);
        const sourceCategory = targetNodeData.data.category;
        const targetCategory = targetNode?.data.category;
        
        // 只允许向下的关系：goal → kpi → kpi → design → verify
        // 阻止 verify → kpi 的反向边
        if (sourceCategory === 'verify' && targetCategory === 'kpi') {
          return false;
        }
        
        return true;
      });
      
      outgoingEdges.forEach(edge => {
        buildTree(
          targetInstanceId,
          edge.target,
          targetInstanceId,
          edge.data?.relationship || 'implement',
          level + 1,
          verticalOffset
        );
      });

      return targetInstanceId;
    };

    // 从顶层目标开始构建
    const goalNode = graphData.nodes.find(n => n.data.category === 'goal');
    if (goalNode) {
      const verticalOffset = { value: 0 }; // 从顶部开始
      const goalInstanceId = getNodeInstance(goalNode.id, 'root');
      
      processedInstances.add(goalInstanceId);
      
      nodes.push({
        ...goalNode,
        id: goalInstanceId,
        position: { x: 0, y: verticalOffset.value }
      });
      
      verticalOffset.value += verticalSpacing;

      // 处理所有从目标出发的KPI
      const kpiEdges = graphData.edges.filter(e => e.source === goalNode.id);
      kpiEdges.forEach(edge => {
        buildTree(
          goalInstanceId,
          edge.target,
          goalInstanceId,
          edge.data?.relationship || 'satisfy',
          1,
          verticalOffset
        );
      });
    }

    return { treeNodes: nodes, treeEdges: edges };
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    treeNodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    treeEdges,
  );

  // 当选定方案变化时，更新节点的指标值
  useEffect(() => {
    if (selectedScheme) {
      setNodes((nds) =>
        nds.map((node) => {
          const kpiValue = selectedScheme.kpiValues[node.id];
          if (kpiValue && node.data.metrics) {
            return {
              ...node,
              data: {
                ...node.data,
                metrics: {
                  ...node.data.metrics,
                  achievementRate: kpiValue.achievementRate,
                  achieved: kpiValue.achievementRate >= 90,
                },
              },
            };
          }
          return node;
        }),
      );
    }
  }, [selectedScheme, setNodes]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(
    null,
  );
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(
    null,
  );
  const [highlightedNodes, setHighlightedNodes] = useState<
    Set<string>
  >(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<
    Set<string>
  >(new Set());
  const [activeFilters, setActiveFilters] = useState<
    Set<string>
  >(new Set(["goal", "kpi", "design", "verify"]));
  const [collapsedNodes, setCollapsedNodes] = useState<
    Set<string>
  >(new Set());
  const [activeModelTypes, setActiveModelTypes] = useState<
    Set<string>
  >(new Set(["sysml", "simulink", "modelica", "fmu"]));
  const [showOnlyUnachieved, setShowOnlyUnachieved] =
    useState(false);
  const [showOnlyNoModel, setShowOnlyNoModel] = useState(false);
  const [activeRelationships, setActiveRelationships] =
    useState<Set<string>>(
      new Set(["satisfy", "implement", "verify"]),
    );
  const [selectedVersion, setSelectedVersion] =
    useState<Version | null>(null);
  const [chainFilteredNodes, setChainFilteredNodes] = useState<
    Set<string>
  >(new Set());
  const [chainFilteredEdges, setChainFilteredEdges] = useState<
    Set<string>
  >(new Set());

  // 辅助函数：递归获取节点的完整相关链路（向上和向下）
  const getRelatedChain = useCallback(
    (startNodeIds: string[]) => {
      const relatedNodes = new Set<string>();
      const relatedEdges = new Set<string>();
      const visited = new Set<string>();

      const traverse = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        relatedNodes.add(nodeId);

        // 向上查找（incoming edges）
        edges.forEach((edge) => {
          if (edge.target === nodeId) {
            relatedEdges.add(edge.id);
            relatedNodes.add(edge.source);
            traverse(edge.source);
          }
        });

        // 向下查找（outgoing edges）
        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            relatedEdges.add(edge.id);
            relatedNodes.add(edge.target);
            traverse(edge.target);
          }
        });
      };

      startNodeIds.forEach((nodeId) => traverse(nodeId));

      return {
        nodes: relatedNodes,
        edges: relatedEdges,
      };
    },
    [edges],
  );

  const handleShowAll = useCallback(() => {
    setShowOnlyUnachieved(false);
    setShowOnlyNoModel(false);
    setChainFilteredNodes(new Set());
    setChainFilteredEdges(new Set());
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleToggleUnachieved = useCallback(
    (value: boolean) => {
      if (value) {
        // 开启未达成筛选
        setShowOnlyUnachieved(true);
        setShowOnlyNoModel(false);
        // 自动展开KPI层
        setActiveFilters(
          new Set(["goal", "kpi", "design", "verify"]),
        );
        // 找到所有未达成的KPI节点
        const unachievedIds = nodes
          .filter(
            (n) =>
              n.data.category === "kpi" &&
              !n.data.metrics?.achieved,
          )
          .map((n) => n.id);

        console.log("未达成的KPI节点:", unachievedIds);

        // 计算完整链路
        const chain = getRelatedChain(unachievedIds);
        console.log("链路中的节点数量:", chain.nodes.size);
        console.log("链路中的节点:", Array.from(chain.nodes));
        console.log("链路中的边数量:", chain.edges.size);

        // 检查链路中有哪些类别的节点
        const nodesByCategory = nodes.reduce(
          (acc, node) => {
            if (chain.nodes.has(node.id)) {
              const category = node.data.category;
              if (!acc[category]) acc[category] = [];
              acc[category].push(node.id);
            }
            return acc;
          },
          {} as Record<string, string[]>,
        );
        console.log("链路中按类别分组的节点:", nodesByCategory);

        setChainFilteredNodes(chain.nodes);
        setChainFilteredEdges(chain.edges);
        setHighlightedNodes(new Set(unachievedIds));
        setHighlightedEdges(new Set());
      } else {
        // 关闭筛选
        handleShowAll();
      }
    },
    [nodes, getRelatedChain, handleShowAll],
  );

  const handleToggleNoModel = useCallback(
    (value: boolean) => {
      if (value) {
        // 开启非模型化交付筛选
        setShowOnlyUnachieved(false);
        setShowOnlyNoModel(true);
        // 自动展开KPI层
        setActiveFilters(
          new Set(["goal", "kpi", "design", "verify"]),
        );
        // 找到所有非模型化交付的KPI节点
        const noModelIds = nodes
          .filter(
            (n) =>
              n.data.category === "kpi" &&
              !n.data.metrics?.modelType,
          )
          .map((n) => n.id);

        // 计算完整链路
        const chain = getRelatedChain(noModelIds);
        setChainFilteredNodes(chain.nodes);
        setChainFilteredEdges(chain.edges);
        setHighlightedNodes(new Set(noModelIds));
        setHighlightedEdges(new Set());
      } else {
        // 关闭筛选
        handleShowAll();
      }
    },
    [nodes, getRelatedChain, handleShowAll],
  );

  // 为 MetricsDashboard 提供的快捷函数
  const handleShowUnachieved = useCallback(() => {
    handleToggleUnachieved(true);
  }, [handleToggleUnachieved]);

  const handleShowNoModel = useCallback(() => {
    setShowOnlyUnachieved(false);
    setShowOnlyNoModel(true);
    // 自动展开KPI层
    setActiveFilters(
      new Set(["goal", "kpi", "design", "verify"]),
    );
    // 找到所有非模型化交付的KPI节点
    const noModelIds = nodes
      .filter(
        (n) =>
          n.data.category === "kpi" &&
          !n.data.metrics?.modelType,
      )
      .map((n) => n.id);

    // 计算完整链路
    const chain = getRelatedChain(noModelIds);
    setChainFilteredNodes(chain.nodes);
    setChainFilteredEdges(chain.edges);
    setHighlightedNodes(new Set(noModelIds));
    setHighlightedEdges(new Set());
  }, [nodes, getRelatedChain]);

  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      setSelectedNode(node);
      setSelectedEdge(null);

      // Find all connected nodes
      const connected = new Set<string>([node.id]);
      const connectedEdges = new Set<string>();

      // 如果节点是折叠的，不显示其子节点
      if (!collapsedNodes.has(node.id)) {
        const incomingEdges = edges.filter(
          (e) => e.target === node.id,
        );
        const outgoingEdges = edges.filter(
          (e) => e.source === node.id,
        );

        incomingEdges.forEach((e) => {
          connected.add(e.source);
          connectedEdges.add(e.id);
        });
        outgoingEdges.forEach((e) => {
          connected.add(e.target);
          connectedEdges.add(e.id);
        });
      }

      setHighlightedNodes(connected);
      setHighlightedEdges(connectedEdges);
    },
    [edges, collapsedNodes],
  );

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);

      // 高亮该边及其两端节点
      setHighlightedNodes(new Set([edge.source, edge.target]));
      setHighlightedEdges(new Set([edge.id]));
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
  }, []);

  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      // 检查父节点是否折叠
      const parentEdges = edges.filter(
        (e) => e.target === node.id,
      );
      const isChildOfCollapsed = parentEdges.some((e) =>
        collapsedNodes.has(e.source),
      );

      // 检查节点是否在选中版本的变更列表中
      const hasVersionChange =
        selectedVersion &&
        selectedVersion.changes.some(
          (change) => change.nodeId === node.id,
        );

      // 获取节点的版本信息
      const versionInfo = getNodeVersionInfo(node.id);

      // 模型类型筛选（仅对KPI节点生效）
      let modelTypeFiltered = false;
      if (node.data.category === "kpi" && node.data.metrics) {
        const modelType = node.data.metrics.modelType;
        if (modelType && !activeModelTypes.has(modelType)) {
          modelTypeFiltered = true;
        }
        // 如果没有模型类型，在所有模型类型都选中时显示
        if (!modelType && activeModelTypes.size === 4) {
          modelTypeFiltered = false;
        }
      }

      // 链路筛选：当启用未达成或非模型化筛选时��只显示链路中的节点对所有节点类型生效）
      let chainFiltered = false;
      if (
        (showOnlyUnachieved || showOnlyNoModel) &&
        chainFilteredNodes.size > 0
      ) {
        chainFiltered = !chainFilteredNodes.has(node.id);
      }

      return {
        ...node,
        hidden:
          !activeFilters.has(node.data.category) ||
          isChildOfCollapsed ||
          modelTypeFiltered ||
          chainFiltered,
        style: {
          ...node.style,
          opacity:
            highlightedNodes.size === 0 ||
            highlightedNodes.has(node.id)
              ? 1
              : 0.15,
        },
        data: {
          ...node.data,
          isHighlighted: highlightedNodes.has(node.id),
          isSelected: selectedNode?.id === node.id,
          isCollapsed: collapsedNodes.has(node.id),
          onToggleCollapse: () => toggleNodeCollapse(node.id),
          hasChildren: edges.some((e) => e.source === node.id),
          hasVersionChange,
          versionInfo,
        },
      };
    });
  }, [
    nodes,
    activeFilters,
    highlightedNodes,
    selectedNode,
    collapsedNodes,
    edges,
    toggleNodeCollapse,
    activeModelTypes,
    showOnlyUnachieved,
    showOnlyNoModel,
    selectedVersion,
    chainFilteredNodes,
  ]);

  const filteredEdges = useMemo(() => {
    return edges.map((edge) => {
      const sourceCollapsed = collapsedNodes.has(edge.source);
      const targetParentCollapsed = edges
        .filter((e) => e.target === edge.target)
        .some((e) => collapsedNodes.has(e.source));

      // 关系类型筛选
      const relationshipFiltered =
        edge.data?.relationship &&
        !activeRelationships.has(edge.data.relationship);

      // 链路筛选：当启用未达成或非模型化筛选时，只显示链路中的边
      let chainEdgeFiltered = false;
      if (
        (showOnlyUnachieved || showOnlyNoModel) &&
        chainFilteredEdges.size > 0
      ) {
        chainEdgeFiltered = !chainFilteredEdges.has(edge.id);
      }

      const isHighlighted =
        highlightedEdges.has(edge.id) ||
        (highlightedNodes.has(edge.source) &&
          highlightedNodes.has(edge.target));

      // 从当前节点列表中查找节点类别
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      return {
        ...edge,
        hidden:
          !activeFilters.has(sourceNode?.data.category || "") ||
          !activeFilters.has(targetNode?.data.category || "") ||
          sourceCollapsed ||
          targetParentCollapsed ||
          relationshipFiltered ||
          chainEdgeFiltered,
        style: {
          ...edge.style,
          opacity:
            highlightedEdges.size === 0 &&
            highlightedNodes.size === 0
              ? 1
              : isHighlighted
                ? 1
                : 0.1,
          strokeWidth: isHighlighted
            ? (edge.style?.strokeWidth || 1) * 1.8
            : edge.style?.strokeWidth,
        },
        animated: isHighlighted,
      };
    });
  }, [
    edges,
    nodes,
    activeFilters,
    highlightedNodes,
    highlightedEdges,
    collapsedNodes,
    activeRelationships,
    showOnlyUnachieved,
    showOnlyNoModel,
    chainFilteredEdges,
  ]);

  const handleHighlightNodesFromDashboard = useCallback(
    (nodeIds: string[]) => {
      setHighlightedNodes(new Set(nodeIds));
      setHighlightedEdges(new Set());
    },
    [],
  );

  // 处理版本选择 - 高亮影响链路
  const handleVersionSelect = useCallback(
    (
      version: Version,
      impactedNodes: string[],
      impactedEdges: string[],
    ) => {
      setSelectedVersion(version);
      setHighlightedNodes(new Set(impactedNodes));
      setHighlightedEdges(new Set(impactedEdges));
      // 清除其他筛选状态
      setShowOnlyUnachieved(false);
      setShowOnlyNoModel(false);
      setSelectedNode(null);
      setSelectedEdge(null);
    },
    [],
  );

  // 清除版本选择
  const handleClearVersion = useCallback(() => {
    setSelectedVersion(null);
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
  }, []);

  // 处理点击变更项 - 定位到节点并高亮影响链路
  const handleChangeItemClick = useCallback(
    (
      nodeId: string,
      impactedNodes: string[],
      impactedEdges: string[],
    ) => {
      setHighlightedNodes(new Set(impactedNodes));
      setHighlightedEdges(new Set(impactedEdges));

      // 找到对应的节点并选中
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (targetNode) {
        setSelectedNode(targetNode);
      }

      // 清除其他筛选状态
      setShowOnlyUnachieved(false);
      setShowOnlyNoModel(false);
    },
    [nodes],
  );

  // 处理 Copilot 高亮请求
  const handleCopilotHighlight = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      setHighlightedNodes(new Set(nodeIds));
      setHighlightedEdges(new Set(edgeIds));
      // 清除其他筛选状态
      setShowOnlyUnachieved(false);
      setShowOnlyNoModel(false);
      setSelectedNode(null);
      setSelectedEdge(null);
      setSelectedVersion(null);
    },
    [],
  );

  return (
    <div className="relative w-full h-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToTradeoff}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回方案选型
              </Button>
              <div className="border-l border-slate-300 h-8" />
              <div>
                <h1 className="text-slate-900">
                  新能源汽车折叠方向盘 指标全链路图
                </h1>
                <p className="text-slate-600 mt-1">
                  目标 → 指标 → 设计参数 → 仿真验证
                </p>
              </div>
            </div>
            {selectedScheme && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <div className="text-sm text-gray-600">
                  当前方案:
                </div>
                <div className="text-sm text-gray-900">
                  {selectedScheme.name.split("：")[1]}
                </div>
                {selectedScheme.recommended && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    推荐
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Relationship Filter and Quick Filters in same row */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
            <RelationshipFilter
              activeRelationships={activeRelationships}
              onRelationshipChange={setActiveRelationships}
            />
            <QuickFilters
              showOnlyUnachieved={showOnlyUnachieved}
              showOnlyNoModel={showOnlyNoModel}
              onToggleUnachieved={handleToggleUnachieved}
              onToggleNoModel={handleToggleNoModel}
              onShowAll={handleShowAll}
            />
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div
        className="absolute top-28 left-4 z-10"
        style={{ top: "180px" }}
      >
        <FilterPanel
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          activeModelTypes={activeModelTypes}
          onModelTypeChange={setActiveModelTypes}
        />
      </div>

      {/* Metrics Dashboard */}
      <MetricsDashboard
        nodes={nodes}
        onShowUnachieved={handleShowUnachieved}
        onHighlightNodes={handleHighlightNodesFromDashboard}
      />

      {/* Version Panel */}
      <div
        className="absolute top-28 right-4 z-10"
        style={{ top: "180px" }}
      >
        <VersionPanel
          onVersionSelect={handleVersionSelect}
          onClearVersion={handleClearVersion}
          selectedVersion={selectedVersion}
          onChangeItemClick={handleChangeItemClick}
        />
      </div>

      {/* Copilot Panel - 浮动按钮 */}
      <CopilotPanel
        nodes={nodes}
        edges={edges}
        onHighlight={handleCopilotHighlight}
      />

      {/* Flow Chart */}
      <div className="w-full h-screen pt-24 bg-slate-50/30">
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#cbd5e1"
          />
          <Controls className="bg-white border-slate-200 shadow-lg" />
        </ReactFlow>
      </div>

      {/* Detail Panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => {
            setSelectedNode(null);
            setHighlightedNodes(new Set());
          }}
          edges={edges}
        />
      )}
    </div>
  );
}