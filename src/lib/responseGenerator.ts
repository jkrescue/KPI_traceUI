import { Node, Edge } from 'reactflow';
import { CopilotEngine } from './copilotEngine';
import { ParsedQuery } from './nlpParser';
import { AdvancedAnalyzer } from './advancedAnalyzer';

export interface GeneratedResponse {
  content: string;
  nodes?: string[];
  edges?: string[];
  action?: 'highlight' | 'focus' | 'trace';
}

export interface ResponseData {
  content: string;
  nodes?: string[];
  edges?: string[];
  action?: 'highlight' | 'focus' | 'trace';
}

/**
 * 响应生成器
 */
export class ResponseGenerator {
  private engine: CopilotEngine;
  private nodes: Node[];
  private edges: Edge[];
  private analyzer: AdvancedAnalyzer;

  constructor(engine: CopilotEngine, nodes: Node[], edges: Edge[]) {
    this.engine = engine;
    this.nodes = nodes;
    this.edges = edges;
    this.analyzer = new AdvancedAnalyzer(engine, nodes, edges);
  }

  /**
   * 根据解析结果生成响应
   */
  generateResponse(parsed: ParsedQuery): ResponseData {
    switch (parsed.intent) {
      case 'query_stats':
        return this.generateStatsResponse(parsed);
      case 'query_nodes':
        return this.generateQueryNodesResponse(parsed);
      case 'trace_chain':
        return this.generateTraceChainResponse(parsed);
      case 'analyze_impact':
        return this.generateImpactAnalysisResponse(parsed);
      case 'find_issues':
        return this.generateFindIssuesResponse(parsed);
      case 'suggest':
        return this.generateSuggestionResponse(parsed);
      case 'compare':
        return this.generateCompareResponse(parsed);
      case 'correlation':
        return this.generateCorrelationResponse(parsed);
      case 'health_check':
        return this.generateHealthCheckResponse(parsed);
      case 'prioritize':
        return this.generatePriorityResponse(parsed);
      default:
        return this.generateUnknownResponse(parsed);
    }
  }

  /**
   * 生成统计响应
   */
  private generateStatsResponse(parsed: ParsedQuery): ResponseData {
    const query = parsed.rawQuery.toLowerCase();
    
    // 模型覆盖率统计
    if (query.includes('模型') || query.includes('覆盖')) {
      return this.generateModelCoverageStats();
    }
    
    // 默认：指标达成率统计
    return this.generateAchievementStats();
  }

  /**
   * 指标达成率统计
   */
  private generateAchievementStats(): ResponseData {
    const kpiNodes = this.engine.queryNodes({ category: ['kpi'] });
    const stats = this.engine.calculateStats(kpiNodes);
    
    const achievedCount = stats.byStatus?.achieved || 0;
    const unachievedCount = stats.byStatus?.unachieved || 0;
    const totalKPI = achievedCount + unachievedCount;
    const achievedRate = totalKPI > 0 ? ((achievedCount / totalKPI) * 100).toFixed(1) : '0';

    // 按层级统计
    const level1KPIs = kpiNodes.filter(n => n.data.level === 1);
    const level2KPIs = kpiNodes.filter(n => n.data.level === 2);
    const level1Achieved = level1KPIs.filter(n => n.data.metrics?.achieved).length;
    const level2Achieved = level2KPIs.filter(n => n.data.metrics?.achieved).length;

    const content = `📊 **指标达成情况统计**\n\n` +
      `**总体情况：**\n` +
      `✅ 已达成：**${achievedCount}** 个\n` +
      `❌ 未达成：**${unachievedCount}** 个\n` +
      `📈 达成率：**${achievedRate}%**\n\n` +
      `**按层级统计：**\n` +
      `- 一级指标：${level1Achieved}/${level1KPIs.length} 个达成\n` +
      `- 二级指标：${level2Achieved}/${level2KPIs.length} 个达成\n\n` +
      `---\n\n` +
      `💡 **建议**：${this.getAchievementSuggestion(unachievedCount, achievedRate)}`;

    return { content };
  }

