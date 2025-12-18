import React, { useState, useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { 
  Settings, GitBranch, BarChart2, ArrowRight, Check, 
  Info, AlertTriangle, RotateCcw, Save, Layers, 
  Activity, Cpu, Database, Zap, ChevronRight, 
  MousePointer2, Table as TableIcon, LayoutDashboard,
  Target, Sparkles, Car, CheckCircle2, TrendingUp
} from 'lucide-react';
import { topLevelMetrics, designSchemes, metricDecompositionTemplate, DesignScheme, TopLevelMetric } from '../data/tradeoffData';
import { WBSDrawer } from './WBSDrawer';
import { KPISystemSelection } from './KPISystemSelection';
import { 
  KPISystem, 
  recommendedKPISystems, 
  existingVehicleKPISystems, 
  recommendKPISystems 
} from '../data/kpiSystems';

interface TradeoffAnalysisProps {
  onProceedToEvaluation: (selectedScheme: DesignScheme) => void;
}

type WorkflowStep = 'define' | 'kpi-selection' | 'decompose' | 'compare';
type ViewMode = 'radar' | 'table' | 'scatter';

// 模拟的子系统压力数据
const calculateSystemStress = (metrics: TopLevelMetric[]) => {
  const weights = metrics.reduce((acc, m) => ({ ...acc, [m.id]: m.weight }), {} as Record<string, number>);
  return [
    { name: '电机驱动系统', value: (weights.performance || 0) * 80 + (weights.lightweight || 0) * 40, limit: 80 },
    { name: '机械锁止机构', value: (weights.safety || 0) * 90 + (weights.space || 0) * 30, limit: 85 },
    { name: '控制器算力', value: (weights.performance || 0) * 60 + (weights.safety || 0) * 50, limit: 70 },
    { name: '结构材料强度', value: (weights.lightweight || 0) * 85 + (weights.cost || 0) * 20, limit: 75 },
  ];
};

export function TradeoffAnalysis({ onProceedToEvaluation }: TradeoffAnalysisProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('define');
  const [selectedScheme, setSelectedScheme] = useState<string>('scheme-b');
  const [viewMode, setViewMode] = useState<ViewMode>('radar');
  const [isWBSDrawerOpen, setIsWBSDrawerOpen] = useState(false);
  
  // Custom Metrics State
  const [customMetrics, setCustomMetrics] = useState<TopLevelMetric[]>(
    topLevelMetrics.map(m => ({ ...m }))
  );
  const [useCustomWeights, setUseCustomWeights] = useState(false);
  
  // KPI System Selection State
  const [selectedKPISystem, setSelectedKPISystem] = useState<KPISystem | null>(null);
  
  // KPI Simulation State - 使用 useMemo 确保与选中的KPI体系保持一致
  const defaultKpiTargets = useMemo(() => {
    if (!selectedKPISystem) {
      return {
        'KPI_FoldTime': 1.5,
        'KPI_FoldAngle': 120,
        'KPI_SpaceGain': 160,
        'KPI_NVH': 45
      };
    }
    
    // 从selectedKPISystem中提取数值
    const parseTarget = (target: string): number => {
      const match = target.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    };
    
    return {
      'KPI_FoldTime': parseTarget(selectedKPISystem.kpis.KPI_FoldTime.target),
      'KPI_FoldAngle': parseTarget(selectedKPISystem.kpis.KPI_FoldAngle.target),
      'KPI_SpaceGain': parseTarget(selectedKPISystem.kpis.KPI_SpaceGain.target),
      'KPI_NVH': parseTarget(selectedKPISystem.kpis.KPI_NVH.target)
    };
  }, [selectedKPISystem]);

  const [kpiTargets, setKpiTargets] = useState<Record<string, number>>(defaultKpiTargets);

  // 当selectedKPISystem变化时,更新kpiTargets
  React.useEffect(() => {
    setKpiTargets(defaultKpiTargets);
  }, [defaultKpiTargets]);

  // Handlers
  const handleWeightChange = (metricId: string, newWeight: number) => {
    setUseCustomWeights(true);
    setCustomMetrics(prev =>
      prev.map(m => m.id === metricId ? { ...m, weight: newWeight / 100 } : m)
    );
  };

  const normalizeWeights = () => {
    const total = customMetrics.reduce((sum, m) => sum + m.weight, 0);
    if (total > 0) {
      setCustomMetrics(prev =>
        prev.map(m => ({ ...m, weight: m.weight / total }))
      );
    }
  };

  const applyPreset = (type: 'balanced' | 'performance' | 'cost') => {
    setUseCustomWeights(true);
    let newWeights: Record<string, number> = {};
    
    switch(type) {
      case 'balanced':
        newWeights = { cost: 0.2, lightweight: 0.2, safety: 0.2, space: 0.2, performance: 0.2 };
        break;
      case 'performance':
        newWeights = { cost: 0.1, lightweight: 0.15, safety: 0.25, space: 0.1, performance: 0.4 };
        break;
      case 'cost':
        newWeights = { cost: 0.5, lightweight: 0.1, safety: 0.2, space: 0.1, performance: 0.1 };
        break;
    }

    setCustomMetrics(prev => prev.map(m => ({
      ...m,
      weight: newWeights[m.id] || 0.2
    })));
  };

  const calculateWeightedScore = (scheme: DesignScheme) => {
    const metrics = useCustomWeights ? customMetrics : topLevelMetrics;
    return metrics.reduce((total, metric) => {
      return total + scheme.scores[metric.id] * metric.weight;
    }, 0);
  };

  // Derived Data
  const systemStressData = useMemo(() => calculateSystemStress(customMetrics), [customMetrics]);
  const totalWeight = customMetrics.reduce((sum, m) => sum + m.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01;

  const recommendedScheme = useMemo(() => {
    const scores = designSchemes.map(scheme => ({
      scheme,
      score: calculateWeightedScore(scheme),
    }));
    scores.sort((a, b) => b.score - a.score);
    return scores[0].scheme;
  }, [customMetrics, useCustomWeights]);

  const radarData = useMemo(() => {
    const metrics = useCustomWeights ? customMetrics : topLevelMetrics;
    return metrics.map((metric) => {
      const dataPoint: any = {
        metric: metric.name,
        fullMark: 100,
      };
      designSchemes.forEach((scheme) => {
        dataPoint[scheme.name] = scheme.scores[metric.id];
      });
      return dataPoint;
    });
  }, [useCustomWeights, customMetrics]);

  // KPI System Recommendations based on weights
  const recommendedSystems = useMemo(() => {
    const userWeights = customMetrics.reduce((acc, m) => ({ ...acc, [m.id]: m.weight }), {} as Record<string, number>);
    return recommendKPISystems(userWeights);
  }, [customMetrics]);

  // Helper function to get specs for each KPI
  const getSpecsForKPI = (kpiId: string): string[] => {
    const specsMap: Record<string, string[]> = {
      'KPI_FoldTime': ['启动响应≤0.2s', '完成时间≤1.3s'],
      'KPI_FoldAngle': ['最大角度≥120°', '控制精度±2°'],
      'KPI_SpaceGain': ['垂直增益≥150mm', '进出便利≥20%'],
      'KPI_LockSafe': ['锁止强度≥2000N', '位置精度±0.5mm'],
      'KPI_NVH': ['折叠噪声≤45dB', '振动加速≤2.0'],
      'KPI_Life': ['循环寿命≥100k', '性能衰减≤10%']
    };
    return specsMap[kpiId] || [];
  };

  // Steps Configuration
  const steps = [
    { id: 'define', label: '1. 权重定义与约束', icon: Settings },
    { id: 'kpi-selection', label: '2. KPI体系选择', icon: Target },
    { id: 'decompose', label: '3. 指标拆解仿真', icon: GitBranch },
    { id: 'compare', label: '4. 多方案权衡决策', icon: BarChart2 },
  ];

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Professional Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 shrink-0 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-600 rounded text-white">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">NEV折叠方向盘 · 指标仿真系统</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Database className="w-3 h-3" /> V2.4.0</span>
              <span>|</span>
              <span className="text-emerald-500">System Online</span>
            </div>
          </div>
        </div>
        
        {/* Stepper */}
        <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isPassed = steps.findIndex(s => s.id === currentStep) > idx;
            return (
              <div 
                key={step.id}
                onClick={() => (isPassed || isActive) && setCurrentStep(step.id as WorkflowStep)}
                className={`
                  flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all
                  ${isActive ? 'bg-slate-700 text-white shadow-sm' : isPassed ? 'text-emerald-400 hover:bg-slate-700/50' : 'text-slate-500'}
                `}
              >
                {isPassed ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                {step.label}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {currentStep === 'compare' && (
            <Button 
              size="sm"
              onClick={() => {
                // 确保已选择方案后再打开任务分解
                const scheme = designSchemes.find(s => s.id === selectedScheme);
                if (scheme) {
                  setIsWBSDrawerOpen(true);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            >
              生成任务分解
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full max-w-[1600px] mx-auto">
          
          {/* ==================== STEP 1: DEFINE ==================== */}
          {currentStep === 'define' && (
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Left: Configuration Panel */}
              <div className="col-span-4 flex flex-col gap-4 h-full">
                <Card className="flex-1 p-5 bg-white border border-slate-200 shadow-sm flex flex-col overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-emerald-700" />
                      顶层权重配置
                    </h3>
                    <Badge variant="outline" className="text-xs text-slate-500">Custom Mode</Badge>
                  </div>

                  {/* Scenario Presets */}
                  <div className="grid grid-cols-3 gap-2 mb-8">
                    {[
                      { id: 'balanced', label: '均衡模式', icon: Layers },
                      { id: 'performance', label: '性能优先', icon: Zap },
                      { id: 'cost', label: '成本导向', icon: Database },
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.id as any)}
                        className="flex flex-col items-center justify-center p-3 rounded border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                      >
                        <preset.icon className="w-5 h-5 mb-2 text-slate-500 group-hover:text-emerald-600" />
                        <span className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {customMetrics.map((metric) => (
                      <div key={metric.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{metric.name}</span>
                          <span className="font-mono text-emerald-700 font-bold">{(metric.weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[metric.weight * 100]}
                            max={100}
                            step={1}
                            onValueChange={([v]) => handleWeightChange(metric.id, v)}
                            className="flex-1"
                          />
                        </div>
                        <div className="text-xs text-slate-400 truncate">{metric.description}</div>
                      </div>
                    ))}
                  </div>

                  {/* Validation Status */}
                  <div className={`mt-auto pt-4 border-t border-slate-100 ${!isWeightValid ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`flex flex-col p-3 rounded-md border transition-all ${
                      isWeightValid 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : totalWeight > 1.0 
                          ? 'bg-rose-50 border-rose-200 text-rose-700' 
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {isWeightValid ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          <span className="text-sm font-bold">
                            {isWeightValid ? '权重配置有效' : totalWeight > 1.0 ? '权重溢出警告' : '权重未饱和'}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-lg">{(totalWeight * 100).toFixed(0)}%</span>
                      </div>
                      
                      {/* 状态解释与引导 */}
                      <div className="text-xs opacity-90 flex items-start gap-1.5 mt-1 leading-relaxed">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          {isWeightValid 
                            ? '当前配置符合 ZD 定义标准。' 
                            : totalWeight > 1.0 
                              ? '总和 >100% 将导致压力仿真出现非线性放大（Data Distortion），请点击下方按钮进行归一化。' 
                              : '总和 <100% 意味着系统存在未定义的冗余设计空间。'}
                        </span>
                      </div>
                    </div>
                    {!isWeightValid && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={normalizeWeights}
                        className="w-full mt-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      >
                        执行自动归一化
                      </Button>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right: Analysis Dashboard */}
              <div className="col-span-8 flex flex-col gap-4 h-full">
                {/* System Stress Monitor */}
                <Card className="flex-[2] p-5 bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-emerald-700" />
                      ZD方向盘子系统压力仿真 (System Stress)
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 正常范围
                      <span className="w-2 h-2 rounded-full bg-amber-500 ml-2"></span> 警告阈值
                    </div>
                  </div>
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={systemStressData.map(d => ({
                          ...d,
                          name: d.name === '电机驱动系统' ? '电机驱动模组' : 
                                d.name === '机械锁止机构' ? '锁止机构' : 
                                d.name === '控制器算力' ? '电控系统' : '折叠铰链模组'
                        }))} 
                        layout="vertical" 
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 500, fill: '#475569'}} />
                        <RechartsTooltip 
                          cursor={{fill: 'rgba(0,0,0,0.05)'}}
                          contentStyle={{borderRadius: '6px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                        />
                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                          {systemStressData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.value > entry.limit ? '#f59e0b' : '#059669'} />
                          ))}
                        </Bar>
                        <ReferenceLine x={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical Limit', fill: '#ef4444', fontSize: 10 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-sm text-slate-600 flex gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0" />
                    <p>
                      当前ZD配置下，<span className="font-bold text-slate-800">锁止机构</span> 承受设计压力接近阈值。建议在追溯视图中重点排查 <span className="font-mono text-emerald-700">D_LockStructure</span> (锁止形式) 与 <span className="font-mono text-emerald-700">D_HingeStrength</span> (铰链强度) 的设计冗余度。
                    </p>
                  </div>
                </Card>

                {/* Consistency Analysis */}
                <Card className="flex-1 p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-center">
                   <h3 className="font-bold text-slate-900 mb-2">配置一致性检查</h3>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded bg-emerald-50 border border-emerald-100">
                        <div className="text-xs text-emerald-600 mb-1">成本 vs 性能</div>
                        <div className="font-bold text-emerald-800">Compatible</div>
                      </div>
                      <div className="p-3 rounded bg-slate-50 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">轻量化 vs 安全</div>
                        <div className="font-bold text-slate-700">Balanced</div>
                      </div>
                      <div className="p-3 rounded bg-amber-50 border border-amber-100">
                        <div className="text-xs text-amber-600 mb-1">空间 vs 结构</div>
                        <div className="font-bold text-amber-800">Conflict Risk</div>
                      </div>
                   </div>
                   <div className="flex justify-end mt-4">
                      <Button onClick={() => setCurrentStep('kpi-selection')} className="bg-slate-900 hover:bg-slate-800 text-white">
                        下一步：选择KPI体系
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                   </div>
                </Card>
              </div>
            </div>
          )}

          {/* ==================== STEP 2: KPI SYSTEM SELECTION ==================== */}
          {currentStep === 'kpi-selection' && (
            <KPISystemSelection
              recommendedSystems={recommendedSystems}
              existingSystems={existingVehicleKPISystems}
              selectedSystem={selectedKPISystem}
              onSelectSystem={setSelectedKPISystem}
              onConfirm={() => setCurrentStep('decompose')}
            />
          )}

          {/* ==================== STEP 3: DECOMPOSE ==================== */}
          {currentStep === 'decompose' && (
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              {/* Top Row: Metric Tree + KPI Simulation - 响应式高度 */}
              <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                {/* Left: Metric Tree Visualization */}
                <div className="col-span-8 h-full">
                <Card className="h-full p-0 bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-emerald-700" />
                      指标拆解拓扑图 (Topology)
                    </h3>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white">Layer 1: Top Metrics</Badge>
                        <Badge variant="outline" className="bg-white">Layer 2: System KPI</Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 relative bg-slate-50/50 p-8 overflow-y-auto">
                     {/* Custom Visualization of Tree */}
                     <div className="flex gap-6 h-full relative overflow-hidden pl-4">
                        {/* Background Grid */}
                        <div className="absolute inset-0 pointer-events-none border border-slate-100 rounded-xl bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px] opacity-50"></div>

                        {/* Level 0: Root (G-Node) */}
                        <div className="flex flex-col justify-center z-10 shrink-0">
                             <div className="w-32 py-5 px-2 rounded-lg bg-slate-900 text-white flex flex-col items-center justify-center text-center shadow-lg border-2 border-slate-700">
                                <div className="text-xs font-mono text-emerald-400 mb-1 opacity-80">G1</div>
                                <div className="font-bold text-sm leading-tight">方向盘折叠体验<br/>与安全优化</div>
                             </div>
                        </div>

                        {/* Connector 0-1 */}
                        <div className="w-6 flex items-center justify-center shrink-0">
                            <div className="h-px w-full bg-slate-300 border-t border-dashed border-slate-400"></div>
                        </div>

                        {/* Tree Structure: L1 (Radar) -> L2 (KPI) -> L3 (Spec) */}
                        <div className="flex flex-col justify-center flex-1 gap-4 z-10">
                            {selectedKPISystem && [
                                { 
                                    id: 'UX', label: '交互体验', sub: 'Experience', color: 'border-blue-400 text-blue-700 bg-blue-50',
                                    kpiIds: ['KPI_FoldTime', 'KPI_FoldAngle']
                                },
                                { 
                                    id: 'PKG', label: '空间布置', sub: 'Package', color: 'border-indigo-400 text-indigo-700 bg-indigo-50',
                                    kpiIds: ['KPI_SpaceGain']
                                },
                                { 
                                    id: 'SAF', label: '功能安全', sub: 'Safety', color: 'border-emerald-400 text-emerald-700 bg-emerald-50',
                                    kpiIds: ['KPI_LockSafe']
                                },
                                { 
                                    id: 'NVH', label: '声振品质', sub: 'NVH', color: 'border-amber-400 text-amber-700 bg-amber-50',
                                    kpiIds: ['KPI_NVH']
                                },
                                { 
                                    id: 'REL', label: '可靠耐久', sub: 'Reliability', color: 'border-slate-400 text-slate-700 bg-slate-50',
                                    kpiIds: ['KPI_Life']
                                }
                            ].map((dim) => {
                                // 从selectedKPISystem中获取该维度的KPI数据
                                const kpis = dim.kpiIds.map(kpiId => ({
                                    id: kpiId,
                                    label: selectedKPISystem.kpis[kpiId as keyof typeof selectedKPISystem.kpis]?.label || '',
                                    target: selectedKPISystem.kpis[kpiId as keyof typeof selectedKPISystem.kpis]?.target || '',
                                    specs: getSpecsForKPI(kpiId)
                                }));

                                return (
                                <div key={dim.id} className="flex items-stretch">
                                    {/* L1: Radar Dimension Node */}
                                    <div className="flex flex-col justify-center mr-4">
                                        <div className={`w-36 p-3 rounded border shadow-sm flex flex-col items-center justify-center text-center transition-all ${dim.color}`}>
                                            <div className="text-sm font-bold leading-tight">{dim.label}</div>
                                            <div className="text-xs font-mono opacity-80 uppercase">{dim.sub}</div>
                                        </div>
                                    </div>

                                    {/* Connector L1 -> L2 (Handles 1-to-Many branching) */}
                                    <div className="flex flex-col justify-center mr-4 relative w-6 shrink-0">
                                        <div className="absolute left-0 top-1/2 w-full h-px bg-slate-300 -translate-y-1/2"></div>
                                        {kpis.length > 1 && (
                                            <div className="absolute right-0 top-2 bottom-2 w-px bg-slate-300 border-l border-slate-300"></div>
                                        )}
                                    </div>

                                    {/* L2 Group */}
                                    <div className="flex flex-col gap-2 justify-center">
                                        {kpis.map((kpi, kIdx) => (
                                            <div key={kpi.id} className="flex items-center">
                                                {/* Connector from Branch (if needed) */}
                                                {kpis.length > 1 && (
                                                    <div className="w-3 h-px bg-slate-300 mr-2"></div>
                                                )}
                                                
                                                {/* L2 Node (KPI) */}
                                                <div className="w-40 p-2 rounded border shadow-sm flex flex-col relative overflow-hidden transition-colors shrink-0 bg-white border-slate-200">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                                    
                                                    <div className="flex justify-between items-center pl-2">
                                                        <span className="text-xs font-bold truncate text-slate-800">{kpi.id}</span>
                                                    </div>
                                                    <div className="flex justify-between items-baseline pl-2 mt-0.5">
                                                        <span className="text-xs text-slate-600 truncate max-w-[70px]">{kpi.label}</span>
                                                        <span className="text-[10px] font-mono text-slate-400">{kpi.target}</span>
                                                    </div>
                                                </div>

                                                {/* Connector L2 -> L3 */}
                                                <div className="w-4 h-px bg-slate-300 mx-2 shrink-0"></div>

                                                {/* L3 Group (Specs) */}
                                                <div className="flex flex-col gap-1.5">
                                                    {kpi.specs.map((spec, sIdx) => (
                                                        <div key={sIdx} className="w-40 p-1 px-2.5 rounded border flex items-center justify-between bg-slate-50 border-slate-100">
                                                            <span className="text-[10px] whitespace-nowrap text-slate-500">{spec}</span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )})}
                        </div>
                     </div>
                  </div>
                </Card>
              </div>

              {/* Right: KPI Parameter & Simulation */}
              <div className="col-span-4 flex flex-col gap-4 h-full">
                 <Card className="flex-1 p-5 bg-white border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <RotateCcw className="w-5 h-5 text-emerald-700" />
                        <h3 className="font-bold text-slate-900">KPI 目标仿真</h3>
                    </div>
                    
                    <div className="space-y-6 overflow-y-auto pr-2 flex-1">
                         {/* Simulation Item */}
                         <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                             <div className="flex justify-between items-center">
                                 <label className="text-sm font-medium text-slate-700">折叠时间 (FoldTime)</label>
                                 <span className="text-xs text-slate-500">Target: {selectedKPISystem?.kpis.KPI_FoldTime.target || '≤1.5s'}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                 <Slider 
                                    value={[kpiTargets['KPI_FoldTime']]} max={3.0} min={0.5} step={0.1} 
                                    onValueChange={([v]) => setKpiTargets(p => ({...p, KPI_FoldTime: v}))}
                                 />
                                 <div className="w-12 text-center font-mono text-sm bg-white border rounded px-1">
                                    {kpiTargets['KPI_FoldTime']}s
                                 </div>
                             </div>
                             {/* Impact Feedback */}
                             {kpiTargets['KPI_FoldTime'] < 1.2 && (
                                 <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                     <AlertTriangle className="w-3 h-3" />
                                     <span>电机成本预计增加 15%</span>
                                 </div>
                             )}
                         </div>

                         <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                             <div className="flex justify-between items-center">
                                 <label className="text-sm font-medium text-slate-700">NVH 噪音限值</label>
                                 <span className="text-xs text-slate-500">Target: {selectedKPISystem?.kpis.KPI_NVH.target || '≤45dB'}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                 <Slider 
                                    value={[kpiTargets['KPI_NVH']]} max={60} min={30} step={1} 
                                    onValueChange={([v]) => setKpiTargets(p => ({...p, KPI_NVH: v}))}
                                 />
                                 <div className="w-12 text-center font-mono text-sm bg-white border rounded px-1">
                                    {kpiTargets['KPI_NVH']}
                                 </div>
                             </div>
                         </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" onClick={() => setCurrentStep('compare')}>
                            应用参数并对比方案
                            <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                 </Card>
              </div>
              </div>
            </div>
          )}

          {/* ==================== STEP 3: COMPARE ==================== */}
          {currentStep === 'compare' && (
            <div className="h-full flex flex-col gap-4">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
                 <div className="flex gap-1 bg-slate-100 p-1 rounded">
                    <button 
                        onClick={() => setViewMode('radar')}
                        className={`px-3 py-1.5 text-sm font-medium rounded flex items-center gap-2 transition-all ${viewMode === 'radar' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Activity className="w-4 h-4" /> 雷达综述
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 text-sm font-medium rounded flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TableIcon className="w-4 h-4" /> 详细参数表
                    </button>
                    <button 
                        onClick={() => setViewMode('scatter')}
                        className={`px-3 py-1.5 text-sm font-medium rounded flex items-center gap-2 transition-all ${viewMode === 'scatter' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> 效费比分析
                    </button>
                 </div>
                 <div className="flex items-center gap-3 px-4 text-sm">
                     <span className="text-slate-500">推荐方案:</span>
                     <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
                        {recommendedScheme.name}
                     </Badge>
                     <span className="text-slate-300">|</span>
                     <span className="font-mono text-slate-700">Score: {calculateWeightedScore(recommendedScheme).toFixed(1)}</span>
                 </div>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
                 {/* Main Visualization Area */}
                 <div className="lg:col-span-8 h-full bg-white rounded border border-slate-200 shadow-sm p-4 relative">
                    
                    {viewMode === 'radar' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 14, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                {designSchemes.map((scheme) => {
                                    const isSelected = selectedScheme === scheme.id;
                                    // Highlight selected scheme, fade others
                                    const opacity = isSelected ? 0.6 : 0.1; 
                                    const strokeWidth = isSelected ? 3 : 1;
                                    
                                    // Scheme-specific colors
                                    let color = '#94a3b8'; // default gray
                                    if (scheme.id === 'scheme-b') color = '#059669'; // Emerald for B (Recommended)
                                    if (scheme.id === 'scheme-a') color = '#6366f1'; // Indigo for A
                                    if (scheme.id === 'scheme-c') color = '#f59e0b'; // Amber for C

                                    return (
                                        <Radar
                                            key={scheme.id}
                                            name={scheme.name}
                                            dataKey={scheme.name}
                                            stroke={color}
                                            strokeWidth={strokeWidth}
                                            fill={color}
                                            fillOpacity={opacity}
                                            isAnimationActive={false} // Smooth transition without jitter
                                        />
                                    );
                                })}
                                <Legend />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}

                    {viewMode === 'table' && (
                        <div className="h-full overflow-auto">
                            <table className="w-full border-collapse text-sm text-left">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 border-b border-slate-200 font-bold text-slate-700">KPI Indicator</th>
                                        <th className="p-3 border-b border-slate-200 text-slate-500">Target</th>
                                        {designSchemes.map(s => (
                                            <th 
                                                key={s.id} 
                                                onClick={() => setSelectedScheme(s.id)}
                                                className={`p-3 border-b border-slate-200 font-bold cursor-pointer transition-colors ${selectedScheme === s.id ? 'text-emerald-800 bg-emerald-100/50 border-b-emerald-500' : 'text-slate-700 hover:bg-slate-100'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {s.name}
                                                    {selectedScheme === s.id && <Check className="w-3 h-3 text-emerald-600" />}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(designSchemes[0].kpiValues).map(([kpiId, val]) => {
                                        // Define Logic based on KPI Nature
                                        // Lower is Better: FoldTime, NVH
                                        const isLowerBetter = ['KPI_FoldTime', 'KPI_NVH'].includes(kpiId);
                                        // Higher is Better: SpaceGain, FoldAngle, Life
                                        const isHigherBetter = !isLowerBetter;
                                        
                                        const target = kpiTargets[kpiId];
                                        const targetDisplay = target !== undefined 
                                            ? (isLowerBetter ? `≤ ${target}` : `≥ ${target}`) 
                                            : '-';

                                        return (
                                            <tr key={kpiId} className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                                                <td className="p-3 font-medium text-slate-700">{kpiId}</td>
                                                <td className="p-3 font-mono text-slate-500">{targetDisplay}</td>
                                                {designSchemes.map(s => {
                                                    const kpiData = s.kpiValues[kpiId];
                                                    // 统一使用 achievementRate 判断标准，确保与任务分解逻辑一致
                                                    const isFailed = kpiData.achievementRate < 100;
                                                    const isSelected = selectedScheme === s.id;

                                                    return (
                                                        <td key={s.id} className={`p-3 font-mono transition-colors ${isSelected ? 'bg-emerald-50/30' : ''} ${isFailed ? 'bg-rose-50' : ''}`}>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className={`${isFailed ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>{kpiData.value}</span>
                                                                {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                                                                {!isFailed && kpiData.achievementRate >= 95 && <Check className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {viewMode === 'scatter' && (
                        <div className="h-full flex flex-col relative">
                            {/* Chart Header / Legend Context */}
                            <div className="absolute top-0 right-0 z-10 flex flex-col gap-1 text-xs text-slate-500 bg-white/80 p-2 rounded border border-slate-100 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div>
                                    <span>High Value Zone (Top-Left)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500"></div>
                                    <span>Risk Zone (Bottom-Right)</span>
                                </div>
                            </div>

                            <div className="flex-1 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        
                                        {/* X Axis: Cost (Actual Currency Estimate) */}
                                        <XAxis 
                                            type="number" 
                                            dataKey="costAmount" 
                                            name="Est. Cost" 
                                            unit="$" 
                                            domain={['dataMin - 50', 'dataMax + 50']}
                                            label={{ value: 'Est. Unit Cost (USD) - Lower is Better →', position: 'bottom', offset: 20, fill: '#64748b', fontSize: 12 }} 
                                            tick={{ fill: '#64748b', fontSize: 11 }}
                                            tickFormatter={(val) => `$${val}`}
                                        />
                                        
                                        {/* Y Axis: Total Weighted Performance */}
                                        <YAxis 
                                            type="number" 
                                            dataKey="performance" 
                                            name="Total Score" 
                                            unit="" 
                                            domain={[60, 100]}
                                            label={{ value: 'Comprehensive Performance Score (0-100)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} 
                                            tick={{ fill: '#64748b', fontSize: 11 }}
                                        />

                                        {/* Tooltip */}
                                        <RechartsTooltip 
                                            cursor={{ strokeDasharray: '3 3' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm z-50 min-w-[200px]">
                                                            <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1 flex justify-between items-center">
                                                                {data.name}
                                                                <Badge variant={data.isRecommended ? "default" : "outline"} className="text-[10px] h-5">
                                                                    {data.id === 'scheme-b' ? 'Recommended' : 'Candidate'}
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-1 mt-2">
                                                                <div className="flex justify-between text-slate-600">
                                                                    <span>Est. Cost:</span>
                                                                    <span className="font-mono text-slate-900 font-semibold">${data.costAmount}</span>
                                                                </div>
                                                                <div className="flex justify-between text-slate-600">
                                                                    <span>Perf Score:</span>
                                                                    <span className="font-mono text-slate-900 font-semibold">{data.performance.toFixed(1)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-slate-600">
                                                                    <span>Mass Risk:</span>
                                                                    <span className="font-mono text-slate-900">{data.mass}kg</span>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 italic">
                                                                    "{data.tagline}"
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />

                                        {/* Reference Lines for Decision Making */}
                                        <ReferenceLine x={350} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Budget Cap ($350)', fill: '#ef4444', fontSize: 10 }} />
                                        <ReferenceLine y={85} stroke="#6366f1" strokeDasharray="3 3" label={{ position: 'insideRight', value: 'Perf Target (85)', fill: '#6366f1', fontSize: 10 }} />

                                        {/* The Scatter Bubbles */}
                                        <Scatter 
                                            name="Design Schemes" 
                                            data={designSchemes.map(s => {
                                                // Transform Data for Realism
                                                // Cost Score (High is Good) -> Cost Amount (Low is Good)
                                                // Mock Mapping: Score 100 = $200, Score 0 = $600
                                                const estCost = Math.round(600 - (s.scores.cost * 4)); 
                                                
                                                // Taglines for realism
                                                const taglines: Record<string, string> = {
                                                    'scheme-a': 'Baseline mechanism, proven reliability.',
                                                    'scheme-b': 'Novel retraction gear, high UX value.',
                                                    'scheme-c': 'Simplified structure, cost-optimized.'
                                                };

                                                return {
                                                    id: s.id,
                                                    name: s.name,
                                                    isRecommended: s.id === 'scheme-b',
                                                    costAmount: estCost,
                                                    performance: calculateWeightedScore(s), 
                                                    mass: s.id === 'scheme-b' ? 3.2 : (s.id === 'scheme-a' ? 2.8 : 2.5), // Mock Mass for bubble size context if needed, or just display
                                                    tagline: taglines[s.id] || 'Alternative option',
                                                    z: 1 // uniform size for now, or map to 'readiness'
                                                };
                                            })} 
                                            onClick={(node) => setSelectedScheme(node.id)}
                                            cursor="pointer"
                                        >
                                            {designSchemes.map((entry, index) => {
                                                const isSelected = selectedScheme === entry.id;
                                                let color = '#94a3b8';
                                                if (entry.id === 'scheme-b') color = '#059669';
                                                if (entry.id === 'scheme-a') color = '#6366f1';
                                                if (entry.id === 'scheme-c') color = '#f59e0b';

                                                return (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={color} 
                                                        stroke={isSelected ? '#0f172a' : 'white'}
                                                        strokeWidth={isSelected ? 3 : 2}
                                                        fillOpacity={isSelected ? 1 : 0.6}
                                                    />
                                                );
                                            })}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-400 text-center pb-2">
                                Plot: Cost vs. Performance Efficiency Frontier. Top-Left is ideal (High Perf, Low Cost).
                            </p>
                        </div>
                    )}
                 </div>

                 {/* Right: Scheme Cards */}
                 <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto h-full pr-1">
                    {designSchemes.map((scheme) => {
                        const score = calculateWeightedScore(scheme);
                        const isSelected = selectedScheme === scheme.id;
                        const isRec = scheme.id === recommendedScheme.id;
                        
                        return (
                            <div 
                                key={scheme.id}
                                onClick={() => setSelectedScheme(scheme.id)}
                                className={`
                                    p-4 rounded-lg border-2 cursor-pointer transition-all relative group
                                    ${isSelected ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-1 ring-emerald-600' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'}
                                `}
                            >
                                {isRec && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-bl shadow-sm">Recommended</div>}
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`font-bold text-sm flex items-center gap-2 ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                                        {scheme.name}
                                    </h4>
                                    <span className={`font-mono font-bold text-lg ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>{score.toFixed(1)}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{scheme.description}</p>
                                {/* Mini Specs */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={`flex justify-between p-1 rounded ${isSelected ? 'bg-white border border-emerald-100' : 'bg-slate-50'}`}>
                                        <span className="text-slate-500">Fold</span>
                                        <span className="font-mono font-bold text-slate-700">{scheme.kpiValues.KPI_FoldTime.value}</span>
                                    </div>
                                    <div className={`flex justify-between p-1 rounded ${isSelected ? 'bg-white border border-emerald-100' : 'bg-slate-50'}`}>
                                        <span className="text-slate-500">Cost</span>
                                        <span className="font-mono font-bold text-slate-700">{scheme.scores.cost}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* WBS Drawer */}
      <WBSDrawer
        isOpen={isWBSDrawerOpen}
        onClose={() => setIsWBSDrawerOpen(false)}
        selectedScheme={designSchemes.find(s => s.id === selectedScheme) || null}
        selectedKPISystem={selectedKPISystem}
        onConfirm={() => {
          const scheme = designSchemes.find(s => s.id === selectedScheme);
          if (scheme) {
            onProceedToEvaluation(scheme);
          }
        }}
      />
    </div>
  );
}