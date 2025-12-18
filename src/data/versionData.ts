// 版本变更记录数据结构
import { graphData } from './graphData';

export interface VersionChange {
  nodeId: string;
  nodeName: string;
  changeType: 'new' | 'modified' | 'deleted' | 'value_changed';
  oldValue?: string;
  newValue?: string;
  description: string;
}

export interface Version {
  id: string;
  versionNumber: string;
  date: string;
  author: string;
  description: string;
  changes: VersionChange[];
}

// 辅助函数：基于真实edges计算节点的影响链路
export function calculateImpactedChain(nodeId: string, version?: Version) {
  const impactedNodes = new Set<string>([nodeId]);
  const impactedEdges = new Set<string>();
  
  // 查找所有与该节点直接相连的边和节点
  graphData.edges.forEach(edge => {
    if (edge.source === nodeId) {
      impactedNodes.add(edge.target);
      impactedEdges.add(edge.id);
    }
    if (edge.target === nodeId) {
      impactedNodes.add(edge.source);
      impactedEdges.add(edge.id);
    }
  });
  
  return {
    impactedNodes: Array.from(impactedNodes),
    impactedEdges: Array.from(impactedEdges),
  };
}

// 计算整个版本的影响链路（合并所有变更项的影响）
export function calculateVersionImpact(version: Version) {
  const allImpactedNodes = new Set<string>();
  const allImpactedEdges = new Set<string>();
  
  version.changes.forEach(change => {
    const { impactedNodes, impactedEdges } = calculateImpactedChain(change.nodeId);
    impactedNodes.forEach(node => allImpactedNodes.add(node));
    impactedEdges.forEach(edge => allImpactedEdges.add(edge));
  });
  
  return {
    impactedNodes: Array.from(allImpactedNodes),
    impactedEdges: Array.from(allImpactedEdges),
  };
}

// 版本历史数据 - 仅记录真实的变更，影响链路动态计算
export const versionHistory: Version[] = [
  {
    id: 'v1',
    versionNumber: 'V1.0',
    date: '2024-01-15',
    author: '张工',
    description: '初始版本 - 建立完整的指标体系',
    changes: [],
  },
  {
    id: 'v2',
    versionNumber: 'V1.1',
    date: '2024-02-20',
    author: '李工',
    description: '优化折叠响应时间指标，提升用户体验',
    changes: [
      {
        nodeId: 'KPI_FoldTime_Start',
        nodeName: 'KPI_FoldTime_Start 折叠启动响应时间',
        changeType: 'value_changed',
        oldValue: '≤ 0.5s',
        newValue: '≤ 0.2s',
        description: '根据用户反馈，将启动响应时间从0.5秒优化到0.2秒，提升操作即时性',
      },
    ],
  },
  {
    id: 'v3',
    versionNumber: 'V1.2',
    date: '2024-03-10',
    author: '王工',
    description: '调整垂直空间增益目标值',
    changes: [
      {
        nodeId: 'KPI_SpaceGain_Vertical',
        nodeName: 'KPI_SpaceGain_Vertical 垂直空间增益',
        changeType: 'value_changed',
        oldValue: '≥ 120mm',
        newValue: '≥ 150mm',
        description: '提高垂直空间增益要求，从120mm提升到150mm，进一步改善乘员进出便利性',
      },
    ],
  },
  {
    id: 'v4',
    versionNumber: 'V1.3',
    date: '2024-04-05',
    author: '赵工',
    description: '强化NVH性能指标要求',
    changes: [
      {
        nodeId: 'KPI_NVH_Noise',
        nodeName: 'KPI_NVH_Noise 折叠噪声',
        changeType: 'value_changed',
        oldValue: '≤ 50 dB',
        newValue: '≤ 45 dB',
        description: '降低折叠噪声限值，从50dB降至45dB，提升高端车型静谧性',
      },
      {
        nodeId: 'KPI_NVH_Vibration',
        nodeName: 'KPI_NVH_Vibration 振动加速度',
        changeType: 'value_changed',
        oldValue: '≤ 3.0 m/s²',
        newValue: '≤ 2.0 m/s²',
        description: '收紧振动加速度要求，从3.0m/s²降至2.0m/s²，改善触感品质',
      },
    ],
  },
  {
    id: 'v5',
    versionNumber: 'V1.4',
    date: '2024-05-15',
    author: '刘工',
    description: '提升锁止性能与安全性要求',
    changes: [
      {
        nodeId: 'KPI_LockSafe_Strength',
        nodeName: 'KPI_LockSafe_Strength 锁止强度',
        changeType: 'value_changed',
        oldValue: '≥ 1500N',
        newValue: '≥ 2000N',
        description: '提高锁止强度要求，从1500N提升至2000N，满足更严格的安全标准',
      },
      {
        nodeId: 'KPI_LockSafe_Precision',
        nodeName: 'KPI_LockSafe_Precision 锁止位置精度',
        changeType: 'value_changed',
        oldValue: '± 1.0mm',
        newValue: '± 0.5mm',
        description: '提高锁止精度要求，从±1.0mm提升至±0.5mm，确保锁止可靠性',
      },
    ],
  },
  {
    id: 'v6',
    versionNumber: 'V2.0',
    date: '2024-06-20',
    author: '陈工',
    description: '重大更新 - 优化寿命指标与折叠完成时间',
    changes: [
      {
        nodeId: 'KPI_Life_Cycle',
        nodeName: 'KPI_Life_Cycle 循环寿命',
        changeType: 'value_changed',
        oldValue: '≥ 80,000 次',
        newValue: '≥ 100,000 次',
        description: '提升循环寿命要求，从8万次提升至10万次，延长产品使用寿命',
      },
      {
        nodeId: 'KPI_Life_Degradation',
        nodeName: 'KPI_Life_Degradation 性能衰减率',
        changeType: 'value_changed',
        oldValue: '≤ 15%',
        newValue: '≤ 10%',
        description: '收紧性能衰减率要求，从15%降至10%，保证长期性能稳定',
      },
      {
        nodeId: 'KPI_FoldTime_Complete',
        nodeName: 'KPI_FoldTime_Complete 折叠完成时间',
        changeType: 'value_changed',
        oldValue: '≤ 1.5s',
        newValue: '≤ 1.3s',
        description: '优化折叠完成时间，从1.5秒缩短至1.3秒，提升整体折叠效率',
      },
    ],
  },
];

// 当前版本
export const currentVersion = versionHistory[versionHistory.length - 1];

// 获取节点的版本信息
export function getNodeVersionInfo(nodeId: string) {
  const versions = versionHistory.filter(v => 
    v.changes.some(c => c.nodeId === nodeId)
  );
  
  if (versions.length === 0) {
    return {
      currentVersion: 'V1.0',
      hasVersionHistory: false,
    };
  }
  
  const lastVersion = versions[versions.length - 1];
  return {
    currentVersion: lastVersion.versionNumber,
    hasVersionHistory: true,
    lastModifiedVersion: lastVersion.versionNumber,
    changeHistory: versions.map(v => v.versionNumber),
  };
}