  /**
   * 模型覆盖率统计
   */
  private generateModelCoverageStats(): ResponseData {
    const kpiNodes = this.engine.queryNodes({ category: ['kpi'] });
    const stats = this.engine.calculateStats(kpiNodes);
    
    const withModel = stats.byStatus?.withModel || 0;
    const withoutModel = stats.byStatus?.withoutModel || 0;
    const totalKPI = withModel + withoutModel;
    const coverageRate = totalKPI > 0 ? ((withModel / totalKPI) * 100).toFixed(1) : '0';

    // 统计各模型类型
    const modelTypes: Record<string, number> = {
      sysml: 0,
      simulink: 0,
      modelica: 0,
      fmu: 0,
    };

    kpiNodes.forEach(node => {
      const modelType = node.data.metrics?.modelType;
      if (modelType && modelTypes[modelType] !== undefined) {
        modelTypes[modelType]++;
      }
    });

    const content = `📦 **模型覆盖率统计**\n\n` +
      `**总体情况：**\n` +
      `✅ 已覆盖：**${withModel}** 个指标\n` +
      `❌ 未覆盖：**${withoutModel}** 个指标\n` +
      `📊 覆盖率：**${coverageRate}%**\n\n` +
      `**各模型类型使用情况：**\n` +
      `- 🔷 SysML：**${modelTypes.sysml}** 个 (${this.getPercentage(modelTypes.sysml, withModel)})\n` +
      `- 🔶 Simulink：**${modelTypes.simulink}** 个 (${this.getPercentage(modelTypes.simulink, withModel)})\n` +
      `- 🔵 Modelica：**${modelTypes.modelica}** 个 (${this.getPercentage(modelTypes.modelica, withModel)})\n` +
      `- 🟣 FMU：**${modelTypes.fmu}** 个 (${this.getPercentage(modelTypes.fmu, withModel)})\n\n` +
      `---\n\n` +
      `💡 **建议**：${this.getModelCoverageSuggestion(withoutModel, parseFloat(coverageRate))}`;

    return { content };
  }

  /**
   * 节点查询响应
   */
  private generateQueryNodesResponse(parsed: ParsedQuery): ResponseData {
    // 提取过滤条件
    const statusEntity = parsed.entities.find(e => e.type === 'status');
    const modelEntity = parsed.entities.find(e => e.type === 'model_type');
    const levelEntity = parsed.entities.find(e => e.type === 'level');
    
    let condition: any = { category: ['kpi'] };
    
    if (statusEntity?.value === 'unachieved') {
      condition.achieved = false;
    } else if (statusEntity?.value === 'achieved') {
      condition.achieved = true;
    }
    
    if (modelEntity?.value === 'null') {
      condition.hasModel = false;
    }
    
    if (levelEntity) {
      condition.level = parseInt(levelEntity.value);
    }
    
    const resultNodes = this.engine.queryNodes(condition);
    
    if (resultNodes.length === 0) {
      return {
        content: this.getEmptyResultMessage(condition),
      };
    }
    
    const chain = this.engine.traceChain(resultNodes.map(n => n.id));
    
    let content = this.generateNodeListHeader(condition, resultNodes.length);
    
    // 列出节点
    resultNodes.slice(0, 10).forEach((node, idx) => {
      const level = node.data.level || 1;
      const rate = node.data.metrics?.achievementRate || 0;
      const status = node.data.metrics?.achieved ? '✅' : '❌';
      const model = node.data.metrics?.modelType || '无模型';
      
      content += `${idx + 1}. **${node.data.label}** (L${level}) ${status}\n`;
      content += `   📝 ${node.data.description}\n`;
      content += `   📊 达成率：${rate}% | 模型：${model}\n\n`;
    });
    
    if (resultNodes.length > 10) {
      content += `_...还有 ${resultNodes.length - 10} 个节点_\n\n`;
    }
    
    content += `---\n\n`;
    content += `🔗 已为你高亮显示这些指标及其完整链路（包含 ${chain.nodes.size} 个节点）`;

    return {
      content,
      nodes: Array.from(chain.nodes),
      edges: Array.from(chain.edges),
      action: 'highlight',
    };
  }

