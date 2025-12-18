import { Node, Edge } from 'reactflow';

export interface KPIMetrics {
  achieved: boolean; // 是否达成
  modelType?: 'sysml' | 'modelica' | 'fmu' | 'simulink' | null; // 模型类型
  modelCovered: boolean; // 是否有模型覆盖
  achievementRate?: number; // 达成率百分比
}

export interface VersionInfo {
  currentVersion: string; // 当前版本号
  hasVersionHistory: boolean; // 是否有版本变更历史
  lastModifiedVersion?: string; // 最后修改的版本
  changeHistory?: string[]; // 变更历史版本列表
}

export type EdgeRelationship = 'satisfy' | 'implement' | 'verify';

export const graphData: { nodes: Node[]; edges: Edge[] } = {
  nodes: [
    // ================= 顶层目标 =================
    {
      id: 'G1',
      type: 'custom',
      position: { x: 100, y: 400 },
      data: { 
        id: 'G1',
        label: 'G1 方向盘折叠体验与安全优化',
        description: '方向盘折叠体验与安全优化',
        category: 'goal'
      },
    },

    // ================= 一级指标层（KPI L1） =================
    {
      id: 'KPI_FoldTime',
      type: 'custom',
      position: { x: 500, y: 50 },
      data: { 
        id: 'KPI_FoldTime',
        label: 'KPI_FoldTime',
        description: '折叠时间 ≤ 1.5 s',
        category: 'kpi',
        level: 1,
        metrics: {
          achieved: true,
          modelType: 'simulink',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_FoldAngle',
      type: 'custom',
      position: { x: 500, y: 200 },
      data: { 
        id: 'KPI_FoldAngle',
        label: 'KPI_FoldAngle',
        description: '折叠角度范围 0–120°',
        category: 'kpi',
        level: 1,
        metrics: {
          achieved: true,
          modelType: 'sysml',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_SpaceGain',
      type: 'custom',
      position: { x: 500, y: 350 },
      data: { 
        id: 'KPI_SpaceGain',
        label: 'KPI_SpaceGain',
        description: '乘员空间提升 ≥ X mm',
        category: 'kpi',
        level: 1,
        metrics: {
          achieved: false,
          modelType: null,
          modelCovered: false,
          achievementRate: 85
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_LockSafe',
      type: 'custom',
      position: { x: 500, y: 500 },
      data: { 
        id: 'KPI_LockSafe',
        label: 'KPI_LockSafe',
        description: '锁止安全性',
        category: 'kpi',
        level: 1,
        metrics: {
          achieved: true,
          modelType: null,
          modelCovered: false,
          achievementRate: 100
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_NVH',
      type: 'custom',
      position: { x: 500, y: 650 },
      data: { 
        id: 'KPI_NVH',
        label: 'KPI_NVH',
        description: 'NVH性能',
        category: 'kpi',
        level: 1,
        metrics: {
          achieved: false,
          modelType: null,
          modelCovered: false,
          achievementRate: 70
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_Life',
      type: 'custom',
      position: { x: 500, y: 800 },
      data: { 
        id: 'KPI_Life',
        label: 'KPI_Life',
        description: '折叠寿命 ≥ 10 万次',
        category: 'kpi',
        level: 1,
        metrics: {
          achieved: false, // 修正：性能衰减未达标，与wbsData保持一致
          modelType: 'fmu',
          modelCovered: true,
          achievementRate: 95
        } as KPIMetrics
      },
    },

    // ================= 二级指标层（KPI L2） =================
    // KPI_FoldTime 的子指标
    {
      id: 'KPI_FoldTime_Start',
      type: 'custom',
      position: { x: 850, y: 0 },
      data: { 
        id: 'KPI_FoldTime_Start',
        label: 'KPI_FoldTime_Start',
        description: '折叠启动响应时间 ≤ 0.2s',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_FoldTime',
        metrics: {
          achieved: true,
          modelType: 'simulink',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_FoldTime_Complete',
      type: 'custom',
      position: { x: 850, y: 100 },
      data: { 
        id: 'KPI_FoldTime_Complete',
        label: 'KPI_FoldTime_Complete',
        description: '折叠完成时间 ≤ 1.3s',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_FoldTime',
        metrics: {
          achieved: true,
          modelType: 'simulink',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },

    // KPI_FoldAngle 的子指标
    {
      id: 'KPI_FoldAngle_Max',
      type: 'custom',
      position: { x: 850, y: 170 },
      data: { 
        id: 'KPI_FoldAngle_Max',
        label: 'KPI_FoldAngle_Max',
        description: '最大折叠角度 ≥ 120°',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_FoldAngle',
        metrics: {
          achieved: true,
          modelType: 'sysml',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_FoldAngle_Precision',
      type: 'custom',
      position: { x: 850, y: 250 },
      data: { 
        id: 'KPI_FoldAngle_Precision',
        label: 'KPI_FoldAngle_Precision',
        description: '角度控制精度 ± 2°',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_FoldAngle',
        metrics: {
          achieved: true,
          modelType: 'simulink',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },

    // KPI_SpaceGain 的子指标
    {
      id: 'KPI_SpaceGain_Vertical',
      type: 'custom',
      position: { x: 850, y: 320 },
      data: { 
        id: 'KPI_SpaceGain_Vertical',
        label: 'KPI_SpaceGain_Vertical',
        description: '垂直空间增益 ≥ 150mm',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_SpaceGain',
        metrics: {
          achieved: false,
          modelType: 'modelica',
          modelCovered: true,
          achievementRate: 80
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_SpaceGain_Access',
      type: 'custom',
      position: { x: 850, y: 400 },
      data: { 
        id: 'KPI_SpaceGain_Access',
        label: 'KPI_SpaceGain_Access',
        description: '进出便利性提升 ≥ 20%',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_SpaceGain',
        metrics: {
          achieved: true,
          modelType: null,
          modelCovered: false,
          achievementRate: 90
        } as KPIMetrics
      },
    },

    // KPI_LockSafe 的子指标
    {
      id: 'KPI_LockSafe_Strength',
      type: 'custom',
      position: { x: 850, y: 470 },
      data: { 
        id: 'KPI_LockSafe_Strength',
        label: 'KPI_LockSafe_Strength',
        description: '锁止强度 ≥ 2000N',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_LockSafe',
        metrics: {
          achieved: true,
          modelType: 'fmu',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_LockSafe_Precision',
      type: 'custom',
      position: { x: 850, y: 550 },
      data: { 
        id: 'KPI_LockSafe_Precision',
        label: 'KPI_LockSafe_Precision',
        description: '锁止位置精度 ± 0.5mm',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_LockSafe',
        metrics: {
          achieved: true,
          modelType: 'sysml',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },

    // KPI_NVH 的子指标
    {
      id: 'KPI_NVH_Noise',
      type: 'custom',
      position: { x: 850, y: 620 },
      data: { 
        id: 'KPI_NVH_Noise',
        label: 'KPI_NVH_Noise',
        description: '折叠噪声 ≤ 45 dB',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_NVH',
        metrics: {
          achieved: false,
          modelType: null,
          modelCovered: false,
          achievementRate: 75
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_NVH_Vibration',
      type: 'custom',
      position: { x: 850, y: 700 },
      data: { 
        id: 'KPI_NVH_Vibration',
        label: 'KPI_NVH_Vibration',
        description: '振动加速度 ≤ 2.0 m/s²',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_NVH',
        metrics: {
          achieved: false,
          modelType: 'modelica',
          modelCovered: true,
          achievementRate: 65
        } as KPIMetrics
      },
    },

    // KPI_Life 的子指标
    {
      id: 'KPI_Life_Cycle',
      type: 'custom',
      position: { x: 850, y: 770 },
      data: { 
        id: 'KPI_Life_Cycle',
        label: 'KPI_Life_Cycle',
        description: '循环寿命 ≥ 100,000 次',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_Life',
        metrics: {
          achieved: true,
          modelType: 'fmu',
          modelCovered: true,
          achievementRate: 100
        } as KPIMetrics
      },
    },
    {
      id: 'KPI_Life_Degradation',
      type: 'custom',
      position: { x: 850, y: 850 },
      data: { 
        id: 'KPI_Life_Degradation',
        label: 'KPI_Life_Degradation',
        description: '性能衰减率 ≤ 10%',
        category: 'kpi',
        level: 2,
        parentId: 'KPI_Life',
        metrics: {
          achieved: false,
          modelType: null,
          modelCovered: false,
          achievementRate: 85
        } as KPIMetrics
      },
    },

    // ================= 设计参数层 =================
    // 结构与机构
    {
      id: 'D_HingeRange',
      type: 'custom',
      position: { x: 1250, y: 200 },
      data: { 
        id: 'D_HingeRange',
        label: 'D_HingeRange',
        description: '折叠铰链角度行程',
        category: 'design'
      },
    },
    {
      id: 'D_HingeStrength',
      type: 'custom',
      position: { x: 1250, y: 300 },
      data: { 
        id: 'D_HingeStrength',
        label: 'D_HingeStrength',
        description: '铰链强度 / 安全系数',
        category: 'design'
      },
    },
    {
      id: 'D_LockStructure',
      type: 'custom',
      position: { x: 1250, y: 400 },
      data: { 
        id: 'D_LockStructure',
        label: 'D_LockStructure',
        description: '锁止机构形式与锁爪布局',
        category: 'design'
      },
    },
    {
      id: 'D_ColumnLayout',
      type: 'custom',
      position: { x: 1250, y: 500 },
      data: { 
        id: 'D_ColumnLayout',
        label: 'D_ColumnLayout',
        description: '转向柱与内饰空间布置',
        category: 'design'
      },
    },
    {
      id: 'D_Clearance',
      type: 'custom',
      position: { x: 1250, y: 600 },
      data: { 
        id: 'D_Clearance',
        label: 'D_Clearance',
        description: '结构间隙 / 配合公差',
        category: 'design'
      },
    },

    // 执行机构与电控
    {
      id: 'D_MotorTorque',
      type: 'custom',
      position: { x: 1250, y: 700 },
      data: { 
        id: 'D_MotorTorque',
        label: 'D_MotorTorque',
        description: '电机额定 / 峰值扭矩',
        category: 'design'
      },
    },
    {
      id: 'D_GearRatio',
      type: 'custom',
      position: { x: 1250, y: 800 },
      data: { 
        id: 'D_GearRatio',
        label: 'D_GearRatio',
        description: '传动比与效率',
        category: 'design'
      },
    },
    {
      id: 'D_ControlAlgo',
      type: 'custom',
      position: { x: 1250, y: 900 },
      data: { 
        id: 'D_ControlAlgo',
        label: 'D_ControlAlgo',
        description: '折叠控制算法\n（速度曲线 / PID / 前馈）',
        category: 'design'
      },
    },
    {
      id: 'D_SensorRedund',
      type: 'custom',
      position: { x: 1250, y: 1020 },
      data: { 
        id: 'D_SensorRedund',
        label: 'D_SensorRedund',
        description: '位置传感器冗余\n霍尔 / 编码器',
        category: 'design'
      },
    },
    {
      id: 'D_SafetyLogic',
      type: 'custom',
      position: { x: 1250, y: 1140 },
      data: { 
        id: 'D_SafetyLogic',
        label: 'D_SafetyLogic',
        description: '功能安全与车速联动逻辑',
        category: 'design'
      },
    },

    // 材料与NVH
    {
      id: 'D_FrictionPair',
      type: 'custom',
      position: { x: 1250, y: 1260 },
      data: { 
        id: 'D_FrictionPair',
        label: 'D_FrictionPair',
        description: '摩擦副材料\n(POM/PA66+GF/PTFE)',
        category: 'design'
      },
    },
    {
      id: 'D_Damping',
      type: 'custom',
      position: { x: 1250, y: 1380 },
      data: { 
        id: 'D_Damping',
        label: 'D_Damping',
        description: '阻尼件 / 垫片布置',
        category: 'design'
      },
    },
    {
      id: 'D_MaterialMain',
      type: 'custom',
      position: { x: 1250, y: 1480 },
      data: { 
        id: 'D_MaterialMain',
        label: 'D_MaterialMain',
        description: '主体结构材料\n(钢/铝/复材)',
        category: 'design'
      },
    },

    // 制造与质量
    {
      id: 'D_AssyTolerance',
      type: 'custom',
      position: { x: 1250, y: 1580 },
      data: { 
        id: 'D_AssyTolerance',
        label: 'D_AssyTolerance',
        description: '装配公差方案',
        category: 'design'
      },
    },
    {
      id: 'D_CPK',
      type: 'custom',
      position: { x: 1250, y: 1680 },
      data: { 
        id: 'D_CPK',
        label: 'D_CPK',
        description: '关键尺寸 CPK ≥ 1.67',
        category: 'design'
      },
    },

    // ================= 仿真与试验验证层 =================
    {
      id: 'V_FoldCycle',
      type: 'custom',
      position: { x: 1700, y: 500 },
      data: { 
        id: 'V_FoldCycle',
        label: 'V_FoldCycle',
        description: '折叠耐久试验\n(循环次数、失效模式)',
        category: 'verify'
      },
    },
    {
      id: 'V_StructFEA',
      type: 'custom',
      position: { x: 1700, y: 650 },
      data: { 
        id: 'V_StructFEA',
        label: 'V_StructFEA',
        description: '结构强度 / 刚度 FEA\n(含碰撞工况)',
        category: 'verify'
      },
    },
    {
      id: 'V_NVHTest',
      type: 'custom',
      position: { x: 1700, y: 820 },
      data: { 
        id: 'V_NVHTest',
        label: 'V_NVHTest',
        description: '折叠过程噪声 / 振动试验',
        category: 'verify'
      },
    },
    {
      id: 'V_HIL_SIL',
      type: 'custom',
      position: { x: 1700, y: 990 },
      data: { 
        id: 'V_HIL_SIL',
        label: 'V_HIL_SIL',
        description: '电控 HIL/SIL 仿真\n(失效注入 / 超时)',
        category: 'verify'
      },
    },
    {
      id: 'V_EnvReliab',
      type: 'custom',
      position: { x: 1700, y: 1160 },
      data: { 
        id: 'V_EnvReliab',
        label: 'V_EnvReliab',
        description: '高低温 / 湿热 / 盐雾试验',
        category: 'verify'
      },
    },
    {
      id: 'V_RegulCert',
      type: 'custom',
      position: { x: 1700, y: 1310 },
      data: { 
        id: 'V_RegulCert',
        label: 'V_RegulCert',
        description: '法规与功能安全认证\n(GB/UN ECE/ISO 26262)',
        category: 'verify'
      },
    },
  ],

  edges: [
    // ========= 目标 → ��级指标 (满足关系) =========
    { id: 'e-G1-KPI_FoldTime', source: 'G1', target: 'KPI_FoldTime', style: { stroke: '#8b5cf6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-G1-KPI_FoldAngle', source: 'G1', target: 'KPI_FoldAngle', style: { stroke: '#8b5cf6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-G1-KPI_SpaceGain', source: 'G1', target: 'KPI_SpaceGain', style: { stroke: '#8b5cf6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-G1-KPI_LockSafe', source: 'G1', target: 'KPI_LockSafe', style: { stroke: '#8b5cf6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-G1-KPI_NVH', source: 'G1', target: 'KPI_NVH', style: { stroke: '#8b5cf6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-G1-KPI_Life', source: 'G1', target: 'KPI_Life', style: { stroke: '#8b5cf6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },

    // ========= 一级指标 → 二级指标 (满足关系) =========
    { id: 'e-KPI_FoldTime-KPI_FoldTime_Start', source: 'KPI_FoldTime', target: 'KPI_FoldTime_Start', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-KPI_FoldTime-KPI_FoldTime_Complete', source: 'KPI_FoldTime', target: 'KPI_FoldTime_Complete', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    
    { id: 'e-KPI_FoldAngle-KPI_FoldAngle_Max', source: 'KPI_FoldAngle', target: 'KPI_FoldAngle_Max', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-KPI_FoldAngle-KPI_FoldAngle_Precision', source: 'KPI_FoldAngle', target: 'KPI_FoldAngle_Precision', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    
    { id: 'e-KPI_SpaceGain-KPI_SpaceGain_Vertical', source: 'KPI_SpaceGain', target: 'KPI_SpaceGain_Vertical', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-KPI_SpaceGain-KPI_SpaceGain_Access', source: 'KPI_SpaceGain', target: 'KPI_SpaceGain_Access', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    
    { id: 'e-KPI_LockSafe-KPI_LockSafe_Strength', source: 'KPI_LockSafe', target: 'KPI_LockSafe_Strength', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-KPI_LockSafe-KPI_LockSafe_Precision', source: 'KPI_LockSafe', target: 'KPI_LockSafe_Precision', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    
    { id: 'e-KPI_NVH-KPI_NVH_Noise', source: 'KPI_NVH', target: 'KPI_NVH_Noise', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-KPI_NVH-KPI_NVH_Vibration', source: 'KPI_NVH', target: 'KPI_NVH_Vibration', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    
    { id: 'e-KPI_Life-KPI_Life_Cycle', source: 'KPI_Life', target: 'KPI_Life_Cycle', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },
    { id: 'e-KPI_Life-KPI_Life_Degradation', source: 'KPI_Life', target: 'KPI_Life_Degradation', style: { stroke: '#3b82f6', strokeWidth: 2 }, data: { relationship: 'satisfy' } },

    // ========= 指标 → 设计参数（实现关系） =========
    // 折叠时间相关
    { id: 'e-KPI_FoldTime_Start-D_ControlAlgo', source: 'KPI_FoldTime_Start', target: 'D_ControlAlgo', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_FoldTime_Complete-D_MotorTorque', source: 'KPI_FoldTime_Complete', target: 'D_MotorTorque', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_FoldTime_Complete-D_GearRatio', source: 'KPI_FoldTime_Complete', target: 'D_GearRatio', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_FoldTime_Complete-D_Damping', source: 'KPI_FoldTime_Complete', target: 'D_Damping', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_FoldTime_Complete-D_Clearance', source: 'KPI_FoldTime_Complete', target: 'D_Clearance', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },

    // 折叠角度相关
    { id: 'e-KPI_FoldAngle_Max-D_HingeRange', source: 'KPI_FoldAngle_Max', target: 'D_HingeRange', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_FoldAngle_Max-D_ColumnLayout', source: 'KPI_FoldAngle_Max', target: 'D_ColumnLayout', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_FoldAngle_Precision-D_SensorRedund', source: 'KPI_FoldAngle_Precision', target: 'D_SensorRedund', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_FoldAngle_Precision-D_ControlAlgo', source: 'KPI_FoldAngle_Precision', target: 'D_ControlAlgo', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },

    // 空间增益相关
    { id: 'e-KPI_SpaceGain_Vertical-D_ColumnLayout', source: 'KPI_SpaceGain_Vertical', target: 'D_ColumnLayout', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_SpaceGain_Vertical-D_HingeRange', source: 'KPI_SpaceGain_Vertical', target: 'D_HingeRange', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },

    // 锁止安全相关
    { id: 'e-KPI_LockSafe_Strength-D_LockStructure', source: 'KPI_LockSafe_Strength', target: 'D_LockStructure', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_LockSafe_Strength-D_HingeStrength', source: 'KPI_LockSafe_Strength', target: 'D_HingeStrength', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_LockSafe_Strength-D_MaterialMain', source: 'KPI_LockSafe_Strength', target: 'D_MaterialMain', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_LockSafe_Precision-D_SensorRedund', source: 'KPI_LockSafe_Precision', target: 'D_SensorRedund', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_LockSafe_Precision-D_SafetyLogic', source: 'KPI_LockSafe_Precision', target: 'D_SafetyLogic', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },

    // NVH相关
    { id: 'e-KPI_NVH_Noise-D_FrictionPair', source: 'KPI_NVH_Noise', target: 'D_FrictionPair', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_NVH_Noise-D_Damping', source: 'KPI_NVH_Noise', target: 'D_Damping', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_NVH_Vibration-D_GearRatio', source: 'KPI_NVH_Vibration', target: 'D_GearRatio', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_NVH_Vibration-D_Clearance', source: 'KPI_NVH_Vibration', target: 'D_Clearance', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_NVH_Vibration-D_AssyTolerance', source: 'KPI_NVH_Vibration', target: 'D_AssyTolerance', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },

    // 寿命相关
    { id: 'e-KPI_Life_Cycle-D_HingeStrength', source: 'KPI_Life_Cycle', target: 'D_HingeStrength', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_Life_Cycle-D_FrictionPair', source: 'KPI_Life_Cycle', target: 'D_FrictionPair', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_Life_Cycle-D_MotorTorque', source: 'KPI_Life_Cycle', target: 'D_MotorTorque', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },
    { id: 'e-KPI_Life_Degradation-D_MaterialMain', source: 'KPI_Life_Degradation', target: 'D_MaterialMain', style: { stroke: '#3b82f6' }, data: { relationship: 'implement' } },

    // ========= 设计参数 → 仿真/验证 (验证关系) =========
    // 结构相关
    { id: 'e-D_HingeStrength-V_StructFEA', source: 'D_HingeStrength', target: 'V_StructFEA', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_MaterialMain-V_StructFEA', source: 'D_MaterialMain', target: 'V_StructFEA', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_LockStructure-V_StructFEA', source: 'D_LockStructure', target: 'V_StructFEA', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_HingeRange-V_StructFEA', source: 'D_HingeRange', target: 'V_StructFEA', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },

    // 执行机构 / 电控相关
    { id: 'e-D_MotorTorque-V_FoldCycle', source: 'D_MotorTorque', target: 'V_FoldCycle', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_GearRatio-V_FoldCycle', source: 'D_GearRatio', target: 'V_FoldCycle', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_ControlAlgo-V_HIL_SIL', source: 'D_ControlAlgo', target: 'V_HIL_SIL', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_SensorRedund-V_HIL_SIL', source: 'D_SensorRedund', target: 'V_HIL_SIL', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_SafetyLogic-V_HIL_SIL', source: 'D_SafetyLogic', target: 'V_HIL_SIL', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },

    // NVH 与材料
    { id: 'e-D_FrictionPair-V_NVHTest', source: 'D_FrictionPair', target: 'V_NVHTest', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_Damping-V_NVHTest', source: 'D_Damping', target: 'V_NVHTest', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_Clearance-V_NVHTest', source: 'D_Clearance', target: 'V_NVHTest', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_AssyTolerance-V_NVHTest', source: 'D_AssyTolerance', target: 'V_NVHTest', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },

    // 环境可靠性
    { id: 'e-D_MaterialMain-V_EnvReliab', source: 'D_MaterialMain', target: 'V_EnvReliab', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_FrictionPair-V_EnvReliab', source: 'D_FrictionPair', target: 'V_EnvReliab', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_SensorRedund-V_EnvReliab', source: 'D_SensorRedund', target: 'V_EnvReliab', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },

    // 制造质量 → 一致性
    { id: 'e-D_AssyTolerance-V_FoldCycle', source: 'D_AssyTolerance', target: 'V_FoldCycle', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },
    { id: 'e-D_CPK-V_FoldCycle', source: 'D_CPK', target: 'V_FoldCycle', style: { stroke: '#22c55e' }, data: { relationship: 'verify' } },

    // ========= 指标 ← 验证（闭环 - 验证关系） =========
    { id: 'e-V_FoldCycle-KPI_Life_Cycle', source: 'V_FoldCycle', target: 'KPI_Life_Cycle', style: { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }, data: { relationship: 'verify' } },
    { id: 'e-V_StructFEA-KPI_LockSafe_Strength', source: 'V_StructFEA', target: 'KPI_LockSafe_Strength', style: { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }, data: { relationship: 'verify' } },
    { id: 'e-V_NVHTest-KPI_NVH_Noise', source: 'V_NVHTest', target: 'KPI_NVH_Noise', style: { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }, data: { relationship: 'verify' } },
    { id: 'e-V_NVHTest-KPI_NVH_Vibration', source: 'V_NVHTest', target: 'KPI_NVH_Vibration', style: { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }, data: { relationship: 'verify' } },
    { id: 'e-V_HIL_SIL-KPI_FoldTime_Start', source: 'V_HIL_SIL', target: 'KPI_FoldTime_Start', style: { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }, data: { relationship: 'verify' } },
    { id: 'e-V_HIL_SIL-KPI_LockSafe_Precision', source: 'V_HIL_SIL', target: 'KPI_LockSafe_Precision', style: { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }, data: { relationship: 'verify' } },
    { id: 'e-V_EnvReliab-KPI_Life_Degradation', source: 'V_EnvReliab', target: 'KPI_Life_Degradation', style: { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }, data: { relationship: 'verify' } },
    { id: 'e-V_RegulCert-KPI_LockSafe', source: 'V_RegulCert', target: 'KPI_LockSafe', style: { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }, data: { relationship: 'verify' } },
  ],
};