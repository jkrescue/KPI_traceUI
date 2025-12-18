/**
 * NLP 查询解析器
 */

/**
 * 实体类型
 */
export interface Entity {
  type: 'node_id' | 'category' | 'status' | 'model_type' | 'level' | 'metric' | 'relationship';
  value: string;
  confidence?: number;
}

/**
 * 查询意图
 */
export type QueryIntent = 
  | 'query_stats'       // 查询统计信息
  | 'query_nodes'       // 查询节点
  | 'trace_chain'       // 追踪链路
  | 'analyze_impact'    // 影响分析
  | 'find_issues'       // 发现问题
  | 'suggest'           // 建议
  | 'compare'           // 对比分析
  | 'correlation'       // 相关性分析
  | 'health_check'      // 健康检查
  | 'prioritize'        // 优先级排序
  | 'unknown';          // 未知意图

/**
 * 解析后的查询
 */
export interface ParsedQuery {
  rawQuery: string;
  intent: QueryIntent;
  entities: Entity[];
  confidence: number;
}

/**
 * 快捷命令定义
 */
export interface QuickCommand {
  id: string;
  label: string;
  query: string;
  description: string;
  category: 'stats' | 'query' | 'analyze' | 'suggest';
  icon?: React.ReactNode;
}

export const QUICK_COMMANDS: QuickCommand[] = [
  {
    id: 'stats_achievement',
    label: '指标达成',
    query: '统计指标达成情况',
    description: '查看所有指标的达成率统计',
    category: 'stats',
  },
  {
    id: 'query_unachieved',
    label: '未达成',
    query: '显示所有未达成的指标',
    description: '列出所有未达成的KPI',
    category: 'query',
  },
  {
    id: 'stats_model',
    label: '模型覆盖',
    query: '统计模型覆盖率',
    description: '查看各模型类型的使用情况',
    category: 'stats',
  },
  {
    id: 'analyze_health',
    label: '健康检查',
    query: '系统健康度检查',
    description: '评估系统整体健康度',
    category: 'analyze',
  },
];

/**
 * 解析查询字符串
 */
export function parseQuery(query: string): ParsedQuery {
  const normalizedQuery = query.toLowerCase().trim();
  const entities: Entity[] = [];
  let intent: QueryIntent = 'unknown';
  let confidence = 0.5;

  // 意图识别
  if (/统计|多少|几个|数量|占比|比例|百分/.test(normalizedQuery)) {
    intent = 'query_stats';
    confidence = 0.9;
  } else if (/链路|路径|追踪|关系/.test(normalizedQuery)) {
    intent = 'trace_chain';
    confidence = 0.9;
  } else if (/影响|波及|连带/.test(normalizedQuery)) {
    intent = 'analyze_impact';
    confidence = 0.9;
  } else if (/问题|瓶颈|风险|缺失|缺少/.test(normalizedQuery)) {
    intent = 'find_issues';
    confidence = 0.8;
  } else if (/建议|推荐|优化|改进/.test(normalizedQuery)) {
    intent = 'suggest';
    confidence = 0.8;
  } else if (/对比|比较|差异/.test(normalizedQuery)) {
    intent = 'compare';
    confidence = 0.8;
  } else if (/相关|关联/.test(normalizedQuery)) {
    intent = 'correlation';
    confidence = 0.8;
  } else if (/健康|评估|诊断/.test(normalizedQuery)) {
    intent = 'health_check';
    confidence = 0.9;
  } else if (/优先级|排序|重要/.test(normalizedQuery)) {
    intent = 'prioritize';
    confidence = 0.8;
  } else if (/显示|查看|列出|找出/.test(normalizedQuery)) {
    intent = 'query_nodes';
    confidence = 0.7;
  }

  // 实体识别

  // 1. 节点ID识别（KPI_xxx, D_xxx, V_xxx, G_xxx格式）
  const nodeIdMatches = query.match(/\b([A-Z_]+\d*)\b/g);
  if (nodeIdMatches) {
    nodeIdMatches.forEach(id => {
      if (/^(KPI_|D_|V_|G_)/.test(id)) {
        entities.push({ type: 'node_id', value: id, confidence: 0.95 });
      }
    });
  }

  // 2. 中文别名识别
  const aliasMap: Record<string, string> = {
    '折叠时间': 'KPI_FoldTime',
    '空间收益': 'KPI_SpaceGain',
    '用户体验': 'KPI_UX',
    '安全性': 'KPI_Safety',
    'nvh': 'KPI_NVH',
    '成本': 'KPI_Cost',
    '可靠性': 'KPI_Reliability',
    '电机扭矩': 'D_MotorTorque',
    '控制算法': 'D_ControlAlgo',
  };

  Object.entries(aliasMap).forEach(([alias, id]) => {
    if (normalizedQuery.includes(alias.toLowerCase())) {
      entities.push({ type: 'node_id', value: id, confidence: 0.9 });
    }
  });

  // 3. 状态识别
  if (/未达成|未完成|不达标/.test(normalizedQuery)) {
    entities.push({ type: 'status', value: 'unachieved', confidence: 0.9 });
  } else if (/已达成|完成|达标/.test(normalizedQuery)) {
    entities.push({ type: 'status', value: 'achieved', confidence: 0.9 });
  }

  // 4. 模型类型识别
  if (/sysml|系统建模/.test(normalizedQuery)) {
    entities.push({ type: 'model_type', value: 'sysml', confidence: 0.95 });
  } else if (/simulink|仿真/.test(normalizedQuery)) {
    entities.push({ type: 'model_type', value: 'simulink', confidence: 0.95 });
  } else if (/modelica/.test(normalizedQuery)) {
    entities.push({ type: 'model_type', value: 'modelica', confidence: 0.95 });
  } else if (/fmu/.test(normalizedQuery)) {
    entities.push({ type: 'model_type', value: 'fmu', confidence: 0.95 });
  } else if (/非?模型|没有模型/.test(normalizedQuery)) {
    entities.push({ type: 'model_type', value: 'none', confidence: 0.9 });
  }

  // 5. 层级识别
  if (/一级|1级|level\s*1/.test(normalizedQuery)) {
    entities.push({ type: 'level', value: '1', confidence: 0.9 });
  } else if (/二级|2级|level\s*2/.test(normalizedQuery)) {
    entities.push({ type: 'level', value: '2', confidence: 0.9 });
  }

  // 6. 类别识别
  if (/目标/.test(normalizedQuery)) {
    entities.push({ type: 'category', value: 'goal', confidence: 0.9 });
  } else if (/指标|kpi/i.test(normalizedQuery)) {
    entities.push({ type: 'category', value: 'kpi', confidence: 0.9 });
  } else if (/设计|参数/.test(normalizedQuery)) {
    entities.push({ type: 'category', value: 'design', confidence: 0.9 });
  } else if (/验证|仿真/.test(normalizedQuery)) {
    entities.push({ type: 'category', value: 'verify', confidence: 0.9 });
  }

  return {
    rawQuery: query,
    intent,
    entities,
    confidence,
  };
}