  /**
   * 链路追踪响应
   */
  private generateTraceChainResponse(parsed: ParsedQuery): ResponseData {
    const nodeIdEntity = parsed.entities.find(e => e.type === 'node_id');
    
    if (!nodeIdEntity) {
      return {
        content: '🤔 请指定要追踪的节点ID，例如："KPI_FoldTime 的链路"',
      };
    }
    
    const nodeId = nodeIdEntity.value;
    const targetNode = this.nodes.find(n => n.id === nodeId);
    
    if (!targetNode) {
      return {
        content: `❌ 未找到节点：${nodeId}`,
      };
    }
    
    const chain = this.engine.traceChain([nodeId]);
    
    // 统计链路中的节点类型
    const nodesByCategory: Record<string, number> = {};
    Array.from(chain.nodes).forEach(id => {
      const node = this.nodes.find(n => n.id === id);
      if (node) {
        const cat = node.data.category;
        nodesByCategory[cat] = (nodesByCategory[cat] || 0) + 1;
      }
    });
    
    const content = `🔗 **${targetNode.data.label} 的完整链路分析**\n\n` +
      `📝 描述：${targetNode.data.description}\n\n` +
      `**链路统计：**\n` +
      `- 总节点数：**${chain.nodes.size}** 个\n` +
      `- 连接数：**${chain.edges.size}** 条\n\n` +
      `**节点分布：**\n` +
      `${Object.entries(nodesByCategory).map(([cat, count]) => 
        `- ${this.getCategoryIcon(cat)} ${this.getCategoryName(cat)}：${count} 个`
      ).join('\n')}\n\n` +
      `---\n\n` +
      `✨ 已在画布上高亮显示完整链路`;

    return {
      content,
      nodes: Array.from(chain.nodes),
      edges: Array.from(chain.edges),
      action: 'highlight',
    };
  }

  /**
   * 影响分析响应
   */
  private generateImpactAnalysisResponse(parsed: ParsedQuery): ResponseData {
    const nodeIdEntity = parsed.entities.find(e => e.type === 'node_id');
    
    if (!nodeIdEntity) {
      return {
        content: '🤔 请指定要分析的节点，例如："D_MotorTorque 的影响分析"',
      };
    }
    
    const nodeId = nodeIdEntity.value;
    const targetNode = this.nodes.find(n => n.id === nodeId);
    
    if (!targetNode) {
      return {
        content: `❌ 未找到节点：${nodeId}`,
      };
    }
    
    // 反向追踪影响
    const impact = this.engine.traceImpact(nodeId);
    const affectedKPIs = Array.from(impact.nodes)
      .map(id => this.nodes.find(n => n.id === id))
      .filter(n => n && n.data.category === 'kpi');
    
    const content = `⚡ **${targetNode.data.label} 的影响分析**\n\n` +
      `📝 描述：${targetNode.data.description}\n` +
      `🏷️ 类型：${this.getCategoryName(targetNode.data.category)}\n\n` +
      `**影响范围：**\n` +
      `- 影响节点数：**${impact.nodes.size}** 个\n` +
      `- 影响指标数：**${affectedKPIs.length}** 个\n\n` +
      `**受影响的指标：**\n` +
      `${affectedKPIs.slice(0, 5).map(n => 
        `- ${n!.data.metrics?.achieved ? '✅' : '❌'} ${n!.data.label}`
      ).join('\n')}\n` +
      `${affectedKPIs.length > 5 ? `_...还有 ${affectedKPIs.length - 5} 个指标_\n` : ''}\n` +
      `---\n\n` +
      `⚠️ 变更此节点可能影响 ${affectedKPIs.length} 个指标，请谨慎操作！`;

    return {
      content,
      nodes: Array.from(impact.nodes),
      edges: Array.from(impact.edges),
      action: 'highlight',
    };
  }

  /**
   * 问题诊断响应
   */
  private generateFindIssuesResponse(parsed: ParsedQuery): ResponseData {
    const query = parsed.rawQuery.toLowerCase();
    
    // 查找需要优先关注的指标
    if (query.includes('优先') || query.includes('关注') || query.includes('瓶颈')) {
      return this.generateBottleneckAnalysis();
    }
    
    // 查找缺少验证的指标
    if (query.includes('验证') || query.includes('缺口')) {
      return this.generateVerificationGapAnalysis();
    }
    
    // 默认：综合问题诊断
    return this.generateComprehensiveDiagnosis();
  }

