import { Node, Edge } from 'reactflow';
import { ParsedQuery } from './nlpParser';

/**
 * 上下文管理器 - 管理多轮对话上下文
 */

export interface ConversationContext {
  // 当前焦点
  focusedNodes: string[];
  focusedCategory?: string;
  
  // 历史查询
  queryHistory: {
    query: string;
    parsed: ParsedQuery;
    timestamp: Date;
    resultNodes?: string[];
  }[];
  
  // 用户偏好
  preferences: {
    favoriteKPIs: string[];
    recentlyViewed: string[];
    frequentQueries: Map<string, number>;
  };
  
  // 当前会话状态
  sessionState: {
    lastIntent?: string;
    lastEntities?: any[];
    pendingAction?: string;
  };
}

export class ContextManager {
  private context: ConversationContext;
  private maxHistorySize = 10;
  private maxRecentlyViewed = 20;

  constructor() {
    this.context = this.initializeContext();
  }

  private initializeContext(): ConversationContext {
    return {
      focusedNodes: [],
      queryHistory: [],
      preferences: {
        favoriteKPIs: [],
        recentlyViewed: [],
        frequentQueries: new Map(),
      },
      sessionState: {},
    };
  }

  /**
   * 记录查询
   */
  recordQuery(
    query: string,
    parsed: ParsedQuery,
    resultNodes?: string[]
  ) {
    this.context.queryHistory.push({
      query,
      parsed,
      timestamp: new Date(),
      resultNodes,
    });

    // 限制历史记录大小
    if (this.context.queryHistory.length > this.maxHistorySize) {
      this.context.queryHistory.shift();
    }

    // 更新会话状态
    this.context.sessionState.lastIntent = parsed.intent;
    this.context.sessionState.lastEntities = parsed.entities;

    // 记录查询频率
    const count = this.context.preferences.frequentQueries.get(query) || 0;
    this.context.preferences.frequentQueries.set(query, count + 1);
  }

  /**
   * 更新焦点节点
   */
  updateFocus(nodeIds: string[], category?: string) {
    this.context.focusedNodes = nodeIds;
    this.context.focusedCategory = category;

    // 更新最近查看
    nodeIds.forEach(id => {
      // 移除旧的
      const index = this.context.preferences.recentlyViewed.indexOf(id);
      if (index > -1) {
        this.context.preferences.recentlyViewed.splice(index, 1);
      }
      // 添加到前面
      this.context.preferences.recentlyViewed.unshift(id);
    });

    // 限制大小
    if (this.context.preferences.recentlyViewed.length > this.maxRecentlyViewed) {
      this.context.preferences.recentlyViewed = 
        this.context.preferences.recentlyViewed.slice(0, this.maxRecentlyViewed);
    }
  }

  /**
   * 获取上下文提示
   */
  getContextualHints(): string[] {
    const hints: string[] = [];
    
    const lastQuery = this.getLastQuery();
    if (lastQuery) {
      const intent = lastQuery.parsed.intent;
      
      // 根据上一次意图提供后续建议
      if (intent === 'query_nodes') {
        hints.push('💡 你可以继续问："这些节点的链路是什么？"');
        hints.push('💡 或者："分析它们的影响范围"');
      } else if (intent === 'trace_chain') {
        hints.push('💡 你可以继续问："这条链路有什么风险？"');
        hints.push('💡 或者："如何优化这条链路？"');
      } else if (intent === 'find_issues') {
        hints.push('💡 你可以继续问："给出优化建议"');
        hints.push('💡 或者："计算优先级"');
      } else if (intent === 'query_stats') {
        hints.push('💡 你可以继续问："显示未达成的指标"');
        hints.push('💡 或者："分析模型覆盖缺口"');
      }
    }

    // 基于焦点节点的提示
    if (this.context.focusedNodes.length > 0) {
      hints.push('💡 当前关注的节点可以用于进一步分析');
    }

    return hints;
  }

