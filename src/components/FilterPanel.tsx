import {
  Target,
  Gauge,
  Wrench,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface FilterPanelProps {
  activeFilters: Set<string>;
  onFilterChange: (filters: Set<string>) => void;
  activeModelTypes: Set<string>;
  onModelTypeChange: (types: Set<string>) => void;
}

export function FilterPanel({
  activeFilters,
  onFilterChange,
  activeModelTypes,
  onModelTypeChange,
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filters = [
    {
      id: "goal",
      label: "顶层目标",
      icon: Target,
      color: "purple",
    },
    { id: "kpi", label: "指标层", icon: Gauge, color: "blue" },
    {
      id: "design",
      label: "设计参数",
      icon: Wrench,
      color: "green",
    },
    {
      id: "verify",
      label: "仿真验证",
      icon: FlaskConical,
      color: "red",
    },
  ];

  const modelTypes = [
    {
      id: "sysml",
      label: "SysML",
      color: "blue",
      desc: "功能",
    },
    {
      id: "simulink",
      label: "Simulink",
      color: "purple",
      desc: "控制",
    },
    {
      id: "modelica",
      label: "Modelica",
      color: "green",
      desc: "性能",
    },
    { id: "fmu", label: "FMU", color: "orange", desc: "性能" },
  ];

  const toggleFilter = (filterId: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filterId)) {
      newFilters.delete(filterId);
    } else {
      newFilters.add(filterId);
    }
    onFilterChange(newFilters);
  };

  const toggleModelType = (typeId: string) => {
    const newTypes = new Set(activeModelTypes);
    if (newTypes.has(typeId)) {
      newTypes.delete(typeId);
    } else {
      newTypes.add(typeId);
    }
    onModelTypeChange(newTypes);
  };

  const getColorClasses = (color: string, active: boolean) => {
    const colors: Record<
      string,
      { active: string; inactive: string }
    > = {
      purple: {
        active:
          "bg-purple-100 border-purple-400 text-purple-700",
        inactive: "bg-white border-slate-200 text-slate-400",
      },
      blue: {
        active: "bg-blue-100 border-blue-400 text-blue-700",
        inactive: "bg-white border-slate-200 text-slate-400",
      },
      green: {
        active: "bg-green-100 border-green-400 text-green-700",
        inactive: "bg-white border-slate-200 text-slate-400",
      },
      red: {
        active: "bg-red-100 border-red-400 text-red-700",
        inactive: "bg-white border-slate-200 text-slate-400",
      },
      orange: {
        active:
          "bg-orange-100 border-orange-400 text-orange-700",
        inactive: "bg-white border-slate-200 text-slate-400",
      },
    };
    return active
      ? colors[color].active
      : colors[color].inactive;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 min-w-[220px] space-y-4">
      {/* Header with Collapse Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 text-sm">图层筛选</h3>
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
        <>
          {/* 图层筛选 */}
          <div>
            <div className="space-y-2">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilters.has(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all hover:scale-105 ${getColorClasses(filter.color, isActive)}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">
                      {filter.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 模型类型筛选 */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-slate-900 mb-3 text-sm">
              模型类型
            </h3>
            <div className="space-y-2">
              {modelTypes.map((type) => {
                const isActive = activeModelTypes.has(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleModelType(type.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all hover:scale-105 ${getColorClasses(type.color, isActive)}`}
                  >
                    <span className="text-xs">
                      {type.label}
                    </span>
                    <span className="text-xs opacity-70">
                      {type.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}