  /**
   * 瓶颈分析
   */
  private generateBottleneckAnalysis(): ResponseData {
    const unachievedKPIs = this.engine.queryNodes({ 
      category: ['kpi'], 
      achieved: false 
    });
    
    // 计算每个未达成指标的影响范围
    const kpiWithImpact = unachievedKPIs.map(kpi => {
      const deps = this.engine.traceDependencies(kpi.id);
      return {
        node: kpi,
        impactSize: deps.nodes.size,
      };
    }).sort((a, b) => b.impactSize - a.impactSize);
    
    if (kpiWithImpact.length === 0) {
      return {
        content: '✅ 太棒了！所有指标都已达成，没有发现瓶颈问题。',
      };
    }
    
    const topBottlenecks = kpiWithImpact.slice(0, 3);
    
    let content = `🎯 **关键瓶颈识别**\n\n` +
      `发现 **${unachievedKPIs.length}** 个未达成指标，` +
      `以下是影响最大的 **${topBottlenecks.length}** 个：\n\n`;
    
    topBottlenecks.forEach((item, idx) => {
      const rate = item.node.data.metrics?.achievementRate || 0;
      const level = item.node.data.level || 1;
      content += `**${idx + 1}. ${item.node.data.label}** (L${level})\n`;
      content += `   📉 达成率：${rate}%\n`;
      content += `   🔗 影响范围：${item.impactSize} 个节点\n`;
      content += `   📝 ${item.node.data.description}\n\n`;
    });
    
    content += `---\n\n`;
    content += `💡 **建议**：优先解决上述指标，可获得最大收益。点击查看完整链路。`;
    
    const allIds = topBottlenecks.map(i => i.node.id);
    const chain = this.engine.traceChain(allIds);
    
    return {
      content,
      nodes: Array.from(chain.nodes),
      edges: Array.from(chain.edges),
      action: 'highlight',
    };
  }

  /**
   * 验证缺口分析
   */
  private generateVerificationGapAnalysis(): ResponseData {
    const kpiNodes = this.engine.queryNodes({ category: ['kpi'] });
    const verifyNodes = this.engine.queryNodes({ category: ['verify'] });
    
    // 找出没有验证节点的KPI
    const kpisWithoutVerify = kpiNodes.filter(kpi => {
      const connected = this.engine.getConnectedNodes(kpi.id, 'outgoing');
      return !connected.some(n => n.data.category === 'verify');
    });
    
    if (kpisWithoutVerify.length === 0) {
      return {
        content: '✅ 所有指标都有对应的验证环节！',
      };
    }
    
    const chain = this.engine.traceChain(kpisWithoutVerify.map(n => n.id));
    
    let content = `⚠️ **验证缺口分析**\n\n` +
      `发现 **${kpisWithoutVerify.length}** 个指标缺少验证环节：\n\n`;
    
    kpisWithoutVerify.slice(0, 8).forEach((kpi, idx) => {
      const level = kpi.data.level || 1;
      const status = kpi.data.metrics?.achieved ? '✅' : '❌';
      content += `${idx + 1}. **${kpi.data.label}** (L${level}) ${status}\n`;
      content += `   📝 ${kpi.data.description}\n\n`;
    });
    
    if (kpisWithoutVerify.length > 8) {
      content += `_...还有 ${kpisWithoutVerify.length - 8} 个指标_\n\n`;
    }
    
    content += `---\n\n`;
    content += `💡 **建议**：为这些指标补充相应的仿真验证或测试验证环节。`;
    
    return {
      content,
      nodes: Array.from(chain.nodes),
      edges: Array.from(chain.edges),
      action: 'highlight',
    };
  }

  /**
   * 综合问题诊断
   */
  private generateComprehensiveDiagnosis(): ResponseData {
    const kpiNodes = this.engine.queryNodes({ category: ['kpi'] });
    const stats = this.engine.calculateStats(kpiNodes);
    
    const unachievedCount = stats.byStatus?.unachieved || 0;
    const noModelCount = stats.byStatus?.withoutModel || 0;
    
    const issues: string[] = [];
    
    if (unachievedCount > 0) {
      issues.push(`❌ **${unachievedCount}** 个指标未达成`);
    }
    
    if (noModelCount > 0) {
      issues.push(`📦 **${noModelCount}** 个指标缺少模型`);
    }
    
    if (issues.length === 0) {
      return {
        content: '🎉 恭喜！系统状态良好，未发现明显问题。',
      };
    }
    
    const content = `🔍 **综合问题诊断**\n\n` +
      `发现以下问题：\n\n` +
      `${issues.join('\n')}\n\n` +
      `---\n\n` +
      `💡 **建议**：\n` +
      `- 使用 "显示未达成指标" 查看详情\n` +
      `- 使用 "识别瓶颈" 找出优先事项\n` +
      `- 使用 "哪些指标缺少验证" 补全缺口`;
    
    return { content };
  }

