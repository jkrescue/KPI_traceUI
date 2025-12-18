import { Node, Edge } from 'reactflow';
import { CopilotEngine } from './copilotEngine';

/**
 * 高级分析器 - 提供深度分析能力
 */

export interface ComparisonResult {
  entity1: string;
  entity2: string;
  metrics: {
    name: string;
    value1: number | string;
    value2: number | string;
    diff?: number;
    diffPercent?: number;
    better?: 'entity1' | 'entity2' | 'equal';
  }[];
  summary: string;
}

export interface TrendAnalysis {
  indicator: string;
  trend: 'improving' | 'declining' | 'stable';
  currentValue: number;
  historicalValues?: number[];
  recommendation: string;
}

export interface DependencyAnalysis {
  nodeId: string;
  nodeName: string;
  dependencies: {
    upstream: { id: string; name: string; category: string }[];
    downstream: { id: string; name: string; category: string }[];
  };
  criticalPath: string[];
  riskLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
}

export interface CorrelationAnalysis {
  kpi1: { id: string; name: string; achieved: boolean };
  kpi2: { id: string; name: string; achieved: boolean };
  sharedDesignParams: number;
  sharedVerifications: number;
  correlationStrength: 'strong' | 'medium' | 'weak';
  insight: string;
}

export interface GapAnalysis {
  category: string;
  identified: string[];
  missing: string[];
  coverageRate: number;
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export class AdvancedAnalyzer {
  private engine: CopilotEngine;
  private nodes: Node[];
  private edges: Edge[];

  constructor(engine: CopilotEngine, nodes: Node[], edges: Edge[]) {
    this.engine = engine;
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * 对比分析两个KPI
   */
  compareKPIs(kpiId1: string, kpiId2: string): ComparisonResult | null {
    const kpi1 = this.nodes.find(n => n.id === kpiId1 && n.data.category === 'kpi');
    const kpi2 = this.nodes.find(n => n.id === kpiId2 && n.data.category === 'kpi');

    if (!kpi1 || !kpi2) return null;

    const metrics1 = kpi1.data.metrics || {};
    const metrics2 = kpi2.data.metrics || {};

    const comparisonMetrics = [];

    // 达成率对比
    const rate1 = metrics1.achievementRate || 0;
    const rate2 = metrics2.achievementRate || 0;
    comparisonMetrics.push({
      name: '达成率',
      value1: `${rate1}%`,
      value2: `${rate2}%`,
      diff: rate1 - rate2,
      diffPercent: rate1 - rate2,
      better: rate1 > rate2 ? 'entity1' : rate1 < rate2 ? 'entity2' : 'equal',
    });

    // 层级对比
    comparisonMetrics.push({
      name: 'KPI层级',
      value1: `L${kpi1.data.level || 1}`,
      value2: `L${kpi2.data.level || 1}`,
    });

    // 模型覆盖对比
    comparisonMetrics.push({
      name: '模型类型',
      value1: metrics1.modelType || '无',
      value2: metrics2.modelType || '无',
    });

    // 设计参数数量对比
    const designParams1 = this.engine.getConnectedNodes(kpiId1, 'outgoing')
      .filter(n => n.data.category === 'design').length;
    const designParams2 = this.engine.getConnectedNodes(kpiId2, 'outgoing')
      .filter(n => n.data.category === 'design').length;
    comparisonMetrics.push({
      name: '设计参数数量',
      value1: designParams1,
      value2: designParams2,
      diff: designParams1 - designParams2,
    });

    // 验证数量对比
    const verifications1 = this.engine.getConnectedNodes(kpiId1, 'outgoing')
      .filter(n => n.data.category === 'verify').length;
    const verifications2 = this.engine.getConnectedNodes(kpiId2, 'outgoing')
      .filter(n => n.data.category === 'verify').length;
    comparisonMetrics.push({
      name: '验证环节数量',
      value1: verifications1,
      value2: verifications2,
      diff: verifications1 - verifications2,
    });

    // 生成总结
    const summary = this.generateComparisonSummary(kpi1, kpi2, comparisonMetrics);

    return {
      entity1: kpi1.data.label,
      entity2: kpi2.data.label,
      metrics: comparisonMetrics,
      summary,
    };
  }

  private generateComparisonSummary(kpi1: Node, kpi2: Node, metrics: any[]): string {
    const rateMetric = metrics.find(m => m.name === '达成率');
    const summary: string[] = [];

    if (rateMetric) {
      if (rateMetric.better === 'entity1') {
        summary.push(`${kpi1.data.label} 的达成率更高（${rateMetric.diffPercent.toFixed(1)}%）`);
      } else if (rateMetric.better === 'entity2') {
        summary.push(`${kpi2.data.label} 的达成率更高（${Math.abs(rateMetric.diffPercent).toFixed(1)}%）`);
      } else {
        summary.push('两个指标达成率相同');
      }
    }

    return summary.join('，');
  }

  /**
   * 依赖分析
   */
  analyzeDependencies(nodeId: string): DependencyAnalysis | null {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const upstream = this.engine.getConnectedNodes(nodeId, 'incoming')
      .map(n => ({
        id: n.id,
        name: n.data.label,
        category: n.data.category,
      }));

    const downstream = this.engine.getConnectedNodes(nodeId, 'outgoing')
      .map(n => ({
        id: n.id,
        name: n.data.label,
        category: n.data.category,
      }));

    // 计算关键路径（到顶层目标的路径）
    const criticalPath = this.calculateCriticalPath(nodeId);

    // 评估风险等级
    const riskAnalysis = this.assessRisk(node, upstream, downstream);

    return {
      nodeId,
      nodeName: node.data.label,
      dependencies: { upstream, downstream },
      criticalPath,
      riskLevel: riskAnalysis.level,
      riskFactors: riskAnalysis.factors,
    };
  }

  private calculateCriticalPath(nodeId: string): string[] {
    const path: string[] = [nodeId];
    let currentId = nodeId;

    // 向上追溯到目标层
    while (true) {
      const parent = this.engine.getConnectedNodes(currentId, 'incoming')
        .find(n => n.data.category === 'goal' || n.data.category === 'kpi');
      
      if (!parent) break;
      path.unshift(parent.id);
      currentId = parent.id;

      if (parent.data.category === 'goal') break;
    }

    return path;
  }

  private assessRisk(node: Node, upstream: any[], downstream: any[]): {
    level: 'high' | 'medium' | 'low';
    factors: string[];
  } {
    const factors: string[] = [];
    let riskScore = 0;

    // KPI 未达成
    if (node.data.category === 'kpi' && !node.data.metrics?.achieved) {
      factors.push('指标未达成');
      riskScore += 3;
    }

    // 缺少模型
    if (node.data.category === 'kpi' && !node.data.metrics?.modelType) {
      factors.push('缺少模型支撑');
      riskScore += 2;
    }

    // 缺少验证
    if (node.data.category === 'kpi' || node.data.category === 'design') {
      const hasVerify = downstream.some(n => n.category === 'verify');
      if (!hasVerify) {
        factors.push('缺少验证环节');
        riskScore += 2;
      }
    }

    // 依赖过多
    if (upstream.length > 5) {
      factors.push(`上游依赖较多（${upstream.length}个）`);
      riskScore += 1;
    }

    // 被依赖过多
    if (downstream.length > 8) {
      factors.push(`下游依赖较多（${downstream.length}个）`);
      riskScore += 1;
    }

    const level = riskScore >= 5 ? 'high' : riskScore >= 3 ? 'medium' : 'low';
    return { level, factors };
  }

  /**
   * 关联分析 - 找出相关联的KPI
   */
  analyzeCorrelations(): CorrelationAnalysis[] {
    const kpis = this.engine.queryNodes({ category: ['kpi'] });
    const correlations: CorrelationAnalysis[] = [];

    // 两两对比
    for (let i = 0; i < kpis.length; i++) {
      for (let j = i + 1; j < kpis.length; j++) {
        const kpi1 = kpis[i];
        const kpi2 = kpis[j];

        // 找共享的设计参数
        const design1 = new Set(
          this.engine.getConnectedNodes(kpi1.id, 'outgoing')
            .filter(n => n.data.category === 'design')
            .map(n => n.id)
        );
        const design2 = new Set(
          this.engine.getConnectedNodes(kpi2.id, 'outgoing')
            .filter(n => n.data.category === 'design')
            .map(n => n.id)
        );

        const sharedDesign = Array.from(design1).filter(id => design2.has(id));

        // 找共享的验证
        const verify1 = new Set(
          this.engine.getConnectedNodes(kpi1.id, 'outgoing')
            .filter(n => n.data.category === 'verify')
            .map(n => n.id)
        );
        const verify2 = new Set(
          this.engine.getConnectedNodes(kpi2.id, 'outgoing')
            .filter(n => n.data.category === 'verify')
            .map(n => n.id)
        );

        const sharedVerify = Array.from(verify1).filter(id => verify2.has(id));

        // 如果有共享，创建关联分析
        if (sharedDesign.length > 0 || sharedVerify.length > 0) {
          const strength = 
            sharedDesign.length >= 2 ? 'strong' :
            sharedDesign.length >= 1 ? 'medium' : 'weak';

          correlations.push({
            kpi1: {
              id: kpi1.id,
              name: kpi1.data.label,
              achieved: kpi1.data.metrics?.achieved || false,
            },
            kpi2: {
              id: kpi2.id,
              name: kpi2.data.label,
              achieved: kpi2.data.metrics?.achieved || false,
            },
            sharedDesignParams: sharedDesign.length,
            sharedVerifications: sharedVerify.length,
            correlationStrength: strength,
            insight: this.generateCorrelationInsight(
              kpi1, kpi2, sharedDesign.length, sharedVerify.length
            ),
          });
        }
      }
    }

    // 按关联强度排序
    return correlations.sort((a, b) => 
      b.sharedDesignParams - a.sharedDesignParams
    );
  }

  private generateCorrelationInsight(
    kpi1: Node, 
    kpi2: Node, 
    sharedDesign: number, 
    sharedVerify: number
  ): string {
    const both = kpi1.data.metrics?.achieved && kpi2.data.metrics?.achieved;
    const neither = !kpi1.data.metrics?.achieved && !kpi2.data.metrics?.achieved;
    const oneAchieved = kpi1.data.metrics?.achieved !== kpi2.data.metrics?.achieved;

    if (sharedDesign >= 2) {
      if (neither) {
        return '共享多个设计参数，两个指标都未达成，建议优先优化共享参数';
      } else if (oneAchieved) {
        return '共享设计参数但达成情况不同，可能存在其他影响因素';
      } else {
        return '共享设计参数且都已达成，设计方案有效';
      }
    }

    return '存在关联，建议综合考虑';
  }

  /**
   * 缺口分析
   */
  analyzeGaps(): GapAnalysis[] {
    const gaps: GapAnalysis[] = [];

    // 1. 模型覆盖缺口
    const modelGap = this.analyzeModelGap();
    if (modelGap) gaps.push(modelGap);

    // 2. 验证覆盖缺口
    const verifyGap = this.analyzeVerificationGap();
    if (verifyGap) gaps.push(verifyGap);

    // 3. 指标达成缺口
    const achievementGap = this.analyzeAchievementGap();
    if (achievementGap) gaps.push(achievementGap);

    return gaps;
  }

  private analyzeModelGap(): GapAnalysis | null {
    const kpis = this.engine.queryNodes({ category: ['kpi'] });
    const withModel = kpis.filter(n => n.data.metrics?.modelType);
    const withoutModel = kpis.filter(n => !n.data.metrics?.modelType);

    if (withoutModel.length === 0) return null;

    const coverageRate = (withModel.length / kpis.length) * 100;
    const priority = coverageRate < 60 ? 'high' : coverageRate < 80 ? 'medium' : 'low';

    const recommendations: string[] = [];
    
    // 按层级统计
    const l1Missing = withoutModel.filter(n => n.data.level === 1).length;
    const l2Missing = withoutModel.filter(n => n.data.level === 2).length;

    if (l1Missing > 0) {
      recommendations.push(`优先为 ${l1Missing} 个一级指标补充模型`);
    }
    if (l2Missing > 0) {
      recommendations.push(`为 ${l2Missing} 个二级指标补充模型`);
    }

    recommendations.push('建议选用适合的模型类型（SysML/Simulink/Modelica/FMU）');

    return {
      category: '模型覆盖',
      identified: withModel.map(n => n.id),
      missing: withoutModel.map(n => n.id),
      coverageRate,
      priority,
      recommendations,
    };
  }

  private analyzeVerificationGap(): GapAnalysis | null {
    const kpis = this.engine.queryNodes({ category: ['kpi'] });
    const withVerify: string[] = [];
    const withoutVerify: string[] = [];

    kpis.forEach(kpi => {
      const hasVerify = this.engine.getConnectedNodes(kpi.id, 'outgoing')
        .some(n => n.data.category === 'verify');
      
      if (hasVerify) {
        withVerify.push(kpi.id);
      } else {
        withoutVerify.push(kpi.id);
      }
    });

    if (withoutVerify.length === 0) return null;

    const coverageRate = (withVerify.length / kpis.length) * 100;
    const priority = coverageRate < 60 ? 'high' : coverageRate < 80 ? 'medium' : 'low';

    const recommendations = [
      `为 ${withoutVerify.length} 个指标补充验证环节`,
      '建议结合仿真验证和测试验证',
      '优先验证未达成的指标',
    ];

    return {
      category: '验证覆盖',
      identified: withVerify,
      missing: withoutVerify,
      coverageRate,
      priority,
      recommendations,
    };
  }

  private analyzeAchievementGap(): GapAnalysis | null {
    const kpis = this.engine.queryNodes({ category: ['kpi'] });
    const achieved = kpis.filter(n => n.data.metrics?.achieved);
    const unachieved = kpis.filter(n => !n.data.metrics?.achieved);

    if (unachieved.length === 0) return null;

    const coverageRate = (achieved.length / kpis.length) * 100;
    const priority = coverageRate < 60 ? 'high' : coverageRate < 80 ? 'medium' : 'low';

    const recommendations: string[] = [];

    // 找出影响最大的未达成指标
    const criticalUnachieved = unachieved
      .map(kpi => {
        const deps = this.engine.traceDependencies(kpi.id);
        return { kpi, impactSize: deps.nodes.size };
      })
      .sort((a, b) => b.impactSize - a.impactSize)
      .slice(0, 3);

    if (criticalUnachieved.length > 0) {
      recommendations.push(
        `优先解决：${criticalUnachieved.map(c => c.kpi.data.label).join('、')}`
      );
    }

    recommendations.push('检查并优化相关设计参数');
    recommendations.push('补充必要的模型和验证');

    return {
      category: '指标达成',
      identified: achieved.map(n => n.id),
      missing: unachieved.map(n => n.id),
      coverageRate,
      priority,
      recommendations,
    };
  }

  /**
   * 层级健康度分析
   */
  analyzeLevelHealth(): {
    level: number;
    totalKPIs: number;
    achievedKPIs: number;
    achievementRate: number;
    withModel: number;
    modelCoverage: number;
    withVerify: number;
    verificationCoverage: number;
    healthScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  }[] {
    const levels = [1, 2];
    const results = [];

    for (const level of levels) {
      const kpis = this.engine.queryNodes({ category: ['kpi'], level });
      const totalKPIs = kpis.length;

      if (totalKPIs === 0) continue;

      const achievedKPIs = kpis.filter(n => n.data.metrics?.achieved).length;
      const achievementRate = (achievedKPIs / totalKPIs) * 100;

      const withModel = kpis.filter(n => n.data.metrics?.modelType).length;
      const modelCoverage = (withModel / totalKPIs) * 100;

      const withVerify = kpis.filter(kpi => 
        this.engine.getConnectedNodes(kpi.id, 'outgoing')
          .some(n => n.data.category === 'verify')
      ).length;
      const verificationCoverage = (withVerify / totalKPIs) * 100;

      // 综合健康度评分
      const healthScore = (
        achievementRate * 0.5 +
        modelCoverage * 0.3 +
        verificationCoverage * 0.2
      );

      const grade = 
        healthScore >= 90 ? 'A' :
        healthScore >= 80 ? 'B' :
        healthScore >= 70 ? 'C' :
        healthScore >= 60 ? 'D' : 'F';

      results.push({
        level,
        totalKPIs,
        achievedKPIs,
        achievementRate,
        withModel,
        modelCoverage,
        withVerify,
        verificationCoverage,
        healthScore,
        grade,
      });
    }

    return results;
  }

  /**
   * 优先级排序 - 找出最需要关注的节点
   */
  prioritizeNodes(): {
    nodeId: string;
    nodeName: string;
    category: string;
    priorityScore: number;
    reasons: string[];
  }[] {
    const kpis = this.engine.queryNodes({ category: ['kpi'] });
    const priorities = [];

    for (const kpi of kpis) {
      let score = 0;
      const reasons: string[] = [];

      // 未达成 +50分
      if (!kpi.data.metrics?.achieved) {
        score += 50;
        reasons.push('指标未达成');
      }

      // 缺少模型 +30分
      if (!kpi.data.metrics?.modelType) {
        score += 30;
        reasons.push('缺少模型');
      }

      // 缺少验证 +20分
      const hasVerify = this.engine.getConnectedNodes(kpi.id, 'outgoing')
        .some(n => n.data.category === 'verify');
      if (!hasVerify) {
        score += 20;
        reasons.push('缺少验证');
      }

      // 一级指标 +10分
      if (kpi.data.level === 1) {
        score += 10;
        reasons.push('一级指标');
      }

      // 影响范围大 +影响节点数
      const impact = this.engine.traceDependencies(kpi.id);
      score += Math.min(impact.nodes.size, 20);
      if (impact.nodes.size > 5) {
        reasons.push(`影响${impact.nodes.size}个节点`);
      }

      if (score > 0) {
        priorities.push({
          nodeId: kpi.id,
          nodeName: kpi.data.label,
          category: kpi.data.category,
          priorityScore: score,
          reasons,
        });
      }
    }

    return priorities.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
