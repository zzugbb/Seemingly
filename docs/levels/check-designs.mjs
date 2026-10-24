import assert from 'node:assert/strict'
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chapterScore, chapterSeal } from './chapter-scores.mjs'

for (const chapter of [3, 4]) {
  const score = chapterScore(chapter)
  const pitchClasses = new Set(score.scale.map((n) => n % 12))
  assert.equal(score.notes.length, 51, '每章乐句完整')
  assert.equal(score.chords.length, 8)
  assert.equal(score.seconds, score.beat * 128)
  assert.equal(score.chordSeconds, score.beat * 16)
  for (const sequence of score.onsets) {
    assert(sequence.every((beat, i) => beat >= 0 && beat < 16 && (!i || beat > sequence[i - 1])))
  }
  for (const note of [...score.notes, ...chapterSeal(chapter)]) {
    assert(pitchClasses.has(note.note % 12), '旋律及章末音列遵守章节调式')
    assert(note.at >= 0 && note.at < score.seconds && note.duration > 0)
    assert(note.velocity > 0 && note.velocity <= 1 && Math.abs(note.pan) <= 1)
  }
  for (const chord of score.chords) assert(chord.notes.every((n) => pitchClasses.has(n % 12)))
}
assert(chapterScore(4).bpm > chapterScore(3).bpm && chapterScore(3).bpm > 80)
assert.notDeepEqual(chapterScore(3).onsets, chapterScore(4).onsets, '两章分别写节奏，不只移调')
const intervals = (notes) => notes.slice(1).map((note, i) => note.note - notes[i].note)
assert.notDeepEqual(intervals(chapterScore(3).notes), intervals(chapterScore(4).notes), '两章旋律轮廓分别展开')

const options = process.argv.slice(2)
assert(
  options.every((option) => option === '--runtime'),
  '只支持 --runtime 正式接入核对选项',
)
const checkRuntime = options.includes('--runtime')

