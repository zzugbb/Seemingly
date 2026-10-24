import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, transformWithOxc } from 'vite'
import { chapterFiveScore, finaleNotes } from './chapter-5-score.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
assert(
  process.argv.slice(2).every((x) => x === '--runtime'),
  '只支持--runtime',
)
const runtimeMode = process.argv.includes('--runtime')
const score = chapterFiveScore(),
  pitch = new Set(score.scale.map((n) => n % 12))
assert.equal(score.notes.length, 51)
assert.equal(score.chords.length, 8)
assert.equal(score.seconds, (128 * 60) / 84)
for (const note of [...score.notes, ...finaleNotes()])
  assert(pitch.has(note.note % 12) && note.at >= 0 && note.duration > 0)
for (const chord of score.chords) assert(chord.notes.every((n) => pitch.has(n % 12)))
const sources = new Map(),
  baselines = new Map()
const temporary = await mkdtemp(join(tmpdir(), 'seemingly-chapter5-types-'))
try {
  const files = []
  for (const n of [13, 14, 15]) {
    const id = 'level-' + n,
      text = await readFile(new URL(`./${id}.md`, import.meta.url), 'utf8')
    const code = text.match(/## 完整参考实现\s+```ts\n([\s\S]*?)\n```/)?.[1]
    const baseline = text.match(/## 自动验证基准\s+```json\n([\s\S]*?)\n```/)?.[1]
    assert(code && baseline, `${id} 缺完整代码或基准`)
    sources.set(
      '\0design:' + id,
      code
        .replaceAll(/(['"])\.\/builders\1/g, JSON.stringify(root + 'src/game/levels/builders'))
        .replaceAll(/(['"])\.\/types\1/g, JSON.stringify(root + 'src/game/levels/types')),
    )
    baselines.set(id, JSON.parse(baseline))
    const file = join(temporary, id + '.ts')
    await writeFile(file, sources.get('\0design:' + id))
    files.push(file)
  }
  await promisify(execFile)(root + 'node_modules/.bin/tsc', [
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
const s = await createServer({
  root,
  configFile: false,
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
  plugins: [
    {
      name: 'chapter-five-docs',
      resolveId: (id) => (id.startsWith('design:') ? '\0' + id + '.ts' : null),
      load: async (id) => {
        const code = sources.get(id.endsWith('.ts') ? id.slice(0, -3) : id)
        return code ? (await transformWithOxc(code, 'design.ts')).code : null
      },
      transform: (code, id) =>
        id === root + 'src/game/core/clearance.ts'
          ? code + '\nexport {parts,settledParts,movingParts,intersects,bearingContact,actorIntersects}'
          : null,
    },
  ],
})
try {
  const rules = await s.ssrLoadModule('/src/game/core/rules.ts'),
    solver = await s.ssrLoadModule('/src/game/core/solver.ts'),
    geometry = await s.ssrLoadModule('/src/game/core/clearance.ts'),
    shapes = await s.ssrLoadModule('/src/game/core/shapes.ts'),
    { surfaceY } = await s.ssrLoadModule('/src/game/core/iso.ts')
  const { validateLevel } = await s.ssrLoadModule('/src/game/core/validate.ts'),
    { measureLevel } = await s.ssrLoadModule('/src/game/core/metrics.ts')
  const runtime = await s.ssrLoadModule('/src/game/levels/index.ts'),
    { targets } = await s.ssrLoadModule('/src/game/levels/targets.ts')
  assert.deepEqual(
    runtime.mainLevels.slice(0, 12).map((l) => createHash('sha256').update(JSON.stringify(l)).digest('hex')),
    [
      'ab96d7db7fbc8fc464d85c8953ac372bc842708a72a1c21070fcb73aa049e891',
      'b14e89fca8fbec1a87ca2d2ae7014d4cbf625f5af4ab851dfb2e744ff008465b',
      'ad8fd5cd0792ef95f1c75e329d74725e3012decc6918226b64b237f05f26392c',
      '28de386257c611fc2834adedbfcd60f893b153f81463571babaea84958d6c634',
      'f964d35ee37c17f8e73df2781070089d02f60dc60482c06070dd5eda251e9157',
      '8c2fc796f49c633457c11c770137b1e31a90bcd6121f2800f83804fc54baf82c',
      '1c35ef5bd5df1b750c2651f781d945ed88b2c00b42d6b933557a542b30ccb3a5',
      'ff4803b4ae0951b3df26580ddfed2050ab10b97cd79dcd0f17205693f7860538',
      'ec3731b0236adf98dfb92d2b98ecad5b3466913ae56988c1855da4a121be5db4',
      '8f13e947b7a512e840404503f7936073b944ebf095087811c21e064a7fe38df7',
      'dc74c17f256426d3f7738898c9cc627331cb69a3e6ad64953987c4f7be8fe8b3',
      '41d776fb20f7801d3f3fa9ea4e9b4a73866bc28384f381428254a17c5d33a262',
    ],
    '前十二关完整数据必须保留',
  )
  assert.deepEqual(
    runtime.mainLevels.slice(0, 12).map((l) => l.revision),
    [2, 3, 4, 3, 3, 4, 1, 2, 2, 2, 2, 2],
  )
  if (runtimeMode) assert.equal(runtime.mainLevels.length, 15, 'T6.18尚未接入15关，设计检查不能代替正式实现')
  for (const [id, baseline] of baselines) {
    const documented = (await s.ssrLoadModule('design:' + id)).default
    const level = runtimeMode ? runtime.mainLevels.find((l) => l.id === id) : documented
    if (runtimeMode) assert.deepEqual(level, documented, `${id} 正式对象漂移`)
    const target = {
      minActions: baseline.metrics.minActions,
      minActionsAll: baseline.metrics.minActionsAll,
      reachableStatesMin: 80,
      randomWin: { steps: 60, maxRate: 0.2 },
      illusionsMin: 2,
      tradeoffsMin: 2,
    }
    if (runtimeMode) assert.deepEqual(targets[id], target)
    const started = performance.now()
    solver.analyze(level)
    assert(performance.now() - started < 2000, `${id} 求解超过两秒`)
    assert.deepEqual(validateLevel(level, new Set(), target), [], `${id} 主线校验`)
    assert.deepEqual(measureLevel(level, 60), baseline.metrics, `${id} 指标漂移`)
    assert.equal(baseline.all.length, target.minActionsAll)
    assert.deepEqual(validateLevel({ ...level, solution: baseline.all }), [], `${id} 全收集校验`)
    assert(level.decor.islands.length >= 2 && level.decor.islands.length <= 4)
    const decor =
      level.decor.trees.length +
      level.decor.flowers.length +
      level.decor.windows.length +
      (level.decor.lanterns?.length ?? 0)
    assert(decor >= 3 && decor <= 6)
    for (const pos of [...level.decor.trees, ...level.decor.flowers, ...(level.decor.lanterns ?? [])])
      assert(
        level.decor.islands.some(
          (i) => i.y === pos[1] && i.x[0] <= pos[0] && pos[0] <= i.x[1] && i.z[0] <= pos[2] && pos[2] <= i.z[1],
        ),
        `${id} 装饰应在岛上`,
      )
    const replay = (steps) => {
      let st = rules.initialState(level)
      const trace = []
      for (const step of steps) {
        const tile =
          step.type === 'walk'
            ? [...rules.tilesOf(level, st).values()].find((t) => t.pos.every((v, i) => v === step.to[i]))
            : null
        const action = step.type === 'walk' ? { type: 'walk', tileId: tile?.id } : step
        const tr = rules.applyAction(level, st, action)
        assert(tr, `${id} 非法解法动作`)
        trace.push({ before: st, action, tr })
        st = tr.state
      }
      assert(st.won)
      return { state: st, trace }
    }
    const main = replay(level.solution),
      all = replay(baseline.all)
    assert.equal(all.state.orbs.length, level.orbs.length)
    assert.equal(main.trace.filter((t) => t.tr.patrolMoves.length).length > 0, true)
    const policy = solver.buildPolicy(level)
    if (id !== 'level-13') {
      let empty = rules.initialState(level)
      for (let i = 0; i < 2; i++) empty = rules.applyAction(level, empty, { type: 'operate', mechanism: 'ferry' }).state
      assert(policy.get(rules.stateKey(empty)), `${id} 一次空送往返后仍应可恢复`)
    }
    for (const st of solver.reachableStates(level)) {
      const action = policy.get(rules.stateKey(st))
      if (action) assert(rules.applyAction(level, st, action))
    }
    const canWin = (allow) => {
      const first = rules.initialState(level),
        queue = [first],
        seen = new Set([rules.stateKey(first)])
      for (let i = 0; i < queue.length; i++) {
        const st = queue[i]
        if (st.won) return true
        for (const a of rules.legalActions(level, st)) {
          const tr = rules.applyAction(level, st, a)
          if (!allow(st, a, tr)) continue
          const k = rules.stateKey(tr.state)
          if (!seen.has(k)) {
            seen.add(k)
            queue.push(tr.state)
          }
        }
      }
      return false
    }
    assert.equal(
      canWin((_, a, tr) => tr.patrolMoves.length === 0),
      false,
      `${id} 必须利用巡逻移动`,
    )
    if (id !== 'level-13')
      assert.equal(
        canWin((_, a) => a.type !== 'push'),
        false,
        `${id} 主线必须推箱`,
      )
    if (id === 'level-15') {
      assert.equal(
        canWin((_, a) => !(a.type === 'operate' && a.mechanism === 'home')),
        false,
        '必须揭挡并接归桥',
      )
      assert(
        main.trace.some((t) => t.tr.pushed?.to === '13,1,1'),
        '返程必须改压北位',
      )
      assert.equal(level.ending.lanterns.length, 15)
      assert.equal(new Set(level.ending.lanterns.map((p) => p.join(','))).size, 15)
      assert.deepEqual(level.ending.lanterns[0], level.goal)
      for (const p of level.ending.tower)
        assert(level.blocks.some((b) => b.kind === 'solid' && b.pos.every((v, i) => v === p[i])))
      for (const p of level.ending.lanterns.slice(1))
        assert(
          level.blocks.some((b) => b.pos.every((v, i) => v === p[i])),
          '灯必须有静态基座',
        )
    }
    const report = checkBuildings(level, { rules, solver, geometry, shapes, surfaceY })
    assert.deepEqual(report.issues, [], `${id} 运动实体相交`)
    assert.deepEqual(report, baseline.clearance, `${id} 运动采样覆盖漂移`)
    console.log(
      `${id} ${target.minActions}/${target.minActionsAll}步，${baseline.metrics.reachableStates}状态：主线／全收集／提示／反事实／181姿态净空通过`,
    )
  }
} finally {
  await s.close()
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

      const next = transition.state
      assert(
        active.every((m) => m.type !== 'rotator' || (next.rotator[m.id] - state.rotator[m.id] + 4) % 4 === 1),
        '反转须扩展实际角度采样',
      )
      const activeIds = new Set(active.map((m) => m.id))
      const key = JSON.stringify([state.rotator, state.mover, state.crates, gatesOf(level, state), [...activeIds]])
      const actorKey = `${key}/${next.at}/${JSON.stringify(state.patrols)}`
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
        ...gateBoxes({ ...next, patrols: state.patrols }),
      ]
      const ridingCrates = Object.entries(state.crates).filter(([, at]) =>
        active.some((m) => at.startsWith(`${m.id}#`)),
      )
      for (const [id, at] of Object.entries(state.crates))
        if (!ridingCrates.some(([cid]) => cid === id)) fixed.push(crateBox(id, tiles.get(at).pos))
      const patrols = Object.entries(rules.patrolTilesOf(level, state))
      let structureHit = false,
        actorHit = false
      for (let i = 0; i < samples; i++) {
        const fraction = i / (samples - 1)
        const durations = active.map((m) =>
          m.type === 'rotator'
            ? 0.9
            : Math.abs(m.stops[next.mover[m.id].stopIndex] - m.stops[state.mover[m.id].stopIndex]) * 0.45,
        )
        const elapsedTime = fraction * Math.max(...durations)
        const groups = active.map((m, j) => {
          const t = Math.min(1, elapsedTime / durations[j])
          const progress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          return { m, boxes: movingParts(m, state, next, progress) }
        })
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
          for (const [id, at] of patrols) {
            const ride = active.find((m) => at.startsWith(`${m.id}#`))
            const pos = ride ? moving.find((b) => b.id === at).pos : nextTiles.get(at).pos
            const body = {
              id,
              pos: [pos[0], surfaceY(pos[1]) + 0.220001, pos[2]],
              half: [0.000001, 0.000001, 0.000001],
              radius: 0.22,
              angle: 0,
            }
            const hit = [...fixed, ...moving.filter((b) => b.id !== at && b.id !== `${at}/slab`), ...crates].find((b) =>
              intersects(body, b),
            )
            if (hit) {
              issue(id, hit.id)
              actorHit = true
              break
            }
          }

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
