import { useState } from 'react';
import { History, ChevronDown, ChevronUp, GitBranch, Calendar, User, FileText, TrendingUp, AlertCircle, Plus, Edit, Trash2, MousePointerClick } from 'lucide-react';
import { Version, versionHistory, calculateImpactedChain, calculateVersionImpact } from '../data/versionData';

interface VersionPanelProps {
  onVersionSelect: (version: Version, impactedNodes: string[], impactedEdges: string[]) => void;
  onClearVersion: () => void;
  onChangeItemClick: (nodeId: string, impactedNodes: string[], impactedEdges: string[]) => void;
  selectedVersion: Version | null;
}

export function VersionPanel({ onVersionSelect, onClearVersion, onChangeItemClick, selectedVersion }: VersionPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const toggleVersionExpand = (versionId: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'new':
        return <Plus className="w-3 h-3 text-green-600" />;
      case 'modified':
      case 'value_changed':
        return <Edit className="w-3 h-3 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="w-3 h-3 text-red-600" />;
      default:
        return <FileText className="w-3 h-3 text-slate-600" />;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'new':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'modified':
      case 'value_changed':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'deleted':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getChangeTypeName = (type: string) => {
    switch (type) {
      case 'new':
        return '新增';
      case 'modified':
        return '修改';
      case 'value_changed':
        return '值变更';
      case 'deleted':
        return '删除';
      default:
        return '变更';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-80 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="text-slate-900 text-sm">版本记录</h3>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
            {versionHistory.length} 个版本
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-indigo-100 rounded transition-colors"
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
          {/* Clear Selection Button */}
          {selectedVersion && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
              <button
                onClick={onClearVersion}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-all text-xs text-amber-800"
              >
                <AlertCircle className="w-4 h-4" />
                <span>清除版本选择 (当前: {selectedVersion.versionNumber})</span>
              </button>
            </div>
          )}

          {/* Version List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[...versionHistory].reverse().map((version, index) => {
              const isExpanded = expandedVersions.has(version.id);
              const isSelected = selectedVersion?.id === version.id;
              const isLatest = index === 0;

              return (
                <div
                  key={version.id}
                  className={`border-2 rounded-lg overflow-hidden transition-all ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Version Header */}
                  <div
                    onClick={() => toggleVersionExpand(version.id)}
                    className="p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-indigo-600" />
                        <span className="text-slate-900 text-sm">{version.versionNumber}</span>
                        {isLatest && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                            最新
                          </span>
                        )}
                        {version.changes.length > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                            {version.changes.length} 项变更
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar className="w-3 h-3" />
                        <span>{version.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <User className="w-3 h-3" />
                        <span>{version.author}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-2">{version.description}</p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50">
                      {version.changes.length > 0 ? (
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="text-xs text-slate-700">变更详情</span>
                          </div>
                          {version.changes.map((change, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border ${getChangeTypeColor(change.changeType)}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {getChangeTypeIcon(change.changeType)}
                                <span className="text-xs">{getChangeTypeName(change.changeType)}</span>
                                <span className="text-xs">·</span>
                                <span className="text-xs">{change.nodeName}</span>
                              </div>
                              {change.oldValue && (
                                <div className="text-xs opacity-75 line-through">
                                  旧值: {change.oldValue}
                                </div>
                              )}
                              {change.newValue && (
                                <div className="text-xs">
                                  新值: {change.newValue}
                                </div>
                              )}
                              <div className="text-xs mt-1 opacity-80">
                                {change.description}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const { impactedNodes, impactedEdges } = calculateImpactedChain(change.nodeId, version);
                                  onChangeItemClick(change.nodeId, impactedNodes, impactedEdges);
                                }}
                                className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                              >
                                <MousePointerClick className="w-3 h-3" />
                                <span>定位到节点并查看影响链路</span>
                              </button>
                            </div>
                          ))}

                          {/* Impact Info */}
                          <div className="pt-2 border-t border-slate-300 mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-3 h-3 text-purple-600" />
                              <span className="text-xs text-purple-700">影响范围</span>
                            </div>
                            <div className="text-xs text-slate-600">
                              {(() => {
                                const { impactedNodes, impactedEdges } = calculateVersionImpact(version);
                                return `影响节点: ${impactedNodes.length} 个 · 影响连线: ${impactedEdges.length} 条`;
                              })()}
                            </div>
                          </div>

                          {/* View Impact Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const { impactedNodes, impactedEdges } = calculateVersionImpact(version);
                              onVersionSelect(version, impactedNodes, impactedEdges);
                            }}
                            className={`w-full mt-2 px-3 py-2 rounded-lg transition-all text-xs ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isSelected ? '✓ 已选中 - 查看影响链路' : '查看影响链路'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 text-xs text-slate-500 text-center">
                          初始版本，无变更记录
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}