  /**
   * 获取相关历史查询
   */
  getRelatedQueries(currentQuery: string): string[] {
    // 简单的相似度匹配
    return this.context.queryHistory
      .map(h => h.query)
      .filter(q => {
        const similarity = this.calculateSimilarity(q, currentQuery);
        return similarity > 0.3;
      })
      .slice(-3);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // 简单的词重叠相似度
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 解析引用（"它"、"这些"、"上一个"等）
   */
  resolveReferences(query: string, parsed: ParsedQuery): ParsedQuery {
    let resolvedQuery = query;
    const resolvedEntities = [...parsed.entities];

    // 检测引用词
    const hasReference = /它|这个|这些|那个|那些|上一个|刚才|之前/.test(query);
    
    if (hasReference) {
      const lastQuery = this.getLastQuery();
      
      // 如果上一次有结果节点，引用它们
      if (lastQuery?.resultNodes && lastQuery.resultNodes.length > 0) {
        // 添加节点ID到实体
        lastQuery.resultNodes.forEach(nodeId => {
          if (!resolvedEntities.some(e => e.value === nodeId)) {
            resolvedEntities.push({
              type: 'node_id',
              value: nodeId,
              raw: '(引用上文)',
            });
          }
        });
      }
      
      // 如果有焦点节点
      if (this.context.focusedNodes.length > 0) {
        this.context.focusedNodes.forEach(nodeId => {
          if (!resolvedEntities.some(e => e.value === nodeId)) {
            resolvedEntities.push({
              type: 'node_id',
              value: nodeId,
              raw: '(当前焦点)',
            });
          }
        });
      }
    }

    return {
      ...parsed,
      entities: resolvedEntities,
      rawQuery: resolvedQuery,
    };
  }

  /**
   * 获取最近查询
   */
  getLastQuery() {
    return this.context.queryHistory[this.context.queryHistory.length - 1];
  }

  /**
   * 获取常用查询
   */
  getFrequentQueries(limit: number = 5): string[] {
    return Array.from(this.context.preferences.frequentQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);
  }

  /**
   * 添加收藏
   */
  addFavorite(nodeId: string) {
    if (!this.context.preferences.favoriteKPIs.includes(nodeId)) {
      this.context.preferences.favoriteKPIs.push(nodeId);
    }
  }

  /**
   * 移除收藏
   */
  removeFavorite(nodeId: string) {
    const index = this.context.preferences.favoriteKPIs.indexOf(nodeId);
    if (index > -1) {
      this.context.preferences.favoriteKPIs.splice(index, 1);
    }
  }

  /**
   * 获取收藏列表
   */
  getFavorites(): string[] {
    return [...this.context.preferences.favoriteKPIs];
  }

  /**
   * 获取最近查看
   */
  getRecentlyViewed(limit: number = 10): string[] {
    return this.context.preferences.recentlyViewed.slice(0, limit);
  }

  /**
   * 清空上下文
   */
  clearContext() {
    this.context = this.initializeContext();
  }

  /**
   * 导出上下文（用于持久化）
   */
  exportContext(): string {
    return JSON.stringify({
      preferences: {
        favoriteKPIs: this.context.preferences.favoriteKPIs,
        recentlyViewed: this.context.preferences.recentlyViewed,
        frequentQueries: Array.from(this.context.preferences.frequentQueries.entries()),
      },
    });
  }

  /**
   * 导入上下文（从持久化恢复）
   */
  importContext(data: string) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.preferences) {
        this.context.preferences.favoriteKPIs = parsed.preferences.favoriteKPIs || [];
        this.context.preferences.recentlyViewed = parsed.preferences.recentlyViewed || [];
        this.context.preferences.frequentQueries = new Map(
          parsed.preferences.frequentQueries || []
        );
      }
    } catch (e) {
      console.error('Failed to import context:', e);
    }
  }

  /**
   * 生成智能建议
   */
  generateSuggestions(nodes: Node[]): string[] {
    const suggestions: string[] = [];
    
    // 基于最近查看的节点
    const recentKPIs = this.context.preferences.recentlyViewed
      .map(id => nodes.find(n => n.id === id))
      .filter(n => n && n.data.category === 'kpi')
      .slice(0, 3);
    
    if (recentKPIs.length > 0) {
      suggestions.push(`你最近查看了 ${recentKPIs.map(n => n!.data.label).join('、')}`);
      suggestions.push('💡 是否需要查看它们的最新状态？');
    }

    // 基于收藏
    if (this.context.preferences.favoriteKPIs.length > 0) {
      const favoriteCount = this.context.preferences.favoriteKPIs.length;
      suggestions.push(`你有 ${favoriteCount} 个收藏的指标`);
    }

    // 基于查询历史
    const lastIntent = this.context.sessionState.lastIntent;
    if (lastIntent === 'find_issues') {
      suggestions.push('💡 建议：查看优先级排序以确定改进顺序');
    }

    return suggestions;
  }
}
