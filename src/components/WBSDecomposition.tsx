import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  ChevronRight, ChevronDown, Network, Database, Cpu, 
  CheckCircle2, Clock, AlertCircle, User, Calendar,
  GitBranch, Layers, Box, Shield, Activity, Target, TrendingUp,
  AlertTriangle, Flame
} from 'lucide-react';
import { kpiToTaskMapping, wbsTree, teamConfig, WBSTask } from '../data/wbsData';

interface WBSDecompositionProps {
  selectedKPI?: string;
}

export function WBSDecomposition({ selectedKPI }: WBSDecompositionProps) {
  const [expandedKPIs, setExpandedKPIs] = useState<Set<string>>(new Set(['KPI_NVH', 'KPI_SpaceGain'])); // 默认展开未达标指标
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showWBSTree, setShowWBSTree] = useState(false);
  const [expandedWBSNodes, setExpandedWBSNodes] = useState<Set<string>>(new Set(['WBS_Root', 'WBS_MechDesign', 'WBS_ActuatorSystem']));

  // Calculate statistics
  const stats = useMemo(() => {
    const allTasks = Object.values(kpiToTaskMapping).flatMap(wbs => wbs.tasks);
    const allModels = Object.values(kpiToTaskMapping).flatMap(wbs => wbs.models);
    const totalDays = allTasks.reduce((sum, task) => sum + task.estimatedDays, 0);
    const highPriorityTasks = allTasks.filter(t => t.priority === 'High').length;
    const criticalTasks = allTasks.filter(t => t.criticality === 'Critical').length;
    const underperformingKPIs = Object.values(kpiToTaskMapping).filter(wbs => wbs.isUnderperforming).length;
    
    return {
      totalTasks: allTasks.length,
      totalModels: allModels.length,
      totalDays,
      highPriorityTasks,
      criticalTasks,
      underperformingKPIs,
      kpiCount: Object.keys(kpiToTaskMapping).length,
    };
  }, []);

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

  const toggleWBSNode = (nodeId: string) => {
    const newExpanded = new Set(expandedWBSNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedWBSNodes(newExpanded);
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'CAE': return <Database className="w-3 h-3" />;
      case 'Design': return <Layers className="w-3 h-3" />;
      case 'Test': return <Activity className="w-3 h-3" />;
      case 'Validation': return <CheckCircle2 className="w-3 h-3" />;
      case 'Control': return <Cpu className="w-3 h-3" />;
      default: return <Box className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'in-progress':
        return { icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'completed':
        return { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'planned':
        return { icon: AlertCircle, color: 'text-slate-500 bg-slate-50 border-slate-200' };
      default:
        return { icon: Clock, color: 'text-slate-400 bg-slate-50 border-slate-200' };
    }
  };

  const renderWBSTreeNode = (node: any, level: number = 0) => {
    const isExpanded = expandedWBSNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const statusConfig = getStatusConfig(node.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div key={node.id} className="text-sm">
        <div 
          className={`
            flex items-center gap-2 py-2 px-3 rounded hover:bg-slate-50 cursor-pointer group transition-colors
            ${level === 0 ? 'font-bold text-slate-900' : ''}
            ${level === 1 ? 'font-medium text-slate-800' : ''}
            ${level === 2 ? 'text-slate-700' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => hasChildren && toggleWBSNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            )
          ) : (
            <div className="w-4 h-4 shrink-0"></div>
          )}
          
          <StatusIcon className={`w-4 h-4 shrink-0 ${statusConfig.color.split(' ')[0]}`} />
          
          <span className="flex-1">{node.name}</span>
          
          {node.team && level === 1 && (
            <Badge variant="outline" className="text-xs bg-white">
              {node.team}
            </Badge>
          )}
          
          {node.duration && level === 2 && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              {node.duration}
            </div>
          )}
          
          {node.owner && level === 2 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
              {node.owner}
            </div>
          )}

          {node.relatedKPI && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              {node.relatedKPI}
            </Badge>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child: any) => renderWBSTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex gap-2 bg-white p-1 rounded border border-slate-200">
        <button
          onClick={() => setShowWBSTree(false)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded flex items-center justify-center gap-2 transition-all ${
            !showWBSTree ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Network className="w-4 h-4" />
          指标→任务→模型
        </button>
        <button
          onClick={() => setShowWBSTree(true)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded flex items-center justify-center gap-2 transition-all ${
            showWBSTree ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          WBS 结构树
        </button>
      </div>

      {/* Main Content */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {!showWBSTree ? (
          /* 指标→任务→模型视图 */
          <div className="divide-y divide-slate-100">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Network className="w-5 h-5 text-emerald-700" />
                  指标→任务→模型 自动分解 (WBS 自动化)
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white text-xs">
                    {stats.kpiCount} 个 KPI · {stats.totalTasks} 个任务
                  </Badge>
                  {stats.underperformingKPIs > 0 && (
                    <Badge className="bg-rose-500 text-white text-xs font-bold animate-pulse">
                      <Flame className="w-3 h-3 mr-1" />
                      {stats.underperformingKPIs} 个未达标指标
                    </Badge>
                  )}
                  {stats.criticalTasks > 0 && (
                    <Badge className="bg-amber-500 text-white text-xs font-bold">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {stats.criticalTasks} 个关键任务
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {Object.entries(kpiToTaskMapping).map(([kpiId, wbsData]) => {
                const isExpanded = expandedKPIs.has(kpiId);
                const isSelected = selectedKPI === kpiId;
                const isUnderperforming = wbsData.isUnderperforming;

                return (
                  <div 
                    key={kpiId} 
                    className={`border-l-4 transition-all ${
                      isUnderperforming 
                        ? 'border-rose-500 bg-rose-50/20' 
                        : isSelected 
                          ? 'border-emerald-500 bg-emerald-50/30' 
                          : 'border-transparent'
                    }`}
                  >
                    {/* KPI Header */}
                    <div 
                      className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                        isUnderperforming ? 'bg-rose-50/10' : ''
                      }`}
                      onClick={() => toggleKPI(kpiId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        
                        {/* 未达标指标的特殊标记 */}
                        {isUnderperforming && (
                          <div className="shrink-0 p-1.5 bg-rose-100 rounded-full border border-rose-300 animate-pulse">
                            <Flame className="w-4 h-4 text-rose-600" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`font-bold ${
                              isUnderperforming ? 'text-rose-900' : 'text-slate-900'
                            }`}>{kpiId}</span>
                            {isUnderperforming && (
                              <Badge className="text-xs bg-rose-500 text-white border-none font-bold">
                                未达标 - 重点关注
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {wbsData.tasks.length} 任务
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {wbsData.models.length} 模型
                            </Badge>
                            {isUnderperforming && (
                              <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                                {wbsData.tasks.filter(t => t.criticality === 'Critical').length} 关键任务
                              </Badge>
                            )}
                          </div>
                          <div className={`text-sm ${
                            isUnderperforming ? 'text-rose-700 font-medium' : 'text-slate-600'
                          }`}>{wbsData.name}</div>
                          
                          {/* 显示具体未达标的规格 */}
                          {isUnderperforming && wbsData.underperformingSpecs && (
                            <div className="mt-2 flex items-start gap-2 p-2 bg-rose-50 rounded border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div className="text-xs text-rose-800">
                                <span className="font-semibold">未达标规格：</span>
                                <span className="ml-1">{wbsData.underperformingSpecs.join(' | ')}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <User className="w-4 h-4" />
                            <span>{wbsData.owner}</span>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {wbsData.team}
                          </Badge>
                          {wbsData.duration && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-4 h-4" />
                              <span>{wbsData.duration}周</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 bg-slate-50/50">
                        {/* Tasks Section */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-slate-200">
                            <Layers className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-bold text-slate-700">任务列表</span>
                            {isUnderperforming && (
                              <Badge className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                                含{wbsData.tasks.filter(t => t.criticality === 'Critical').length}个关键任务
                              </Badge>
                            )}
                          </div>
                          
                          {wbsData.tasks.map((task) => {
                            const isTaskExpanded = expandedTasks.has(task.id);
                            const isCritical = task.criticality === 'Critical';
                            
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
                                    isCritical 
                                      ? 'hover:bg-rose-50' 
                                      : 'hover:bg-slate-50'
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
                                    
                                    {/* 关键任务的火焰标记 */}
                                    {isCritical && (
                                      <div className="shrink-0 p-1 bg-rose-100 rounded border border-rose-300">
                                        <Flame className="w-3 h-3 text-rose-600" />
                                      </div>
                                    )}
                                    
                                    <div className={`p-1.5 rounded border ${
                                      task.type === 'CAE' ? 'bg-blue-50 border-blue-200' :
                                      task.type === 'Test' ? 'bg-purple-50 border-purple-200' :
                                      task.type === 'Control' ? 'bg-indigo-50 border-indigo-200' :
                                      task.type === 'Validation' ? 'bg-emerald-50 border-emerald-200' :
                                      'bg-slate-50 border-slate-200'
                                    }`}>
                                      {getTaskTypeIcon(task.type)}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className={`font-medium text-sm ${
                                        isCritical ? 'text-rose-900' : 'text-slate-900'
                                      }`}>
                                        {task.name}
                                        {isCritical && (
                                          <span className="ml-2 text-xs font-bold text-rose-600">[关键]</span>
                                        )}
                                      </div>
                                    </div>

                                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </Badge>
                                    
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                      <Clock className="w-3 h-3" />
                                      {task.estimatedDays}天
                                    </div>
                                  </div>
                                </div>

                                {isTaskExpanded && (
                                  <div className={`px-3 pb-3 pt-1 border-t ${
                                    isCritical 
                                      ? 'bg-rose-50/30 border-rose-100' 
                                      : 'bg-slate-50 border-slate-100'
                                  }`}>
                                    <div className="text-sm text-slate-600 mb-2">{task.description}</div>
                                    <div className="flex items-center gap-4 text-xs">
                                      <Badge variant="outline" className="bg-white">{task.type}</Badge>
                                      {isCritical && (
                                        <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                                          关键任务 - 需优先处理
                                        </Badge>
                                      )}
                                      {task.dependencies && task.dependencies.length > 0 && (
                                        <div className="flex items-center gap-1 text-amber-600">
                                          <AlertCircle className="w-3 h-3" />
                                          <span>依赖: {task.dependencies.join(', ')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Models Section */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-slate-200">
                            <Database className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-bold text-slate-700">关联模型</span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {wbsData.models.map((model) => (
                              <div key={model.id} className="bg-white p-3 rounded border border-slate-200 hover:shadow-sm transition-shadow">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded bg-indigo-50 border border-indigo-200">
                                    <Database className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-slate-900 text-sm mb-1">{model.name}</div>
                                    <div className="text-xs text-slate-600 mb-2">{model.description}</div>
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
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* WBS 结构树视图 */
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-emerald-700" />
                  研发任务 WBS 结构树
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    进行中
                  </Badge>
                  <Badge variant="outline" className="bg-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    计划中
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-2 max-h-[600px] overflow-y-auto">
              {renderWBSTreeNode(wbsTree)}
            </div>

            {/* Team Legend */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-600 mb-2">团队配置</div>
              <div className="flex flex-wrap gap-2">
                {teamConfig.map((team) => (
                  <Badge 
                    key={team.id} 
                    variant="outline" 
                    className="text-xs bg-white"
                    style={{ borderColor: team.color, color: team.color }}
                  >
                    {team.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Info Panel */}
      <Card className={`p-4 border ${
        stats.underperformingKPIs > 0 
          ? 'bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <div className="flex gap-3">
          <div className="shrink-0">
            <div className={`p-2 rounded ${
              stats.underperformingKPIs > 0 ? 'bg-rose-100' : 'bg-blue-100'
            }`}>
              {stats.underperformingKPIs > 0 ? (
                <Flame className="w-5 h-5 text-rose-600" />
              ) : (
                <Network className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 mb-1 text-sm flex items-center gap-2">
              {stats.underperformingKPIs > 0 ? (
                <>
                  <span>WBS 自动化 - 风险预警</span>
                  <Badge className="bg-rose-500 text-white text-xs">
                    {stats.underperformingKPIs} 个未达标指标
                  </Badge>
                </>
              ) : (
                'WBS 自动化说明'
              )}
            </div>
            <div className="text-xs text-slate-700 leading-relaxed">
              系统根据<span className="font-medium text-blue-700">指标拓扑图</span>自动匹配任务模板，绑定仿真模型，并生成 WBS 结构。
              <span className="font-medium text-blue-700"> 任务依赖关系</span>已自动识别，
              <span className="font-medium text-blue-700"> 责任人与排期</span>根据团队资源自动分配。
              {stats.underperformingKPIs > 0 && (
                <>
                  <br />
                  <span className="font-bold text-rose-700 mt-1 inline-block">
                    ⚠️ 检测到 {stats.underperformingKPIs} 个未达标指标，已自动生成 {stats.criticalTasks} 个关键任务（标记为 <Flame className="w-3 h-3 inline text-rose-600" />），
                    需优先处理以确保指标达成。
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