  /**
   * 建议响应
   */
  private generateSuggestionResponse(parsed: ParsedQuery): ResponseData {
    const nodeIdEntity = parsed.entities.find(e => e.type === 'node_id');
    
    if (nodeIdEntity) {
      return this.generateNodeSuggestion(nodeIdEntity.value);
    }
    
    return {
      content: `💡 **优化建议**\n\n` +
        `我可以为你提供以下建议：\n\n` +
        `1. **指标优化**：告诉我具体的指标ID（如 KPI_SpaceGain）\n` +
        `2. **系统优化**：使用 "识别瓶颈" 找出优先事项\n` +
        `3. **覆盖率提升**：使用 "哪些指标缺少验证"\n\n` +
        `你想了解哪方面的建议？`,
    };
  }

  /**
   * 节点建议
   */
  private generateNodeSuggestion(nodeId: string): ResponseData {
    const node = this.nodes.find(n => n.id === nodeId);
    
    if (!node) {
      return { content: `❌ 未找到节点：${nodeId}` };
    }
    
    if (node.data.category !== 'kpi') {
      return { content: `ℹ️ 暂时只支持为 KPI 节点提供建议。` };
    }
    
    const achieved = node.data.metrics?.achieved;
    const hasModel = !!node.data.metrics?.modelType;
    const rate = node.data.metrics?.achievementRate || 0;
    
    const suggestions: string[] = [];
    
    if (!achieved) {
      suggestions.push(`📉 当前达成率 ${rate}%，建议检查相关设计参数是否优化到位`);
    }
    
    if (!hasModel) {
      suggestions.push(`📦 缺少模型支撑，建议补充建模以验证设计`);
    }
    
    const connectedDesign = this.engine.getConnectedNodes(nodeId, 'outgoing')
      .filter(n => n.data.category === 'design');
    
    if (connectedDesign.length > 0) {
      suggestions.push(`🔧 关注以下设计参数：${connectedDesign.map(n => n.data.label).join('、')}`);
    }
    
    const hasVerify = this.engine.getConnectedNodes(nodeId, 'outgoing')
      .some(n => n.data.category === 'verify');
    
    if (!hasVerify) {
      suggestions.push(`⚠️ 缺少验证环节，建议补充仿真或测试验证`);
    }
    
    if (suggestions.length === 0) {
      suggestions.push(`✅ 该指标状态良好，继续保持！`);
    }
    
    const chain = this.engine.traceChain([nodeId]);
    
    const content = `💡 **${node.data.label} 优化建议**\n\n` +
      `📝 ${node.data.description}\n\n` +
      `**分析与建议：**\n\n` +
      `${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}\n\n` +
      `---\n\n` +
      `✨ 已高亮显示相关链路`;
    
    return {
      content,
      nodes: Array.from(chain.nodes),
      edges: Array.from(chain.edges),
      action: 'highlight',
    };
  }

  /**
   * 未知响应
   */
  private generateUnknownResponse(parsed: ParsedQuery): ResponseData {
    return {
      content: `🤔 抱歉，我还不太理解这个问题。\n\n` +
        `**你可以尝试：**\n\n` +
        `📊 **统计查询**\n` +
        `- "统计指标达成情况"\n` +
        `- "模型覆盖率统计"\n\n` +
        `🔍 **节点查询**\n` +
        `- "显示所有未达成的指标"\n` +
        `- "显示没有模型的一级指标"\n\n` +
        `🔗 **链路追踪**\n` +
        `- "KPI_SpaceGain 的链路"\n` +
        `- "D_MotorTorque 的影响分析"\n\n` +
        `💡 **问题诊断**\n` +
        `- "识别瓶颈"\n` +
        `- "哪些指标缺少验证"\n\n` +
        `或者使用下面的快捷命令！`,
    };
  }

  // ========== 辅助方法 ==========

