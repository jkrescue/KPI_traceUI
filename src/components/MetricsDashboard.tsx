import { useState, useRef, useEffect } from 'react';
import { Activity, Box, GripVertical, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Node } from 'reactflow';
import { KPIMetrics } from '../data/graphData';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface MetricsDashboardProps {
  nodes: Node[];
  onShowUnachieved: () => void;
  onHighlightNodes?: (nodeIds: string[]) => void;
}

export function MetricsDashboard({ nodes, onShowUnachieved, onHighlightNodes }: MetricsDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: window.innerHeight - 480 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // 获取所有KPI节点（包括两层）
  const kpiNodes = nodes.filter(n => n.data.category === 'kpi');
  
  // 计算达成率
  const achievedCount = kpiNodes.filter(n => n.data.metrics?.achieved).length;
  const achievementRate = kpiNodes.length > 0 ? (achievedCount / kpiNodes.length) * 100 : 0;
  
  // 计算模型覆盖率
  const modelCoveredCount = kpiNodes.filter(n => n.data.metrics?.modelCovered).length;
  const modelCoverageRate = kpiNodes.length > 0 ? (modelCoveredCount / kpiNodes.length) * 100 : 0;
  
  // 未达成的指标
  const unachievedKPIs = kpiNodes.filter(n => !n.data.metrics?.achieved);
  
  // 按模型类型统计
  const modelTypeStats = {
    sysml: kpiNodes.filter(n => n.data.metrics?.modelType === 'sysml').length,
    modelica: kpiNodes.filter(n => n.data.metrics?.modelType === 'modelica').length,
    fmu: kpiNodes.filter(n => n.data.metrics?.modelType === 'fmu').length,
    simulink: kpiNodes.filter(n => n.data.metrics?.modelType === 'simulink').length,
  };

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRateBgColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 准备饼图数据
  const achievementData = [
    { name: '已达成', value: achievedCount, color: '#22c55e' },
    { name: '未达成', value: kpiNodes.length - achievedCount, color: '#ef4444' },
  ];

  const coverageData = [
    { name: '已覆盖', value: modelCoveredCount, color: '#3b82f6' },
    { name: '未覆盖', value: kpiNodes.length - modelCoveredCount, color: '#f59e0b' },
  ];

  // 处理饼图点击
  const handlePieClick = (type: 'achievement' | 'coverage', segmentName: string) => {
    const segmentKey = `${type}-${segmentName}`;
    
    // 切换选中状态
    if (selectedSegment === segmentKey) {
      setSelectedSegment(null);
      onHighlightNodes?.([]); // 取消高亮
    } else {
      setSelectedSegment(segmentKey);
      
      // 获取对应的节点并高亮
      let targetNodes: Node[] = [];
      if (type === 'achievement') {
        if (segmentName === '已达成') {
          targetNodes = kpiNodes.filter(n => n.data.metrics?.achieved);
        } else {
          targetNodes = kpiNodes.filter(n => !n.data.metrics?.achieved);
        }
      } else {
        if (segmentName === '已覆盖') {
          targetNodes = kpiNodes.filter(n => n.data.metrics?.modelCovered);
        } else {
          targetNodes = kpiNodes.filter(n => !n.data.metrics?.modelCovered);
        }
      }
      
      onHighlightNodes?.(targetNodes.map(n => n.id));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDragging) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={dashboardRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 w-80 z-20"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Draggable Header */}
      <div 
        className="px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 cursor-grab active:cursor-grabbing flex items-center justify-between rounded-[14px]"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-400" />
          <Activity className="w-5 h-5 text-slate-700" />
          <h3 className="text-slate-900 text-sm">指标分析仪表</h3>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-slate-200 rounded transition-colors"
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-5 space-y-4">
          {/* 一键查看未达成指标 */}
          {unachievedKPIs.length > 0 && (
            <button
              onClick={onShowUnachieved}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-900 text-sm">未达成指标</span>
              </div>
              <span className="px-2 py-1 bg-amber-200 text-amber-900 rounded-full text-xs">
                {unachievedKPIs.length}
              </span>
            </button>
          )}

          {/* 指标达成率和模型覆盖率 - 并排显示 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 指标达成率 */}
            <div>
              <div className="flex flex-col items-center mb-2">
                <span className="text-xs text-slate-600">指标达成率</span>
                <span className={`text-xs ${getRateColor(achievementRate)}`}>
                  {achievedCount}/{kpiNodes.length}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie
                    data={achievementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => handlePieClick('achievement', data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {achievementData.map((entry, index) => {
                      const isSelected = selectedSegment === `achievement-${entry.name}`;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={isSelected ? '#000' : 'none'}
                          strokeWidth={isSelected ? 3 : 0}
                          opacity={selectedSegment && !isSelected ? 0.3 : 1}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontSize: '10px' }}
                    formatter={(value: number) => `${value} 项`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={`text-center mt-1 text-xs ${getRateColor(achievementRate)}`}>
                {achievementRate.toFixed(1)}%
              </div>
            </div>

            {/* 模型覆盖率 */}
            <div>
              <div className="flex flex-col items-center mb-2">
                <span className="text-xs text-slate-600">模型覆盖率</span>
                <span className={`text-xs ${getRateColor(modelCoverageRate)}`}>
                  {modelCoveredCount}/{kpiNodes.length}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie
                    data={coverageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => handlePieClick('coverage', data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {coverageData.map((entry, index) => {
                      const isSelected = selectedSegment === `coverage-${entry.name}`;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={isSelected ? '#000' : 'none'}
                          strokeWidth={isSelected ? 3 : 0}
                          opacity={selectedSegment && !isSelected ? 0.3 : 1}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontSize: '10px' }}
                    formatter={(value: number) => `${value} 项`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={`text-center mt-1 text-xs ${getRateColor(modelCoverageRate)}`}>
                {modelCoverageRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* 模型类型分布 */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Box className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-600">模型类型分布</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="text-xs text-blue-600 mb-1">SysML</div>
                <div className="text-blue-900 text-sm">{modelTypeStats.sysml}</div>
                <div className="text-xs text-blue-500 mt-1">功能指标</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                <div className="text-xs text-purple-600 mb-1">Simulink</div>
                <div className="text-purple-900 text-sm">{modelTypeStats.simulink}</div>
                <div className="text-xs text-purple-500 mt-1">控制指标</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <div className="text-xs text-green-600 mb-1">Modelica</div>
                <div className="text-green-900 text-sm">{modelTypeStats.modelica}</div>
                <div className="text-xs text-green-500 mt-1">性能指标</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                <div className="text-xs text-orange-600 mb-1">FMU</div>
                <div className="text-orange-900 text-sm">{modelTypeStats.fmu}</div>
                <div className="text-xs text-orange-500 mt-1">性能指标</div>
              </div>
            </div>
          </div>

          {/* 风险提示 */}
          {(achievementRate < 90 || modelCoverageRate < 90) && (
            <div className="pt-3 border-t border-slate-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-xs text-amber-800">
                  ⚠️ 
                  {achievementRate < 90 && ' 部分指标未达成'}
                  {achievementRate < 90 && modelCoverageRate < 90 && ' ·'}
                  {modelCoverageRate < 90 && ' 模型覆盖不足'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}