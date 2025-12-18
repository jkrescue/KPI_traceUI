// KPI指标体系方案
// 支持基于权重推荐和已有车型选择

export interface KPISystem {
  id: string;
  name: string;
  description: string;
  source: 'recommended' | 'existing'; // 推荐方案 or 已有车型
  vehicleModel?: string; // 车型名称（仅existing类型）
  matchScore?: number; // 与用户权重的匹配度（仅recommended类型）
  
  // 基于顶层维度的权重特征
  weightProfile: {
    cost: number;
    lightweight: number;
    safety: number;
    space: number;
    performance: number;
  };
  
  // 5个核心KPI指标定义（严格对应指标拆解拓扑图中的L1→L2结构）
  // L1维度: 交互体验(Experience) → KPI_FoldTime, KPI_FoldAngle
  // L1维度: 空间布置(Package) → KPI_SpaceGain  
  // L1维度: 功能安全(Safety) → KPI_LockSafe
  // L1维度: 声振品质(NVH) → KPI_NVH
  // L1维度: 可靠耐久(Reliability) → KPI_Life
  kpis: {
    KPI_FoldTime: { target: string; label: string; description: string };
    KPI_FoldAngle: { target: string; label: string; description: string };
    KPI_SpaceGain: { target: string; label: string; description: string };
    KPI_LockSafe: { target: string; label: string; description: string };
    KPI_NVH: { target: string; label: string; description: string };
    KPI_Life: { target: string; label: string; description: string };
  };
  
  // 约束条件
  constraints: string[];
  
  // 特色标签
  tags: string[];
}

// 推荐方案（基于权重智能匹配）
export const recommendedKPISystems: KPISystem[] = [
  {
    id: 'kpi-balanced',
    name: '均衡型指标体系',
    description: '五维均衡，适合综合考虑成本、安全、性能的主流车型',
    source: 'recommended',
    weightProfile: {
      cost: 0.2,
      lightweight: 0.2,
      safety: 0.2,
      space: 0.2,
      performance: 0.2,
    },
    kpis: {
      KPI_FoldTime: { 
        target: '≤1.5s', 
        label: '折叠时间',
        description: '折叠时间适中，兼顾用户体验与成本' 
      },
      KPI_FoldAngle: { 
        target: '≥120°', 
        label: '折叠角度',
        description: '标准折叠角度，满足主流需求' 
      },
      KPI_SpaceGain: { 
        target: '≥150mm', 
        label: '空间增益',
        description: '空间增益中等，改善乘员进出便利性' 
      },
      KPI_LockSafe: { 
        target: '≥25kN', 
        label: '锁止强度',
        description: '锁止强度满足碰撞安全法规' 
      },
      KPI_NVH: { 
        target: '≤50dB', 
        label: 'NVH性能',
        description: 'NVH性能良好，符合舒适性要求' 
      },
      KPI_Life: { 
        target: '≥10万次', 
        label: '使用寿命',
        description: '寿命满足整车设计周期' 
      },
    },
    constraints: [
      '成本目标：≤500元',
      '重量：≤2.5kg',
      '电机功率：≤150W'
    ],
    tags: ['主流配置', '五维均衡', '成本可控'],
  },
  {
    id: 'kpi-performance',
    name: '性能优先指标体系',
    description: '强调性能与安全，适合高端车型和智能驾驶场景',
    source: 'recommended',
    weightProfile: {
      cost: 0.1,
      lightweight: 0.15,
      safety: 0.3,
      space: 0.15,
      performance: 0.3,
    },
    kpis: {
      KPI_FoldTime: { 
        target: '≤1.0s', 
        label: '折叠时间',
        description: '极速折叠，提升智能驾驶切换体验' 
      },
      KPI_FoldAngle: { 
        target: '≥135°', 
        label: '折叠角度',
        description: '大角度折叠，最大化空间收益' 
      },
      KPI_SpaceGain: { 
        target: '≥180mm', 
        label: '空间增益',
        description: '显著空间提升，增强品牌差异化' 
      },
      KPI_LockSafe: { 
        target: '≥30kN', 
        label: '锁止强度',
        description: '高强度锁止，满足严苛碰撞工况' 
      },
      KPI_NVH: { 
        target: '≤45dB', 
        label: 'NVH性能',
        description: '高端NVH性能，静谧无感折叠' 
      },
      KPI_Life: { 
        target: '≥15万次', 
        label: '使用寿命',
        description: '超长寿命，降低全生命周期成本' 
      },
    },
    constraints: [
      '成本目标：≤800元',
      '重量：≤2.0kg（铝合金）',
      '电机功率：≤200W'
    ],
    tags: ['高端定位', '性能卓越', '智能驾驶'],
  },
  {
    id: 'kpi-cost-optimized',
    name: '成本优化指标体系',
    description: '注重成本控制，适合经济型车型和快速上量',
    source: 'recommended',
    weightProfile: {
      cost: 0.4,
      lightweight: 0.1,
      safety: 0.25,
      space: 0.1,
      performance: 0.15,
    },
    kpis: {
      KPI_FoldTime: { 
        target: '≤2.0s', 
        label: '折叠时间',
        description: '折叠时间放宽，降低电机成本' 
      },
      KPI_FoldAngle: { 
        target: '≥110°', 
        label: '折叠角度',
        description: '基础折叠角度，满足功能需求' 
      },
      KPI_SpaceGain: { 
        target: '≥130mm', 
        label: '空间增益',
        description: '基本空间增益，控制机构复杂度' 
      },
      KPI_LockSafe: { 
        target: '≥25kN', 
        label: '锁止强度',
        description: '满足法规要求的锁止强度' 
      },
      KPI_NVH: { 
        target: '≤55dB', 
        label: 'NVH性能',
        description: 'NVH性能合格，避免过度设计' 
      },
      KPI_Life: { 
        target: '≥8万次', 
        label: '使用寿命',
        description: '寿命满足基本保修期' 
      },
    },
    constraints: [
      '成本目标：≤350元',
      '重量：≤3.0kg（钢材）',
      '电机功率：≤120W'
    ],
    tags: ['成本敏感', '快速上量', '经济型'],
  },
];

