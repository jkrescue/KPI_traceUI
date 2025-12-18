import { X, ArrowRight, ArrowLeft, Target, Gauge, Wrench, FlaskConical, CheckCircle2, XCircle, AlertCircle, FileCode, ListTodo, Flame, Database, Clock, User, GitBranch } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { KPIMetrics } from '../data/graphData';
import { kpiToTaskMapping, TaskTemplate, ModelBinding } from '../data/wbsData';

interface NodeDetailPanelProps {
  node: Node;
  onClose: () => void;
  edges: Edge[];
}

export function NodeDetailPanel({ node, onClose, edges }: NodeDetailPanelProps) {
  const incomingEdges = edges.filter(e => e.target === node.id);
  const outgoingEdges = edges.filter(e => e.source === node.id);
  const feedbackEdges = edges.filter(e => e.source === node.id && e.style?.dashArray);

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'goal':
        return { icon: Target, label: '顶层目标', color: 'text-purple-600' };
      case 'kpi':
        return { icon: Gauge, label: '指标层', color: 'text-blue-600' };
      case 'design':
        return { icon: Wrench, label: '设计参数', color: 'text-green-600' };
      case 'verify':
        return { icon: FlaskConical, label: '仿真验证', color: 'text-red-600' };
      default:
        return { icon: Target, label: '未知', color: 'text-slate-600' };
    }
  };

  const categoryInfo = getCategoryInfo(node.data.category);
  const CategoryIcon = categoryInfo.icon;

  // 获取模型信息
  const getModelInfo = (modelType: string | null | undefined) => {
    switch (modelType) {
      case 'sysml':
        return { name: 'SysML', color: 'blue', desc: '功能建模' };
      case 'simulink':
        return { name: 'Simulink', color: 'purple', desc: '控制建模' };
      case 'modelica':
        return { name: 'Modelica', color: 'green', desc: '性能建模' };
      case 'fmu':
        return { name: 'FMU', color: 'orange', desc: '性能建模' };
      default:
        return null;
    }
  };

  const metrics = node.data.metrics as KPIMetrics | undefined;
  const modelInfo = metrics?.modelType ? getModelInfo(metrics.modelType) : null;

  // 获取KPI对应的任务和模型数据（新增）
  // 支持二级指标：如果是二级指标，通过parentId找到一级指标的任务
  let wbsData: typeof kpiToTaskMapping[string] | undefined;
  if (node.data.category === 'kpi') {
    if (node.data.parentId && kpiToTaskMapping[node.data.parentId]) {
      // 二级指标：使用父级指标的任务数据
      wbsData = kpiToTaskMapping[node.data.parentId];
    } else if (kpiToTaskMapping[node.id]) {
      // 一级指标：直接使用自己的任务数据
      wbsData = kpiToTaskMapping[node.id];
    }
  }
  
  const criticalTasks = wbsData?.tasks.filter(t => t.criticality === 'Critical') || [];
  const normalTasks = wbsData?.tasks.filter(t => t.criticality !== 'Critical') || [];
  
  // 任务类型图标和颜色
  const getTaskTypeInfo = (type: TaskTemplate['type']) => {
    switch (type) {
      case 'CAE':
        return { label: 'CAE仿真', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      case 'Test':
        return { label: '台架测试', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'Design':
        return { label: '设计优化', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' };
      case 'Validation':
        return { label: '验证分析', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
      case 'Control':
        return { label: '控制策略', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' };
      default:
        return { label: '其他', color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' };
    }
  };

  return (
    <div className="absolute top-28 right-4 bottom-4 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-20 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <CategoryIcon className={`w-5 h-5 ${categoryInfo.color}`} />
            <span className={`text-sm ${categoryInfo.color}`}>{categoryInfo.label}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-slate-900">{node.data.id}</h3>
        {node.data.description && (
          <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">
            {node.data.description}
          </p>
        )}

        {/* KPI指标状态 */}
        {node.data.category === 'kpi' && metrics && (
          <div className="mt-4 space-y-2">
            {/* 达成状态 */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              metrics.achieved ? 'bg-green-100 border border-green-300' :
              (metrics.achievementRate && metrics.achievementRate >= 70) ? 'bg-yellow-100 border border-yellow-300' :
              'bg-red-100 border border-red-300'
            }`}>
              {metrics.achieved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">已达成</span>
                </>
              ) : (
                <>
                  {(metrics.achievementRate && metrics.achievementRate >= 70) ? (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${
                    (metrics.achievementRate && metrics.achievementRate >= 70) ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    未达成 ({metrics.achievementRate}%)
                  </span>
                </>
              )}
            </div>

            {/* 模型覆盖状态 */}
            {metrics.modelCovered && modelInfo ? (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${modelInfo.color}-100 border border-${modelInfo.color}-300`}>
                <FileCode className={`w-4 h-4 text-${modelInfo.color}-600`} />
                <div className="flex-1">
                  <span className={`text-sm text-${modelInfo.color}-700`}>{modelInfo.name} 模型</span>
                  <span className={`text-xs text-${modelInfo.color}-600 ml-2`}>({modelInfo.desc})</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-300">
                <AlertCircle className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-700">无模型覆盖</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Incoming Connections */}
        {incomingEdges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <h4 className="text-slate-900">来源节点</h4>
              <span className="text-xs text-slate-500">({incomingEdges.length})</span>
            </div>
            <div className="space-y-2">
              {incomingEdges.map((edge, idx) => {
                const sourceNode = edges.find(e => e.id === edge.id);
                return (
                  <div 
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700"
                  >
                    {edge.source}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Outgoing Connections */}
        {outgoingEdges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <h4 className="text-slate-900">目标节点</h4>
              <span className="text-xs text-slate-500">({outgoingEdges.length})</span>
            </div>
            <div className="space-y-2">
              {outgoingEdges.map((edge, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700"
                >
                  {edge.target}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Connections */}
        {feedbackEdges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 border-2 border-dashed border-red-400 rounded"></div>
              <h4 className="text-slate-900">反馈验证</h4>
              <span className="text-xs text-slate-500">({feedbackEdges.length})</span>
            </div>
            <div className="space-y-2">
              {feedbackEdges.map((edge, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700"
                >
                  {edge.target}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI对应的任务和模型数据（新增） */}
        {node.data.category === 'kpi' && wbsData && (
          <>
            {/* 未达标警告（如果存在）*/}
            {wbsData.isUnderperforming && (
              <div className="pt-4 border-t-2 border-rose-200">
                <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-lg border-2 border-rose-300">
                  <Flame className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-rose-900 mb-1 flex items-center gap-2">
                      <span>⚠️ 指标未达标 - 需重点关注</span>
                    </h4>
                    {wbsData.underperformingSpecs && wbsData.underperformingSpecs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-rose-700">未达标项：</p>
                        {wbsData.underperformingSpecs.map((spec, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-rose-800">
                            <div className="w-1 h-1 rounded-full bg-rose-600"></div>
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 任务追溯 */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <ListTodo className="w-5 h-5 text-emerald-600" />
                <h4 className="text-slate-900">任务分解 (WBS)</h4>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {wbsData.tasks.length} 项
                </span>
              </div>

              {/* 责任人和团队信息 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded border border-blue-200">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-blue-600">负责人</div>
                    <div className="text-xs text-blue-900 truncate">{wbsData.owner}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded border border-purple-200">
                  <GitBranch className="w-3.5 h-3.5 text-purple-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-purple-600">执行团队</div>
                    <div className="text-xs text-purple-900 truncate">{wbsData.team}</div>
                  </div>
                </div>
              </div>

              {/* 关键任务列表 */}
              {criticalTasks.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <h5 className="text-sm text-slate-800">关键任务</h5>
                    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                      {criticalTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {criticalTasks.map((task, idx) => {
                      const taskTypeInfo = getTaskTypeInfo(task.type);
                      return (
                        <div 
                          key={task.id}
                          className={`p-3 rounded-lg border-2 ${taskTypeInfo.borderColor} ${taskTypeInfo.bgColor} transition-all hover:shadow-md`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm ${taskTypeInfo.color}`}>{task.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${taskTypeInfo.bgColor} ${taskTypeInfo.color} border ${taskTypeInfo.borderColor}`}>
                                  {taskTypeInfo.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{task.estimatedDays}天</span>
                            </div>
                            <div className={`text-[10px] px-2 py-0.5 rounded ${
                              task.priority === 'High' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {task.priority} Priority
                            </div>
                          </div>
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <ArrowRight className="w-3 h-3" />
                                <span>依赖: {task.dependencies.join(', ')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 常规任务列表 */}
              {normalTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ListTodo className="w-4 h-4 text-slate-500" />
                    <h5 className="text-sm text-slate-700">常规任务</h5>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {normalTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {normalTasks.map((task, idx) => {
                      const taskTypeInfo = getTaskTypeInfo(task.type);
                      return (
                        <div 
                          key={task.id}
                          className={`p-2.5 rounded border ${taskTypeInfo.borderColor} ${taskTypeInfo.bgColor} hover:shadow-sm transition-all`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-xs ${taskTypeInfo.color}`}>{task.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${taskTypeInfo.bgColor} ${taskTypeInfo.color}`}>
                              {taskTypeInfo.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{task.description}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedDays}天</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 模型追溯 */}
            {wbsData.models && wbsData.models.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-slate-900">关联仿真模型</h4>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {wbsData.models.length} 个
                  </span>
                </div>
                <div className="space-y-2">
                  {wbsData.models.map((model, idx) => (
                    <div 
                      key={model.id}
                      className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-100 border border-indigo-300 flex items-center justify-center flex-shrink-0">
                          <Database className="w-4 h-4 text-indigo-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-indigo-900">{model.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                              {model.software}
                            </span>
                            <span className="text-[10px] text-indigo-600">
                              {model.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{model.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Statistics */}
        {node.data.category !== 'kpi' && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-slate-900 mb-3">连接统计</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl text-blue-600">{incomingEdges.length}</div>
                <div className="text-xs text-blue-600 mt-1">输入连接</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl text-green-600">{outgoingEdges.length}</div>
                <div className="text-xs text-green-600 mt-1">输出连接</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}