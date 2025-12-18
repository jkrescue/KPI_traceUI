import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Badge } from './ui/badge';
import { Database, ListTodo, Target, ChevronRight, ChevronDown, Square, Minus, Plus } from 'lucide-react';
import { kpiToTaskMapping, WBSTask } from '../data/wbsData';
import { KPISystem } from '../data/kpiSystems';
import { kpiDefinitions } from '../data/kpiDefinitions';

type ViewMode = 'one-to-many' | 'multi-to-multi';

interface TraceabilityCanvasProps {
  kpis: string[]; // 当前方案涉及的KPI列表
  selectedKPISystem?: KPISystem | null;
  viewMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

// 自定义节点组件 - MagicDraw 风格
function CustomTraceNode({ data }: { data: any }) {
  const [isExpanded, setIsExpanded] = useState(data.initialExpanded ?? true);

  const getNodeIcon = () => {
    switch (data.type) {
      case 'kpi':
        return <Square className="w-3 h-3 text-blue-600" />;
      case 'task':
        return <Square className="w-3 h-3 text-emerald-600" />;
      case 'model':
        return <Square className="w-3 h-3 text-purple-600" />;
      default:
        return <Square className="w-3 h-3 text-slate-600" />;
    }
  };

  const hasChildren = data.hasChildren;

  return (
    <div className="flex items-center gap-1.5 group">
      {/* 展开/收缩按钮 */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
            data.onToggle?.(data.id, !isExpanded);
          }}
          className="w-3.5 h-3.5 rounded-sm border border-slate-400 bg-white flex items-center justify-center hover:border-slate-600 hover:bg-slate-50 transition-colors"
        >
          {isExpanded ? (
            <Minus className="w-2.5 h-2.5 text-slate-600" />
          ) : (
            <Plus className="w-2.5 h-2.5 text-slate-600" />
          )}
        </button>
      )}
      
      {/* 节点图标 */}
      {getNodeIcon()}
      
      {/* 节点文本 */}
      <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all">
        <span className="text-xs text-slate-700 whitespace-nowrap">
          {data.label || data.id}
        </span>
        {data.badge && (
          <span className="text-[10px] text-slate-500">
            {data.badge}
          </span>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  custom: CustomTraceNode,
};

export function TraceabilityCanvas({ kpis, selectedKPISystem, viewMode, onModeChange }: TraceabilityCanvasProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((nodeId: string, expanded: boolean) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (expanded) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // 构建追溯关系图数据
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (viewMode === 'multi-to-multi') {
      // 树形视图（紧凑布局）：每个节点都是独立副本，确保每个节点左侧只有一个输入
      let currentY = 50;
      const levelSpacing = 350;
      const nodeSpacing = 60;

      kpis.forEach((kpiId) => {
        const wbsData = kpiToTaskMapping[kpiId];
        if (!wbsData) return;

        const kpiDef = selectedKPISystem?.kpis[kpiId as keyof typeof selectedKPISystem.kpis] || kpiDefinitions[kpiId];
        const kpiLabel = kpiDef?.label || kpiDef?.name || kpiId;

        const kpiNodeId = `kpi-${kpiId}`;
        const isKPICollapsed = collapsedNodes.has(kpiNodeId);

        // KPI节点
        nodes.push({
          id: kpiNodeId,
          type: 'custom',
          position: { x: 50, y: currentY },
          data: {
            id: kpiId,
            label: kpiLabel,
            type: 'kpi',
            hasChildren: wbsData.tasks.length > 0,
            onToggle: handleToggle,
            initialExpanded: !isKPICollapsed,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        if (!isKPICollapsed) {
          let taskY = currentY;
          
          wbsData.tasks.forEach((task, taskIndex) => {
            const taskNodeId = `task-${kpiId}-${task.id}`;
            const isTaskCollapsed = collapsedNodes.has(taskNodeId);
            const hasModels = task.models && task.models.length > 0;

            // 任务节点（每个KPI都有独立的任务副本）
            nodes.push({
              id: taskNodeId,
              type: 'custom',
              position: { x: 50 + levelSpacing, y: taskY },
              data: {
                id: task.id,
                label: task.name,
                type: 'task',
                badge: task.criticality === 'Critical' ? '⊕' : undefined,
                hasChildren: hasModels,
                onToggle: handleToggle,
                initialExpanded: !isTaskCollapsed,
              },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
            });

            // KPI → Task 边
            edges.push({
              id: `edge-${kpiNodeId}-${taskNodeId}`,
              source: kpiNodeId,
              target: taskNodeId,
              type: 'smoothstep',
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#64748b',
                width: 10,
                height: 10,
              },
              style: {
                stroke: '#94a3b8',
                strokeWidth: 1.5,
              },
            });

            if (!isTaskCollapsed && hasModels) {
              task.models!.forEach((modelId, modelIndex) => {
                const model = wbsData.models.find(m => m.id === modelId);
                if (!model) return;

                const modelNodeId = `model-${kpiId}-${task.id}-${modelId}`;
                const modelY = taskY + modelIndex * nodeSpacing;

                // 模型节点（每个任务都有独立的模型副本）
                nodes.push({
                  id: modelNodeId,
                  type: 'custom',
                  position: { x: 50 + levelSpacing * 2, y: modelY },
                  data: {
                    id: model.name,
                    label: `${model.software}`,
                    type: 'model',
                    badge: model.type,
                    hasChildren: false,
                  },
                  sourcePosition: Position.Right,
                  targetPosition: Position.Left,
                });

                // Task → Model 边
                edges.push({
                  id: `edge-${taskNodeId}-${modelNodeId}`,
                  source: taskNodeId,
                  target: modelNodeId,
                  type: 'smoothstep',
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#64748b',
                    width: 10,
                    height: 10,
                  },
                  style: {
                    stroke: '#94a3b8',
                    strokeWidth: 1.5,
                  },
                });
              });

              taskY += (task.models!.length) * nodeSpacing;
            } else {
              taskY += nodeSpacing;
            }
          });

          currentY = taskY + nodeSpacing;
        } else {
          currentY += nodeSpacing;
        }
      });

    } else {
      // 一对多树形视图：类似 MagicDraw 的展示方式
      let currentY = 50;
      const levelSpacing = 350; // 层级之间的水平间距
      const nodeSpacing = 60; // 节点之间的垂直间距

      kpis.forEach((kpiId) => {
        const wbsData = kpiToTaskMapping[kpiId];
        if (!wbsData) return;

        const kpiDef = selectedKPISystem?.kpis[kpiId as keyof typeof selectedKPISystem.kpis] || kpiDefinitions[kpiId];
        const kpiLabel = kpiDef?.label || kpiDef?.name || kpiId;

        const kpiNodeId = `kpi-${kpiId}`;
        const isKPICollapsed = collapsedNodes.has(kpiNodeId);

        // KPI节点
        nodes.push({
          id: kpiNodeId,
          type: 'custom',
          position: { x: 50, y: currentY },
          data: {
            id: kpiId,
            label: kpiLabel,
            type: 'kpi',
            hasChildren: wbsData.tasks.length > 0,
            onToggle: handleToggle,
            initialExpanded: !isKPICollapsed,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        if (!isKPICollapsed) {
          let taskY = currentY;
          
          wbsData.tasks.forEach((task, taskIndex) => {
            const taskNodeId = `task-${kpiId}-${task.id}`;
            const isTaskCollapsed = collapsedNodes.has(taskNodeId);
            const hasModels = task.models && task.models.length > 0;

            // 任务节点
            nodes.push({
              id: taskNodeId,
              type: 'custom',
              position: { x: 50 + levelSpacing, y: taskY },
              data: {
                id: task.id,
                label: task.name,
                type: 'task',
                badge: task.criticality === 'Critical' ? '⊕' : undefined,
                hasChildren: hasModels,
                onToggle: handleToggle,
                initialExpanded: !isTaskCollapsed,
              },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
            });

            // KPI → Task 边
            edges.push({
              id: `edge-${kpiNodeId}-${taskNodeId}`,
              source: kpiNodeId,
              target: taskNodeId,
              type: 'smoothstep',
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#64748b',
                width: 10,
                height: 10,
              },
              style: {
                stroke: '#94a3b8',
                strokeWidth: 1.5,
              },
            });

            if (!isTaskCollapsed && hasModels) {
              task.models!.forEach((modelId, modelIndex) => {
                const model = wbsData.models.find(m => m.id === modelId);
                if (!model) return;

                const modelNodeId = `model-${kpiId}-${task.id}-${modelId}`;
                const modelY = taskY + modelIndex * nodeSpacing;

                // 模型节点
                nodes.push({
                  id: modelNodeId,
                  type: 'custom',
                  position: { x: 50 + levelSpacing * 2, y: modelY },
                  data: {
                    id: model.name,
                    label: `${model.software}`,
                    type: 'model',
                    badge: model.type,
                    hasChildren: false,
                  },
                  sourcePosition: Position.Right,
                  targetPosition: Position.Left,
                });

                // Task → Model 边
                edges.push({
                  id: `edge-${taskNodeId}-${modelNodeId}`,
                  source: taskNodeId,
                  target: modelNodeId,
                  type: 'smoothstep',
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#64748b',
                    width: 10,
                    height: 10,
                  },
                  style: {
                    stroke: '#94a3b8',
                    strokeWidth: 1.5,
                  },
                });
              });

              taskY += (task.models!.length) * nodeSpacing;
            } else {
              taskY += nodeSpacing;
            }
          });

          currentY = taskY + nodeSpacing;
        } else {
          currentY += nodeSpacing;
        }
      });
    }

    return { nodes, edges };
  }, [kpis, selectedKPISystem, viewMode, collapsedNodes, handleToggle]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 当 collapsedNodes 改变时，更新节点和边
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#e2e8f0" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.type) {
              case 'kpi':
                return '#3b82f6';
              case 'task':
                return '#10b981';
              case 'model':
                return '#8b5cf6';
              default:
                return '#64748b';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: '#f8fafc',
          }}
        />
      </ReactFlow>
    </div>
  );
}