// 已有车型方案（用户可直接选择）
export const existingVehicleKPISystems: KPISystem[] = [
  {
    id: 'vehicle-model-x',
    name: 'A车型指标',
    description: '高端智能电动SUV，强调科技感与性能体验',
    source: 'existing',
    vehicleModel: 'A车型',
    weightProfile: {
      cost: 0.15,
      lightweight: 0.2,
      safety: 0.25,
      space: 0.2,
      performance: 0.2,
    },
    kpis: {
      KPI_FoldTime: { target: '≤1.2s', label: '折叠时间', description: '快速响应，科技感十足' },
      KPI_FoldAngle: { target: '≥130°', label: '折叠角度', description: '大角度折叠，视觉冲击' },
      KPI_SpaceGain: { target: '≥170mm', label: '空间增益', description: '宽敞空间，豪华体验' },
      KPI_LockSafe: { target: '≥28kN', label: '锁止强度', description: '高安全标准' },
      KPI_NVH: { target: '≤48dB', label: 'NVH性能', description: '静谧折叠体验' },
      KPI_Life: { target: '≥12万次', label: '使用寿命', description: '长寿命设计' },
    },
    constraints: [
      '成本目标：≤650元',
      '重量：≤2.2kg',
      '电机功率：≤180W'
    ],
    tags: ['已验证', '高端SUV', '科技豪华'],
  },
  {
    id: 'vehicle-compact-a',
    name: 'B车型指标',
    description: '紧凑型家用轿车，平衡性能与成本',
    source: 'existing',
    vehicleModel: 'B车型',
    weightProfile: {
      cost: 0.25,
      lightweight: 0.15,
      safety: 0.2,
      space: 0.2,
      performance: 0.2,
    },
    kpis: {
      KPI_FoldTime: { target: '≤1.5s', label: '折叠时间', description: '标准响应时间' },
      KPI_FoldAngle: { target: '≥120°', label: '折叠角度', description: '实用折叠角度' },
      KPI_SpaceGain: { target: '≥150mm', label: '空间增益', description: '空间改善明显' },
      KPI_LockSafe: { target: '≥25kN', label: '锁止强度', description: '满足法规要求' },
      KPI_NVH: { target: '≤50dB', label: 'NVH性能', description: '良好静谧性' },
      KPI_Life: { target: '≥10万次', label: '使用寿命', description: '标准寿命' },
    },
    constraints: [
      '成本目标：≤450元',
      '重量：≤2.6kg',
      '电机功率：≤150W'
    ],
    tags: ['已验证', '紧凑家轿', '性价比'],
  },
  {
    id: 'vehicle-luxury-s',
    name: 'C车型指标',
    description: '豪华旗舰轿车，追求极致品质与体验',
    source: 'existing',
    vehicleModel: 'C车型',
    weightProfile: {
      cost: 0.05,
      lightweight: 0.25,
      safety: 0.3,
      space: 0.15,
      performance: 0.25,
    },
    kpis: {
      KPI_FoldTime: { target: '≤0.9s', label: '折叠时间', description: '瞬间折叠，极致体验' },
      KPI_FoldAngle: { target: '≥140°', label: '折叠角度', description: '最大化折叠角度' },
      KPI_SpaceGain: { target: '≥200mm', label: '空间增益', description: '豪华级空间提升' },
      KPI_LockSafe: { target: '≥35kN', label: '锁止强度', description: '旗舰级安全标准' },
      KPI_NVH: { target: '≤42dB', label: 'NVH性能', description: '图书馆级静谧' },
      KPI_Life: { target: '≥20万次', label: '使用寿命', description: '超长使用寿命' },
    },
    constraints: [
      '成本目标：≤1200元',
      '重量：≤1.8kg（碳纤维+铝合金）',
      '电机功率：≤250W'
    ],
    tags: ['已验证', '豪华旗舰', '极致工艺'],
  },
  {
    id: 'vehicle-ev-mini',
    name: 'D车型指标',
    description: '小型电动车，注重成本与轻量化',
    source: 'existing',
    vehicleModel: 'D车型',
    weightProfile: {
      cost: 0.35,
      lightweight: 0.2,
      safety: 0.2,
      space: 0.15,
      performance: 0.1,
    },
    kpis: {
      KPI_FoldTime: { target: '≤2.0s', label: '折叠时间', description: '经济型响应时间' },
      KPI_FoldAngle: { target: '≥110°', label: '折叠角度', description: '基础折叠功能' },
      KPI_SpaceGain: { target: '≥130mm', label: '空间增益', description: '有效空间改善' },
      KPI_LockSafe: { target: '≥23kN', label: '锁止强度', description: '满足基本安全' },
      KPI_NVH: { target: '≤55dB', label: 'NVH性能', description: '可接受的NVH' },
      KPI_Life: { target: '≥8万次', label: '使用寿命', description: '基本寿命要求' },
    },
    constraints: [
      '成本目标：≤300元',
      '重量：≤3.2kg',
      '电机功率：≤100W'
    ],
    tags: ['已验证', '小型电动', '极致成本'],
  },
];

// 计算权重相似度（余弦相似度）
export function calculateWeightSimilarity(
  userWeights: Record<string, number>,
  systemWeights: Record<string, number>
): number {
  const keys = Object.keys(userWeights);
  
  let dotProduct = 0;
  let userMagnitude = 0;
  let systemMagnitude = 0;
  
  keys.forEach(key => {
    const userW = userWeights[key] || 0;
    const systemW = systemWeights[key] || 0;
    dotProduct += userW * systemW;
    userMagnitude += userW * userW;
    systemMagnitude += systemW * systemW;
  });
  
  if (userMagnitude === 0 || systemMagnitude === 0) return 0;
  
  return (dotProduct / (Math.sqrt(userMagnitude) * Math.sqrt(systemMagnitude))) * 100;
}

// 基于用户权重推荐KPI体系
export function recommendKPISystems(userWeights: Record<string, number>): KPISystem[] {
  const systemsWithScore = recommendedKPISystems.map(system => ({
    ...system,
    matchScore: calculateWeightSimilarity(userWeights, system.weightProfile),
  }));
  
  // 按匹配度降序排列
  return systemsWithScore.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}