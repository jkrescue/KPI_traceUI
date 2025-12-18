import { Node, Edge } from 'reactflow';
import { CopilotEngine } from './copilotEngine';
import { AdvancedAnalyzer } from './advancedAnalyzer';

/**
 * 报告生成器 - 生成各类分析报告
 */

export interface ReportSection {
  title: string;
  content: string;
  data?: any;
  chart?: 'pie' | 'bar' | 'table';
}

export interface Report {
  title: string;
  timestamp: Date;
  sections: ReportSection[];
  summary: string;
}

export class ReportGenerator {
  private engine: CopilotEngine;
  private analyzer: AdvancedAnalyzer;
  private nodes: Node[];
  private edges: Edge[];

  constructor(engine: CopilotEngine, nodes: Node[], edges: Edge[]) {
    this.engine = engine;
    this.analyzer = new AdvancedAnalyzer(engine, nodes, edges);
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * 生成完整系统报告
   */
  generateFullReport(): Report {
    const sections: ReportSection[] = [];

    // 1. 执行摘要
    sections.push(this.generateExecutiveSummary());

    // 2. 指标达成分析
    sections.push(this.generateAchievementAnalysis());

    // 3. 模型覆盖分析
    sections.push(this.generateModelCoverageAnalysis());

    // 4. 层级健康度分析
    sections.push(this.generateHealthAnalysis());

    // 5. 问题识别
    sections.push(this.generateIssuesSection());

    // 6. 优先级建议
    sections.push(this.generatePrioritySection());

    // 7. 缺口分析
    sections.push(this.generateGapAnalysis());

    const summary = this.generateOverallSummary();

    return {
      title: '新能源汽车折叠方向盘系统分析报告',
      timestamp: new Date(),
      sections,
      summary,
    };
  }

  /**
   * 生成KPI专项报告
   */
  generateKPIReport(kpiId: string): Report | null {
    const kpi = this.nodes.find(n => n.id === kpiId);
    if (!kpi || kpi.data.category !== 'kpi') return null;

    const sections: ReportSection[] = [];

    // 1. KPI概况
    sections.push({
      title: '指标概况',
      content: this.generateKPIOverview(kpi),
    });

    // 2. 链路分析
    const chain = this.engine.traceDependencies(kpiId);
    sections.push({
      title: '依赖链路',
      content: this.generateChainSummary(chain, kpi),
    });

    // 3. 影响分析
    const deps = this.analyzer.analyzeDependencies(kpiId);
    if (deps) {
      sections.push({
        title: '依赖与影响',
        content: this.generateDependencyContent(deps),
      });
    }

    // 4. 风险评估
    if (deps) {
      sections.push({
        title: '风险评估',
        content: this.generateRiskContent(deps),
      });
    }

    // 5. 改进建议
    sections.push({
      title: '改进建议',
      content: this.generateKPIRecommendations(kpi, deps),
    });

    return {
      title: `${kpi.data.label} 专项分析报告`,
      timestamp: new Date(),
      sections,
      summary: `本报告针对 ${kpi.data.label} 进行了全面分析，包括链路追踪、依赖关系、风险评估和改进建议。`,
    };
  }

  /**
   * 生成对比报告
   */
  generateComparisonReport(kpiId1: string, kpiId2: string): Report | null {
    const comparison = this.analyzer.compareKPIs(kpiId1, kpiId2);
    if (!comparison) return null;

    const sections: ReportSection[] = [];

    // 1. 对比概览
    sections.push({
      title: '对比概览',
      content: `本报告对比分析 **${comparison.entity1}** 和 **${comparison.entity2}** 的各项指标。`,
    });

    // 2. 详细对比
    let detailContent = '## 详细对比\n\n';
    comparison.metrics.forEach(metric => {
      detailContent += `### ${metric.name}\n`;
      detailContent += `- ${comparison.entity1}: ${metric.value1}\n`;
      detailContent += `- ${comparison.entity2}: ${metric.value2}\n`;
      if (metric.diff !== undefined) {
        const arrow = metric.diff > 0 ? '↑' : metric.diff < 0 ? '↓' : '→';
        detailContent += `- 差值: ${arrow} ${Math.abs(metric.diff)}\n`;
      }
      detailContent += '\n';
    });

    sections.push({
      title: '详细指标对比',
      content: detailContent,
    });

    // 3. 总结
    sections.push({
      title: '对比总结',
      content: comparison.summary,
    });

    return {
      title: `${comparison.entity1} vs ${comparison.entity2} 对比报告`,
      timestamp: new Date(),
      sections,
      summary: comparison.summary,
    };
  }

  /**
   * 导出为Markdown
   */
  exportToMarkdown(report: Report): string {
    let md = `# ${report.title}\n\n`;
    md += `**生成时间**: ${report.timestamp.toLocaleString('zh-CN')}\n\n`;
    md += `---\n\n`;
    
    // 目录
    md += `## 目录\n\n`;
    report.sections.forEach((section, idx) => {
      md += `${idx + 1}. [${section.title}](#${this.slugify(section.title)})\n`;
    });
    md += `\n---\n\n`;

    // 摘要
    md += `## 执行摘要\n\n${report.summary}\n\n---\n\n`;

    // 各章节
    report.sections.forEach(section => {
      md += `## ${section.title}\n\n`;
      md += `${section.content}\n\n`;
      md += `---\n\n`;
    });

    // 页脚
    md += `\n---\n\n`;
    md += `*本报告由 Figma Make - 折叠方向盘系统分析工具自动生成*\n`;

    return md;
  }

  /**
   * 导出为JSON
   */
  exportToJSON(report: Report): string {
    return JSON.stringify(report, null, 2);
  }

  // ========== 私有方法 ==========

  private generateExecutiveSummary(): ReportSection {
    const kpis = this.engine.queryNodes({ category: ['kpi'] });
    const achieved = kpis.filter(n => n.data.metrics?.achieved);
    const withModel = kpis.filter(n => n.data.metrics?.modelType);

    const content = `
本系统共包含 **${kpis.length}** 个关键性能指标（KPI），其中：

- ✅ **已达成**: ${achieved.length} 个 (${((achieved.length / kpis.length) * 100).toFixed(1)}%)
- ❌ **未达成**: ${kpis.length - achieved.length} 个
- 🔧 **模型覆盖**: ${withModel.length} 个 (${((withModel.length / kpis.length) * 100).toFixed(1)}%)

**整体评估**: ${this.getOverallGrade(achieved.length, kpis.length, withModel.length)}
`;

    return {
      title: '执行摘要',
      content: content.trim(),
    };
  }

  private generateAchievementAnalysis(): ReportSection {
    const l1KPIs = this.engine.queryNodes({ category: ['kpi'], level: 1 });
    const l2KPIs = this.engine.queryNodes({ category: ['kpi'], level: 2 });

    const l1Achieved = l1KPIs.filter(n => n.data.metrics?.achieved).length;
    const l2Achieved = l2KPIs.filter(n => n.data.metrics?.achieved).length;

    let content = `### 一级指标 (L1)\n\n`;
    content += `- 总数: ${l1KPIs.length} 个\n`;
    content += `- 已达成: ${l1Achieved} 个 (${((l1Achieved / l1KPIs.length) * 100).toFixed(1)}%)\n`;
    content += `- 未达成: ${l1KPIs.length - l1Achieved} 个\n\n`;

    content += `### 二级指标 (L2)\n\n`;
    content += `- 总数: ${l2KPIs.length} 个\n`;
    content += `- 已达成: ${l2Achieved} 个 (${((l2Achieved / l2KPIs.length) * 100).toFixed(1)}%)\n`;
    content += `- 未达成: ${l2KPIs.length - l2Achieved} 个\n\n`;

    // 未达成列表
    const unachieved = [...l1KPIs, ...l2KPIs].filter(n => !n.data.metrics?.achieved);
    if (unachieved.length > 0) {
      content += `### 未达成指标清单\n\n`;
      unachieved.forEach(kpi => {
        const rate = kpi.data.metrics?.achievementRate || 0;
        content += `- **${kpi.data.label}**: ${kpi.data.description} (当前: ${rate}%)\n`;
      });
    }

    return {
      title: '指标达成分析',
      content,
    };
  }

  private generateModelCoverageAnalysis(): ReportSection {
    const kpis = this.engine.queryNodes({ category: ['kpi'] });
    const modelTypes = ['sysml', 'simulink', 'modelica', 'fmu'];
    
    let content = `### 模型类型分布\n\n`;
    
    modelTypes.forEach(type => {
      const count = kpis.filter(n => n.data.metrics?.modelType === type).length;
      if (count > 0) {
        content += `- **${type.toUpperCase()}**: ${count} 个\n`;
      }
    });

    const noModel = kpis.filter(n => !n.data.metrics?.modelType);
    content += `- **无模型**: ${noModel.length} 个\n\n`;

    if (noModel.length > 0) {
      content += `### 缺少模型的指标\n\n`;
      noModel.forEach(kpi => {
        content += `- ${kpi.data.label}: ${kpi.data.description}\n`;
      });
    }

    return {
      title: '模型覆盖分析',
      content,
    };
  }

  private generateHealthAnalysis(): ReportSection {
    const healthData = this.analyzer.analyzeLevelHealth();
    
    let content = '';
    healthData.forEach(level => {
      const emoji = level.grade === 'A' ? '🏆' : 
                    level.grade === 'B' ? '🥈' :
                    level.grade === 'C' ? '🥉' :
                    level.grade === 'D' ? '⚠️' : '🚨';
      
      content += `### ${emoji} L${level.level} 指标 - 健康度 ${level.grade}\n\n`;
      content += `- **综合评分**: ${level.healthScore.toFixed(1)}/100\n`;
      content += `- **达成率**: ${level.achievementRate.toFixed(1)}%\n`;
      content += `- **模型覆盖率**: ${level.modelCoverage.toFixed(1)}%\n`;
      content += `- **验证覆盖率**: ${level.verificationCoverage.toFixed(1)}%\n\n`;
    });

    return {
      title: '层级健康度分析',
      content,
    };
  }

  private generateIssuesSection(): ReportSection {
    const gaps = this.analyzer.analyzeGaps();
    
    let content = '';
    gaps.forEach(gap => {
      const emoji = gap.priority === 'high' ? '🚨' : 
                    gap.priority === 'medium' ? '⚠️' : 'ℹ️';
      
      content += `### ${emoji} ${gap.category} (优先级: ${gap.priority})\n\n`;
      content += `- **覆盖率**: ${gap.coverageRate.toFixed(1)}%\n`;
      content += `- **已覆盖**: ${gap.identified.length} 个\n`;
      content += `- **缺失**: ${gap.missing.length} 个\n\n`;
      
      if (gap.recommendations.length > 0) {
        content += `**改进建议**:\n`;
        gap.recommendations.forEach(rec => {
          content += `- ${rec}\n`;
        });
        content += '\n';
      }
    });

    return {
      title: '问题识别与缺口分析',
      content,
    };
  }

  private generatePrioritySection(): ReportSection {
    const priorities = this.analyzer.prioritizeNodes().slice(0, 10);
    
    let content = `以下是按优先级排序的需要关注的指标（Top 10）：\n\n`;
    
    priorities.forEach((item, idx) => {
      content += `**${idx + 1}. ${item.nodeName}** (优先级: ${item.priorityScore})\n`;
      content += `   - 原因: ${item.reasons.join('、')}\n\n`;
    });

    return {
      title: '优先级排序',
      content,
    };
  }

  private generateGapAnalysis(): ReportSection {
    const gaps = this.analyzer.analyzeGaps();
    
    let content = `本节总结了系统在各维度的缺口情况：\n\n`;
    
    gaps.forEach(gap => {
      content += `- **${gap.category}**: 覆盖率 ${gap.coverageRate.toFixed(1)}%，`;
      content += `缺失 ${gap.missing.length} 项 (${gap.priority}优先级)\n`;
    });

    return {
      title: '缺口总结',
      content,
    };
  }

  private generateOverallSummary(): string {
    const kpis = this.engine.queryNodes({ category: ['kpi'] });
    const achieved = kpis.filter(n => n.data.metrics?.achieved);
    const achievementRate = (achieved.length / kpis.length) * 100;
    
    let summary = `系统整体达成率为 ${achievementRate.toFixed(1)}%，`;
    
    if (achievementRate >= 80) {
      summary += '表现优秀，建议继续保持并优化剩余指标。';
    } else if (achievementRate >= 60) {
      summary += '表现良好，但仍有提升空间，建议关注未达成的关键指标。';
    } else {
      summary += '存在较大改进空间，建议优先处理高优先级指标。';
    }

    return summary;
  }

  private generateKPIOverview(kpi: Node): string {
    const metrics = kpi.data.metrics || {};
    const status = metrics.achieved ? '✅ 已达成' : '❌ 未达成';
    const model = metrics.modelType ? `✓ ${metrics.modelType.toUpperCase()}` : '✗ 无模型';
    
    return `
- **名称**: ${kpi.data.label}
- **描述**: ${kpi.data.description}
- **层级**: L${kpi.data.level || 1}
- **状态**: ${status}
- **达成率**: ${metrics.achievementRate || 0}%
- **模型支撑**: ${model}
`.trim();
  }

  private generateChainSummary(chain: any, kpi: Node): string {
    let content = `该指标的完整链路包含:\n\n`;
    content += `- **相关节点总数**: ${chain.nodes.size} 个\n`;
    content += `- **连接关系数**: ${chain.edges.size} 条\n`;
    return content;
  }

  private generateDependencyContent(deps: any): string {
    let content = `### 上游依赖\n\n`;
    if (deps.dependencies.upstream.length > 0) {
      deps.dependencies.upstream.forEach((d: any) => {
        content += `- ${d.name} (${d.category})\n`;
      });
    } else {
      content += `无上游依赖\n`;
    }
    
    content += `\n### 下游依赖\n\n`;
    if (deps.dependencies.downstream.length > 0) {
      deps.dependencies.downstream.forEach((d: any) => {
        content += `- ${d.name} (${d.category})\n`;
      });
    } else {
      content += `无下游依赖\n`;
    }
    
    return content;
  }

  private generateRiskContent(deps: any): string {
    const emoji = deps.riskLevel === 'high' ? '🚨' : 
                  deps.riskLevel === 'medium' ? '⚠️' : '✅';
    
    let content = `**风险等级**: ${emoji} ${deps.riskLevel.toUpperCase()}\n\n`;
    
    if (deps.riskFactors.length > 0) {
      content += `**风险因素**:\n`;
      deps.riskFactors.forEach((factor: string) => {
        content += `- ${factor}\n`;
      });
    } else {
      content += `未发现明显风险因素\n`;
    }
    
    return content;
  }

  private generateKPIRecommendations(kpi: Node, deps: any): string {
    const recommendations: string[] = [];
    
    if (!kpi.data.metrics?.achieved) {
      recommendations.push('指标未达成，建议优先排查关键设计参数');
    }
    
    if (!kpi.data.metrics?.modelType) {
      recommendations.push('缺少模型支撑，建议建立仿真模型进行验证');
    }
    
    if (deps && deps.dependencies.downstream.length === 0) {
      recommendations.push('缺少验证环节，建议补充相应的测试和验证');
    }
    
    if (deps && deps.riskLevel === 'high') {
      recommendations.push('风险等级较高，建议加强监控和风险缓解措施');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('当前状态良好，建议持续监控');
    }
    
    let content = '';
    recommendations.forEach((rec, idx) => {
      content += `${idx + 1}. ${rec}\n`;
    });
    
    return content;
  }

  private getOverallGrade(achieved: number, total: number, withModel: number): string {
    const rate = (achieved / total) * 100;
    const modelRate = (withModel / total) * 100;
    
    const avgScore = (rate + modelRate) / 2;
    
    if (avgScore >= 90) return '🏆 优秀';
    if (avgScore >= 80) return '🥈 良好';
    if (avgScore >= 70) return '🥉 中等';
    if (avgScore >= 60) return '⚠️ 需改进';
    return '🚨 需紧急改进';
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-\u4e00-\u9fa5]+/g, '');
  }
}