  private getAchievementSuggestion(unachievedCount: number, achievedRate: string): string {
    const rate = parseFloat(achievedRate);
    if (unachievedCount === 0) {
      return '所有指标均已达成，表现优秀！';
    } else if (rate >= 80) {
      return `还有 ${unachievedCount} 个指标未达成，整体表现良好，继续努力！`;
    } else if (rate >= 60) {
      return `有 ${unachievedCount} 个指标需要关注，建议使用 "识别瓶颈" 找出优先事项。`;
    } else {
      return `达成率较低，建议立即使用 "识别瓶颈" 分析关键问题。`;
    }
  }

  private getModelCoverageSuggestion(withoutModel: number, coverageRate: number): string {
    if (withoutModel === 0) {
      return '模型覆盖完整，继续保持！';
    } else if (coverageRate >= 80) {
      return `还有 ${withoutModel} 个指标缺少模型，整体覆盖率良好。`;
    } else if (coverageRate >= 60) {
      return `有 ${withoutModel} 个指标缺少模型支撑，建议逐步补充建模。`;
    } else {
      return `模型覆盖率较低，建议优先为关键指标补充建模。`;
    }
  }

  private getEmptyResultMessage(condition: any): string {
    if (condition.achieved === false) {
      return '🎉 太棒了！所有指标都已达成！';
    }
    if (condition.hasModel === false) {
      return '✅ 所有指标都有模型覆盖！';
    }
    return '未找到符合条件的节点。';
  }

