import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Target, Sparkles, Car, CheckCircle2, ChevronRight
} from 'lucide-react';
import { KPISystem } from '../data/kpiSystems';

interface KPISystemSelectionProps {
  recommendedSystems: KPISystem[];
  existingSystems: KPISystem[];
  selectedSystem: KPISystem | null;
  onSelectSystem: (system: KPISystem) => void;
  onConfirm: () => void;
}

export function KPISystemSelection({
  recommendedSystems,
  existingSystems,
  selectedSystem,
  onSelectSystem,
  onConfirm,
}: KPISystemSelectionProps) {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">KPI指标体系选择</h3>
            <p className="text-sm text-slate-600">
              基于您配置的顶层权重，系统为您推荐了最匹配的KPI指标体系。您也可以选择已有车型的成熟指标方案。
            </p>
          </div>
        </div>
      </Card>

      {/* 智能推荐方案 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-900">智能推荐方案</h3>
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
            基于权重匹配
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {recommendedSystems.map((system, index) => {
            const isSelected = selectedSystem?.id === system.id;
            const isTopRecommended = index === 0;
            
            return (
              <Card 
                key={system.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                    : 'border-slate-200 hover:border-blue-300'
                } ${isTopRecommended ? 'ring-2 ring-amber-400' : ''}`}
                onClick={() => onSelectSystem(system)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900">{system.name}</h4>
                        {isTopRecommended && (
                          <Badge className="bg-amber-500 text-white text-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            最佳推荐
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{system.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                  </div>

                  {/* Match Score */}
                  <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">匹配度</span>
                      <span className="text-xs font-bold text-blue-700">
                        {system.matchScore?.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${system.matchScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {system.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* KPI Preview (show 3 key ones) */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>折叠时间</span>
                      <span className="font-mono font-medium">{system.kpis.KPI_FoldTime.target}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>折叠角度</span>
                      <span className="font-mono font-medium">{system.kpis.KPI_FoldAngle.target}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>空间提升</span>
                      <span className="font-mono font-medium">{system.kpis.KPI_SpaceGain.target}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 已有车型方案 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-900">已有车型方案</h3>
          <Badge variant="outline">
            成熟验证
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {existingSystems.map(system => {
            const isSelected = selectedSystem?.id === system.id;
            
            return (
              <Card 
                key={system.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md' 
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
                onClick={() => onSelectSystem(system)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-900 mb-0.5">
                        {system.vehicleModel}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {system.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {system.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs space-y-0.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>折叠时间</span>
                      <span className="font-mono">{system.kpis.KPI_FoldTime.target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>锁止强度</span>
                      <span className="font-mono">{system.kpis.KPI_LockSafe.target}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Selected System Details */}
      {selectedSystem && (
        <Card className="bg-white border-2 border-blue-500">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">已选择：{selectedSystem.name}</h3>
            </div>

            {/* Full KPI List */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Object.entries(selectedSystem.kpis).map(([kpiId, kpiData]) => (
                <div key={kpiId} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="font-medium text-sm text-slate-900 mb-1">
                    {kpiData.label}
                  </div>
                  <div className="text-xs text-slate-600 mb-2">
                    {kpiData.description}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500 text-white font-mono text-xs">
                      {kpiData.target}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="mb-4">
              <h4 className="font-bold text-sm text-slate-900 mb-2">约束条件</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSystem.constraints.map(constraint => (
                  <Badge key={constraint} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {constraint}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => onSelectSystem(null as any)}
              >
                重新选择
              </Button>
              <Button
                onClick={onConfirm}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                确认并进入指标拆解
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!selectedSystem && (
        <Card className="bg-slate-50 border-dashed border-2 border-slate-300">
          <div className="p-8 text-center">
            <Target className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">
              请选择一个KPI指标体系方案，以便进行后续的指标拆解与仿真
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}