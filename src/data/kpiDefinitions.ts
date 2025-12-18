/**
 * KPI 统一定义文件
 * 确保整个应用使用一致的指标体系
 */

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  target: string;
  unit: string;
  betterDirection: 'higher' | 'lower'; // 数值越高越好 / 越低越好
}

/**
 * 6个核心KPI定义
 * 这些KPI在整个应用中保持一致，从权重定义 → KPI拆解 → 方案对比 → 任务分解
 */
export const kpiDefinitions: Record<string, KPIDefinition> = {
  KPI_FoldTime: {
    id: 'KPI_FoldTime',
    name: '折叠时间',
    description: '方向盘从展开到完全折叠所需时间',
    target: '≤ 1.5 s',
    unit: 's',
    betterDirection: 'lower',
  },
  KPI_FoldAngle: {
    id: 'KPI_FoldAngle',
    name: '折叠角度',
    description: '方向盘可折叠的最大角度范围',
    target: '0-120°',
    unit: '°',
    betterDirection: 'higher',
  },
  KPI_SpaceGain: {
    id: 'KPI_SpaceGain',
    name: '乘员空间提升',
    description: '折叠后增加的驾驶员空间',
    target: '≥ 150 mm',
    unit: 'mm',
    betterDirection: 'higher',
  },
  KPI_LockSafe: {
    id: 'KPI_LockSafe',
    name: '锁止安全性',
    description: '锁止机构的可靠性和安全性',
    target: '达成',
    unit: '',
    betterDirection: 'higher',
  },
  KPI_NVH: {
    id: 'KPI_NVH',
    name: 'NVH性能',
    description: '折叠过程中的噪声、振动和声振粗糙度',
    target: '≤ 45 dB',
    unit: 'dB',
    betterDirection: 'lower',
  },
  KPI_Life: {
    id: 'KPI_Life',
    name: '折叠寿命',
    description: '折叠机构的循环寿命',
    target: '≥ 10万次',
    unit: '次',
    betterDirection: 'higher',
  },
};

/**
 * KPI ID 列表（按优先级排序）
 */
export const kpiIdList = [
  'KPI_FoldTime',
  'KPI_FoldAngle',
  'KPI_SpaceGain',
  'KPI_LockSafe',
  'KPI_NVH',
  'KPI_Life',
] as const;

export type KPIId = typeof kpiIdList[number];

/**
 * 工具函数：获取KPI定义
 */
export function getKPIDefinition(kpiId: string): KPIDefinition | undefined {
  return kpiDefinitions[kpiId];
}

/**
 * 工具函数：检查是否是有效的KPI ID
 */
export function isValidKPIId(id: string): id is KPIId {
  return kpiIdList.includes(id as KPIId);
}
