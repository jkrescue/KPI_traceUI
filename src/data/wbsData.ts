// 指标 → 任务 → 模型 的自动分解数据
// WBS (Work Breakdown Structure) 自动化

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: 'CAE' | 'Design' | 'Test' | 'Validation' | 'Control';
  estimatedDays: number;
  dependencies?: string[];
  priority: 'High' | 'Medium' | 'Low';
  criticality?: 'Critical' | 'Normal'; // 新增：标记关键任务（对应未达标指标）
  owner?: string; // 负责人
  startDay?: number; // 开始时间（相对项目起始日，天数）
  models?: string[]; // 推荐模型ID列表
}

export interface ModelBinding {
  id: string;
  name: string;
  type: string;
  software: string;
  description: string;
}

export interface WBSTask {
  id: string;
  name: string;
  kpiId: string; // 关联的KPI
  tasks: TaskTemplate[];
  models: ModelBinding[];
  owner: string;
  team: string;
  startWeek?: number;
  duration?: number;
  isUnderperforming?: boolean; // 新增：标记该KPI是否未达标
  underperformingSpecs?: string[]; // 新增：具体未达标的规格
}

// 指标到任务的自动匹配规则
export const kpiToTaskMapping: Record<string, WBSTask> = {
  KPI_LockSafe: {
    id: 'WBS_LockSafe',
    name: '锁止安全性验证',
    kpiId: 'KPI_LockSafe',
    owner: '张工',
    team: '机构设计组',
    startWeek: 1,
    duration: 8,
    isUnderperforming: false,
    tasks: [
      {
        id: 'TASK_LockCAE',
        name: '机械结构 CAE 仿真',
        description: '对锁止机构进行强度、刚度分析',
        type: 'CAE',
        estimatedDays: 15,
        priority: 'High',
        criticality: 'Normal',
      },
      {
        id: 'TASK_LockLife',
        name: '锁止机构寿命验证',
        description: '进行疲劳寿命和循环加载测试',
        type: 'Test',
        estimatedDays: 20,
        dependencies: ['TASK_LockCAE'],
        priority: 'High',
        criticality: 'Normal',
      },
      {
        id: 'TASK_LockModel',
        name: '力学模型创建',
        description: '建立锁止机构的非线性力学模型',
        type: 'Design',
        estimatedDays: 10,
        priority: 'Medium',
        criticality: 'Normal',
      },
      {
        id: 'TASK_LockImpact',
        name: '冲击载荷验证',
        description: '碰撞工况下锁止强度验证',
        type: 'Validation',
        estimatedDays: 12,
        dependencies: ['TASK_LockCAE'],
        priority: 'High',
        criticality: 'Normal',
      },
    ],
    models: [
      {
        id: 'MODEL_Abaqus',
        name: 'Abaqus 非线性分析模型',
        type: 'FEA',
        software: 'Abaqus 2023',
        description: '用于锁止机构的强度和变形分析',
      },
      {
        id: 'MODEL_Adams',
        name: 'Adams 多体动力学模型',
        type: 'MBD',
        software: 'Adams 2022',
        description: '锁止过程的动态仿真',
      },
    ],
  },
  KPI_FoldTime: {
    id: 'WBS_FoldTime',
    name: '折叠时间优化',
    kpiId: 'KPI_FoldTime',
    owner: '李工',
    team: '电控设计组',
    startWeek: 2,
    duration: 10,
    isUnderperforming: false,
    tasks: [
      {
        id: 'TASK_DynamicSim',
        name: '执行器动力学验证',
        description: '电机响应速度与扭矩特性验证',
        type: 'CAE',
        estimatedDays: 12,
        priority: 'High',
        criticality: 'Normal',
      },
      {
        id: 'TASK_FoldTimeVal',
        name: '折叠时间测试',
        description: '实际样机折叠时间测试与优化',
        type: 'Test',
        estimatedDays: 8,
        dependencies: ['TASK_DynamicSim'],
        priority: 'High',
        criticality: 'Normal',
      },
      {
        id: 'TASK_ControlStrategy',
        name: '控制策略评估',
        description: '优化电机控制算法以缩短折叠时间',
        type: 'Control',
        estimatedDays: 10,
        priority: 'Medium',
        criticality: 'Normal',
      },
    ],
    models: [
      {
        id: 'MODEL_Modelica',
        name: 'Modelica 系统动力学模型',
        type: 'System Dynamics',
        software: 'Dymola/OpenModelica',
        description: '电机-传动系统的联合仿真',
      },
      {
        id: 'MODEL_Simulink',
        name: 'Simulink 控制模型',
        type: 'Control',
        software: 'MATLAB/Simulink',
        description: '电机控制策略仿真',
      },
    ],
  },
  KPI_NVH: {
    id: 'WBS_NVH',
    name: 'NVH 性能评估',
    kpiId: 'KPI_NVH',
    owner: '王工',
    team: 'NVH 团队',
    startWeek: 3,
    duration: 12,
    isUnderperforming: true, // 标记为未达标
    underperformingSpecs: ['折叠噪声≤45dB', '振动加速≤2.0'],
    tasks: [
      {
        id: 'TASK_NVHSim',
        name: '噪声评估',
        description: '折叠过程的噪声频谱分析',
        type: 'CAE',
        estimatedDays: 10,
        priority: 'High',
        criticality: 'Critical', // 关键任务
        owner: '王工',
        startDay: 0,
        models: ['MODEL_Nastran', 'MODEL_Abaqus_NVH'],
      },
      {
        id: 'TASK_VibTest',
        name: '振动测试',
        description: '振动加速度与传递路径测试',
        type: 'Test',
        estimatedDays: 15,
        dependencies: ['TASK_NVHSim'],
        priority: 'High',
        criticality: 'Critical', // 关键任务
        owner: '王工',
        startDay: 10,
        models: ['MODEL_Abaqus_NVH'],
      },
      {
        id: 'TASK_AcousticOpt',
        name: '声学优化',
        description: '通过材料和结构优化降低噪声',
        type: 'Design',
        estimatedDays: 12,
        dependencies: ['TASK_NVHSim', 'TASK_VibTest'],
        priority: 'High', // 提升优先级
        criticality: 'Critical', // 关键任务
        owner: '刘工',
        startDay: 25,
        models: ['MODEL_Nastran'],
      },
      {
        id: 'TASK_NVHRootCause',
        name: '噪声源定位分析',
        description: '识别主要噪声源并制定改进方案',
        type: 'Validation',
        estimatedDays: 8,
        dependencies: ['TASK_NVHSim'],
        priority: 'High',
        criticality: 'Critical',
        owner: '王工',
        startDay: 10,
        models: ['MODEL_Abaqus_NVH'],
      },
    ],
    models: [
      {
        id: 'MODEL_Nastran',
        name: 'Nastran 振动分析模型',
        type: 'Modal Analysis',
        software: 'MSC Nastran',
        description: '模态分析和频响分析',
      },
      {
        id: 'MODEL_Abaqus_NVH',
        name: 'Abaqus 声振模型',
        type: 'Vibro-Acoustics',
        software: 'Abaqus',
        description: '结构-声学耦合分析',
      },
    ],
  },
  KPI_SpaceGain: {
    id: 'WBS_SpaceGain',
    name: '空间提升验证',
    kpiId: 'KPI_SpaceGain',
    owner: '赵工',
    team: '整车布置组',
    startWeek: 1,
    duration: 6,
    isUnderperforming: true, // 标记为未达标
    underperformingSpecs: ['垂直增益≥150mm'],
    tasks: [
      {
        id: 'TASK_PackageAnalysis',
        name: '布置空间分析',
        description: '折叠前后的空间增益计算',
        type: 'Design',
        estimatedDays: 8,
        priority: 'High',
        criticality: 'Critical', // 关键任务
        owner: '赵工',
        startDay: 0,
        models: ['MODEL_Adams_Package'],
      },
      {
        id: 'TASK_FoldTrajectory',
        name: '折叠轨迹仿真',
        description: '验证折叠轨迹与座椅、仪表板的干涉',
        type: 'CAE',
        estimatedDays: 10,
        dependencies: ['TASK_PackageAnalysis'],
        priority: 'High',
        criticality: 'Critical', // 关键任务
        owner: '赵工',
        startDay: 8,
        models: ['MODEL_Adams_Package'],
      },
      {
        id: 'TASK_SpaceOptimization',
        name: '空间增益优化',
        description: '优化折叠角度和轨迹以最大化空间收益',
        type: 'Design',
        estimatedDays: 10,
        dependencies: ['TASK_FoldTrajectory', 'TASK_PackageAnalysis'],
        priority: 'High',
        criticality: 'Critical',
        owner: '孙工',
        startDay: 18,
        models: ['MODEL_Adams_Package'],
      },
    ],
    models: [
      {
        id: 'MODEL_Adams_Package',
        name: 'Adams 运动学模型',
        type: 'Kinematics',
        software: 'Adams',
        description: '折叠轨迹与空间包络分析',
      },
    ],
  },
  KPI_FoldAngle: {
    id: 'WBS_FoldAngle',
    name: '折叠角度控制',
    kpiId: 'KPI_FoldAngle',
    owner: '钱工',
    team: '电控设计组',
    startWeek: 2,
    duration: 8,
    isUnderperforming: false,
    tasks: [
      {
        id: 'TASK_AngleControl',
        name: '角度控制精度验证',
        description: '编码器精度与控制算法验证',
        type: 'Control',
        estimatedDays: 10,
        priority: 'High',
        criticality: 'Normal',
      },
      {
        id: 'TASK_AngleCalibration',
        name: '角度标定',
        description: '传感器标定与误差补偿',
        type: 'Validation',
        estimatedDays: 8,
        dependencies: ['TASK_AngleControl'],
        priority: 'Medium',
        criticality: 'Normal',
      },
      {
        id: 'TASK_AngleSensorSelection',
        name: '传感器选型验证',
        description: '评估不同编码器方案的精度和成本',
        type: 'Design',
        estimatedDays: 5,
        priority: 'Medium',
        criticality: 'Normal',
      },
    ],
    models: [
      {
        id: 'MODEL_Simulink_Angle',
        name: 'Simulink 角度控制模型',
        type: 'Control',
        software: 'MATLAB/Simulink',
        description: 'PID控制器设计与仿真',
      },
      {
        id: 'MODEL_CarSim_Angle',
        name: 'CarSim 动态响应模型',
        type: 'Vehicle Dynamics',
        software: 'CarSim',
        description: '角度控制响应特性分析',
      },
    ],
  },
  KPI_Life: {
    id: 'WBS_Life',
    name: '寿命耐久性验证',
    kpiId: 'KPI_Life',
    owner: '孙工',
    team: 'CAE 强度/耐久组',
    startWeek: 4,
    duration: 15,
    isUnderperforming: true, // 部分未达标
    underperformingSpecs: ['性能衰减≤10%'],
    tasks: [
      {
        id: 'TASK_FatigueAnalysis',
        name: '疲劳寿命分析',
        description: 'S-N曲线与疲劳寿命预测',
        type: 'CAE',
        estimatedDays: 12,
        priority: 'High',
        criticality: 'Normal',
      },
      {
        id: 'TASK_DurabilityTest',
        name: '耐久性台架测试',
        description: '10万次循环折叠试验',
        type: 'Test',
        estimatedDays: 30,
        dependencies: ['TASK_FatigueAnalysis'],
        priority: 'High',
        criticality: 'Normal',
      },
      {
        id: 'TASK_WearAnalysis',
        name: '磨损分析',
        description: '关键部件磨损评估',
        type: 'Validation',
        estimatedDays: 10,
        dependencies: ['TASK_DurabilityTest'],
        priority: 'High', // 提升优先级
        criticality: 'Critical', // 关键任务（性能衰减问题）
      },
      {
        id: 'TASK_PerformanceDegradation',
        name: '性能衰减分析',
        description: '评估使用过程中的性能衰减趋势',
        type: 'Validation',
        estimatedDays: 8,
        dependencies: ['TASK_DurabilityTest', 'TASK_WearAnalysis'],
        priority: 'High',
        criticality: 'Critical', // 关键任务（直接对应未达标指标）
      },
      {
        id: 'TASK_MaterialOptimization',
        name: '材料优化',
        description: '选择更耐磨材料以降低性能衰减',
        type: 'Design',
        estimatedDays: 12,
        dependencies: ['TASK_WearAnalysis'],
        priority: 'High',
        criticality: 'Critical',
      },
    ],
    models: [
      {
        id: 'MODEL_Abaqus_Life',
        name: 'Abaqus 疲劳分析模型',
        type: 'Fatigue',
        software: 'Abaqus',
        description: '疲劳寿命计算与裂纹扩展分析',
      },
      {
        id: 'MODEL_FMU_Life',
        name: 'FMU 磨损预测模型',
        type: 'Wear Prediction',
        software: 'FMU',
        description: '关键部件磨损与性能衰减预测',
      },
    ],
  },
};

