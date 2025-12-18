import { CheckCircle, Zap, Link } from 'lucide-react';

interface RelationshipFilterProps {
  activeRelationships: Set<string>;
  onRelationshipChange: (relationships: Set<string>) => void;
}

export function RelationshipFilter({
  activeRelationships,
  onRelationshipChange,
}: RelationshipFilterProps) {
  const relationships = [
    { id: 'satisfy', label: '满足', icon: CheckCircle, color: 'purple', desc: '目标→指标' },
    { id: 'implement', label: '实现', icon: Zap, color: 'blue', desc: '指标→设计' },
    { id: 'verify', label: '验证', icon: Link, color: 'red', desc: '设计→验证' },
  ];

  const toggleRelationship = (relId: string) => {
    const newRels = new Set(activeRelationships);
    if (newRels.has(relId)) {
      newRels.delete(relId);
    } else {
      newRels.add(relId);
    }
    onRelationshipChange(newRels);
  };

  const getColorClasses = (color: string, active: boolean) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      purple: {
        active: 'bg-purple-100 border-purple-400 text-purple-700',
        inactive: 'bg-white border-slate-200 text-slate-400'
      },
      blue: {
        active: 'bg-blue-100 border-blue-400 text-blue-700',
        inactive: 'bg-white border-slate-200 text-slate-400'
      },
      red: {
        active: 'bg-red-100 border-red-400 text-red-700',
        inactive: 'bg-white border-slate-200 text-slate-400'
      },
    };
    return active ? colors[color].active : colors[color].inactive;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600 mr-2">关系类型:</span>
      {relationships.map(rel => {
        const Icon = rel.icon;
        const isActive = activeRelationships.has(rel.id);
        return (
          <button
            key={rel.id}
            onClick={() => toggleRelationship(rel.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all hover:scale-105 ${getColorClasses(rel.color, isActive)}`}
            title={rel.desc}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{rel.label}</span>
          </button>
        );
      })}
    </div>
  );
}