  private generateNodeListHeader(condition: any, count: number): string {
    if (condition.achieved === false) {
      return `❌ **找到 ${count} 个未达成指标：**\n\n`;
    }
    if (condition.hasModel === false) {
      return `⚠️ **找到 ${count} 个缺少模型的指标：**\n\n`;
    }
    if (condition.level) {
      return `📋 **找到 ${count} 个 L${condition.level} 指标：**\n\n`;
    }
    return `📋 **找到 ${count} 个节点：**\n\n`;
  }

  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'goal': return '🎯';
      case 'kpi': return '📊';
      case 'design': return '🔧';
      case 'verify': return '✓';
      default: return '•';
    }
  }

  private getCategoryName(category: string): string {
    switch (category) {
      case 'goal': return '目标';
      case 'kpi': return '指标';
      case 'design': return '设计参数';
      case 'verify': return '验证';
      default: return category;
    }
  }

  private getPercentage(count: number, total: number): string {
    if (total === 0) return '0%';
    return `${((count / total) * 100).toFixed(0)}%`;
  }

  // ========== 新增方法 ==========

  /**
   * 比较响应
   */
  private generateCompareResponse(parsed: ParsedQuery): ResponseData {
    // 简化处理：从所有实体中获取节点ID
    const nodeIdEntities = parsed.entities.filter(e => e.type === 'node_id');
    
    if (nodeIdEntities.length < 2) {
      return {
        content: '🤔 请指定要比较的两个节点ID，例如：\"比较 KPI_SpaceGain 和 KPI_FoldTime\"',
      };
    }
    
    const node1Id = nodeIdEntities[0].value;
    const node2Id = nodeIdEntities[1].value;
    const comparison = this.analyzer.compareKPIs(node1Id, node2Id);
    
    if (!comparison) {
      return {
        content: `❌ 无法比较这两个节点，请确保都是KPI节点。`,
      };
    }
    
    let content = `📊 **${comparison.entity1} 和 ${comparison.entity2} 的对比分析**\n\n`;
    
    comparison.metrics.forEach(metric => {
      content += `**${metric.name}**\n`;
      content += `- ${comparison.entity1}：${metric.value1}\n`;
      content += `- ${comparison.entity2}：${metric.value2}\n`;
      if (metric.diff !== undefined) {
        content += `- 差值：${metric.diff > 0 ? '+' : ''}${metric.diff}\n`;
      }
      content += `\n`;
    });
    
    content += `---\n\n`;
    content += `📝 **总结**：${comparison.summary}`;
    
    const chain = this.engine.traceChain([node1Id, node2Id]);
    
    return {
      content,
      nodes: Array.from(chain.nodes),
      edges: Array.from(chain.edges),
      action: 'highlight',
    };
  }

  /**
   * 相关性分析响应
   */
  private generateCorrelationResponse(parsed: ParsedQuery): ResponseData {
    const correlations = this.analyzer.analyzeCorrelations();
    
    if (correlations.length === 0) {
      return {
        content: '✅ 未发现指标之间的明显关联。',
      };
    }
    
    // 只显示前5个最强的关联
    const topCorrelations = correlations.slice(0, 5);
    
    let content = `🔗 **指标关联分析**\n\n`;
    content += `发现 **${correlations.length}** 对相关联的指标，`;
    content += `以下是关联最强的 **${topCorrelations.length}** 对：\n\n`;
    
    topCorrelations.forEach((corr, idx) => {
      const status1 = corr.kpi1.achieved ? '✅' : '❌';
      const status2 = corr.kpi2.achieved ? '✅' : '❌';
      content += `**${idx + 1}. ${corr.kpi1.name} ${status1} ⬌ ${corr.kpi2.name} ${status2}**\n`;
      content += `   🔧 共享设计参数：${corr.sharedDesignParams} 个\n`;
      content += `   ✓ 共享验证：${corr.sharedVerifications} 个\n`;
      content += `   💡 ${corr.insight}\n\n`;
    });
    
    content += `---\n\n`;
    content += `🎯 **建议**：关注共享设计参数较多的指标组合，优化时需要综合考虑。`;
    
    // 高亮所有相关的KPI
    const allKpiIds = topCorrelations.flatMap(c => [c.kpi1.id, c.kpi2.id]);
    const chain = this.engine.traceChain(allKpiIds);
    
    return {
      content,
      nodes: Array.from(chain.nodes),
      edges: Array.from(chain.edges),
      action: 'highlight',
    };
  }

  /**
   * 健康检查响应
   */
  private generateHealthCheckResponse(parsed: ParsedQuery): ResponseData {
    const levelHealth = this.analyzer.analyzeLevelHealth();
    
    let content = `🏥 **系统健康度检查**\n\n`;
    
    levelHealth.forEach(level => {
      const gradeEmoji = 
        level.grade === 'A' ? '🏆' :
        level.grade === 'B' ? '🥈' :
        level.grade === 'C' ? '🥉' :
        level.grade === 'D' ? '⚠️' : '🚨';
        
      content += `**${gradeEmoji} L${level.level} 指标健康度：${level.grade} (${level.healthScore.toFixed(1)}分)**\n\n`;
      content += `- 总指标数：${level.totalKPIs} 个\n`;
      content += `- 达成情况：${level.achievedKPIs}/${level.totalKPIs} (${level.achievementRate.toFixed(1)}%)\\n`;
      content += `- 模型覆盖：${level.withModel}/${level.totalKPIs} (${level.modelCoverage.toFixed(1)}%)\\n`;
      content += `- 验证覆盖：${level.withVerify}/${level.totalKPIs} (${level.verificationCoverage.toFixed(1)}%)\\n\\n`;
    });
    
    content += `---\n\n`;
    
    // 找出最需要改进的层级
    const needsImprovement = levelHealth.filter(l => l.grade === 'D' || l.grade === 'F');
    if (needsImprovement.length > 0) {
      content += `⚠️ **需要改进**：`;
      content += needsImprovement.map(l => `L${l.level}`).join('、');
      content += ` 指标健康度较低，建议优先关注。`;
    } else {
      content += `✅ **整体表现良好**：所有层级健康度达标！`;
    }
    
    return { content };
  }

  /**
   * 优先级响应
   */
  private generatePriorityResponse(parsed: ParsedQuery): ResponseData {
    const priorities = this.analyzer.prioritizeNodes();
    
    if (priorities.length === 0) {
      return {
        content: '✅ 太棒了！所有指标都已达成，无需优先处理。',
      };
    }
    
    const topPriorities = priorities.slice(0, 5);
    
    let content = `🎯 **优先级排序分析**\n\n`;
    content += `共 **${priorities.length}** 个指标需要关注，`;
    content += `以下是优先级最高的 **${topPriorities.length}** 个：\n\n`;
    
    topPriorities.forEach((item, idx) => {
      content += `**${idx + 1}. ${item.nodeName}** (优先级：${item.priorityScore}分)\n`;
      content += `   📝 原因：${item.reasons.join('、')}\n\n`;
    });
    
    content += `---\n\n`;
    content += `💡 **建议**：按照优先级顺序逐个解决，可以获得最大的改进效果。`;
    
    const topIds = topPriorities.map(p => p.nodeId);
    const chain = this.engine.traceChain(topIds);
    
    return {
      content,
      nodes: Array.from(chain.nodes),
      edges: Array.from(chain.edges),
      action: 'highlight',
    };
  }
}