const root = fileURLToPath(new URL('../../', import.meta.url))
const sources = new Map()
const baselines = new Map()
for (let n = 7; n <= 12; n++) {
  const id = `level-${String(n).padStart(2, '0')}`
  const text = await readFile(new URL(`./${id}.md`, import.meta.url), 'utf8')
  const code = text.match(/## 完整参考实现\s+```ts\n([\s\S]*?)\n```/)?.[1]
  const baseline = text.match(/## 自动验证基准\s+```json\n([\s\S]*?)\n```/)?.[1]
  assert(code && baseline, `${id} 缺少完整参考实现或验证基准`)
  sources.set(`\0design:${id}`, code.replace("'./builders'", "'/src/game/levels/builders.ts'"))
  baselines.set(id, JSON.parse(baseline))
}

const temporary = await mkdtemp(join(tmpdir(), 'seemingly-designs-'))
try {
  const files = []
  for (const [id, code] of sources) {
    const file = join(temporary, `${id.slice(id.indexOf(':') + 1)}.ts`)
    await writeFile(
      file,
      code.replace("'/src/game/levels/builders.ts'", JSON.stringify(`${root}src/game/levels/builders`)),
    )
    files.push(file)
  }
  await promisify(execFile)(`${root}node_modules/.bin/tsc`, [
    '--ignoreConfig',
    '--noEmit',
    '--strict',
    '--noUnusedLocals',
    '--noUnusedParameters',
    '--isolatedModules',
    '--module',
    'ESNext',
    '--moduleResolution',
    'bundler',
    '--target',
    'ES2022',
    '--skipLibCheck',
    ...files,
  ])
} finally {
  await rm(temporary, { recursive: true, force: true })
}

// 只在本验证进程中导出已有几何辅助方法；不改写源码，不进入正式构建。
const geometryExports = ['parts', 'settledParts', 'movingParts', 'intersects', 'bearingContact', 'actorIntersects']
const server = await createServer({
  root,
  configFile: false,
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
  plugins: [
    {
      name: 'documented-level-designs',
      resolveId: (id) => (id.startsWith('design:') ? `\0${id}` : null),
      load: (id) => sources.get(id),
      transform: (code, id) =>
        id === `${root}src/game/core/clearance.ts` ? `${code}\nexport { ${geometryExports.join(', ')} }` : null,
    },
  ],
})

try {
  const rules = await server.ssrLoadModule('/src/game/core/rules.ts')
  const solver = await server.ssrLoadModule('/src/game/core/solver.ts')
  const { validateLevel } = await server.ssrLoadModule('/src/game/core/validate.ts')
  const { measureLevel } = await server.ssrLoadModule('/src/game/core/metrics.ts')
  const geometry = await server.ssrLoadModule('/src/game/core/clearance.ts')
  const shapes = await server.ssrLoadModule('/src/game/core/shapes.ts')
  const { surfaceY } = await server.ssrLoadModule('/src/game/core/iso.ts')
  const runtime = checkRuntime ? await server.ssrLoadModule('/src/game/levels/index.ts') : null
  const runtimeTargets = checkRuntime ? await server.ssrLoadModule('/src/game/levels/targets.ts') : null
  if (runtime) {
    const missing = [...baselines.keys()].filter((id) => !runtime.mainLevels.some((level) => level.id === id))
    assert.equal(missing.length, 0, `正式主线尚未接入：${missing.join('、')}；当前只能通过设计稿检查`)
    assert.deepEqual(
      runtime.mainLevels.slice(0, 12).map((level) => level.id),
      Array.from({ length: 12 }, (_, i) => `level-${String(i + 1).padStart(2, '0')}`),
      'T6.14正式主线前缀须按顺序保留12关',
    )
    assert.deepEqual(
      runtime.mainLevels.slice(0, 6).map((level) => level.revision),
      [2, 3, 4, 3, 3, 4],
      '前六关revision保持',
    )
  }
  const ids = new Set()
  for (const [id, expected] of baselines) {
    const { default: documented } = await server.ssrLoadModule(`design:${id}`)
    const level = runtime ? runtime.mainLevels.find((entry) => entry.id === id) : documented
    if (runtime) {
      assert.equal(
        level.revision ?? 1,
        documented.revision ?? 1,
        `${id} 正式revision仍旧；请按T6.14b～f逐关接入第三稿，不能据设计检查通过宣称正式完成`,
      )
      assert.deepEqual(level, documented, `${id} 正式关卡与当前完整设计稿不一致`)
    }

    assert(level.decor.islands.length >= 2 && level.decor.islands.length <= 4, `${id} 岛屿数量`)
    const ornaments =
      level.decor.trees.length +
      level.decor.flowers.length +
      level.decor.windows.length +
      (level.decor.lanterns?.length ?? 0)
    assert(ornaments >= 3 && ornaments <= 6, `${id} 装饰数量`)
    for (const pos of [...level.decor.trees, ...level.decor.flowers, ...(level.decor.lanterns ?? [])])
      assert(
        level.decor.islands.some(
          (island) =>
            island.y === pos[1] &&
            island.x[0] <= pos[0] &&
            pos[0] <= island.x[1] &&
            island.z[0] <= pos[2] &&
            pos[2] <= island.z[1],
        ),
        `${id} 地面装饰须在岛上`,
      )
    const target = {
      minActions: expected.metrics.minActions,
      minActionsAll: expected.metrics.minActionsAll,
      reachableStatesMin: level.chapter === 3 ? 40 : 60,
      randomWin: { steps: level.chapter === 3 ? 40 : 50, maxRate: level.chapter === 3 ? 0.35 : 0.25 },
      illusionsMin: 2,
      tradeoffsMin: 1,
    }
    if (runtimeTargets) assert.deepEqual(runtimeTargets.targets[id], target, `${id} 正式targets与设计交接不一致`)
    assert.deepEqual(validateLevel(level, ids, target), [], `${id} 主线校验`)
    assert.deepEqual(measureLevel(level, target.randomWin.steps), expected.metrics, `${id} 指标漂移`)
    assert.equal(expected.all.length, target.minActionsAll, `${id} 全收集解法必须最优`)
    assert.deepEqual(validateLevel({ ...level, solution: expected.all }), [], `${id} 全收集校验`)
    const trace = []
    const replay = (steps) => {
      let state = rules.initialState(level)
      for (const step of steps) {
        const tile =
          step.type === 'walk'
            ? [...rules.tilesOf(level, state).values()].find((t) => t.pos.every((v, i) => v === step.to[i]))
            : null
        const action = step.type === 'walk' ? { type: 'walk', tileId: tile?.id } : step
        const transition = rules.applyAction(level, state, action)
        assert(transition, `${id} 无效动作 ${JSON.stringify(step)}`)
        trace.push({ before: state, action, transition })
        state = transition.state
      }
      return state
    }
    const all = replay(expected.all)
    assert(all.won && all.orbs.length === level.orbs.length, `${id} 未全收集通关`)
    if (id === 'level-07') {
      assert.equal(trace.filter((t) => t.action.type === 'operate' && t.action.mechanism === 'swing').length, 2)
    }
    if (id === 'level-09') {
      assert.equal(trace.filter((t) => t.transition.plate === 'call-north').length, 2, '选做必须召高台再恢复归路')
      let state = rules.initialState(level)
      for (const action of [
        { type: 'walk', tileId: 'swing#0' },
        { type: 'operate', mechanism: 'swing' },
        { type: 'walk', tileId: '4,2,8' },
      ])
        state = rules.applyAction(level, state, action).state
      assert.equal(state.mover.receiver.stopIndex, 1, '经过压板不召台')
      assert.equal(state.gates.door, false)
      state = rules.applyAction(level, state, { type: 'walk', tileId: '4,2,7' }).state
      assert.equal(state.mover.receiver.stopIndex, 0, '停住才召台')
      assert.equal(state.gates.door, true)
    }
    if (id === 'level-11' || id === 'level-12') {
      const corner = id === 'level-11' ? '6,2,7' : '8,2,4'
      const optional = `orb-${level.orbs.findIndex((o) => o.optional)}`
      const collected = trace.find((t) => t.transition.collected.includes(optional))
      assert.equal(collected?.before.crates['crate-0'], corner, `${id} 选做须在中途停箱时取得`)
    }
    const mainOffset = trace.length
    replay(level.solution)
    const mainTrace = trace.splice(mainOffset)
    if (id === 'level-09')
      assert.equal(mainTrace.filter((t) => t.transition.plate === 'call-north').length, 2, '主线必须召高台并恢复归门')
    if (id === 'level-10')
      assert.equal(
        mainTrace.filter((t) => t.action.type === 'operate' && t.action.mechanism === 'freight').length,
        3,
        '人箱去程、独自返程、再次赴远岸',
      )
    if (id === 'level-11')
      assert.equal(
        mainTrace.find((t) => t.transition.plate === 'latch')?.before.crates['crate-0'],
        '6,2,7',
        '主线必须先临时停箱开低廊，再停板开出口',
      )
    if (id === 'level-12') {
      assert.equal(
        mainTrace.filter((t) => t.action.type === 'operate' && t.action.mechanism === 'freight').length,
        4,
        '最优四程运输',
      )
      const freight = level.mechanisms.find((m) => m.id === 'freight')
      assert.deepEqual(freight.stops, [0, 2, 6])
      assert.equal(freight.handle.uses, 8, '保留一次完整往返的四次余量')
    }
    const policy = solver.buildPolicy(level)
    for (const [name, steps] of Object.entries(expected.recovery ?? {})) {
      const offset = trace.length
      assert(replay(steps).won, `${id} 补救路线${name}未完成`)
      trace.splice(offset)
      assert.deepEqual(validateLevel({ ...level, solution: steps }), [], `${id} 补救路线${name}可见性／解法校验`)
    }
    for (const [name, steps] of Object.entries(expected.deadPrefixes ?? {})) {
      const offset = trace.length
      const state = replay(steps)
      trace.splice(offset)
      assert(!state.won && policy.get(rules.stateKey(state)) === null, `${id} ${name}应给撤销建议`)
    }
    if (id === 'level-12') {
      const start = rules.initialState(level)
      // 策略表也收录值为null的死局；has只表示见过该状态，不能证明仍有解。
      const first = rules.legalActions(level, start)
      let secondCount = 0
      for (const action of first) {
        const next = rules.applyAction(level, start, action).state
        assert(next.won || policy.get(rules.stateKey(next)), '第十二关首次合法尝试必须仍有解')
        for (const second of rules.legalActions(level, next)) {
          secondCount++
          const after = rules.applyAction(level, next, second).state
          assert(after.won || policy.get(rules.stateKey(after)), '第十二关前两步合法试探必须仍有解')
        }
      }
      assert.equal(first.length, 14)
      assert.equal(secondCount, 147)
      let state = rules.applyAction(level, start, { type: 'operate', mechanism: 'freight' }).state
      let count = 1
      while (!state.won && count <= 20) {
        const hint = policy.get(rules.stateKey(state))
        assert(hint, '首次空人运箱后必须可追台完成')
        state = rules.applyAction(level, state, hint).state
        count++
      }
      assert(state.won && count === expected.metrics.minActions, '首次空人送箱后仍能以主线最少步数完成，无需撤销')
    }
    for (const state of solver.reachableStates(level)) {
      const hint = policy.get(rules.stateKey(state))
      if (hint) assert(rules.applyAction(level, state, hint), `${id} 提示动作无效`)
    }
    const canWin = (allow, allOrbs = false, limit = Infinity) => {
      const start = rules.initialState(level),
        queue = [start],
        seen = new Set([rules.stateKey(start)]),
        depths = new Map([[rules.stateKey(start), 0]])
      for (let i = 0; i < queue.length; i++) {
        const state = queue[i]
        if (state.won && (!allOrbs || state.orbs.length === level.orbs.length)) return true
        const depth = depths.get(rules.stateKey(state))
        if (depth >= limit) continue
        for (const action of rules.legalActions(level, state)) {
          const tr = rules.applyAction(level, state, action)
          if (!allow(state, action, tr)) continue
          const key = rules.stateKey(tr.state)
          if (!seen.has(key)) {
            seen.add(key)
            depths.set(key, depth + 1)
            queue.push(tr.state)
          }
        }
      }
      return false
    }
    assert.equal(
      canWin((state, _action, tr) => !tr.moved.some((id) => state.at.startsWith(`${id}#`))),
      false,
      `${id} 必须乘坐`,
    )
    if (id === 'level-09') {
      assert.equal(
        canWin((_state, _action, tr) => tr.plate !== 'call-north', true, expected.metrics.minActionsAll),
        false,
        '最优全收集必须调用北庭；不禁止更长的南庭往返',
      )
    }
    if (id === 'level-11' || id === 'level-12') {
      const corner = id === 'level-11' ? '6,2,7' : '8,2,4'
      const optional = `orb-${level.orbs.findIndex((o) => o.optional)}`
      assert.equal(
        canWin((state, _action, tr) => !(tr.collected.includes(optional) && state.crates['crate-0'] === corner), true),
        false,
        `${id} 不存在避开中途停箱时机的全收集捷径`,
      )
    }
    if (id === 'level-08') {
      for (const handle of ['pair', 'relay'])
        assert.equal(
          canWin((_state, action) => action.type !== 'operate' || action.mechanism !== handle),
          false,
          `第八关必须使用${handle}，不能退化为单把手顺推`,
        )
      for (const state of solver.reachableStates(level))
        assert.equal(
          state.rotator.remote,
          (state.rotator.pair + state.rotator.relay + 1) % 4,
          '共享远桥保持设计相位关系',
        )
    }
    if (id === 'level-10')
      assert.equal(
        canWin(
          (state, action, tr) =>
            !(
              action.type === 'operate' &&
              action.mechanism === 'freight' &&
              state.mover.freight.stopIndex === 1 &&
              tr.state.mover.freight.stopIndex === 0 &&
              state.at.startsWith('freight#') &&
              state.crates['crate-0'] === '8,2,4'
            ),
        ),
        false,
        '卸箱后人必须独自返近岸取光',
      )
    if (id === 'level-11')
      assert.equal(
        canWin((_state, _action, tr) => tr.plate !== 'latch'),
        false,
        '主线必须触发低廊出口开关',
      )
    if (id === 'level-12')
      assert.equal(
        canWin((state, _action, tr) => !(tr.collected.includes('orb-2') && state.crates['crate-0'] === '8,2,4')),
        false,
        '远庭取必需光时箱子必须仍压在中站',
      )
    if (level.crates.length) {
      assert.equal(
        canWin(
          (state, _action, tr) =>
            !tr.moved.some((id) => Object.values(state.crates).some((at) => at.startsWith(`${id}#`))),
        ),
        false,
        `${id} 箱子必须乘坐`,
      )
      assert.equal(
        canWin((state, _action, tr) => {
          if (!tr.pushed) return true
          const tiles = rules.tilesOf(level, state),
            from = tiles.get(tr.pushed.from).pos,
            to = tiles.get(tr.pushed.to).pos
          return from.reduce((sum, v, i) => sum + Math.abs(v - to[i]), 0) === 1
        }),
        false,
        `${id} 必须跨错觉推箱`,
      )
    }
    const report = checkBuildings(level, { rules, solver, geometry, shapes, surfaceY })
    assert.deepEqual(report.issues, [], `${id} 运动实体相交`)
    assert.deepEqual(report, expected.clearance, `${id} 运动覆盖变化`)
    console.log(
      `${id} ${level.title}：${target.minActions}/${target.minActionsAll}步，${expected.metrics.reachableStates}状态，主线／全收集／提示／181姿态净空${runtime ? '／正式数据与targets一致' : ''}通过`,
    )
  }
} finally {
  await server.close()
}

function checkBuildings(level, { rules, solver, geometry, shapes, surfaceY }) {
  const { parts, settledParts, movingParts, intersects, bearingContact, actorIntersects } = geometry
  const { islandLayers, CHARACTER_HEIGHT, advanceBrace, braceScale } = shapes
  const { applyAction, legalActions, tilesOf, gatesOf } = rules
  const mechanisms = level.mechanisms.filter((m) => m.type === 'rotator' || m.type === 'mover')
  const staticParts = level.blocks.flatMap((b) =>
    parts(b.pos.join(','), b.pos, b.kind === 'path').map((p) => ({ ...p, staticBlock: true })),
  )
  const rocks = level.decor.islands.flatMap((island, i) =>
    islandLayers(island).map((layer, j) => ({
      id: `island-${i}#${j}`,
      pos: layer.position,
      angle: 0,
      half: layer.size.map((v) => v / 2 - 0.08),
      radius: 0.08,
    })),
  )
  const bases = mechanisms
    .filter((m) => m.type === 'rotator')
    .map((m) => ({
      id: `${m.id}/base`,
      pos: [m.pivot[0], m.pivot[1] - 0.55, m.pivot[2]],
      angle: 0,
      half: [1.214, 0.034, 1.214],
      radius: 0.001,
    }))
  // 0.76高包络含箱子上角饰；箱子本体保持世界朝向，与现有cratePose一致。
  const crateBox = (id, pos) => ({
    id,
    pos: [pos[0], surfaceY(pos[1]) + 0.38, pos[2]],
    angle: 0,
    half: [0.3, 0.32, 0.3],
    radius: 0.06,
  })
  const gateBoxes = (state) =>
    level.mechanisms.flatMap((g) => {
      if (g.type !== 'gate') return []
      const y = surfaceY(g.tile[1]) - (gatesOf(level, state)[g.id] ? 0.62 : 0)
      const box = (suffix, pos, half, radius) => ({ id: `${g.id}/${suffix}`, pos, half, radius, angle: 0 })
      return [
        box('post-a', [g.tile[0] - 0.3, y + 0.275, g.tile[2]], [0.035, 0.275, 0.035], 0.001),
        box('post-b', [g.tile[0] + 0.3, y + 0.275, g.tile[2]], [0.035, 0.275, 0.035], 0.001),
        box('bar', [g.tile[0], y + 0.48, g.tile[2]], [0.315, 0.04, 0.015], 0.025),
        ...(g.mode === 'hold'
          ? [box('dot', [g.tile[0], y + 0.48, g.tile[2] + 0.05], [0.001, 0.001, 0.001], 0.04)]
          : []),
      ]
    })
  const structural = new Set(),
    characters = new Set(),
    issues = []
  const samples = 181
  for (const state of solver.reachableStates(level))
    for (const action of legalActions(level, state)) {
      const transition = applyAction(level, state, action)
      const active = mechanisms.filter((m) => transition.moved.includes(m.id))
      if (!active.length) continue
      assert(active.length === 1 || active.every((m) => m.type === 'rotator'), '本设计采样只支持等时联动转盘')
      const next = transition.state
      assert(
        active.every((m) => m.type !== 'rotator' || (next.rotator[m.id] - state.rotator[m.id] + 4) % 4 === 1),
        '反转须扩展实际角度采样',
      )
      const activeIds = new Set(active.map((m) => m.id))
      const key = JSON.stringify([state.rotator, state.mover, state.crates, gatesOf(level, state), [...activeIds]])
      const actorKey = `${key}/${next.at}`
      const structure = !structural.has(key),
        actor = !characters.has(actorKey)
      if (!structure && !actor) continue
      structural.add(key)
      characters.add(actorKey)
      const tiles = tilesOf(level, state),
        nextTiles = tilesOf(level, next)
      const fixed = [
        ...staticParts,
        ...rocks,
        ...bases,
        ...mechanisms.filter((m) => !activeIds.has(m.id)).flatMap((m) => settledParts(m, state)),
        ...gateBoxes(next),
      ]
      const ridingCrates = Object.entries(state.crates).filter(([, at]) =>
        active.some((m) => at.startsWith(`${m.id}#`)),
      )
      for (const [id, at] of Object.entries(state.crates))
        if (!ridingCrates.some(([cid]) => cid === id)) fixed.push(crateBox(id, tiles.get(at).pos))
      let structureHit = false,
        actorHit = false
      for (let i = 0; i < samples; i++) {
        const fraction = i / (samples - 1)
        const groups = active.map((m) => ({ m, boxes: movingParts(m, state, next, fraction) }))
        const moving = groups.flatMap((p) => p.boxes)
        const crates = ridingCrates.map(([id, at]) => crateBox(id, moving.find((b) => b.id === at).pos))
        const issue = (object, obstacle) =>
          issues.push({ mechanism: [...activeIds].join('+'), fraction, object, obstacle })
        if (structure && !structureHit) {
          for (const { m, boxes } of groups) {
            for (const box of boxes) {
              const hit = [
                ...fixed.filter((b) => b.id !== `${m.id}/base`),
                ...groups.filter((p) => p.m !== m).flatMap((p) => p.boxes),
              ].find((b) => !bearingContact(m, box, b) && intersects(box, b))
              if (hit) {
                issue(box.id, hit.id)
                structureHit = true
                break
              }
            }
            if (structureHit) break
          }
          for (const box of crates) {
            const hit = [...fixed, ...moving, ...crates.filter((c) => c !== box)].find((b) => intersects(box, b))
            if (hit) {
              issue(box.id, hit.id)
              structureHit = true
              break
            }
          }
        }
        if (actor && !actorHit) {
          const ride = active.find((m) => next.at.startsWith(`${m.id}#`))
          const pos = ride ? moving.find((b) => b.id === next.at).pos : nextTiles.get(next.at).pos
          const duration = Math.max(
            ...active.map((m) =>
              m.type === 'rotator'
                ? 0.9
                : Math.abs(m.stops[next.mover[m.id].stopIndex] - m.stops[state.mover[m.id].stopIndex]) * 0.45,
            ),
          )
          const elapsed = (fraction < 0.5 ? Math.cbrt(fraction / 4) : 1 - Math.cbrt((1 - fraction) / 4)) * duration
          const height = CHARACTER_HEIGHT * (i === samples - 1 ? 1 : braceScale(advanceBrace(0, true, elapsed)))
          const obstacles = ride
            ? [...fixed, ...moving.filter((b) => b.id !== next.at && b.id !== `${next.at}/slab`), ...crates]
            : [...moving, ...crates]
          const hit = obstacles.find((b) => actorIntersects(pos, height, b))
          if (hit) {
            issue(`character@${next.at}`, hit.id)
            actorHit = true
          }
        }
      }
    }
  return { structuralTransitions: structural.size, characterTransitions: characters.size, samples, issues }
}
