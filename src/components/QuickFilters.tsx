import { XCircle, FileX, RefreshCw } from 'lucide-react';

interface QuickFiltersProps {
  showOnlyUnachieved: boolean;
  showOnlyNoModel: boolean;
  onToggleUnachieved: (value: boolean) => void;
  onToggleNoModel: (value: boolean) => void;
  onShowAll: () => void;
}

export function QuickFilters({
  showOnlyUnachieved,
  showOnlyNoModel,
  onToggleUnachieved,
  onToggleNoModel,
  onShowAll,
}: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onToggleUnachieved(!showOnlyUnachieved)}
        className={`p-2 rounded-lg border-2 transition-all hover:scale-110 ${
          showOnlyUnachieved
            ? 'bg-red-100 border-red-400 text-red-700 shadow-lg'
            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}
        title="仅显示未达成指标"
      >
        <XCircle className="w-5 h-5" />
      </button>

      <button
        onClick={() => onToggleNoModel(!showOnlyNoModel)}
        className={`p-2 rounded-lg border-2 transition-all hover:scale-110 ${
          showOnlyNoModel
            ? 'bg-amber-100 border-amber-400 text-amber-700 shadow-lg'
            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}
        title="仅显示非模型化交付指标"
      >
        <FileX className="w-5 h-5" />
      </button>

      <button
        onClick={onShowAll}
        className={`p-2 rounded-lg border-2 transition-all hover:scale-110 ${
          !showOnlyUnachieved && !showOnlyNoModel
            ? 'bg-green-100 border-green-400 text-green-700 shadow-lg'
            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}
        title="显示全部"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
}