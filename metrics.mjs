import { createServer } from 'vite'

const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
})

try {
  const { levels, sampleLevels } = await server.ssrLoadModule('/src/game/levels/index.ts')
  const { targets, sampleTargets } = await server.ssrLoadModule('/src/game/levels/targets.ts')
  const { measureLevel, RANDOM_RUNS, RANDOM_SEED } = await server.ssrLoadModule('/src/game/core/metrics.ts')
  console.log(`随机模拟：固定种子 ${RANDOM_SEED}，每关 ${RANDOM_RUNS} 次；未登记目标的关卡统一使用 30 步预算。`)
  console.table(
    [...levels, ...sampleLevels].map((level) => {
      const report = measureLevel(level, (targets[level.id] ?? sampleTargets[level.id])?.randomWin?.steps)
      return {
        关卡: level.id,
        名称: level.title,
        最少步数: report.minActions ?? '无解',
        全收集最少步数: report.minActionsAll ?? '无解',
        可达状态数: report.reachableStates,
        死局数: report.deadEndStates,
        随机步数: report.randomSteps,
        随机通关率: `${(report.randomRate * 100).toFixed(1)}%`,
        错觉连接数: report.illusions,
        取舍次数: report.tradeoffs,
      }
    }),
  )
} finally {
  await server.close()
}
