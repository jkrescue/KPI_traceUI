import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, XCircle, FileCode, GitCommit, Flame, ListTodo } from 'lucide-react';
import { kpiToTaskMapping } from '../data/wbsData';

export const CustomNode = memo(({ data }: NodeProps) => {
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'goal':
        return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 text-purple-900';
      case 'kpi':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 text-blue-900';
      case 'design':
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 text-green-900';
      case 'verify':
        return 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 text-red-900';
      default:
        return 'bg-white border-slate-300 text-slate-900';
    }
  };

  const getHighlightStyle = (category: string) => {
    switch (category) {
      case 'goal':
        return 'shadow-2xl shadow-purple-400/50 border-purple-500 scale-105 ring-4 ring-purple-300/50';
      case 'kpi':
        return 'shadow-2xl shadow-blue-400/50 border-blue-600 scale-105 ring-4 ring-blue-300/50';
      case 'design':
        return 'shadow-2xl shadow-green-400/50 border-green-600 scale-105 ring-4 ring-green-300/50';
      case 'verify':
        return 'shadow-2xl shadow-red-400/50 border-red-600 scale-105 ring-4 ring-red-300/50';
      default:
        return 'shadow-2xl shadow-slate-400/50 border-slate-500 scale-105 ring-4 ring-slate-300/50';
    }
  };

  const baseStyle = getCategoryStyle(data.category);
  const highlightStyle = data.isSelected ? getHighlightStyle(data.category) : 
                        data.isHighlighted ? 'shadow-xl border-opacity-100' : '';

  // 获取模型类型图标颜色
  const getModelTypeColor = (modelType: string | null | undefined) => {
    switch (modelType) {
      case 'sysml': return 'text-blue-600';
      case 'simulink': return 'text-purple-600';
      case 'modelica': return 'text-green-600';
      case 'fmu': return 'text-orange-600';
      default: return 'text-slate-400';
    }
  };

  // 获取达成状态
  const getAchievementStatus = () => {
    if (!data.metrics) return null;
    
    if (data.metrics.achieved) {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    } else if (data.metrics.achievementRate && data.metrics.achievementRate >= 70) {
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  // 获取KPI对应的任务数据（新增）
  // 支持二级指标：如果是二级指标，通过parentId找到一级指标的任务
  let wbsData;
  if (data.category === 'kpi') {
    if (data.parentId && kpiToTaskMapping[data.parentId]) {
      // 二级指标：使用父级指标的任务数据
      wbsData = kpiToTaskMapping[data.parentId];
    } else if (kpiToTaskMapping[data.id]) {
      // 一级指标：直接使用自己的任务数据
      wbsData = kpiToTaskMapping[data.id];
    }
  }
  
  const criticalTaskCount = wbsData?.tasks.filter(t => t.criticality === 'Critical').length || 0;
  const totalTaskCount = wbsData?.tasks.length || 0;

  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[200px] max-w-[280px] transition-all duration-300 hover:shadow-lg bg-white shadow-sm ${baseStyle} ${highlightStyle} relative`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400 border-2 border-white" />
      
      {/* 版本变更标识 - 左上角 */}
      {data.hasVersionChange && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="relative">
            <div className="bg-orange-500 text-white rounded-full p-1 shadow-lg border-2 border-white">
              <GitCommit className="w-3 h-3" />
            </div>
            <div className="absolute inset-0 animate-ping">
              <div className="bg-orange-400 rounded-full p-1 opacity-75">
                <GitCommit className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 版本号显示 - KPI节点在右上角显示版本号 */}
      {data.category === 'kpi' && data.versionInfo?.currentVersion && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md border border-white">
            {data.versionInfo.currentVersion}
          </div>
        </div>
      )}
      
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-1">
            {/* 折叠按钮 */}
            {data.hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onToggleCollapse?.();
                }}
                className="hover:bg-slate-100 rounded p-0.5 transition-colors"
              >
                {data.isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
            )}
            <div className="font-bold text-slate-800">{data.id}</div>
          </div>
          
          {/* KPI指标状态标识 */}
          {data.category === 'kpi' && (
            <div className="flex items-center gap-1">
              {data.metrics?.modelCovered && (
                <FileCode className={`w-4 h-4 ${getModelTypeColor(data.metrics.modelType)}`} title={`${data.metrics.modelType?.toUpperCase()} 模型`} />
              )}
              {getAchievementStatus()}
            </div>
          )}
        </div>
        
        {data.description && (
          <div className="text-sm text-slate-600 whitespace-pre-line leading-snug">
            {data.description}
          </div>
        )}

        {/* 达成率显示 */}
        {data.category === 'kpi' && data.metrics && !data.metrics.achieved && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-500">达成率: <span className="text-rose-600">{data.metrics.achievementRate}%</span></div>
          </div>
        )}

        {/* KPI任务摘要徽章（新增 - 优化版）*/}
        {data.category === 'kpi' && wbsData && totalTaskCount > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              {/* 总任务数 */}
              <div className="flex items-center gap-1.5 text-xs">
                <ListTodo className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600">{totalTaskCount} 项任务</span>
              </div>
              
              {/* 关键任务标记 */}
              {criticalTaskCount > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 border border-rose-200">
                  <Flame className="w-3 h-3 text-rose-600" />
                  <span className="text-xs text-rose-700 font-medium">{criticalTaskCount}</span>
                </div>
              )}
            </div>
            
            {/* 未达标指标的团队标记 */}
            {wbsData.isUnderperforming && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
                <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                <span>{wbsData.team}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400 border-2 border-white" />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';