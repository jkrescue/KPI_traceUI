import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  ChevronRight, ChevronDown, Network, Database, 
  Clock, AlertCircle, User, X,
  Layers, Flame, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2
} from 'lucide-react';
import { kpiToTaskMapping, TaskTemplate, ModelBinding } from '../data/wbsData';
import { DesignScheme } from '../data/tradeoffData';
import { kpiDefinitions } from '../data/kpiDefinitions';
import { KPISystem } from '../data/kpiSystems';

interface WBSDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScheme: DesignScheme | null;
  selectedKPISystem: KPISystem | null;
  onConfirm: () => void;
}

// 任务流程图组件
function TaskFlowChart({ tasks }: { tasks: TaskTemplate[] }) {
  // 构建依赖关系图
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  
  // 找到起始任务（没有依赖的任务）
  const startTasks = tasks.filter(t => !t.dependencies || t.dependencies.length === 0);
  
  // 计算任务层级（用于布局）
  const getTaskLevel = (task: TaskTemplate, visited = new Set<string>()): number => {
    if (visited.has(task.id)) return 0;
    visited.add(task.id);
    
    if (!task.dependencies || task.dependencies.length === 0) return 0;
    
    const depLevels = task.dependencies
      .map(depId => taskMap.get(depId))
      .filter(dep => dep !== undefined)
      .map(dep => getTaskLevel(dep!, visited));
    
    return depLevels.length > 0 ? Math.max(...depLevels) + 1 : 0;
  };
  
  // 按层级组织任务
  const tasksByLevel: TaskTemplate[][] = [];
  tasks.forEach(task => {
    const level = getTaskLevel(task);
    if (!tasksByLevel[level]) tasksByLevel[level] = [];
    tasksByLevel[level].push(task);
  });

  return (
    <div className="p-4 bg-white rounded border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Network className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-bold text-slate-700">任务执行链路</span>
      </div>
      
      <div className="flex items-start gap-2 overflow-x-auto pb-2">
        {tasksByLevel.map((levelTasks, levelIndex) => (
          <React.Fragment key={levelIndex}>
            {/* 任务列 */}
            <div className="flex flex-col gap-2 min-w-[180px]">
              {levelTasks.map(task => {
                const isCritical = task.criticality === 'Critical';
                return (
                  <div 
                    key={task.id}
                    className={`p-2 rounded border text-xs ${
                      isCritical 
                        ? 'bg-rose-50 border-rose-300 shadow-sm' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className={`font-medium mb-1 ${
                      isCritical ? 'text-rose-900' : 'text-slate-900'
                    }`}>
                      {task.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      {task.owner && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>xx工</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>xx天</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 箭头 */}
            {levelIndex < tasksByLevel.length - 1 && (
              <div className="flex items-center justify-center min-w-[24px] pt-4">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function WBSDrawer({ isOpen, onClose, selectedScheme, selectedKPISystem, onConfirm }: WBSDrawerProps) {
  const [expandedKPIs, setExpandedKPIs] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});

  // 基于选定方案，筛选未达标的 KPI
  const underperformingKPIs = useMemo(() => {
    if (!selectedScheme) return [];
    
    return Object.entries(selectedScheme.kpiValues)
      .filter(([kpiId, data]) => data.achievementRate < 100)
      .map(([kpiId, data]) => ({
        kpiId,
        achievementRate: data.achievementRate,
        value: data.value,
        wbsData: kpiToTaskMapping[kpiId],
      }))
      .filter(item => item.wbsData)
      .sort((a, b) => a.achievementRate - b.achievementRate);
  }, [selectedScheme]);

  // 统计信息
  const stats = useMemo(() => {
    const totalTasks = underperformingKPIs.reduce(
      (sum, item) => sum + (item.wbsData?.tasks.length || 0), 
      0
    );
    const criticalTasks = underperformingKPIs.reduce(
      (sum, item) => sum + (item.wbsData?.tasks.filter(t => t.criticality === 'Critical').length || 0),
      0
    );
    const estimatedWeeks = Math.max(
      ...underperformingKPIs.map(item => item.wbsData?.duration || 0)
    );
    const teams = new Set(
      underperformingKPIs.map(item => item.wbsData?.team).filter(Boolean)
    );

    return {
      totalTasks,
      criticalTasks,
      estimatedWeeks,
      teamsCount: teams.size,
      underperformingCount: underperformingKPIs.length,
    };
  }, [underperformingKPIs]);

  const toggleKPI = (kpiId: string) => {
    const newExpanded = new Set(expandedKPIs);
    if (newExpanded.has(kpiId)) {
      newExpanded.delete(kpiId);
    } else {
      newExpanded.add(kpiId);
    }
    setExpandedKPIs(newExpanded);
  };

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'CAE': return <Database className="w-3 h-3 text-blue-600" />;
      case 'Test': return <AlertCircle className="w-3 h-3 text-purple-600" />;
      case 'Control': return <Network className="w-3 h-3 text-indigo-600" />;
      default: return <Layers className="w-3 h-3 text-slate-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'Low': return 'bg-slate-100 text-slate-600 border-slate-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  const handleModelSelect = (taskId: string, modelId: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [taskId]: modelId,
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[75%] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex-1">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Network className="w-5 h-5 text-emerald-700" />
              {selectedScheme?.name} - 任务自动分解
            </h2>
            <p className="text-sm text-slate-600">
              基于指标达成情况自动生成任务清单，并推荐对应的分析模型
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Alert Banner */}
        {stats.underperformingCount > 0 && (
          <div className="p-4 bg-rose-50 border-b border-rose-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-full">
                <Flame className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-rose-900 text-sm">
                  识别到 {stats.underperformingCount} 个未达标指标
                </div>
                <div className="text-xs text-rose-700 mt-0.5">
                  系统已自动生成 {stats.criticalTasks} 个关键任务，需优先处理以确保指标达成
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {underperformingKPIs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-emerald-100 rounded-full mb-4">
                <Network className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="font-bold text-slate-900 mb-2">
                所有指标均已达标！
              </div>
              <div className="text-sm text-slate-600">
                {selectedScheme?.name} 无需额外任务分解
              </div>
            </div>
          ) : (
            <>
              {/* 未达标 KPI 列表 */}
              {underperformingKPIs.map((item) => {
                const isExpanded = expandedKPIs.has(item.kpiId);
                const severityLevel = 
                  item.achievementRate < 80 ? 'critical' :
                  item.achievementRate < 90 ? 'warning' : 'info';
                
                const kpiDef = selectedKPISystem?.kpis[item.kpiId as keyof typeof selectedKPISystem.kpis] || kpiDefinitions[item.kpiId];
                const kpiTarget = selectedKPISystem?.kpis[item.kpiId as keyof typeof selectedKPISystem.kpis]?.target || kpiDefinitions[item.kpiId]?.target;
                const kpiLabel = selectedKPISystem?.kpis[item.kpiId as keyof typeof selectedKPISystem.kpis]?.label || kpiDefinitions[item.kpiId]?.name;
                const kpiDescription = selectedKPISystem?.kpis[item.kpiId as keyof typeof selectedKPISystem.kpis]?.description || kpiDefinitions[item.kpiId]?.description;
                const gap = 100 - item.achievementRate;

                return (
                  <Card 
                    key={item.kpiId}
                    className={`overflow-hidden border-l-4 ${
                      severityLevel === 'critical' ? 'border-rose-500 bg-rose-50/30' :
                      severityLevel === 'warning' ? 'border-amber-500 bg-amber-50/30' :
                      'border-blue-500 bg-blue-50/30'
                    }`}
                  >
                    {/* KPI Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
                      onClick={() => toggleKPI(item.kpiId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        {severityLevel === 'critical' && (
                          <div className="shrink-0 p-1.5 bg-rose-100 rounded-full border border-rose-300 animate-pulse">
                            <Flame className="w-4 h-4 text-rose-600" />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-bold ${
                              severityLevel === 'critical' ? 'text-rose-700' :
                              severityLevel === 'warning' ? 'text-amber-700' :
                              'text-blue-700'
                            }`}>
                              {item.kpiId} - {kpiLabel || '未定义'}
                            </span>
                            <Badge 
                              className={`text-xs font-bold ${
                                severityLevel === 'critical' ? 'bg-rose-500 text-white' :
                                severityLevel === 'warning' ? 'bg-amber-500 text-white' :
                                'bg-blue-500 text-white'
                              }`}
                            >
                              达成率 {item.achievementRate}%
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                              缺口 {gap}%
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.wbsData.tasks.length} 任务
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.wbsData.models.length} 模型
                            </Badge>
                          </div>
                          
                          {/* 目标值 vs 实际值对比 */}
                          <div className="flex items-center gap-4 text-xs mt-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-200">
                              <span className="text-slate-500">目标:</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {kpiTarget || '未定义'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-200">
                              <span className="text-slate-500">当前方案值:</span>
                              <span className={`font-mono font-bold ${
                                item.achievementRate < 80 ? 'text-rose-700' :
                                item.achievementRate < 90 ? 'text-amber-700' :
                                'text-blue-700'
                              }`}>
                                {item.value}
                              </span>
                            </div>
                            {kpiDescription && (
                              <div className="flex-1 text-slate-500 text-xs">
                                {kpiDescription}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 text-sm">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {item.wbsData.team}
                          </Badge>
                          {item.wbsData.duration && (
                            <div className="flex items-center gap-1 text-slate-500 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>xx周</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 bg-white/50">
                        {/* 差距分析提示 */}
                        <div className={`p-3 rounded border ${
                          severityLevel === 'critical' ? 'bg-rose-50 border-rose-200' :
                          severityLevel === 'warning' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                              severityLevel === 'critical' ? 'text-rose-600' :
                              severityLevel === 'warning' ? 'text-amber-600' :
                              'text-blue-600'
                            }`} />
                            <div className="flex-1">
                              <div className={`text-sm font-bold mb-1 ${severityLevel === 'critical' ? 'text-rose-900' : severityLevel === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>
                                改进建议
                              </div>
                              <div className={`text-xs ${severityLevel === 'critical' ? 'text-rose-700' : severityLevel === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>
                                该指标当前达成率为 {item.achievementRate}%，需通过以下 {item.wbsData.tasks.filter(t => t.criticality === 'Critical').length} 个关键任务进行优化改进，
                                预计可将 <span className="font-bold">{kpiLabel}</span> 从 <span className="font-mono font-bold">{item.value}</span> 优化至目标 <span className="font-mono font-bold">{kpiTarget}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 任务流程图 */}
                        <TaskFlowChart tasks={item.wbsData.tasks} />

                        {/* Tasks Section */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-slate-200">
                            <Layers className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-bold text-slate-700">任务清单</span>
                            <Badge className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                              {item.wbsData.tasks.filter(t => t.criticality === 'Critical').length}个关键任务
                            </Badge>
                          </div>

                          {item.wbsData.tasks.map((task) => {
                            const isTaskExpanded = expandedTasks.has(task.id);
                            const isCritical = task.criticality === 'Critical';
                            const taskModels = task.models ? item.wbsData.models.filter(m => task.models?.includes(m.id)) : [];

                            return (
                              <div 
                                key={task.id}
                                className={`bg-white rounded border overflow-hidden ${
                                  isCritical 
                                    ? 'border-rose-300 shadow-sm ring-2 ring-rose-100' 
                                    : 'border-slate-200'
                                }`}
                              >
                                <div 
                                  className={`p-3 cursor-pointer transition-colors ${
                                    isCritical ? 'hover:bg-rose-50' : 'hover:bg-slate-50'
                                  }`}
                                  onClick={() => toggleTask(task.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="shrink-0">
                                      {isTaskExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>

                                    {isCritical && (
                                      <div className="shrink-0 p-1 bg-rose-100 rounded border border-rose-300">
                                        <Flame className="w-3 h-3 text-rose-600" />
                                      </div>
                                    )}

                                    <div className={`p-1.5 rounded border ${
                                      task.type === 'CAE' ? 'bg-blue-50 border-blue-200' :
                                      task.type === 'Test' ? 'bg-purple-50 border-purple-200' :
                                      task.type === 'Control' ? 'bg-indigo-50 border-indigo-200' :
                                      'bg-slate-50 border-slate-200'
                                    }`}>
                                      {getTaskTypeIcon(task.type)}
                                    </div>

                                    <div className="flex-1">
                                      <div className={`font-medium text-sm mb-1 ${
                                        isCritical ? 'text-rose-900' : 'text-slate-900'
                                      }`}>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mr-2">
                                          {item.kpiId}
                                        </span>
                                        <span className="text-xs text-slate-500 mr-2">
                                          {kpiLabel}
                                        </span>
                                        {task.name}
                                        {isCritical && (
                                          <span className="ml-2 text-xs font-bold text-rose-600">[关键]</span>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-3 text-xs">
                                        {task.owner && (
                                          <div className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                            <User className="w-3 h-3" />
                                            <span className="font-medium">xx工</span>
                                          </div>
                                        )}
                                        {task.startDay !== undefined && (
                                          <div className="flex items-center gap-1 text-slate-600">
                                            <span className="text-slate-500">第 xx 天开始</span>
                                          </div>
                                        )}
                                        {task.dependencies && task.dependencies.length > 0 && (
                                          <div className="flex items-center gap-1 text-amber-600">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>依赖 {task.dependencies.length} 个前置任务</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                      </Badge>

                                      <div className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1 bg-slate-50 rounded border border-slate-200">
                                        <Clock className="w-3 h-3" />
                                        xx天
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {isTaskExpanded && (
                                  <div className={`px-3 pb-3 pt-1 border-t space-y-3 ${
                                    isCritical 
                                      ? 'bg-rose-50/30 border-rose-100' 
                                      : 'bg-slate-50 border-slate-100'
                                  }`}>
                                    <div className="text-sm text-slate-600">{task.description}</div>
                                    
                                    <div className="flex items-center gap-4 text-xs flex-wrap">
                                      <Badge variant="outline" className="bg-white">{task.type}</Badge>
                                      {isCritical && (
                                        <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                                          关键任务 - 需优先处理
                                        </Badge>
                                      )}
                                    </div>

                                    {/* 推荐模型选择器 */}
                                    {taskModels.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                          <Database className="w-4 h-4 text-indigo-600" />
                                          推荐分析模型
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-2">
                                          {taskModels.map(model => {
                                            const isSelected = selectedModels[task.id] === model.id;
                                            return (
                                              <div 
                                                key={model.id}
                                                className={`p-2 rounded border cursor-pointer transition-all ${
                                                  isSelected 
                                                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200' 
                                                    : 'bg-white border-slate-200 hover:border-indigo-300'
                                                }`}
                                                onClick={() => handleModelSelect(task.id, model.id)}
                                              >
                                                <div className="flex items-start gap-2">
                                                  <div className={`p-1.5 rounded ${
                                                    isSelected ? 'bg-indigo-100' : 'bg-slate-100'
                                                  }`}>
                                                    {isSelected ? (
                                                      <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                                    ) : (
                                                      <Database className="w-3 h-3 text-slate-600" />
                                                    )}
                                                  </div>
                                                  <div className="flex-1">
                                                    <div className="text-xs font-medium text-slate-900 mb-1">
                                                      {model.name}
                                                    </div>
                                                    <div className="text-xs text-slate-600 mb-1">
                                                      {model.description}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                                                        {model.software}
                                                      </Badge>
                                                      <Badge variant="outline" className="text-xs">
                                                        {model.type}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}

              {/* Summary Card */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Network className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-sm mb-1">
                      {selectedScheme?.name} - 总体资源评估
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-500">总任务数：</span>
                        <span className="font-bold">{stats.totalTasks} 项</span>
                      </div>
                      <div>
                        <span className="text-slate-500">关键任务：</span>
                        <span className="font-bold text-rose-600">{stats.criticalTasks} 项</span>
                      </div>
                      <div>
                        <span className="text-slate-500">预估工期：</span>
                        <span className="font-bold">xx 周</span>
                      </div>
                      <div>
                        <span className="text-slate-500">涉及团队：</span>
                        <span className="font-bold">{stats.teamsCount} 个</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回重新选择
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            确认任务并开始评估
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
