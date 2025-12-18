import { Node, Edge } from 'reactflow';

export interface QueryCondition {
  category?: string[];
  achieved?: boolean | null;
  modelType?: string | null;
  level?: number;
  hasModel?: boolean;
  nodeIds?: string[];
}

export interface QueryResult {
  nodes: Node[];
  edges: Edge[];
  stats?: {
    total: number;
    byCategory?: Record<string, number>;
    byStatus?: Record<string, number>;
  };
}

export interface ChainResult {
  nodes: Set<string>;
  edges: Set<string>;
  paths?: string[][];
}

/**
 * Copilot 数据查询引擎
 */
export class CopilotEngine {
  private nodes: Node[];
  private edges: Edge[];

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * 更新数据源
   */
  updateData(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * 按条件查询节点
   */
  queryNodes(condition: QueryCondition): Node[] {
    let result = [...this.nodes];

    // 按类别筛选
    if (condition.category && condition.category.length > 0) {
      result = result.filter(n => condition.category!.includes(n.data.category));
    }

    // 按达成状态筛选（仅对 KPI 节点）
    if (condition.achieved !== undefined && condition.achieved !== null) {
      result = result.filter(n => {
        if (n.data.category !== 'kpi') return false;
        return n.data.metrics?.achieved === condition.achieved;
      });
    }

    // 按模型类型筛选
    if (condition.modelType !== undefined) {
      result = result.filter(n => {
        if (n.data.category !== 'kpi') return false;
        return n.data.metrics?.modelType === condition.modelType;
      });
    }

    // 按层级筛选
    if (condition.level !== undefined) {
      result = result.filter(n => n.data.level === condition.level);
    }

    // 按是否有模型筛选
    if (condition.hasModel !== undefined) {
      result = result.filter(n => {
        if (n.data.category !== 'kpi') return false;
        const hasModel = !!n.data.metrics?.modelType;
        return hasModel === condition.hasModel;
      });
    }

    // 按节点 ID 筛选
    if (condition.nodeIds && condition.nodeIds.length > 0) {
      result = result.filter(n => condition.nodeIds!.includes(n.id));
    }

    return result;
  }

  /**
   * 查询相关的边
   */
  queryEdges(nodeIds: string[], relationship?: string): Edge[] {
    const nodeIdSet = new Set(nodeIds);
    return this.edges.filter(edge => {
      const isRelated = nodeIdSet.has(edge.source) || nodeIdSet.has(edge.target);
      if (!isRelated) return false;
      
      if (relationship) {
        return edge.data?.relationship === relationship;
      }
      return true;
    });
  }

  /**
   * 计算统计数据
   */
  calculateStats(nodes?: Node[]) {
    const targetNodes = nodes || this.nodes;
    
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {
      achieved: 0,
      unachieved: 0,
      partial: 0,
      withModel: 0,
      withoutModel: 0,
    };

    targetNodes.forEach(node => {
      // 按类别统计
      byCategory[node.data.category] = (byCategory[node.data.category] || 0) + 1;

      // 按状态统计（仅 KPI）
      if (node.data.category === 'kpi' && node.data.metrics) {
        if (node.data.metrics.achieved) {
          byStatus.achieved++;
        } else {
          byStatus.unachieved++;
        }

        if (node.data.metrics.modelType) {
          byStatus.withModel++;
        } else {
          byStatus.withoutModel++;
        }
      }
    });

    return {
      total: targetNodes.length,
      byCategory,
      byStatus,
    };
  }

  /**
   * 链路追踪（向上和向下）
   */
  traceChain(startNodeIds: string[]): ChainResult {
    const relatedNodes = new Set<string>();
    const relatedEdges = new Set<string>();
    const visited = new Set<string>();

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      relatedNodes.add(nodeId);

      // 向上查找（incoming edges）
      this.edges.forEach(edge => {
        if (edge.target === nodeId && !visited.has(edge.source)) {
          relatedEdges.add(edge.id);
          relatedNodes.add(edge.source);
          traverse(edge.source);
        }
      });

      // 向下查找（outgoing edges）
      this.edges.forEach(edge => {
        if (edge.source === nodeId && !visited.has(edge.target)) {
          relatedEdges.add(edge.id);
          relatedNodes.add(edge.target);
          traverse(edge.target);
        }
      });
    };

    startNodeIds.forEach(nodeId => {
      if (this.nodes.some(n => n.id === nodeId)) {
        traverse(nodeId);
      }
    });

    return {
      nodes: relatedNodes,
      edges: relatedEdges,
    };
  }

  /**
   * 反向影响分析（从设计参数或验证向上追踪）
   */
  traceImpact(nodeId: string): ChainResult {
    const relatedNodes = new Set<string>();
    const relatedEdges = new Set<string>();
    const visited = new Set<string>();

    const traverseUp = (currentNodeId: string) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);
      relatedNodes.add(currentNodeId);

      // 只向上查找
      this.edges.forEach(edge => {
        if (edge.target === currentNodeId) {
          relatedEdges.add(edge.id);
          relatedNodes.add(edge.source);
          traverseUp(edge.source);
        }
      });
    };

    traverseUp(nodeId);

    return {
      nodes: relatedNodes,
      edges: relatedEdges,
    };
  }

  /**
   * 正向依赖分析（从目标或指标向下追踪）
   */
  traceDependencies(nodeId: string): ChainResult {
    const relatedNodes = new Set<string>();
    const relatedEdges = new Set<string>();
    const visited = new Set<string>();

    const traverseDown = (currentNodeId: string) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);
      relatedNodes.add(currentNodeId);

      // 只向下查找
      this.edges.forEach(edge => {
        if (edge.source === currentNodeId) {
          relatedEdges.add(edge.id);
          relatedNodes.add(edge.target);
          traverseDown(edge.target);
        }
      });
    };

    traverseDown(nodeId);

    return {
      nodes: relatedNodes,
      edges: relatedEdges,
    };
  }

  /**
   * 查找共享相同设计参数的指标
   */
  findSharedDesignParams(designParamId: string): Node[] {
    // 找到所有指向该设计参数的指标
    const relatedKPIs = new Set<string>();
    
    this.edges.forEach(edge => {
      if (edge.target === designParamId) {
        // 找到指标节点
        const sourceNode = this.nodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.data.category === 'kpi') {
          relatedKPIs.add(edge.source);
        }
      }
    });

    return this.nodes.filter(n => relatedKPIs.has(n.id));
  }

  /**
   * 获取节点的直接连接节点
   */
  getConnectedNodes(nodeId: string, direction: 'incoming' | 'outgoing' | 'both' = 'both'): Node[] {
    const connectedIds = new Set<string>();

    this.edges.forEach(edge => {
      if (direction === 'incoming' || direction === 'both') {
        if (edge.target === nodeId) {
          connectedIds.add(edge.source);
        }
      }
      if (direction === 'outgoing' || direction === 'both') {
        if (edge.source === nodeId) {
          connectedIds.add(edge.target);
        }
      }
    });

    return this.nodes.filter(n => connectedIds.has(n.id));
  }
}