# 数据文件说明

本目录包含了ZD方向盘应用的核心数据定义。

## 文件结构

### 1. `kpiDefinitions.ts` ⭐ 核心文件
**统一的KPI定义文件**，确保整个应用使用一致的指标体系。

定义了6个核心KPI：
- `KPI_FoldTime` - 折叠时间
- `KPI_FoldAngle` - 折叠角度
- `KPI_SpaceGain` - 乘员空间提升
- `KPI_LockSafe` - 锁止安全性
- `KPI_NVH` - NVH性能
- `KPI_Life` - 折叠寿命

### 2. `tradeoffData.ts`
**权衡分析数据**，包括：
- 顶层指标（5个维度）：成本、轻量化、安全、空间、性能
- 设计方案（3个预设方案）：方案A、方案B、方案C
- 维度到KPI的映射关系
- 每个方案的KPI达成值

### 3. `wbsData.ts`
**WBS任务分解数据**，包括：
- KPI到任务的映射 (`kpiToTaskMapping`)
- 每个KPI对应的任务列表、模型列表
- WBS结构树 (`wbsTree`)
- 团队配置 (`teamConfig`)

## 数据流向

```
Step 1: 权重定义与约束
↓ (使用 tradeoffData.ts 中的 topLevelMetrics)
↓
Step 2: KPI拆解
↓ (使用 kpiDefinitions.ts 中的6个KPI)
↓
Step 3: 多方案权衡
↓ (使用 tradeoffData.ts 中的 designSchemes)
↓ 用户选择方案
↓
Step 4: WBS任务分解 (抽屉)
↓ (使用 wbsData.ts 中的 kpiToTaskMapping)
↓ 根据未达标KPI生成任务
↓
Step 5: 仿真评估
  (使用选定方案的数据)
```

## KPI 一致性保证

✅ **所有文件使用相同的6个KPI ID**：
- `tradeoffData.ts` → 方案的 kpiValues
- `wbsData.ts` → kpiToTaskMapping 的 key
- `kpiDefinitions.ts` → 统一定义

⚠️ **添加新KPI时的注意事项**：
1. 在 `kpiDefinitions.ts` 中添加定义
2. 在 `tradeoffData.ts` 的每个方案中添加 kpiValues
3. 在 `wbsData.ts` 中添加对应的任务映射
4. 更新维度到KPI的关系映射

## 约束条件

约束条件定义在各个文件中：
- **硬约束**：在方案评估时必须满足，否则标红
- **软约束**：作为优化目标，可以有一定偏差

约束条件会在方案对比时作为筛选/警示依据。
