// 指标权衡分析数据

export interface TopLevelMetric {
  id: string;
  name: string;
  description: string;
  weight: number; // 权重
}

export interface DesignScheme {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
  source?: 'preset' | 'user' | 'simulation'; // 方案来源：系统预设/用户输入/仿真优化
  scores: {
    [metricId: string]: number; // 0-100分
  };
  kpiValues: {
    [kpiId: string]: {
      achievementRate: number;
      value?: string;
    };
  };
}

// 顶层关注指标（雷达图维度）
export const topLevelMetrics: TopLevelMetric[] = [
  {
    id: 'cost',
    name: '成本',
    description: '系统总成本，包括材料、制造和开发成本',
    weight: 0.2,
  },
  {
    id: 'lightweight',
    name: '轻量化',
    description: '系统轻量化水平，影响整车能耗',
    weight: 0.15,
  },
  {
    id: 'safety',
    name: '安全',
    description: '锁止安全性和碰撞安全性能',
    weight: 0.25,
  },
  {
    id: 'space',
    name: '空间',
    description: '乘员空间提升和进出便利性',
    weight: 0.2,
  },
  {
    id: 'performance',
    name: '性能',
    description: '折叠速度、精度、NVH和寿命',
    weight: 0.2,
  },
];

// 顶层指标到具体KPI的映射关系
export const metricToKPIMapping = {
  cost: {
    relatedKPIs: ['KPI_Life', 'KPI_FoldTime'],
    description: '成本主要受寿命（维护成本）和折叠时间（电机功率）影响',
  },
  lightweight: {
    relatedKPIs: ['KPI_FoldTime', 'KPI_FoldAngle'],
    description: '轻量化影响折叠机构的响应速度和角度控制',
  },
  safety: {
    relatedKPIs: ['KPI_LockSafe'],
    description: '安全性主要体现在锁止机构的可靠性',
  },
  space: {
    relatedKPIs: ['KPI_SpaceGain'],
    description: '空间性能直接对应乘员空间提升指标',
  },
  performance: {
    relatedKPIs: ['KPI_FoldTime', 'KPI_FoldAngle', 'KPI_NVH', 'KPI_Life'],
    description: '性能综合考虑折叠时间、角度、NVH和寿命',
  },
};

// 三组设计方案
export const designSchemes: DesignScheme[] = [
  {
    id: 'scheme-a',
    name: '方案A：性能优先',
    description: '采用高性能电机、铝合金材料、精密传感器，追求极致性能体验',
    recommended: false,
    scores: {
      cost: 45, // 成本高
      lightweight: 85, // 铝合金轻量化
      safety: 95, // 高安全等级
      space: 90, // 大角度折叠
      performance: 98, // 极致性能
    },
    kpiValues: {
      KPI_FoldTime: { achievementRate: 100, value: '1.2 s' },
      KPI_FoldAngle: { achievementRate: 92, value: '0-110°' }, // 未达标：目标120°，实际110°
      KPI_SpaceGain: { achievementRate: 100, value: '180 mm' },
      KPI_LockSafe: { achievementRate: 100, value: '达成' },
      KPI_NVH: { achievementRate: 100, value: '42 dB' },
      KPI_Life: { achievementRate: 100, value: '12万次' },
    },
  },
  {
    id: 'scheme-b',
    name: '方案B：平衡方案',
    description: '平衡性能与成本，采用钢铝混合材料、标准电机和传感器配置（推荐）',
    recommended: true,
    scores: {
      cost: 75, // 成本适中
      lightweight: 70, // 混合材料
      safety: 90, // 满足安全标准
      space: 85, // 充足空间
      performance: 88, // 良好性能
    },
    kpiValues: {
      KPI_FoldTime: { achievementRate: 100, value: '1.4 s' },
      KPI_FoldAngle: { achievementRate: 88, value: '0-105°' }, // 未达标：目标120°，实际105°
      KPI_SpaceGain: { achievementRate: 100, value: '160 mm' },
      KPI_LockSafe: { achievementRate: 100, value: '达成' },
      KPI_NVH: { achievementRate: 91, value: '47 dB' }, // 未达标：目标≤45dB，实际47dB
      KPI_Life: { achievementRate: 100, value: '10万次' },
    },
  },
  {
    id: 'scheme-c',
    name: '方案C：成本优先',
    description: '优化成本结构，采用钢材、标准电机、基础传感器，满足基本性能要求',
    recommended: false,
    scores: {
      cost: 92, // 成本优秀
      lightweight: 55, // 钢材较重
      safety: 85, // 满足基本安全
      space: 75, // 基本空间
      performance: 75, // 满足要求
    },
    kpiValues: {
      KPI_FoldTime: { achievementRate: 100, value: '1.5 s' },
      KPI_FoldAngle: { achievementRate: 83, value: '0-100°' }, // 未达标：目标120°，实际100°
      KPI_SpaceGain: { achievementRate: 87, value: '130 mm' }, // 未达标：目标150mm，实际130mm
      KPI_LockSafe: { achievementRate: 100, value: '达成' },
      KPI_NVH: { achievementRate: 78, value: '48 dB' }, // 未达标：目标≤45dB，实际48dB
      KPI_Life: { achievementRate: 100, value: '10万次' },
    },
  },
];

// 指标拆解模板
export const metricDecompositionTemplate = {
  '方向盘折叠体验与安全优化': {
    topLevelMetrics: ['cost', 'lightweight', 'safety', 'space', 'performance'],
    level1KPIs: [
      {
        id: 'KPI_FoldTime',
        name: '折叠时间',
        target: '≤ 1.5 s',
        relatedTopMetrics: ['performance', 'cost'],
      },
      {
        id: 'KPI_FoldAngle',
        name: '折叠角度',
        target: '0–120°',
        relatedTopMetrics: ['performance', 'space', 'lightweight'],
      },
      {
        id: 'KPI_SpaceGain',
        name: '乘员空间提升',
        target: '≥ X mm',
        relatedTopMetrics: ['space'],
      },
      {
        id: 'KPI_LockSafe',
        name: '锁止安全性',
        target: '符合GB/ECE标准',
        relatedTopMetrics: ['safety'],
      },
      {
        id: 'KPI_NVH',
        name: 'NVH性能',
        target: '≤ 45 dB, ≤ 2.0 m/s²',
        relatedTopMetrics: ['performance'],
      },
      {
        id: 'KPI_Life',
        name: '折叠寿命',
        target: '≥ 10万次',
        relatedTopMetrics: ['performance', 'cost'],
      },
    ],
  },
};