// WBS 完整结构树
export const wbsTree = {
  id: 'WBS_Root',
  name: '折叠方向盘研发 WBS',
  children: [
    {
      id: 'WBS_MechDesign',
      name: '折叠机构设计',
      team: '机构设计组',
      children: [
        {
          id: 'WBS_CADModel',
          name: 'CAD 模型构建',
          duration: '2周',
          owner: '张工',
          status: 'in-progress',
        },
        {
          id: 'WBS_StructureValidation',
          name: '结构强度验证',
          duration: '3周',
          owner: '张工',
          status: 'planned',
          relatedKPI: 'KPI_LockSafe',
        },
        {
          id: 'WBS_TrajectorySimulation',
          name: '折叠轨迹仿真',
          duration: '2周',
          owner: '赵工',
          status: 'planned',
          relatedKPI: 'KPI_SpaceGain',
        },
      ],
    },
    {
      id: 'WBS_ActuatorSystem',
      name: '执行器系统',
      team: '电控设计组',
      children: [
        {
          id: 'WBS_ModelicaModeling',
          name: 'Modelica 动力学建模',
          duration: '2周',
          owner: '李工',
          status: 'in-progress',
          relatedKPI: 'KPI_FoldTime',
        },
        {
          id: 'WBS_FoldTimeValidation',
          name: '折叠时间验证',
          duration: '1.5周',
          owner: '李工',
          status: 'planned',
          relatedKPI: 'KPI_FoldTime',
        },
        {
          id: 'WBS_ControlStrategy',
          name: '控制策略评估',
          duration: '2周',
          owner: '钱工',
          status: 'planned',
          relatedKPI: 'KPI_FoldAngle',
        },
      ],
    },
    {
      id: 'WBS_SafetySystem',
      name: '安全系统',
      team: '整车安全组',
      children: [
        {
          id: 'WBS_ImpactValidation',
          name: '碰撞约束力验证',
          duration: '3周',
          owner: '张工',
          status: 'planned',
          relatedKPI: 'KPI_LockSafe',
        },
        {
          id: 'WBS_ComplianceCheck',
          name: '法规一致性检查',
          duration: '1周',
          owner: '周工',
          status: 'planned',
          relatedKPI: 'KPI_LockSafe',
        },
      ],
    },
    {
      id: 'WBS_NVHSystem',
      name: 'NVH 评估',
      team: 'NVH 团队',
      children: [
        {
          id: 'WBS_NoiseEvaluation',
          name: '噪声评估',
          duration: '2周',
          owner: '王工',
          status: 'planned',
          relatedKPI: 'KPI_NVH',
        },
        {
          id: 'WBS_VibrationTest',
          name: '振动测试',
          duration: '3周',
          owner: '王工',
          status: 'planned',
          relatedKPI: 'KPI_NVH',
        },
      ],
    },
    {
      id: 'WBS_DurabilitySystem',
      name: '耐久性验证',
      team: 'CAE 强度/耐久组',
      children: [
        {
          id: 'WBS_FatigueAnalysis',
          name: '疲劳寿命分析',
          duration: '2.5周',
          owner: '孙工',
          status: 'planned',
          relatedKPI: 'KPI_Life',
        },
        {
          id: 'WBS_DurabilityTest',
          name: '耐久性台架测试',
          duration: '6周',
          owner: '孙工',
          status: 'planned',
          relatedKPI: 'KPI_Life',
        },
      ],
    },
  ],
};

// 团队配置
export const teamConfig = [
  { id: 'team1', name: '机构设计组', color: '#3b82f6', icon: 'Layers' },
  { id: 'team2', name: '电控设计组', color: '#8b5cf6', icon: 'Cpu' },
  { id: 'team3', name: 'NVH 团队', color: '#ec4899', icon: 'Activity' },
  { id: 'team4', name: 'CAE 强度/耐久组', color: '#f59e0b', icon: 'Target' },
  { id: 'team5', name: '整车安全组', color: '#10b981', icon: 'Shield' },
  { id: 'team6', name: '整车布置组', color: '#06b6d4', icon: 'Box' },
];